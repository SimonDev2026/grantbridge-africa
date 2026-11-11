// Shared shapes for the quiz interstitials and results gate.
// All numbers and funders here come from the live database (see
// /api/quiz-results/stats and /api/quiz-results/preview) — never hard-coded.
import type { GrantCardData } from '@/components/grant-card';

export type FunderHighlight = Pick<
  GrantCardData,
  'id' | 'title' | 'funderName' | 'amount_usd_min' | 'amount_usd_max' | 'amount_max' | 'currency' | 'scope' | 'deadline' | 'rolling'
>;

export type QuizStats = {
  /** Approved grants with status open/upcoming right now. */
  openGrants: number;
  /** Distinct funders behind those open grants. */
  funders: number;
  /** All funders in the database (open + closed calls). */
  totalFunders: number;
  /** African countries covered — from BRAND.countriesCovered (54). */
  countriesCovered: number;
  /** Open grants with a published USD maximum, largest first. */
  highlights: FunderHighlight[];
};

export type PreviewResult = {
  /**
   * Grants matching the answers given so far.
   * When applicant type + country are both answered this is the deterministic
   * scorer (rankGrants) run on the partial answers; otherwise it is the count
   * of open grants (country-filtered when a country is known). `scored` says
   * which one it is, so the UI can label it honestly.
   */
  eligibleCount: number;
  openGrants: number;
  scored: boolean;
  /** Top 2 ranked (or largest) open grants — labelled as examples in the UI. */
  examples: GrantCardData[];
};
