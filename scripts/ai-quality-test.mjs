// GrantBridge Africa — AI quality harness (guide §10, Step 10).
//
// Runs the three checks the guide's test plan requires, against the REAL
// seed grants (supabase/seed/seed-20-grants.sql) and 5 REAL test
// organisations (scripts/ai-quality-expected.json):
//   1. EXTRACTION — for each of the 20 seed grants, fetch the funder's own
//      page (falling back to the seed summary when the page is unreachable),
//      run the app's extraction prompt (prompts/extract_grant.md) through the
//      configured AI model, and score the extracted fields against the seed
//      row (ground truth). Target: mean field accuracy >= 0.90 (9/10).
//   2. MATCHING — for each of the 5 orgs, call the running app's
//      POST /api/quiz-results and check how many of the top 10 are in the
//      expected-relevance lists. Target: >= 7/10 relevant.
//   3. DRAFTS — for each org, generate a draft for its draft_grant with the
//      app's writer prompt (prompts/draft_application.md) and run automated
//      checks (every required document drafted, funder named, amounts within
//      the grant max, sections non-empty). The 1-5 human scores (accuracy /
//      fit / completeness / clarity / budget) are left NULL for a human
//      reviewer to fill in after reading each draft — this script never
//      invents a quality judgement.
//
// BLOCKED WITHOUT KEYS: if AI_BASE_URL / AI_API_KEY are not set, the script
// prints the exact missing variables and exits 2 WITHOUT writing any
// results. Nothing in the output is ever fabricated: every score field for
// a check that did not run is null, with a reason.
//
// Usage:
//   node scripts/ai-quality-test.mjs [--self-test] [--only extraction|matching|drafts]
//                                     [--out docs/ai-quality-results.json]
//   AI_BASE_URL=... AI_API_KEY=... AI_EXTRACT_MODEL=... AI_WRITER_MODEL=...
//   APP_BASE_URL=http://localhost:3000 node scripts/ai-quality-test.mjs
//
// --self-test parses the seed + expected file + prompts and exits 0 without
// calling any AI or the app. Use it to validate the harness itself.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED_SQL = join(ROOT, 'supabase/seed/seed-20-grants.sql');
const EXPECTED_JSON = join(ROOT, 'scripts/ai-quality-expected.json');
const EXTRACT_PROMPT = join(ROOT, 'prompts/extract_grant.md');
const DRAFT_PROMPT = join(ROOT, 'prompts/draft_application.md');

const args = new Set(process.argv.slice(2));
const SELF_TEST = args.has('--self-test');
const ONLY = (process.argv.find((a) => a.startsWith('--only=')) ?? '').split('=')[1] ?? null;
const OUT =
  (process.argv.find((a) => a.startsWith('--out=')) ?? '').split('=')[1] ??
  join(ROOT, 'docs/ai-quality-results.json');

// ---------------------------------------------------------------------------
// Seed SQL parsing (ground truth). The INSERT column order is fixed; values
// are split at top-level commas, respecting quotes ('' escapes), parens
// (the funder subselect) and ARRAY[...] literals.
// ---------------------------------------------------------------------------
function splitTopLevel(text) {
  const parts = [];
  let cur = '';
  let i = 0;
  let depth = 0;
  let inStr = false;
  while (i < text.length) {
    const ch = text[i];
    if (inStr) {
      cur += ch;
      if (ch === "'") {
        if (text[i + 1] === "'") { cur += "'"; i += 2; continue; }
        inStr = false;
      }
      i++;
      continue;
    }
    if (ch === "'") { inStr = true; cur += ch; i++; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; i++; continue; }
    cur += ch;
    i++;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts;
}

function parseValue(raw) {
  const v = raw.trim();
  if (v === 'NULL') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1).replace(/''/g, "'");
  if (v.startsWith('ARRAY[')) {
    const inner = v.slice(6, -1).trim();
    return inner ? splitTopLevel(inner).map(parseValue) : [];
  }
  if (v.startsWith('(')) return null; // funder subselect / now() — not needed
  return v;
}

const SEED_COLUMNS = [
  'title', 'official_url', 'summary', 'funder_id', 'scope', 'status',
  'sectors', 'beneficiaries', 'applicant_types', 'eligible_countries',
  'eligible_regions', 'amount_usd_min', 'amount_usd_max', 'amount_min',
  'amount_max', 'currency', 'deadline', 'rolling', 'documents_required',
  'registration_required', 'languages', 'all_countries',
  'foreign_applicants_allowed', 'fee_charged', 'partner_required',
  'stages', 'approved', 'last_checked_at',
];

