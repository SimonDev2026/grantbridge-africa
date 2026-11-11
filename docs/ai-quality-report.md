# GrantBridge Africa — AI Quality Report (guide §10)

**Status: BLOCKED — not run yet.** Every score field below says "not run yet".
Nothing in this report is a measured result: the AI keys do not exist yet, so
no extraction, matching or draft has been scored. This document records the
exact harness, the test organisations, the rubric, and what is needed to run it.

**Date of this report:** 2026-11-11 (Step 10)
**Harness:** `scripts/ai-quality-test.mjs` (+ `scripts/ai-quality-expected.json`)
**Results file:** `docs/ai-quality-results.json` — **does not exist yet**; the
harness writes it only on a real run.

## 1. Why it is blocked

| Missing piece | What it blocks | Exact env var / action needed |
|---|---|---|
| AI provider key | Extraction + drafts (both call the AI) | `AI_BASE_URL` (e.g. `https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1`) and `AI_API_KEY` |
| AI models | Extraction + drafts (which model to call) | `AI_EXTRACT_MODEL` and `AI_WRITER_MODEL` (default `@cf/qwen/qwen3-30b-a3b-fp8` if unset) |
| Fallback key (optional) | Nothing — the harness has no fallback; the app does | `AI_FALLBACK_BASE_URL`, `AI_FALLBACK_API_KEY`, `AI_FALLBACK_MODEL` (`openai/gpt-oss-120b` on Groq) — only if the Cloudflare free tier is exhausted |
| Seed grants in the live DB | Matching (nothing to rank) | Apply `supabase/seed/seed-20-grants.sql` to the live Supabase project |
| App running | Matching (calls the live endpoint) | `npm run dev`, then `APP_BASE_URL=http://localhost:3000` (default) |

Running the harness without the keys exits with code 2 and writes nothing:

```
$ node scripts/ai-quality-test.mjs
BLOCKED — AI quality run cannot start. Missing env vars (see .env.example):
  AI_BASE_URL — not set
  AI_API_KEY — not set
```

(Verified 2026-11-11: exit 2, no results file written.)

## 2. The harness

```
npm run ai-quality            # full run: extraction + matching + drafts
npm run ai-quality:self-test  # validate the harness itself (no AI, no app)
node scripts/ai-quality-test.mjs --only extraction|matching|drafts
```

What it does, step by step:

1. **Parses the seed file as ground truth.** A small SQL tokenizer reads
   `supabase/seed/seed-20-grants.sql` (20 grants) — title, official URL,
   summary, scope, sectors, beneficiaries, applicant types, eligible
   countries/regions, USD amounts, deadline, `all_countries`. `--self-test`
   verifies this parse (20 grants, all titles resolve) without calling any AI.
2. **Extraction.** For each grant it fetches the funder's own page
   (8 s timeout, HTML stripped, first 8,000 chars). If the page is
   unreachable it falls back to the seed summary and records the source, so
   a fetch failure is visible in the results instead of silently scoring
   against nothing. It then runs `prompts/extract_grant.md` through
   `AI_EXTRACT_MODEL` and scores 8 fields against the seed row (see §4).
   Known vocabulary gap, handled in the harness: the extraction prompt's
   sector/beneficiary vocab (`enterprise`, `education`, `food_security`,
   `general`, `disability`, …) differs from the seed's stored slugs
   (`economic_empowerment`, `education_youth`, `food_agriculture`,
   `general_public`, `persons_with_disabilities`, …). Both sides are mapped
   to seed slugs before comparison.
3. **Matching.** For each of the 5 test organisations it POSTs that org's
   quiz answers to the running app's `/api/quiz-results` and checks how many
   of the top 10 results are in the expected-relevance lists in
   `scripts/ai-quality-expected.json`.
4. **Drafts.** For each org it generates a draft for that org's `draft_grant`
   with `prompts/draft_application.md` through `AI_WRITER_MODEL`, then runs
   automated checks (see §4). The 1–5 human scores are left `null` for a
   reviewer to fill in after reading each draft — the harness never invents
   a quality judgement.

Results are written to `docs/ai-quality-results.json` (run metadata, per-grant
extraction scores, per-org matching counts, per-org draft checks).

## 3. Test organisations (5 real NGOs, 3 countries)

Only public, verifiable facts are stated. No budgets, staff counts or
internal details are claimed — the quiz answers in
`scripts/ai-quality-expected.json` use the app's own option slugs and the
public descriptions below.

| # | Organisation | Country | Focus used in the test | Why it is in the set |
|---|---|---|---|---|
| 1 | **Simon Community Development Initiative (SCDI)** — the user's own NGO, Ikwo, Ebonyi State | Nigeria | Economic empowerment, rural low-income widows; poverty graduation (business assets + coaching + savings + food support) | The home case: the org the product was built around. Draft grant: D-Prize (Poverty Graduation challenge — SCDI applied in Nov 2026). |
| 2 | **Slum2School Africa** (slum2school.org) — founded 2012 by Orondaam Otto | Nigeria | Education for out-of-school children in informal settlements and riverine communities (incl. the Green Academy, Saga, Epe, Lagos) | Second Nigerian org, different sector (education) and beneficiary (children) from SCDI. Draft grant: National Endowment for Democracy. |
| 3 | **Shining Hope for Communities (SHOFCO)** — founded 2004 by Kennedy Odede, Kibera, Nairobi | Kenya | Girls' education, free clinics, clean water/sanitation, economic empowerment | Kenyan org, health/WASH sector, large multi-programme profile — stresses sector matching. Draft grant: Conservation, Food & Health Foundation. |
| 4 | **CAMFED (Campaign for Female Education)** (camfed.org) — founded 1993 by Ann Cotton | Zimbabwe | Girls' education and young women's leadership (Ghana, Kenya, Malawi, Tanzania, Zambia, Zimbabwe) | Pan-African education org; tests the women/girls sector and a non-Nigeria/Kenya base. Draft grant: African Women's Development Fund Grants. |
| 5 | **GiveDirectly** (givedirectly.org) — founded 2008 | Kenya | Unconditional cash transfers by mobile money to households in extreme poverty (Kenya, Malawi, Mozambique, Rwanda, Uganda) | Economic empowerment via cash, very large funding need — tests amount-fit scoring at the top end. Draft grant: U.S. African Development Foundation Grants. |

