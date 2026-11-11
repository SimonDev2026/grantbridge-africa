"""GrantBridge Africa — daily grant collector.

Steps:  collect  -> raw pages from APIs and funder websites (Crawl4AI, Apache-2.0)
        extract  -> open-source LLM (Qwen3 via our LiteLLM gateway) turns each page into structured grant JSON
        embed    -> bge-m3 vectors for approved grants (matching)

Run:    python pipeline.py collect && python pipeline.py extract && python pipeline.py embed
Env:    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SIMPLER_GRANTS_API_KEY (optional)
        AI_BASE_URL, AI_API_KEY, AI_EXTRACT_MODEL, AI_EMBED_MODEL  (Cloudflare Workers AI free tier by default)
        AI_FALLBACK_BASE_URL, AI_FALLBACK_API_KEY, AI_FALLBACK_MODEL (optional, e.g. Groq free tier)
"""
import asyncio, hashlib, json, os, re, sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

import httpx, yaml
from supabase import create_client

# Free-tier Cloudflare Workers AI defaults (same as the workflow env).
# Overridable via env vars / GitHub secrets; pipeline never KeyErrors on them.
DEFAULT_EXTRACT_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8"
DEFAULT_EMBED_MODEL = "@cf/baai/bge-m3"

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
AI = os.environ["AI_BASE_URL"].rstrip("/")
AI_HEADERS = {"Authorization": f"Bearer {os.environ['AI_API_KEY']}"}
HERE = Path(__file__).parent
SOURCES = yaml.safe_load((HERE / "sources.yaml").read_text())["sources"]
EXTRACT_PROMPT = (HERE.parent / "prompts" / "extract_grant.md").read_text()


def upsert_source(s):
    row = sb.table("sources").select("id").eq("url", s["url"]).limit(1).execute().data
    if row:
        return row[0]["id"]
    return sb.table("sources").insert({"name": s["name"], "url": s["url"], "method": s["method"]}).execute().data[0]["id"]


def save_page(source_id, url, text):
    h = hashlib.sha256(text.encode()).hexdigest()
    old = sb.table("raw_pages").select("id,content_hash").eq("url", url).limit(1).execute().data
    if old and old[0]["content_hash"] == h:
        return False  # unchanged
    sb.table("raw_pages").upsert({"source_id": source_id, "url": url, "content_hash": h, "text": text[:60000],
                                  "processed": False}, on_conflict="url").execute()
    return True


# ---------- robots.txt ----------
_ROBOTS_CACHE = {}


def robots_allowed(url):
    """True if the host's robots.txt allows crawling `url` (user-agent "*").

    robots.txt is fetched once per host per run and cached in memory. If it
    cannot be fetched (network error, non-200), the URL is treated as allowed,
    per the robots exclusion standard (unreachable robots.txt = no restrictions).
    """
    host = urlparse(url).netloc
    if host not in _ROBOTS_CACHE:
        rp = RobotFileParser()
        try:
            r = httpx.get(f"https://{host}/robots.txt", timeout=15, follow_redirects=True,
                          headers={"User-Agent": "GrantBridgeBot/1.0"})
            rp.parse(r.text.splitlines() if r.status_code == 200 else [])
        except Exception as e:
            print(f"  robots.txt unreadable for {host} ({e}); treating as allowed")
            rp.parse([])
        _ROBOTS_CACHE[host] = rp
    return _ROBOTS_CACHE[host].can_fetch("*", url)


# ---------- collectors ----------
def simpler_grants(source_id, s):
    """US federal grants via the Simpler Grants.gov API — keep calls open to any applicant ('unrestricted')."""
    key = os.environ.get("SIMPLER_GRANTS_API_KEY")
    if not key:
        print("  skip: no SIMPLER_GRANTS_API_KEY"); return 0
    body = {"query": s.get("query", ""),
            "filters": {"opportunity_status": {"one_of": ["posted", "forecasted"]},
                        "applicant_type": {"one_of": ["unrestricted"]}},   # verify value list in API docs
            "pagination": {"page_offset": 1, "page_size": 100,
                           "sort_order": [{"order_by": "post_date", "sort_direction": "descending"}]}}
    r = httpx.post("https://api.simpler.grants.gov/v1/opportunities/search", json=body,
                   headers={"X-API-Key": key}, timeout=60)
    r.raise_for_status()
    n = 0
    for opp in r.json().get("data", []):
        url = f"https://simpler.grants.gov/opportunity/{opp.get('opportunity_id')}"
        n += save_page(source_id, url, json.dumps(opp, ensure_ascii=False))
    return n


