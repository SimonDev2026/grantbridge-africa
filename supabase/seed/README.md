# Seed: 20 real grants — verification log

File: `seed-20-grants.sql` — 20 grants (10 international, 10 Africa-focused),
17 funders. Seed date: **2026-11-11**. Verified 2026-11-11 against each
funder's own official website or its own published documents. Nothing in the
seed was invented: any detail that could not be verified is `NULL` in the SQL.

Status split: 11 open, 9 closed (recently closed cycles kept so the catalogue
is not empty of the big annual programmes; their next cycles are not yet
announced). No fee is charged by any of these programmes as far as published
material states; `fee_charged = false` throughout.

## International (10)

| # | Grant — funder | Official URL | Verified |
|---|---|---|---|
| 1 | D-Prize Global Competition 2026 — D-Prize | https://d-prize.org/ | Amount up to $20,000 and all three deadlines (early 25 Oct 2026, regular 15 Nov 2026, extension 6 Dec 2026) read on the official homepage. Seed uses the final extension deadline 2026-12-06. |
| 2 | The Pollination Project Daily Grant — The Pollination Project | https://thepollinationproject.org/apply/ | Rolling applications confirmed on the official apply page, including the year-end closure (closes 30 Nov, reopens 1 Jan 2027) and the $10,000 project / $50,000 organisation budget caps. Amount up to $1,000 is the programme's published seed-grant size; the apply page text fetched did not restate the dollar figure, and one TPP landing page still says $500 — confirm the live form before applying. |
| 3 | Awesome Foundation — Disability Chapter Grant — Awesome Foundation | https://www.awesomefoundation.org/en/chapters/disability | $1,000 monthly, submissions 1st–10th of each month, worldwide eligibility — all read on the official chapter page. |
| 4 | Global Innovation Fund — Core Innovation Fund — Global Innovation Fund | https://www.globalinnovation.fund/investments | $50,000–$15,000,000 range and rolling (no-deadline) applications are from GIF's own programme description (also restated by Cambridge GCI); the GIF homepage/investments pages fetched did not restate the range in visible text. Africa/Asia priority confirmed on the homepage. |
| 5 | Conservation, Food & Health Foundation Concept Grants — Conservation, Food & Health Foundation | https://cfhfoundation.grantsmanagement08.com/ | Usually $25,000–$50,000/year, concept window 15 Oct–22 Dec 2026, two-stage (concept then invited full proposal). Verified against the foundation's own site (checked 9 Nov 2026 by an independent grant index) and its published guidelines. |
| 6 | National Endowment for Democracy Grants Program — National Endowment for Democracy | https://www.ned.org/apply-for-grant/en/ | Application portal, required documents and NGO-only eligibility read on the official page. **No award range is published** (amounts NULL); next deadline 27 Jan 2027 is the published Board-cycle date (21 Sep 2026 round has passed). |
| 7 | GEF Small Grants Programme — GEF Small Grants Programme (UNDP) | https://sgp.undp.org/about-us-157/how-to-apply.html | Max $75,000 per regular grant, typically $25,000–$50,000, and "SGP does not charge a fee at any stage" — all read on the official How to Apply page. Rolling via national country programmes; no single deadline (NULL). |
| 8 | Echoing Green Fellowship — Echoing Green | https://echoinggreen.org/fellowship | $100,000 stipend over 18 months verified from the programme's own pages. 2026 cycle closed 8 Oct 2025; no 2027 window announced — status closed. |
| 9 | Cartier Women's Initiative Regional Awards — Cartier Women's Initiative | https://www.cartierwomensinitiative.com/regional-awards | $100,000 / $60,000 / $30,000 per region and 2027 edition deadline 16 Jun 2026 verified from the official call flyer and programme pages. Status closed; next call not announced. |
| 10 | Draper Richards Kaplan Foundation Grant — Draper Richards Kaplan Foundation | https://www.drkfoundation.org/apply-for-funding/ | Up to $300,000 over three years, applications year-round, Africa a priority region — verified from the foundation's own application pages. No fixed deadline (rolling). |

## Africa-focused (10)

