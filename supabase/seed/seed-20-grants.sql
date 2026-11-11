-- ============================================================================
-- GrantBridge Africa — seed: 20 real grants
-- Seed date: 2026-11-11
-- 20 real grants verified 2026-11-11 (10 international, 10 Africa-focused).
-- Every grant, funder, URL, amount and deadline below was checked against
-- the funder's own official website (or, where noted in README.md, against
-- the funder's own published documents). Nothing was invented: any detail
-- that could not be verified is NULL.
-- Embeddings are NULL until the collector's embed step runs (daily 03:00 UTC
-- workflow) or the admin clicks "Backfill embeddings" on /admin. Matching
-- still works without vectors (match_grants() falls back to the
-- sectors/beneficiaries/amount/urgency score), but the vector ranking only
-- applies once embeddings exist — do NOT fake embedding values here.
-- Idempotent: re-running this file inserts nothing twice (funders are
-- guarded by name, grants by official_url).
-- DO NOT run against production without a human review of README.md.
-- ============================================================================

-- --------------------------------------------------------------------------
-- Funders (insert once only)
-- --------------------------------------------------------------------------

INSERT INTO funders (name, website, type, hq_country)
SELECT 'D-Prize', 'https://d-prize.org/', 'foundation', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'D-Prize');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'The Pollination Project', 'https://thepollinationproject.org/', 'foundation', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'The Pollination Project');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Awesome Foundation', 'https://www.awesomefoundation.org/', 'foundation', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Awesome Foundation');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Global Innovation Fund', 'https://www.globalinnovation.fund/', 'foundation', 'United Kingdom'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Global Innovation Fund');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Conservation, Food & Health Foundation', 'https://cfhfoundation.grantsmanagement08.com/', 'foundation', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Conservation, Food & Health Foundation');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'National Endowment for Democracy', 'https://www.ned.org/', 'foundation', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'National Endowment for Democracy');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'GEF Small Grants Programme', 'https://sgp.undp.org/', 'multilateral', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'GEF Small Grants Programme');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Echoing Green', 'https://echoinggreen.org/', 'foundation', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Echoing Green');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Cartier Women''s Initiative', 'https://www.cartierwomensinitiative.com/', 'corporate', NULL
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Cartier Women''s Initiative');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Draper Richards Kaplan Foundation', 'https://www.drkfoundation.org/', 'foundation', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Draper Richards Kaplan Foundation');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Tony Elumelu Foundation', 'https://www.tonyelumelufoundation.org/', 'foundation', 'Nigeria'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Tony Elumelu Foundation');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'African Women''s Development Fund', 'https://awdf.org/', 'foundation', 'Ghana'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'African Women''s Development Fund');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'U.S. African Development Foundation', 'https://www.usadf.gov/', 'government', 'United States'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'U.S. African Development Foundation');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Urgent Action Fund-Africa', 'https://www.uaf-africa.org/', 'foundation', 'Kenya'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Urgent Action Fund-Africa');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Embassy of Japan in Nigeria', 'https://www.ng.emb-japan.go.jp/', 'embassy', 'Japan'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Embassy of Japan in Nigeria');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Australian Government Department of Foreign Affairs and Trade', 'https://www.dfat.gov.au/people-to-people/direct-aid-program/direct-aid-program', 'government', 'Australia'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Australian Government Department of Foreign Affairs and Trade');

INSERT INTO funders (name, website, type, hq_country)
SELECT 'Mastercard Foundation', 'https://mastercardfdn.org/', 'foundation', 'Canada'
WHERE NOT EXISTS (SELECT 1 FROM funders WHERE name = 'Mastercard Foundation');

-- --------------------------------------------------------------------------
-- Grants — INTERNATIONAL (10)
-- Common columns: approved = true, fee_charged = false (no fee published
-- for any of these programmes), last_checked_at = now(), embedding NULL.
-- --------------------------------------------------------------------------

