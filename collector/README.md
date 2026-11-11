# Grant Collector

Daily grant collector for GrantBridge Africa. Three steps, run in order:

1. **collect** — fetches raw pages from funder APIs and websites (Crawl4AI) into
   the `raw_pages` table in Supabase (deduplicated by content hash).
2. **extract** — an LLM (Qwen3 via the LiteLLM gateway) turns each unprocessed page
   into structured grant JSON using `../prompts/extract_grant.md`; grants land in
   the `grants` table with `approved = false` for human review in `/admin`.
3. **embed** — generates bge-m3 vectors for approved grants without an embedding,
   for matching.

## Run locally

```bash
cd collector
pip install -r requirements.txt
crawl4ai-setup          # one-time: installs the Crawl4AI browser
python pipeline.py collect
python pipeline.py extract
python pipeline.py embed
```

Python 3.12. Do **not** run the collector against the live database unless you
have the real service-role key — the steps above only work with valid credentials.

## Environment variables

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Service-role key (server-side only, never in the browser) |
| `AI_BASE_URL` | yes | LiteLLM gateway base URL (Cloudflare Workers AI free tier by default) |
| `AI_API_KEY` | yes | Gateway API key |
| `AI_EXTRACT_MODEL` | no | Defaults to `@cf/qwen/qwen3-30b-a3b-fp8` |
| `AI_EMBED_MODEL` | no | Defaults to `@cf/baai/bge-m3` |
| `AI_WRITER_MODEL` | no | Used by the app, not the collector; same Qwen default |
| `SIMPLER_GRANTS_API_KEY` | no | Without it the Simpler Grants.gov API source is skipped |
| `AI_FALLBACK_BASE_URL` / `AI_FALLBACK_API_KEY` / `AI_FALLBACK_MODEL` | no | Optional fallback provider (e.g. Groq free tier) when the primary fails |

## GitHub secrets

Set in the repo: **Settings → Secrets and variables → Actions**.

- Required: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `AI_BASE_URL`, `AI_API_KEY`
- Optional: `SIMPLER_GRANTS_API_KEY` (skip = Grants.gov source is skipped),
  `AI_EXTRACT_MODEL`, `AI_EMBED_MODEL`, `AI_WRITER_MODEL` (each falls back to the
  free-tier defaults above when the secret is unset or empty).

## Schedule

The workflow `.github/workflows/collect-grants.yml` runs **daily at 03:00 UTC**
(`0 3 * * *`) on GitHub's free runners (90-minute timeout), and can also be
triggered manually via **Actions → collect-grants → Run workflow**. It runs the
three commands in order: `collect`, then `extract`, then `embed`.

## robots.txt policy

Before crawling any URL, `pipeline.py` fetches `https://<host>/robots.txt` and
checks it with `urllib.robotparser` for user-agent `*`. A URL the file disallows
is skipped and logged as `robots.txt disallows: <url>` — the site is never
crawled. robots.txt is fetched once per host per run and cached in memory. If a
robots.txt cannot be fetched (network error or non-200 response), the URL is
treated as allowed, per the robots exclusion standard.

Known nuance: USADF's robots.txt allows crawling (`Allow: /`) but carries
content signals `search=yes, ai-train=no`. We do not train models on crawled
content; extraction feeds pages to an LLM, which is the unlisted `ai-input`
signal — USADF's file neither grants nor restricts that use. If a funder ever
sets `ai-input=no`, drop the source.

## Sources

20 sources in `sources.yaml` (1 API + 19 scrape). Every URL was verified live
on 2026-11-11. Listing/grants pages are used wherever they exist; a few funders
(AWDF, GEF SGP, TETFund, LSETF) announce calls on their homepage, so the
homepage is kept with a `follow` regex that walks to the individual calls.

## Sources dropped and why

- **US Embassy Nigeria grant-opportunities page** — returns 403 to both curl and
  a page fetch; the URL cannot be verified, so it is not listed.
- **Global Fund for Children** — no public open-call listing page exists;
  funding is invitation-only partner funding. Homepage also returns 403 to
  plain HTTP clients (bot protection).
- **MacArthur Foundation** — its `robots.txt` disallows `/grants/` for all
  agents, so the grants listing must not be scraped.
- **African Development Bank** — behind a Cloudflare bot challenge; neither
  verification nor crawling is possible.
- **National Endowment for Democracy** — both candidate grants URLs
  (`/grants/`, `/apply-for-a-grant/`) return 404; no real listing URL verified.
- **Mastercard Foundation** — takes no unsolicited proposals and reports no
  open calls; there is no grants listing to collect.
- **USAID** — returns 403 and the programme has been dismantled; no usable
  grants listing.

## Adding a source

1. Find the real listing/calls page — never guess a URL; verify it returns 200.
2. Check the site's `robots.txt` and terms of use first; if the listing page is
   disallowed, do not add it.
3. Add an entry to `sources.yaml` with `name`, `url`, `method: scrape`, and a
   `follow` regex + `max_pages` when the listing links to individual calls.