async def crawl(source_id, s):
    """Any funder/embassy page. Optionally follow links matching s['follow'] (regex)."""
    from crawl4ai import AsyncWebCrawler
    n = 0
    if not robots_allowed(s["url"]):
        print("robots.txt disallows:", s["url"]); return 0
    async with AsyncWebCrawler() as c:
        res = await c.arun(url=s["url"])
        if not res.success:
            print("  failed:", res.error_message); return 0
        if s.get("follow"):
            links = {l["href"] for l in res.links.get("internal", []) if re.search(s["follow"], l.get("href", ""))}
            for href in list(links)[: s.get("max_pages", 25)]:
                if not robots_allowed(href):
                    print("robots.txt disallows:", href); continue
                sub = await c.arun(url=href)
                if sub.success:
                    n += save_page(source_id, href, str(sub.markdown))
        else:
            n += save_page(source_id, s["url"], str(res.markdown))
    return n


def collect():
    for s in SOURCES:
        sid = upsert_source(s)
        print("collect:", s["name"])
        try:
            n = simpler_grants(sid, s) if s["method"] == "api" and s.get("api") == "simpler_grants" else asyncio.run(crawl(sid, s))
            sb.table("sources").update({"last_run": datetime.now(timezone.utc).isoformat(), "last_ok": True}).eq("id", sid).execute()
            print("  new/changed pages:", n)
        except Exception as e:  # keep going; mark source unhealthy for the admin panel
            print("  error:", e)
            sb.table("sources").update({"last_run": datetime.now(timezone.utc).isoformat(), "last_ok": False}).eq("id", sid).execute()


# ---------- AI extraction ----------
def _chat(base, key, model, system, user):
    r = httpx.post(f"{base.rstrip('/')}/chat/completions", headers={"Authorization": f"Bearer {key}"}, timeout=600, json={
        "model": model, "temperature": 0, "max_tokens": 4000,
        "messages": [{"role": "system", "content": system}, {"role": "user", "content": user}]})
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def llm_json(system, user):
    """Primary provider first; on quota/errors use the fallback (free tiers have daily limits)."""
    try:
        txt = _chat(AI, os.environ["AI_API_KEY"], os.environ.get("AI_EXTRACT_MODEL", DEFAULT_EXTRACT_MODEL), system, user)
    except Exception as e:
        if not os.environ.get("AI_FALLBACK_BASE_URL"):
            raise
        print("  primary AI failed, using fallback:", e)
        txt = _chat(os.environ["AI_FALLBACK_BASE_URL"], os.environ["AI_FALLBACK_API_KEY"], os.environ.get("AI_FALLBACK_MODEL", DEFAULT_EXTRACT_MODEL), system, user)
    txt = re.sub(r"<think>.*?</think>", "", txt, flags=re.S).replace("```json", "").replace("```", "")
    return json.loads(txt[txt.index("{"): txt.rindex("}") + 1])


def extract():
    pages = sb.table("raw_pages").select("*").eq("processed", False).limit(200).execute().data
    for p in pages:
        try:
            out = llm_json(EXTRACT_PROMPT, f"SOURCE URL: {p['url']}\n\n{p['text'][:24000]}")
            for g in out.get("grants", []):
                if not g.get("title") or not g.get("official_url"):
                    continue
                g["source_id"] = p["source_id"]
                g["approved"] = False          # human review in /admin before users see it
                funder = g.pop("funder_name", None)
                if funder:
                    f = sb.table("funders").select("id").eq("name", funder).limit(1).execute().data
                    g["funder_id"] = f[0]["id"] if f else sb.table("funders").insert({"name": funder}).execute().data[0]["id"]
                sb.table("grants").insert(g).execute()
            sb.table("raw_pages").update({"processed": True}).eq("id", p["id"]).execute()
            print("extracted:", p["url"], len(out.get("grants", [])))
        except Exception as e:
            print("extract error:", p["url"], e)


# ---------- embeddings ----------
def embed():
    rows = sb.table("grants").select("id,title,summary,sectors,beneficiaries,eligible_regions") \
             .eq("approved", True).is_("embedding", "null").limit(500).execute().data
    for i in range(0, len(rows), 32):
        batch = rows[i:i + 32]
        texts = [". ".join(filter(None, [g["title"], g.get("summary"), " ".join(g.get("sectors") or []),
                                          " ".join(g.get("beneficiaries") or []), " ".join(g.get("eligible_regions") or [])]))
                 for g in batch]
        r = httpx.post(f"{AI}/embeddings", headers=AI_HEADERS, timeout=300, json={"model": os.environ.get("AI_EMBED_MODEL", DEFAULT_EMBED_MODEL), "input": texts})
        r.raise_for_status()
        for g, d in zip(batch, r.json()["data"]):
            sb.table("grants").update({"embedding": d["embedding"]}).eq("id", g["id"]).execute()
    print("embedded:", len(rows))


if __name__ == "__main__":
    {"collect": collect, "extract": extract, "embed": embed}[sys.argv[1]]()
