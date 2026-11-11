// Unit tests for the draft quota logic (src/features/writer/draft-quota.ts).
// Plan prices/names come from BRAND.plans (Explorer free, Seeker $19, Writer $49,
// Pro $149) — the allowance mapping is: Seeker 1 / Writer 10 / Pro unlimited.
import { describe, expect, it } from 'vitest';

import {
  hasPlanDraftAllowance,
  monthlyDraftAllowance,
  resolveDraftAccess,
} from '@/features/writer/draft-quota';

describe('monthlyDraftAllowance', () => {
  it('maps Seeker -> 1, Writer -> 10, Pro -> effectively unlimited', () => {
    expect(monthlyDraftAllowance('seeker')).toBe(1);
    expect(monthlyDraftAllowance('writer')).toBe(10);
    expect(monthlyDraftAllowance('pro')).toBe(100000);
  });

  it('is case-insensitive (the route lower-cases the Stripe product name)', () => {
    expect(monthlyDraftAllowance('Seeker')).toBe(1);
    expect(monthlyDraftAllowance('WRITER')).toBe(10);
    expect(monthlyDraftAllowance('Pro')).toBe(100000);
  });

  it('gives 0 for Explorer (free), unknown plans, and no plan', () => {
    expect(monthlyDraftAllowance('explorer')).toBe(0);
    expect(monthlyDraftAllowance('enterprise')).toBe(0);
    expect(monthlyDraftAllowance('')).toBe(0);
    expect(monthlyDraftAllowance(null)).toBe(0);
    expect(monthlyDraftAllowance(undefined)).toBe(0);
  });
});

describe('hasPlanDraftAllowance', () => {
  it('allows a Seeker with 0 drafts used this month, blocks at 1', () => {
    expect(hasPlanDraftAllowance('seeker', 0)).toBe(true);
    expect(hasPlanDraftAllowance('seeker', 1)).toBe(false);
    expect(hasPlanDraftAllowance('seeker', 5)).toBe(false);
  });

  it('allows a Writer up to 10 drafts, blocks at 10', () => {
    expect(hasPlanDraftAllowance('writer', 9)).toBe(true);
    expect(hasPlanDraftAllowance('writer', 10)).toBe(false);
  });

  it('never blocks Pro within any realistic usage', () => {
    expect(hasPlanDraftAllowance('pro', 999)).toBe(true);
  });

  it('blocks a free/Explorer user with no plan allowance', () => {
    expect(hasPlanDraftAllowance('explorer', 0)).toBe(false);
    expect(hasPlanDraftAllowance(null, 0)).toBe(false);
  });
});

describe('resolveDraftAccess — the $29 credit fallback (use_draft_credit)', () => {
  it('uses the plan allowance when one is left', () => {
    expect(resolveDraftAccess('writer', 3, false)).toEqual({ action: 'use-plan-allowance' });
  });

  it('falls back to a draft credit when the plan allowance is exhausted', () => {
    expect(resolveDraftAccess('seeker', 1, true)).toEqual({ action: 'use-draft-credit' });
    expect(resolveDraftAccess('writer', 10, true)).toEqual({ action: 'use-draft-credit' });
    // A free user with a purchased credit can draft too.
    expect(resolveDraftAccess('explorer', 0, true)).toEqual({ action: 'use-draft-credit' });
  });

  it('returns the 402 payment-required outcome when neither allowance nor credit exists', () => {
    expect(resolveDraftAccess('seeker', 1, false)).toEqual({
      action: 'payment-required',
      error: 'Buy a single application draft ($29) or upgrade your plan',
    });
    expect(resolveDraftAccess('explorer', 0, false).action).toBe('payment-required');
  });
});