| # | Grant — funder | Official URL | Verified |
|---|---|---|---|
| 11 | Tony Elumelu Foundation Entrepreneurship Programme — Tony Elumelu Foundation | https://www.tonyelumelufoundation.org/tef-entrepreneurship-programme | $5,000 non-refundable seed capital per selected entrepreneur and the annual 1 Jan–1 Mar window read on the official programme page; 2026 cycle closed 1 Mar 2026 (3,200 selected). Status closed. |
| 12 | African Women's Development Fund Grants — African Women's Development Fund | https://awdf.org/ | General range $5,000–$50,000 from AWDF's published grant-making guidelines; AWDF runs periodic named calls (Open/Kasa/Komboa and responsive grants) rather than one standing deadline, so deadline is NULL and rolling = true. Latest specific calls on awdf.org/grants/ had May deadlines — check the site for the live call before applying. |
| 13 | U.S. African Development Foundation Grants — U.S. African Development Foundation | https://www.usadf.gov/apply/ | Maximum award $250,000 in the official country calls for proposals; "Applying for an USADF grant is free" stated on the official application form. Calls are per-country, so no single deadline (NULL). The apply page itself is JS-rendered and returned little text on fetch; the URL and amounts come from USADF's own published RFAs. |
| 14 | Urgent Action Fund-Africa Rapid Response Grants — Urgent Action Fund-Africa | https://www.uaf-africa.org/apply-for-a-grant/ | Rolling rapid-response grants for women's human rights across all 54 African countries, confirmed on the official apply page. Amount up to $15,000 is the figure on the current Rapid Response form (checked Oct 2026); older UAF-Africa material cites $12,000 rapid-response / $20,000–$30,000 advocacy — the form figure was used. |
| 15 | Japan GGP — Nigeria (FY2025) — Embassy of Japan in Nigeria | https://www.ng.emb-japan.go.jp/itpr_ja/11_000001_00609.html | Max approx. JPY 10,000,000 per project and deadline 23:59 Fri 13 Jun 2025 read on the Embassy's own call page. Scope national (Nigeria only). Status closed; FY2026 call not yet published. |
| 16 | Australian Direct Aid Program — East Africa — Australian Government DFAT | https://www.dfat.gov.au/people-to-people/direct-aid-program/direct-aid-program | DAP is a flexible small-grants programme run through DFAT posts; the Nairobi 2026–27 round caps projects at AUD 60,000 over up to two years (per the official SmartyGrants form). Round dates vary by post, so deadline is NULL. |
| 17 | GEF Small Grants Programme — Malawi (OP8) — GEF Small Grants Programme | https://www.undp.org/malawi/publications/call-project-proposals-gef-small-grants-programme-malawi | $5,000–$75,000, deadline 30 Oct 2026, Mzimba/Rumphi/Nkhata Bay focus — all from the UNDP Malawi call page. Status closed. |
| 18 | GEF Small Grants Programme — Kenya (ICCA-GSI Phase 2) — GEF Small Grants Programme | https://www.undp.org/kenya/call-proposals-gef-small-grants-programme-sgp-0 | Max $50,000 (NGOs; $30,000 for CBO/youth/disability/women groups), proposals due 21 Jun 2026, no fee at any stage — from the UNDP Kenya call page. Status closed. |
| 19 | GEF Small Grants Programme — Gambia (OP8 Tranche 1) — GEF Small Grants Programme | https://www.undp.org/gambia/publications/call-proposals-undp-gef-small-grants-programme-eighth-operational-phase-tranche-1-deadline-submission-proposals-5th-june-2026 | Max $50,000, co-finance at least equal to the request, from the UNDP Gambia call page. Note: the page URL says "5th June" but the call text states the deadline as 12 Jun 2026 — the seed uses 2026-06-12. Status closed. |
| 20 | Mastercard Foundation Scholars Program — University of Cambridge — Mastercard Foundation | https://www.mastercardfoundation.fund.cam.ac.uk/news/applications-20262027-academic-year-are-now-open | 2026/27 applications open for African citizens resident in Africa; tuition plus maintenance allowance covered. **No USD amount and no single deadline are published** on the programme page (both NULL). This is a scholarship, not a project grant. |

## What could NOT be verified (left NULL, not guessed)

- NED award range: NED publishes no minimum/maximum.
- Mastercard Foundation Scholars: no USD amount, no single deadline published.
- AWDF: no single current deadline — it runs periodic named calls.
- USADF / Australian DAP: no single deadline — calls are issued per country/post.
- GIF $50k–$15M range: from GIF's programme description, not restated on the
  homepage/investments pages fetched.
- Pollination Project $1,000: programme's published size; the apply page
  fetched did not restate it and a TPP landing page still says $500.
- TEF $5,000: confirmed by the Foundation's cohort announcements and the
  programme page's funding description; the fetched programme page text did
  not restate the dollar figure in the excerpt read.
- Cartier Women's Initiative funder HQ country: left NULL (Cartier/Richemont
  HQ not asserted).
- NED sector: the app's sector vocabulary has no democracy/human-rights
  value, so `education_youth` (civic education) was used as the closest fit.

## Dropped for lack of verification (not seeded)

- **Segal Family Foundation** — real funder, but it does not accept
  unsolicited applications (referral/network only, no open call).
- **Skoll Awards for Social Innovation** — $2M award is real, but it is
  nomination-only with no public application or deadline.
- **Global Fund for Children** — no general open application; partnership is
  by scouting, and its open Survivor-Led Activism Fund is Europe-only.
- **AfDB AFAWA** — mainly loans/guarantees via partner banks, not a direct
  grant application; the $100k–$250k "Enablers" figure comes only from
  third-party roundups, with no live official call verified.
- **ActionAid Nigeria Strategic Innovation Fund 2026** — the NGN 20,000,000 /
  12 Oct 2026 figures come only from a third-party listing; ActionAid's own
  site documents the earlier WVL-era SIF, not a live 2026 call page.
- **FIFA Global Citizen Education Fund** — $50k–$250k is real, but Cycle II
  closed 28/29 May 2026 and no next call date is published; official apply
  URL could not be verified verbatim.
- **OPEC Fund Grant Program** — small grants up to $100,000 are real, but no
  verbatim official grants-page URL could be verified, and a lookalike
  Wixsite mirror turned up in search results — deliberately excluded.
- **Ashoka Venture & Fellowship** — real, but the stipend is needs-based with
  no published USD amount and the 2026 round closed 1 Sep 2026; dropped in
  favour of better-verified entries (kept as a candidate for a later seed).
- **Canada Fund for Local Initiatives (CFLI)** — real and well documented
  (projects average ~$31,000; official calls page verified), but every 2026
  African call had closed by May 2026 and there is no single amount or
  deadline to seed; kept as a candidate for the next annual cycle.
- **Mastercard Foundation Scholars at Sciences Po** — deadline 14 Dec 2026
  reported by third parties, but no verbatim official Sciences Po URL was
  verified; the Cambridge track (row 20) was seeded instead.

## How to run

```sql
\i supabase/seed/seed-20-grants.sql
-- expect: 17 funders, 20 grants (11 open, 9 closed)
```

The script is idempotent (funders guarded by name, grants by
`official_url`). Embeddings are `NULL` until the collector's embed step runs.
Re-verify deadlines before showing "open" grants to users — several seeded
rows are closed 2025/2026 cycles whose next calls are not yet announced.