export function parseSeedGrants(sql) {
  const grants = [];
  for (const block of sql.split('INSERT INTO grants').slice(1)) {
    const select = block.split('WHERE NOT EXISTS')[0];
    const m = select.match(/SELECT\s+([\s\S]*)$/);
    if (!m) continue;
    const values = splitTopLevel(m[1]).map(parseValue);
    const g = {};
    SEED_COLUMNS.forEach((c, i) => { g[c] = values[i] ?? null; });
    // Funder name comes from the subselect text, not the parsed value.
    const fm = select.match(/FROM funders WHERE name = '((?:[^']|'')+)'/);
    g.funder_name = fm ? fm[1].replace(/''/g, "'") : null;
    grants.push(g);
  }
  return grants;
}

// ---------------------------------------------------------------------------
// Normalisation: the extraction prompt's vocab differs from the seed's stored
// slugs (prompt: enterprise/education/food_security/general/disability;
// seed: economic_empowerment/education_youth/food_agriculture/general_public/
// persons_with_disabilities). Compare after mapping both sides to seed slugs.
// ---------------------------------------------------------------------------
const ALIASES = {
  enterprise: 'economic_empowerment',
  education: 'education_youth',
  food_security: 'food_agriculture',
  general: 'general_public',
  disability: 'persons_with_disabilities',
  climate: 'climate_environment',
  arts_media: 'arts_media_culture',
  tech: 'tech_innovation',
};
const norm = (s) => ALIASES[String(s).toLowerCase()] ?? String(s).toLowerCase();
const normSet = (arr) => new Set((arr ?? []).map(norm));
const jaccard = (a, b) => {
  const A = normSet(a), B = normSet(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
};
const setOk = (a, b) => jaccard(a, b) >= 0.75;

function scoreExtraction(ex, truth) {
  const checks = {
    scope: ex.scope === truth.scope,
    sectors: setOk(ex.sectors, truth.sectors),
    beneficiaries: setOk(ex.beneficiaries, truth.beneficiaries),
    applicant_types: setOk(ex.applicant_types, truth.applicant_types),
    amount_usd_max:
      (ex.amount_usd_max == null && truth.amount_usd_max == null) ||
      (ex.amount_usd_max != null && truth.amount_usd_max != null &&
        Math.abs(ex.amount_usd_max - truth.amount_usd_max) / Math.max(truth.amount_usd_max, 1) <= 0.1),
    deadline: (ex.deadline ?? null) === (truth.deadline ?? null),
    all_countries: (ex.all_countries ?? false) === (truth.all_countries ?? false),
    eligible_regions: setOk(ex.eligible_regions, truth.eligible_regions),
  };
  const correct = Object.values(checks).filter(Boolean).length;
  return { checks, correct, total: Object.keys(checks).length, score: correct / Object.keys(checks).length };
}

// ---------------------------------------------------------------------------
// AI client (OpenAI-compatible, same env vars as the app — see .env.example).
// ---------------------------------------------------------------------------
function stripThink(t) {
  return String(t ?? '').replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}
function parseJsonLoose(text) {
  const clean = stripThink(text).replace(/```(?:json)?/g, '').trim();
  const start = clean.indexOf('{'), end = clean.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('No JSON in AI output');
  return JSON.parse(clean.slice(start, end + 1));
}
async function chatCompletions(base, key, model, messages, maxTokens) {
  const res = await fetch(`${base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, messages, temperature: 0, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`AI ${model} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return stripThink(data.choices?.[0]?.message?.content ?? '');
}

async function fetchSourceText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'GrantBridgeAfrica-quality-harness/1.0' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return { text: null, source: `fetch-failed-http-${res.status}` };
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 8000);
    return { text: text || null, source: text ? 'funder-page' : 'funder-page-empty' };
  } catch (e) {
    return { text: null, source: `fetch-failed-${e.name ?? 'error'}` };
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const seedSql = readFileSync(SEED_SQL, 'utf8');
  const grants = parseSeedGrants(seedSql);
  const expected = JSON.parse(readFileSync(EXPECTED_JSON, 'utf8'));
  const extractPrompt = readFileSync(EXTRACT_PROMPT, 'utf8');
  const draftPrompt = readFileSync(DRAFT_PROMPT, 'utf8');

  if (SELF_TEST) {
    console.log(`seed grants parsed: ${grants.length} (expect 20)`);
    console.log(`organisations: ${expected.organisations.length} (expect 5)`);
    console.log(`extract prompt: ${extractPrompt.length} chars; draft prompt: ${draftPrompt.length} chars`);
    const bad = grants.filter((g) => !g.title || !g.official_url || !g.scope);
    if (grants.length !== 20) throw new Error(`expected 20 seed grants, parsed ${grants.length}`);
    if (bad.length) throw new Error(`${bad.length} grants missing title/url/scope`);
    for (const o of expected.organisations) {
      if (!grants.some((g) => g.title === o.draft_grant)) throw new Error(`draft_grant not in seed: ${o.draft_grant}`);
      for (const t of [...o.expected_relevant_tier1, ...o.expected_relevant_tier2]) {
        if (!grants.some((g) => g.title === t)) throw new Error(`expected grant not in seed: ${t}`);
      }
    }
    console.log('self-test OK: every expected/draft grant title exists in the seed.');
    return;
  }

  const AI_BASE_URL = process.env.AI_BASE_URL;
  const AI_API_KEY = process.env.AI_API_KEY;
  const AI_EXTRACT_MODEL = process.env.AI_EXTRACT_MODEL ?? '@cf/qwen/qwen3-30b-a3b-fp8';
  const AI_WRITER_MODEL = process.env.AI_WRITER_MODEL ?? '@cf/qwen/qwen3-30b-a3b-fp8';
  const APP_BASE_URL = process.env.APP_BASE_URL ?? 'http://localhost:3000';

  const missing = [];
  if (!AI_BASE_URL) missing.push('AI_BASE_URL');
  if (!AI_API_KEY) missing.push('AI_API_KEY');
  if (missing.length) {
    console.error('BLOCKED — AI quality run cannot start. Missing env vars (see .env.example):');
    for (const v of missing) console.error(`  ${v} — not set`);
    console.error('Also needed when set: AI_EXTRACT_MODEL, AI_WRITER_MODEL (default @cf/qwen/qwen3-30b-a3b-fp8).');
    console.error('Matching also needs the app running: APP_BASE_URL (default http://localhost:3000, `npm run dev`).');
    console.error('No results were written; every score stays "not run yet".');
    process.exit(2);
  }

  const results = {
    run_at: new Date().toISOString(),
    status: 'completed',
    targets: { extraction_mean_accuracy: 0.9, matching_top10_relevant: 7, draft_human_score_1_to_5: '>= 4 median' },
    models: { extract: AI_EXTRACT_MODEL, writer: AI_WRITER_MODEL, base_url_host: new URL(AI_BASE_URL).host },
    extraction: { per_grant: [], mean_accuracy: null, grants_at_100pct: null },
    matching: { per_org: [], mean_top10_relevant: null },
    drafts: { per_org: [], human_scores: 'NOT SCORED — a human reviewer must read each draft and fill accuracy/fit/completeness/clarity/budget (1-5) in this file.' },
  };

  // 1. EXTRACTION ------------------------------------------------------------
  if (!ONLY || ONLY === 'extraction') {
    for (const g of grants) {
      const { text, source } = await fetchSourceText(g.official_url);
      const input = text ?? `Seed summary (funder page unreachable, source=${source}): ${g.summary}`;
      let extracted = null, error = null;
      try {
        const out = await chatCompletions(AI_BASE_URL, AI_API_KEY, AI_EXTRACT_MODEL, [
          { role: 'system', content: extractPrompt },
          { role: 'user', content: `URL: ${g.official_url}\n\n${input}` },
        ], 4000);
        const parsed = parseJsonLoose(out);
        extracted = (parsed.grants ?? [])[0] ?? null;
        if (!extracted) error = 'model returned no grants for this page';
      } catch (e) { error = e.message; }
      if (!extracted) {
        results.extraction.per_grant.push({ title: g.title, source, score: null, error });
        console.log(`[extract] ${g.title}: ERROR ${error}`);
      } else {
        const s = scoreExtraction(extracted, g);
        results.extraction.per_grant.push({ title: g.title, source, score: s.score, checks: s.checks, extracted_title: extracted.title ?? null });
        console.log(`[extract] ${g.title}: ${s.correct}/${s.total}`);
      }
    }
    const scored = results.extraction.per_grant.filter((r) => r.score != null);
    results.extraction.mean_accuracy = scored.length ? scored.reduce((a, r) => a + r.score, 0) / scored.length : null;
    results.extraction.grants_at_100pct = scored.filter((r) => r.score === 1).length;
  }

  // 2. MATCHING --------------------------------------------------------------
  if (!ONLY || ONLY === 'matching') {
    for (const org of expected.organisations) {
      const expectedSet = [...org.expected_relevant_tier1, ...org.expected_relevant_tier2];
      let top10 = null, error = null;
      try {
        const res = await fetch(`${APP_BASE_URL.replace(/\/$/, '')}/api/quiz-results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(org.quiz),
          signal: AbortSignal.timeout(30_000),
        });
        if (!res.ok) throw new Error(`quiz-results HTTP ${res.status}`);
        const data = await res.json();
        top10 = (data.matches ?? []).slice(0, 10).map((m) => m.title);
      } catch (e) { error = e.message; }
      if (!top10) {
        results.matching.per_org.push({ org: org.key, top10_relevant: null, error });
        console.log(`[match] ${org.key}: ERROR ${error}`);
      } else {
        const relevant = top10.filter((t) => expectedSet.includes(t));
        results.matching.per_org.push({ org: org.key, top10, top10_relevant: relevant.length, relevant });
        console.log(`[match] ${org.key}: ${relevant.length}/10 relevant`);
      }
    }
    const scored = results.matching.per_org.filter((r) => r.top10_relevant != null);
    results.matching.mean_top10_relevant = scored.length ? scored.reduce((a, r) => a + r.top10_relevant, 0) / scored.length : null;
  }

  // 3. DRAFTS ----------------------------------------------------------------
  if (!ONLY || ONLY === 'drafts') {
    for (const org of expected.organisations) {
      const grant = grants.find((g) => g.title === org.draft_grant);
      let sections = null, error = null;
      try {
        const out = await chatCompletions(AI_BASE_URL, AI_API_KEY, AI_WRITER_MODEL, [
          { role: 'system', content: draftPrompt },
          { role: 'user', content: JSON.stringify({
            grant: { title: grant.title, funder: grant.funder_name, summary: grant.summary,
              documents_required: grant.documents_required, amount_usd_max: grant.amount_usd_max,
              sectors: grant.sectors, beneficiaries: grant.beneficiaries, url: grant.official_url },
            organisation: { name: org.name, country: org.country, type: org.quiz.applicant_type,
              description: org.quiz.description, sectors: [org.quiz.sector],
              beneficiaries: [org.quiz.beneficiaries], funding_need_usd: org.quiz.funding_need,
              stage: org.quiz.stage },
            organisation_documents: '(none supplied for the quality run — drafts are judged on the grant + profile only)',
          }) },
        ], 8000);
        sections = parseJsonLoose(out).sections;
        if (!Array.isArray(sections)) throw new Error('writer output has no sections array');
      } catch (e) { error = e.message; }
      if (!sections) {
        results.drafts.per_org.push({ org: org.key, grant: org.draft_grant, automated_checks: null, error });
        console.log(`[draft] ${org.key}: ERROR ${error}`);
        continue;
      }
      const titles = sections.map((s) => String(s.title ?? '').toLowerCase());
      const bodies = sections.map((s) => String(s.body ?? ''));
      const docsCovered = (grant.documents_required ?? []).map((doc) => {
        const words = String(doc).toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4);
        return { document: doc, drafted: words.length === 0 || titles.some((t) => words.some((w) => t.includes(w))) };
      });
      const amounts = bodies.join(' ').match(/\$[\d,]+(?:\.\d+)?/g) ?? [];
      const overMax = grant.amount_usd_max != null
        ? amounts.map((a) => Number(a.replace(/[$,]/g, ''))).filter((n) => n > grant.amount_usd_max)
        : [];
      const checks = {
        every_required_document_drafted: docsCovered.every((d) => d.drafted),
        documents_required: docsCovered,
        funder_or_grant_named: bodies.join(' ').toLowerCase().includes((grant.funder_name ?? '').toLowerCase()) ||
          bodies.join(' ').toLowerCase().includes(grant.title.toLowerCase()),
        all_sections_nonempty: bodies.every((b) => b.trim().length >= 50),
        amounts_over_grant_max_usd: overMax,
        section_count: sections.length,
      };
      results.drafts.per_org.push({
        org: org.key, grant: org.draft_grant, automated_checks: checks,
        human_scores_1_to_5: { accuracy: null, fit: null, completeness: null, clarity: null, budget: null },
      });
      console.log(`[draft] ${org.key}: ${sections.length} sections, docs covered ${docsCovered.filter((d) => d.drafted).length}/${docsCovered.length}`);
    }
  }

  writeFileSync(OUT, JSON.stringify(results, null, 2) + '\n');
  console.log(`\nWrote ${OUT}`);
  console.log(`extraction mean accuracy: ${results.extraction.mean_accuracy ?? 'not run' } (target >= 0.90)`);
  console.log(`matching mean top-10 relevant: ${results.matching.mean_top10_relevant ?? 'not run'} (target >= 7)`);
  console.log('draft human scores: NOT SCORED — reviewer fills 1-5 per criterion in the results file.');
}

main().catch((e) => { console.error(e); process.exit(1); });