-- 1. D-Prize Global Competition 2026 — up to $20,000; extension deadline
--    2026-12-06 (regular deadline 2026-11-15, early 2026-10-25).
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'D-Prize Global Competition 2026',
  'https://d-prize.org/',
  'Seed funding of up to $20,000 for first-time founders launching a new organisation that distributes a proven poverty intervention. Challenges include poverty graduation, health, education, agriculture, water and road safety. Round 1 is a two-page concept note plus resumes.',
  (SELECT id FROM funders WHERE name = 'D-Prize'),
  'international', 'open',
  ARRAY['economic_empowerment','health_wash','education_youth','food_agriculture'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['individual','startup','ngo'],
  NULL, ARRAY['Africa'],
  NULL, 20000, NULL, NULL, 'USD',
  '2026-12-06', false,
  ARRAY['concept note (2 pages)','resume'],
  NULL, ARRAY['English'],
  false, true, false, NULL,
  ARRAY['concept note','written questions','interview'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://d-prize.org/');

-- 2. The Pollination Project Daily Grant — up to $1,000, rolling.
--    Official apply page: applications close 30 Nov and reopen 1 Jan 2027.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'The Pollination Project Daily Grant',
  'https://thepollinationproject.org/apply/',
  'Seed grants of up to $1,000 for grassroots changemakers worldwide. Total project budget must be under $10,000 and organisational budget under $50,000, with no paid staff and no prior TPP seed grant. Decisions are rolling; the programme closes briefly at year end (30 Nov) and reopens 1 Jan 2027.',
  (SELECT id FROM funders WHERE name = 'The Pollination Project'),
  'international', 'open',
  ARRAY['economic_empowerment','education_youth','climate_environment'],
  ARRAY['general_public','rural_low_income'],
  ARRAY['individual','ngo','community_group'],
  NULL, NULL,
  NULL, 1000, NULL, NULL, 'USD',
  NULL, true,
  ARRAY['online application','referee contact'],
  NULL, ARRAY['English'],
  true, true, false, NULL,
  ARRAY['online application','advisor review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://thepollinationproject.org/apply/');

-- 3. Awesome Foundation — Disability Chapter — $1,000 monthly, rolling
--    (submissions 1st–10th of each month).
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Awesome Foundation — Disability Chapter Grant',
  'https://www.awesomefoundation.org/en/chapters/disability',
  'Monthly $1,000 micro-grant with no strings attached for projects that benefit disabled people, prioritising projects led by disabled people. Open to individuals, nonprofits and companies anywhere in the world. Submissions are accepted 1st–10th of every month; decisions by end of month.',
  (SELECT id FROM funders WHERE name = 'Awesome Foundation'),
  'international', 'open',
  ARRAY['health_wash','arts_media_culture','tech_innovation'],
  ARRAY['persons_with_disabilities'],
  ARRAY['individual','ngo','startup'],
  NULL, NULL,
  1000, 1000, NULL, NULL, 'USD',
  NULL, true,
  ARRAY['online application'],
  NULL, ARRAY['English'],
  true, true, false, NULL,
  ARRAY['monthly review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.awesomefoundation.org/en/chapters/disability');

-- 4. Global Innovation Fund — $50,000 to $15,000,000, rolling.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Global Innovation Fund — Core Innovation Fund',
  'https://www.globalinnovation.fund/investments',
  'Flexible grants, loans and equity from $50,000 to $15,000,000 for social innovations that improve the lives of people in low- and lower-middle-income countries, prioritising Africa and Asia. Climate resilience and inclusive economic opportunity are the current thematic priorities. Applications are accepted continuously with no fixed deadline, starting with a short initial application.',
  (SELECT id FROM funders WHERE name = 'Global Innovation Fund'),
  'international', 'open',
  ARRAY['climate_environment','economic_empowerment','education_youth','health_wash','food_agriculture'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','startup','researcher'],
  NULL, ARRAY['Africa'],
  50000, 15000000, NULL, NULL, 'USD',
  NULL, true,
  ARRAY['initial application (short form plus 2-4 page document or slide deck)'],
  NULL, ARRAY['English'],
  false, true, false, NULL,
  ARRAY['initial application','full application','due diligence'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.globalinnovation.fund/investments');

-- 5. Conservation, Food & Health Foundation — concept grants,
--    usually $25,000–$50,000 per year; current window closes 2026-12-22.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Conservation, Food & Health Foundation Concept Grants',
  'https://cfhfoundation.grantsmanagement08.com/',
  'Grants for conservation, sustainable food production and public health in Africa, Asia, the Caribbean, Latin America and the Middle East. Most grants are $25,000–$50,000 per year for one or two years. Two-stage process: short concept application first, then invited full proposal. Current concept window: 15 Oct – 22 Dec 2026.',
  (SELECT id FROM funders WHERE name = 'Conservation, Food & Health Foundation'),
  'international', 'open',
  ARRAY['climate_environment','food_agriculture','health_wash'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo'],
  NULL, ARRAY['Africa'],
  25000, 50000, NULL, NULL, 'USD',
  '2026-12-22', false,
  ARRAY['concept application'],
  ARRAY['registered_nonprofit'], ARRAY['English'],
  false, true, false, NULL,
  ARRAY['concept application','full proposal (invited)'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://cfhfoundation.grantsmanagement08.com/');

-- 6. National Endowment for Democracy Grants Program — no published
--    award range; next proposal deadline 2027-01-27.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'National Endowment for Democracy Grants Program',
  'https://www.ned.org/apply-for-grant/en/',
  'Project grants to independent non-governmental organisations advancing democratic goals in more than 100 countries, including human rights, independent media, civic education and rule of law. NED awards over 2,000 grants a year and considers proposals three times a year. No standard minimum or maximum award is published; applicants submit a project budget. Next deadline: 27 Jan 2027.',
  (SELECT id FROM funders WHERE name = 'National Endowment for Democracy'),
  'international', 'open',
  ARRAY['education_youth'],
  ARRAY['general_public'],
  ARRAY['ngo'],
  NULL, ARRAY['Africa'],
  NULL, NULL, NULL, NULL, 'USD',
  '2027-01-27', false,
  ARRAY['proposal narrative','proposal budget','certificate of registration'],
  NULL, ARRAY['English'],
  false, true, false, NULL,
  ARRAY['online application','board review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.ned.org/apply-for-grant/en/');

-- 7. GEF Small Grants Programme (global) — max $75,000 per regular
--    grant, typically $25,000–$50,000; rolling via national programmes.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'GEF Small Grants Programme',
  'https://sgp.undp.org/about-us-157/how-to-apply.html',
  'Community-based grants implemented by UNDP for national community organisations and NGOs working on biodiversity, climate change, land degradation, international waters and chemicals and waste. Maximum regular grant is $75,000, typically $25,000–$50,000. Applicants respond to calls issued by their national SGP country programme. SGP charges no fee at any stage.',
  (SELECT id FROM funders WHERE name = 'GEF Small Grants Programme'),
  'international', 'open',
  ARRAY['climate_environment','food_agriculture'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','community_group'],
  NULL, ARRAY['Africa'],
  25000, 75000, NULL, NULL, 'USD',
  NULL, true,
  ARRAY['project concept paper','project proposal'],
  ARRAY['registered_nonprofit'], ARRAY['English'],
  false, true, false, NULL,
  ARRAY['concept paper','proposal','national steering committee review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://sgp.undp.org/about-us-157/how-to-apply.html');

-- 8. Echoing Green Fellowship — $100,000 over 18 months.
--    2026 cycle closed 8 Oct 2025; next cycle not yet announced.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Echoing Green Fellowship',
  'https://echoinggreen.org/fellowship',
  '18-month fellowship for founders of early-stage social impact organisations anywhere in the world, with a $100,000 stipend plus leadership development and support. For-profit fellows receive it as a recoverable grant. The 2026 application window closed 8 Oct 2025 and the next cycle has not been announced.',
  (SELECT id FROM funders WHERE name = 'Echoing Green'),
  'international', 'closed',
  ARRAY['economic_empowerment','education_youth','health_wash','climate_environment'],
  ARRAY['general_public'],
  ARRAY['individual','startup','ngo'],
  NULL, NULL,
  100000, 100000, NULL, NULL, 'USD',
  '2025-10-08', false,
  ARRAY['online application'],
  NULL, ARRAY['English'],
  true, true, false, NULL,
  ARRAY['application','interviews','selection'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://echoinggreen.org/fellowship');

-- 9. Cartier Women's Initiative Regional Awards — $30,000 / $60,000 /
--    $100,000. 2027 edition closed 16 Jun 2026; next call not announced.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Cartier Women''s Initiative Regional Awards',
  'https://www.cartierwomensinitiative.com/regional-awards',
  'Annual awards for women-owned and women-led impact-driven businesses from any country, in nine regions including Sub-Saharan Africa. First place in each region receives a $100,000 grant, second $60,000 and third $30,000, plus a year-long fellowship. The 2027 edition call closed 16 Jun 2026; the next call has not been announced.',
  (SELECT id FROM funders WHERE name = 'Cartier Women''s Initiative'),
  'international', 'closed',
  ARRAY['economic_empowerment','tech_innovation'],
  ARRAY['women_widows'],
  ARRAY['startup'],
  NULL, ARRAY['Africa'],
  30000, 100000, NULL, NULL, 'USD',
  '2026-06-16', false,
  ARRAY['online application','financial statements'],
  ARRAY['registered_company'], ARRAY['English'],
  true, true, false, NULL,
  ARRAY['application','selection','fellowship'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.cartierwomensinitiative.com/regional-awards');

-- 10. Draper Richards Kaplan Foundation — up to $300,000 over three
--     years, applications year-round (Africa is a priority region).
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Draper Richards Kaplan Foundation Grant',
  'https://www.drkfoundation.org/apply-for-funding/',
  'Up to $300,000 in unrestricted grant funding or investment capital over three years, plus hands-on support, for early-stage social enterprises that are post-pilot and pre-scale. Africa, Europe, India and the United States are priority regions. Applications are accepted year-round with no fixed deadline.',
  (SELECT id FROM funders WHERE name = 'Draper Richards Kaplan Foundation'),
  'international', 'open',
  ARRAY['economic_empowerment','education_youth','health_wash','climate_environment','food_agriculture'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','startup'],
  NULL, ARRAY['Africa'],
  NULL, 300000, NULL, NULL, 'USD',
  NULL, true,
  ARRAY['executive summary or pitch deck','business plan','leadership CVs'],
  NULL, ARRAY['English'],
  false, true, false, NULL,
  ARRAY['online application','interviews','due diligence'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.drkfoundation.org/apply-for-funding/');

-- --------------------------------------------------------------------------
-- Grants — AFRICA-FOCUSED (10)
-- --------------------------------------------------------------------------

-- 11. Tony Elumelu Foundation Entrepreneurship Programme — $5,000 seed
--     capital. 2026 window ran 1 Jan – 1 Mar 2026; next cycle not announced.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Tony Elumelu Foundation Entrepreneurship Programme',
  'https://www.tonyelumelufoundation.org/tef-entrepreneurship-programme',
  'Flagship pan-African programme for entrepreneurs aged 18 and above who live in Africa. Selected entrepreneurs receive $5,000 in non-refundable seed capital plus business training, mentorship and network access through TEFConnect. The annual window opens 1 January and closes 1 March; the 2026 cycle closed 1 Mar 2026 and 3,200 entrepreneurs were selected.',
  (SELECT id FROM funders WHERE name = 'Tony Elumelu Foundation'),
  'africa', 'closed',
  ARRAY['economic_empowerment'],
  ARRAY['youth','women_widows'],
  ARRAY['individual','startup'],
  NULL, ARRAY['Africa'],
  5000, 5000, NULL, NULL, 'USD',
  '2026-03-01', false,
  ARRAY['government-issued ID','headshot','business registration certificate','tax registration','bank reference letter'],
  NULL, ARRAY['English'],
  false, true, false, NULL,
  ARRAY['application','due diligence','training','investment readiness','seed capital'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.tonyelumelufoundation.org/tef-entrepreneurship-programme');

-- 12. African Women's Development Fund Grants — $5,000–$50,000.
--     AWDF runs periodic calls; amounts are from its published guidelines.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'African Women''s Development Fund Grants',
  'https://awdf.org/',
  'Pan-African grants to women-led organisations working on women''s rights, economic justice, health and leadership. AWDF publishes periodic calls (including Open, Kasa and Komboa streams and smaller responsive grants); its long-published general range is $5,000–$50,000, with larger awards for regional work. Applicants must be African-led, registered in Africa and led by women.',
  (SELECT id FROM funders WHERE name = 'African Women''s Development Fund'),
  'africa', 'open',
  ARRAY['women_girls','economic_empowerment','health_wash'],
  ARRAY['women_widows'],
  ARRAY['ngo','community_group'],
  NULL, ARRAY['Africa'],
  5000, 50000, NULL, NULL, 'USD',
  NULL, true,
  ARRAY['online application','reference letter'],
  ARRAY['registered_nonprofit'], ARRAY['English','French'],
  false, true, false, NULL,
  ARRAY['call for proposals','application','selection'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://awdf.org/');

-- 13. U.S. African Development Foundation — grants up to $250,000
--     (country calls vary; some partner calls offer up to $40,000).
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'U.S. African Development Foundation Grants',
  'https://www.usadf.gov/apply/',
  'Grant financing and local support for African-owned cooperatives, producer groups and enterprises, with a maximum award of $250,000 in its country calls for proposals. Organisations must be 100% African-owned and led. Applying for a USADF grant is free. Calls are issued per country, so there is no single deadline.',
  (SELECT id FROM funders WHERE name = 'U.S. African Development Foundation'),
  'africa', 'open',
  ARRAY['food_agriculture','economic_empowerment'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','community_group','startup'],
  NULL, ARRAY['Africa'],
  NULL, 250000, NULL, NULL, 'USD',
  NULL, false,
  ARRAY['application form','financial statements (2 years)','registration document'],
  ARRAY['registered_nonprofit','registered_company'], ARRAY['English','French'],
  false, true, false, NULL,
  ARRAY['call for proposals','application','selection'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.usadf.gov/apply/');

-- 14. Urgent Action Fund-Africa Rapid Response Grants — up to $15,000,
--     rolling, for women-led groups across all 54 African countries.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Urgent Action Fund-Africa Rapid Response Grants',
  'https://www.uaf-africa.org/apply-for-a-grant/',
  'Rapid response grants of up to $15,000 for strategic, time-urgent interventions that advance women''s human rights in Africa, normally implemented within three months. Open to women-led organisations, collectives and unregistered groups (with a fiscal sponsor where needed) across all 54 African countries. Applications are accepted on a rolling basis.',
  (SELECT id FROM funders WHERE name = 'Urgent Action Fund-Africa'),
  'africa', 'open',
  ARRAY['women_girls'],
  ARRAY['women_widows'],
  ARRAY['ngo','community_group','individual'],
  NULL, ARRAY['Africa'],
  NULL, 15000, NULL, NULL, 'USD',
  NULL, true,
  ARRAY['application form'],
  NULL, ARRAY['English','French'],
  false, true, false, NULL,
  ARRAY['application','rapid review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.uaf-africa.org/apply-for-a-grant/');

-- 15. Japan Grant Assistance for Grass-roots Human Security Projects
--     (GGP), Nigeria FY2025 — max approx. JPY 10,000,000; closed 13 Jun 2025.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Japan Grant Assistance for Grass-roots Human Security Projects (GGP) — Nigeria',
  'https://www.ng.emb-japan.go.jp/itpr_ja/11_000001_00609.html',
  'Embassy of Japan in Nigeria call for community-level projects in primary healthcare, basic education, vocational training, clean water and empowerment of marginalised groups. Maximum grant is approximately JPY 10,000,000 per project, to be completed within one year of signing. Applicants must be registered non-profits with at least two years of project experience. FY2025 call closed 13 Jun 2025.',
  (SELECT id FROM funders WHERE name = 'Embassy of Japan in Nigeria'),
  'national', 'closed',
  ARRAY['health_wash','education_youth','economic_empowerment'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo'],
  ARRAY['Nigeria'], ARRAY['West Africa'],
  NULL, NULL, 10000000, 10000000, 'JPY',
  '2025-06-13', false,
  ARRAY['application form','budget','project site map','feasibility study','quotations from three suppliers'],
  ARRAY['registered_nonprofit'], ARRAY['English'],
  false, false, false, NULL,
  ARRAY['application','embassy review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.ng.emb-japan.go.jp/itpr_ja/11_000001_00609.html');

-- 16. Australian Direct Aid Program — East Africa (Nairobi) — max
--     AUD 60,000 over the life of the project (2026–27 round).
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Australian Direct Aid Program — East Africa',
  'https://www.dfat.gov.au/people-to-people/direct-aid-program/direct-aid-program',
  'Flexible small grants from the Australian Government, managed through DFAT overseas posts, for not-for-profit community groups and NGOs in ODA-eligible countries. The Nairobi 2026–27 round caps projects at AUD 60,000 over the life of the project (up to two years), prioritising climate adaptation, skills, health, human rights and peacebuilding. Round dates vary by post; check the post page for the current round.',
  (SELECT id FROM funders WHERE name = 'Australian Government Department of Foreign Affairs and Trade'),
  'africa', 'open',
  ARRAY['climate_environment','health_wash','education_youth','women_girls'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','community_group'],
  NULL, ARRAY['East Africa'],
  NULL, NULL, NULL, 60000, 'AUD',
  NULL, false,
  ARRAY['online application','project budget'],
  ARRAY['registered_nonprofit'], ARRAY['English'],
  false, true, false, NULL,
  ARRAY['online application','post review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.dfat.gov.au/people-to-people/direct-aid-program/direct-aid-program');

-- 17. GEF Small Grants Programme — Malawi, Eighth Operational Phase —
--     $5,000–$75,000; call closed 30 Oct 2026.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'GEF Small Grants Programme — Malawi (OP8)',
  'https://www.undp.org/malawi/publications/call-project-proposals-gef-small-grants-programme-malawi',
  'UNDP Malawi call under the GEF Small Grants Programme Eighth Operational Phase for registered non-profit organisations in Malawi. Grants of $5,000–$75,000 for community initiatives on biodiversity, land degradation, climate change and chemicals and waste, focused on Mzimba, Rumphi and Nkhata Bay (plus urban solutions in Blantyre, Zomba, Lilongwe and Mzuzu). Projects run up to 24 months. Call closed 30 Oct 2026.',
  (SELECT id FROM funders WHERE name = 'GEF Small Grants Programme'),
  'national', 'closed',
  ARRAY['climate_environment','food_agriculture'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','community_group'],
  ARRAY['Malawi'], ARRAY['Southern Africa'],
  5000, 75000, NULL, NULL, 'USD',
  '2026-10-30', false,
  ARRAY['project proposal'],
  ARRAY['registered_nonprofit'], ARRAY['English'],
  false, false, false, NULL,
  ARRAY['proposal','review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.undp.org/malawi/publications/call-project-proposals-gef-small-grants-programme-malawi');

-- 18. GEF Small Grants Programme — Kenya, ICCA-GSI Phase 2 —
--     max $50,000; call closed 21 Jun 2026.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'GEF Small Grants Programme — Kenya (ICCA-GSI Phase 2)',
  'https://www.undp.org/kenya/call-proposals-gef-small-grants-programme-sgp-0',
  'UNDP Kenya call under the GEF Small Grants Programme for the ICCA-GSI Phase 2 initiative, combining a catalytic NGO call and regular grants for local civil society organisations. Maximum grant is $50,000 for NGOs ($30,000 for community, youth, disability and women groups). Proposals were due by email by 21 Jun 2026. The programme charges no fee at any stage.',
  (SELECT id FROM funders WHERE name = 'GEF Small Grants Programme'),
  'national', 'closed',
  ARRAY['climate_environment'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','community_group'],
  ARRAY['Kenya'], ARRAY['East Africa'],
  NULL, 50000, NULL, NULL, 'USD',
  '2026-06-21', false,
  ARRAY['project proposal'],
  ARRAY['registered_nonprofit'], ARRAY['English'],
  false, false, false, NULL,
  ARRAY['proposal','review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.undp.org/kenya/call-proposals-gef-small-grants-programme-sgp-0');

-- 19. GEF Small Grants Programme — Gambia, Eighth Operational Phase
--     Tranche 1 — max $50,000; call closed 12 Jun 2026.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'GEF Small Grants Programme — Gambia (OP8 Tranche 1)',
  'https://www.undp.org/gambia/publications/call-proposals-undp-gef-small-grants-programme-eighth-operational-phase-tranche-1-deadline-submission-proposals-5th-june-2026',
  'UNDP Gambia call under the GEF Small Grants Programme Eighth Operational Phase for registered non-profit national organisations (CSOs, CBOs, NGOs, foundations and academia) in The Gambia, covering biodiversity, climate change, land degradation, international waters and chemicals and waste. Maximum amount is $50,000, with co-finance of at least the requested amount required. Call closed 12 Jun 2026.',
  (SELECT id FROM funders WHERE name = 'GEF Small Grants Programme'),
  'national', 'closed',
  ARRAY['climate_environment','food_agriculture'],
  ARRAY['rural_low_income','general_public'],
  ARRAY['ngo','community_group'],
  ARRAY['Gambia'], ARRAY['West Africa'],
  NULL, 50000, NULL, NULL, 'USD',
  '2026-06-12', false,
  ARRAY['project proposal'],
  ARRAY['registered_nonprofit'], ARRAY['English'],
  false, false, false, NULL,
  ARRAY['proposal','review'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.undp.org/gambia/publications/call-proposals-undp-gef-small-grants-programme-eighth-operational-phase-tranche-1-deadline-submission-proposals-5th-june-2026');

-- 20. Mastercard Foundation Scholars Program at the University of
--     Cambridge — fully funded masters for African citizens; 2026/27
--     applications open. No published USD amount or single deadline.
INSERT INTO grants (title, official_url, summary, funder_id, scope, status,
  sectors, beneficiaries, applicant_types, eligible_countries, eligible_regions,
  amount_usd_min, amount_usd_max, amount_min, amount_max, currency,
  deadline, rolling, documents_required, registration_required, languages,
  all_countries, foreign_applicants_allowed, fee_charged, partner_required,
  stages, approved, last_checked_at)
SELECT 'Mastercard Foundation Scholars Program — University of Cambridge',
  'https://www.mastercardfoundation.fund.cam.ac.uk/news/applications-20262027-academic-year-are-now-open',
  'Fully funded one-year masters study at the University of Cambridge for citizens of an African country resident in Africa, covering tuition and a monthly maintenance allowance, with a focus on climate resilience and sustainability. Applications for the 2026/27 academic year are open. No USD amount and no single application deadline are published on the programme page.',
  (SELECT id FROM funders WHERE name = 'Mastercard Foundation'),
  'africa', 'open',
  ARRAY['education_youth'],
  ARRAY['youth'],
  ARRAY['individual'],
  NULL, ARRAY['Africa'],
  NULL, NULL, NULL, NULL, 'USD',
  NULL, false,
  ARRAY['university application','scholarship application'],
  NULL, ARRAY['English'],
  false, true, false, NULL,
  ARRAY['university application','scholarship selection'],
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM grants WHERE official_url = 'https://www.mastercardfoundation.fund.cam.ac.uk/news/applications-20262027-academic-year-are-now-open');

-- --------------------------------------------------------------------------
-- Verification (run after the seed; expect 17 funders, 20 grants)
-- --------------------------------------------------------------------------
-- SELECT (SELECT count(*) FROM funders) AS funders,
--        (SELECT count(*) FROM grants) AS grants;
-- SELECT scope, status, count(*) FROM grants GROUP BY scope, status;
