// Test fixtures — values copied VERBATIM from supabase/seed/seed-20-grants.sql
// (seed date 2026-11-11; 20 real grants verified against the funders' own sites).
// Only the fields the scoring code reads are reproduced here. Do NOT edit a
// value to make a test pass — if the seed changes, update this file from the
// seed and fix the test expectations instead.
//
// US_ONLY_GRANT below is the ONE synthetic fixture: it is NOT a real grant.
// It is the Japan GGP row with its country list swapped to ['United States'],
// used only to prove a US-only national grant is hidden from an African
// applicant. It is labelled SYNTHETIC wherever it is used.

import type { GrantRow, QuizAnswers } from '@/features/matching/score';

export const NIGERIA_NGO: QuizAnswers = {
  applicant_type: 'ngo',
  registration_type: 'registered_nonprofit',
  country: 'Nigeria',
  description: 'We train widows in Ikwo in tailoring and give them sewing machines.',
  sector: 'economic_empowerment',
  beneficiaries: 'rural_low_income',
  funding_need: '5000_25000',
  annual_budget: '10000_50000',
  stage: 'running',
};

export const KENYA_NGO: QuizAnswers = { ...NIGERIA_NGO, country: 'Kenya' };

/** Regions as stored in country_regions for Nigeria (West Africa + Africa). */
export const NIGERIA_REGIONS = ['West Africa', 'Africa'];

/** 1. D-Prize Global Competition 2026 — international, open, max $20,000, deadline 2026-12-06. */
export const D_PRIZE: GrantRow = {
  id: 'seed-d-prize',
  title: 'D-Prize Global Competition 2026',
  scope: 'international',
  sectors: ['economic_empowerment', 'health_wash', 'education_youth', 'food_agriculture'],
  beneficiaries: ['rural_low_income', 'general_public'],
  applicant_types: ['individual', 'startup', 'ngo'],
  eligible_countries: null,
  eligible_regions: ['Africa'],
  all_countries: false,
  amount_usd_max: 20000,
  deadline: '2026-12-06',
  partner_required: null,
};

/** 2. The Pollination Project Daily Grant — international, open, max $1,000, rolling. */
export const POLLINATION: GrantRow = {
  id: 'seed-pollination',
  title: 'The Pollination Project Daily Grant',
  scope: 'international',
  sectors: ['economic_empowerment', 'education_youth', 'climate_environment'],
  beneficiaries: ['general_public', 'rural_low_income'],
  applicant_types: ['individual', 'ngo', 'community_group'],
  eligible_countries: null,
  eligible_regions: null,
  all_countries: true,
  amount_usd_max: 1000,
  deadline: null,
  partner_required: null,
};

/** 3. Awesome Foundation — Disability Chapter Grant — international, open, $1,000. */
export const AWESOME_DISABILITY: GrantRow = {
  id: 'seed-awesome',
  title: 'Awesome Foundation — Disability Chapter Grant',
  scope: 'international',
  sectors: ['health_wash', 'arts_media_culture', 'tech_innovation'],
  beneficiaries: ['persons_with_disabilities'],
  applicant_types: ['individual', 'ngo', 'startup'],
  eligible_countries: null,
  eligible_regions: null,
  all_countries: true,
  amount_usd_max: 1000,
  deadline: null,
  partner_required: null,
};

/** 10. Tony Elumelu Foundation Entrepreneurship Programme — africa, $5,000 (individual/startup only). */
export const TONY_ELUMELU: GrantRow = {
  id: 'seed-tef',
  title: 'Tony Elumelu Foundation Entrepreneurship Programme',
  scope: 'africa',
  sectors: ['economic_empowerment'],
  beneficiaries: ['youth', 'women_widows'],
  applicant_types: ['individual', 'startup'],
  eligible_countries: null,
  eligible_regions: ['Africa'],
  all_countries: false,
  amount_usd_max: 5000,
  deadline: '2026-03-01',
  partner_required: null,
};

/** 13. U.S. African Development Foundation Grants — africa, open, max $250,000. */
export const USADF: GrantRow = {
  id: 'seed-usadf',
  title: 'U.S. African Development Foundation Grants',
  scope: 'africa',
  sectors: ['food_agriculture', 'economic_empowerment'],
  beneficiaries: ['rural_low_income', 'general_public'],
  applicant_types: ['ngo', 'community_group', 'startup'],
  eligible_countries: null,
  eligible_regions: ['Africa'],
  all_countries: false,
  amount_usd_max: 250000,
  deadline: null,
  partner_required: null,
};

/** 15. Japan GGP — Nigeria — national, Nigeria only, NGO only, max JPY 10,000,000 (no USD max). */
export const JAPAN_GGP_NIGERIA: GrantRow = {
  id: 'seed-japan-ggp',
  title: 'Japan Grant Assistance for Grass-roots Human Security Projects (GGP) — Nigeria',
  scope: 'national',
  sectors: ['health_wash', 'education_youth', 'economic_empowerment'],
  beneficiaries: ['rural_low_income', 'general_public'],
  applicant_types: ['ngo'],
  eligible_countries: ['Nigeria'],
  eligible_regions: ['West Africa'],
  all_countries: false,
  amount_usd_max: null,
  deadline: '2025-06-13',
  partner_required: null,
};

/** 17. GEF Small Grants Programme — Malawi (OP8) — national, Malawi only, $5,000–$75,000. */
export const GEF_MALAWI: GrantRow = {
  id: 'seed-gef-malawi',
  title: 'GEF Small Grants Programme — Malawi (OP8)',
  scope: 'national',
  sectors: ['climate_environment', 'food_agriculture'],
  beneficiaries: ['rural_low_income', 'general_public'],
  applicant_types: ['ngo', 'community_group'],
  eligible_countries: ['Malawi'],
  eligible_regions: ['Southern Africa'],
  all_countries: false,
  amount_usd_max: 75000,
  deadline: '2026-10-30',
  partner_required: null,
};

/** 20. Mastercard Foundation Scholars Program — University of Cambridge — africa, individual only. */
export const MASTERCARD_CAMBRIDGE: GrantRow = {
  id: 'seed-mastercard-cambridge',
  title: 'Mastercard Foundation Scholars Program — University of Cambridge',
  scope: 'africa',
  sectors: ['education_youth'],
  beneficiaries: ['youth'],
  applicant_types: ['individual'],
  eligible_countries: null,
  eligible_regions: ['Africa'],
  all_countries: false,
  amount_usd_max: null,
  deadline: null,
  partner_required: null,
};

/** SYNTHETIC (not a real grant): Japan GGP shape with the country list swapped
 *  to the United States, to prove a US-only national grant is hidden. */
export const US_ONLY_GRANT: GrantRow = {
  ...JAPAN_GGP_NIGERIA,
  id: 'synthetic-us-only',
  title: 'SYNTHETIC US-only national grant (test fixture only — not real)',
  eligible_countries: ['United States'],
  eligible_regions: [],
};

export const SEED_GRANTS: GrantRow[] = [
  D_PRIZE,
  POLLINATION,
  AWESOME_DISABILITY,
  TONY_ELUMELU,
  USADF,
  JAPAN_GGP_NIGERIA,
  GEF_MALAWI,
  MASTERCARD_CAMBRIDGE,
];
