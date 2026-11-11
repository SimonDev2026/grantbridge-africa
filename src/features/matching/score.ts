// Deterministic quiz matching — extracted from src/app/api/quiz-results/route.ts
// (Step 10) so it can be unit-tested without a database or AI call.
//
// This is the pre-signup ranking: same weights as the Postgres match_grants()
// function (sectors, beneficiaries, amount, urgency), minus the vector step
// (that runs after sign-up in /api/match). No AI, no network — pure functions
// of the quiz answers and the grant rows.
//
// The route keeps the DB query + HTTP shell and imports rankGrants() from here;
// the scoring behaviour must stay identical in both places.

export type QuizAnswers = {
  applicant_type: string;
  registration_type?: string;
  country: string;
  description: string;
  sector: string;
  beneficiaries: string;
  funding_need: string; // slug, e.g. 5000_25000
  annual_budget: string;
  stage: string;
};

/** Minimal shape of a grants row as used by scoring (subset of the DB row). */
export type GrantRow = {
  id: string;
  title: string;
  scope?: string | null;
  sectors?: string[] | null;
  beneficiaries?: string[] | null;
  applicant_types?: string[] | null;
  eligible_countries?: string[] | null;
  eligible_regions?: string[] | null;
  all_countries?: boolean | null;
  amount_usd_max?: number | null;
  deadline?: string | null;
  partner_required?: string | null;
  [key: string]: unknown;
};

export const NEED_RANGES: Record<string, [number, number]> = {
  under_5000: [0, 5000],
  '5000_25000': [5000, 25000],
  '25000_100000': [25000, 100000],
  '100000_500000': [100000, 500000],
  over_500000: [500000, 100000000],
};

/**
 * Eligibility filter — the same rules as the route (and match_grants()).
 * A grant is shown only if the applicant type matches AND the country is
 * covered (explicit country list, region list, or an international /
 * Africa-wide scope with no country restriction). National grants for
 * other countries are hidden.
 */
export function isEligible(a: QuizAnswers, g: GrantRow, regions: string[]): boolean {
  // Eligibility: applicant type
  if (g.applicant_types?.length && !g.applicant_types.includes(a.applicant_type)) return false;
  // Eligibility: country
  if (g.all_countries) return true;
  if (g.eligible_countries?.length && g.eligible_countries.includes(a.country)) return true;
  if (g.scope === 'national') return false; // national grants for other countries
  if (g.eligible_regions?.length && g.eligible_regions.some((r: string) => regions.includes(r))) return true;
  if (!g.eligible_countries?.length && !g.eligible_regions?.length) return true; // no restriction stated
  return g.scope === 'international' || g.scope === 'africa';
}

/** Fit score (0–100) + human-readable reasons, in the route's exact weights. */
export function scoreGrant(
  a: QuizAnswers,
  g: GrantRow,
  regions: string[],
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (g.scope === 'international') {
    reasons.push(`International funder that accepts applicants from ${a.country}`);
    score += 20;
  } else if (g.scope === 'africa') {
    reasons.push('Africa-focused funder');
    score += 20;
  } else {
    reasons.push(`National programme in ${a.country}`);
    score += 20;
  }

  if ((g.applicant_types ?? []).includes(a.applicant_type)) {
    reasons.push(`Accepts ${a.applicant_type.replace('_', ' ')} applicants`);
    score += 20;
  }
  if ((g.sectors ?? []).includes(a.sector)) {
    reasons.push(`Funds ${a.sector.replace(/_/g, ' ')}`);
    score += 30;
  }
  if ((g.beneficiaries ?? []).includes(a.beneficiaries)) {
    reasons.push(`Prioritises ${a.beneficiaries.replace(/_/g, ' ')}`);
    score += 20;
  }
  const [needMin, needMax] = NEED_RANGES[a.funding_need] ?? [0, 100000000];
  if (g.amount_usd_max && g.amount_usd_max >= needMin && g.amount_usd_max <= needMax * 4) score += 10;
  else if (g.amount_usd_max && g.amount_usd_max >= needMin) score += 5;

  if (g.deadline) reasons.push(`Deadline ${g.deadline}`);
  if (g.partner_required) reasons.push(`Note: needs ${g.partner_required}`);
  return { score, reasons: reasons.slice(0, 4) };
}

export type RankedGrant = GrantRow & { score: number; reasons: string[] };

/** Filter + score + sort (score desc, then earliest deadline first). */
export function rankGrants(a: QuizAnswers, grants: GrantRow[], regions: string[]): RankedGrant[] {
  return grants
    .filter((g) => isEligible(a, g, regions))
    .map((g) => {
      const { score, reasons } = scoreGrant(a, g, regions);
      return { ...g, score, reasons };
    })
    .sort((x, y) => y.score - x.score || (x.deadline ?? '9999').localeCompare(y.deadline ?? '9999'));
}