Countries covered: Nigeria, Kenya, Zimbabwe (3 — meets the guide's 3+).
Sectors covered: economic empowerment, education/youth, health/WASH,
women/girls. Applicant type for all five: `ngo`.

## 4. Scoring rubric

### Extraction — target: mean field accuracy ≥ 0.90 (9/10)

Per grant, 8 fields are checked against the seed row (ground truth):

| Field | Pass rule |
|---|---|
| `scope` | Exact match (`international` / `africa` / `national`) |
| `sectors` | Set overlap Jaccard ≥ 0.75 after vocab normalisation |
| `beneficiaries` | Set overlap Jaccard ≥ 0.75 after vocab normalisation |
| `applicant_types` | Set overlap Jaccard ≥ 0.75 |
| `amount_usd_max` | Both null, or within 10% |
| `deadline` | Both null, or exact `YYYY-MM-DD` |
| `all_countries` | Exact match |
| `eligible_regions` | Set overlap Jaccard ≥ 0.75 (both empty counts as a match) |

Per-grant score = correct / 8. Reported: mean accuracy across the 20 grants
and the count of grants at 100%. **Result: not run yet.**

### Matching — target: ≥ 7 of the top 10 relevant

Expected-relevance rule (written in `scripts/ai-quality-expected.json`, to be
confirmed by a human reviewer before the first scored run): a grant is
**tier 1** if it is open, accepts the org's applicant type, covers the org's
country, AND funds the org's primary sector; **tier 2** if it meets the same
eligibility but matches on beneficiaries only. A top-10 result counts as
relevant if it is in either tier. Reported per org: top-10 titles, relevant
count, and the mean across the 5 orgs.

Known limitation, recorded before running: with only 20 seed grants, narrow
orgs have fewer than 7 tier-1 grants (Slum2School has 5, SCDI and SHOFCO 6).
If the mean comes in below 7, the first suspect is database coverage, not
the matcher — the fix is the collector adding more grants, not tuning the
score. Do not pad the expected lists to hit the target. **Result: not run yet.**

### Drafts — target: median human score ≥ 4/5 per criterion

Automated checks (the harness runs these):
- Every document in the grant's `documents_required` has a matching section.
- The funder or grant name appears in the draft body.
- Every section body is non-empty (≥ 50 chars).
- No dollar amount in the draft exceeds the grant's `amount_usd_max`.

Human scores (1–5, reviewer reads each draft and fills them into
`docs/ai-quality-results.json` — all `null` until then):

| Criterion | 1 | 3 | 5 |
|---|---|---|---|
| Accuracy | Invents facts about the org/grant | Mostly true, minor errors | Every claim traceable to the profile, grant or supplied documents |
| Fit | Generic text, could be any NGO | Addresses the funder's priorities in general | Written to this funder's exact criteria and language |
| Completeness | Required documents missing or skeletal | All documents present, some thin | Every required document complete and submission-ready in structure |
| Clarity | Hard to follow, jargon, repetition | Readable with effort | Plain, direct, well-structured |
| Budget | Numbers missing or inconsistent | Budget present, roughly consistent | Budget consistent with the grant max and the org's stated need |

**Result: not run yet (automated checks and human scores both null).**

## 5. Results

| Check | Target | Result |
|---|---|---|
| Extraction (20 seed grants) | Mean accuracy ≥ 0.90 | **not run yet** — blocked on `AI_BASE_URL` / `AI_API_KEY` |
| Matching (5 orgs, top 10) | ≥ 7/10 relevant | **not run yet** — blocked on AI keys + seed grants not in live DB |
| Drafts (5 orgs × 1 grant) | Median human score ≥ 4/5 | **not run yet** — blocked on `AI_BASE_URL` / `AI_API_KEY` (+ human review) |

## 6. How to run it (for the coordinator)

1. Set the AI keys (Cloudflare Workers AI free tier first, per `.env.example`):
   `AI_BASE_URL`, `AI_API_KEY`. Models default to `@cf/qwen/qwen3-30b-a3b-fp8`.
2. Apply the seed to the live DB: `supabase/seed/seed-20-grants.sql`.
3. Start the app: `npm run dev` (matching calls `http://localhost:3000`).
4. Confirm the expected-relevance lists in `scripts/ai-quality-expected.json`
   with a human reviewer (see §4 — relevance is a judgement).
5. `npm run ai-quality` — results land in `docs/ai-quality-results.json`.
6. A reviewer reads the 5 generated drafts and fills the 1–5 human scores
   in that file; the report table above is then updated from the file.
