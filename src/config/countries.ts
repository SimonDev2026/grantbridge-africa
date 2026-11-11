// All 54 African countries, as seeded in the database (country_regions table).
// Keep this list in sync with the seed migration.
export const AFRICAN_COUNTRIES = [
  'Algeria',
  'Angola',
  'Benin',
  'Botswana',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cameroon',
  'Central African Republic',
  'Chad',
  'Comoros',
  'Congo (Brazzaville)',
  "Côte d'Ivoire",
  'DR Congo',
  'Djibouti',
  'Egypt',
  'Equatorial Guinea',
  'Eritrea',
  'Eswatini',
  'Ethiopia',
  'Gabon',
  'Gambia',
  'Ghana',
  'Guinea',
  'Guinea-Bissau',
  'Kenya',
  'Lesotho',
  'Liberia',
  'Libya',
  'Madagascar',
  'Malawi',
  'Mali',
  'Mauritania',
  'Mauritius',
  'Morocco',
  'Mozambique',
  'Namibia',
  'Niger',
  'Nigeria',
  'Rwanda',
  'São Tomé and Príncipe',
  'Senegal',
  'Seychelles',
  'Sierra Leone',
  'Somalia',
  'South Africa',
  'South Sudan',
  'Sudan',
  'Tanzania',
  'Togo',
  'Tunisia',
  'Uganda',
  'Zambia',
  'Zimbabwe',
] as const;

export type AfricanCountry = (typeof AFRICAN_COUNTRIES)[number];

// Quiz option vocab — these exact slugs are stored in profiles/grants and used by match_grants().
export const APPLICANT_TYPES = [
  { value: 'ngo', label: 'NGO / non-profit' },
  { value: 'startup', label: 'Startup or small business' },
  { value: 'researcher', label: 'Researcher or university' },
  { value: 'individual', label: 'Student / individual' },
  { value: 'community_group', label: 'Community group (unregistered)' },
] as const;

export const REGISTRATION_TYPES = [
  { value: 'registered_nonprofit', label: 'Registered non-profit / Incorporated Trustees' },
  { value: 'registered_company', label: 'Registered company' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'unregistered', label: 'Not yet registered' },
] as const;

export const SECTORS = [
  { value: 'food_agriculture', label: 'Hunger & food security / agriculture' },
  { value: 'education_youth', label: 'Education & youth' },
  { value: 'health_wash', label: 'Health & WASH' },
  { value: 'women_girls', label: 'Women & girls' },
  { value: 'climate_environment', label: 'Climate & environment' },
  { value: 'economic_empowerment', label: 'Economic empowerment & enterprise' },
  { value: 'arts_media_culture', label: 'Arts, media & culture' },
  { value: 'tech_innovation', label: 'Tech & innovation' },
] as const;

export const BENEFICIARIES = [
  { value: 'children_orphans', label: 'Children & orphans' },
  { value: 'women_widows', label: 'Women & widows' },
  { value: 'youth', label: 'Youth' },
  { value: 'persons_with_disabilities', label: 'Persons with disabilities' },
  { value: 'rural_low_income', label: 'Rural / low-income families' },
  { value: 'general_public', label: 'General public' },
] as const;

export const FUNDING_NEEDS = [
  { value: 'under_5000', label: 'Under US$5,000', min: 0, max: 5000 },
  { value: '5000_25000', label: 'US$5,000 – 25,000', min: 5000, max: 25000 },
  { value: '25000_100000', label: 'US$25,000 – 100,000', min: 25000, max: 100000 },
  { value: '100000_500000', label: 'US$100,000 – 500,000', min: 100000, max: 500000 },
  { value: 'over_500000', label: 'Over US$500,000', min: 500000, max: 100000000 },
] as const;

export const ANNUAL_BUDGETS = [
  { value: 'under_10000', label: 'Under US$10,000', amount: 10000 },
  { value: '10000_50000', label: 'US$10,000 – 50,000', amount: 50000 },
  { value: '50000_250000', label: 'US$50,000 – 250,000', amount: 250000 },
  { value: 'over_250000', label: 'Over US$250,000', amount: 250000 },
] as const;

export const PROJECT_STAGES = [
  { value: 'idea', label: 'Idea' },
  { value: 'pilot', label: 'Pilot / early stage' },
  { value: 'running', label: 'Running' },
  { value: 'scaling', label: 'Scaling' },
] as const;
