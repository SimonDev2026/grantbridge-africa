// Draft quota logic — extracted from src/app/api/draft/route.ts (Step 10) so the
// allowance mapping can be unit-tested without a database or a Stripe account.
//
// Plan names come from the Stripe product names (BRAND.plans, src/config/brand.ts).
// The route lower-cases the product name before looking it up here, so keys are
// lower-case. "pro" is effectively unlimited (100,000/month is the sentinel the
// route has used since Step 9 — far above any real usage, kept so the DB count
// comparison still works).

/** AI application drafts included per calendar month, by plan (lower-case product name). */
export const MONTHLY_DRAFT_LIMIT: Record<string, number> = {
  seeker: 1,
  writer: 10,
  pro: 100000,
};

/** Monthly draft allowance for a plan name; 0 for unknown / free (Explorer) / no plan. */
export function monthlyDraftAllowance(planName: string | null | undefined): number {
  if (!planName) return 0;
  return MONTHLY_DRAFT_LIMIT[planName.toLowerCase()] ?? 0;
}

/**
 * True when the user still has plan allowance left this month.
 * `draftsUsedThisMonth` is the count of drafts created since the 1st of the month.
 */
export function hasPlanDraftAllowance(planName: string | null | undefined, draftsUsedThisMonth: number): boolean {
  return monthlyDraftAllowance(planName) > draftsUsedThisMonth;
}

/**
 * What the route does when the plan allowance is exhausted: spend one
 * pay-per-application credit ($29 one-time Stripe price, via the
 * `use_draft_credit` RPC) if the user has one. Returns the outcome the
 * route should act on — the RPC itself still runs in the route.
 */
export type DraftCreditOutcome =
  | { action: 'use-plan-allowance' }
  | { action: 'use-draft-credit' }
  | { action: 'payment-required'; error: 'Buy a single application draft ($29) or upgrade your plan' };

export function resolveDraftAccess(
  planName: string | null | undefined,
  draftsUsedThisMonth: number,
  hasDraftCredit: boolean,
): DraftCreditOutcome {
  if (hasPlanDraftAllowance(planName, draftsUsedThisMonth)) return { action: 'use-plan-allowance' };
  if (hasDraftCredit) return { action: 'use-draft-credit' };
  return { action: 'payment-required', error: 'Buy a single application draft ($29) or upgrade your plan' };
}
