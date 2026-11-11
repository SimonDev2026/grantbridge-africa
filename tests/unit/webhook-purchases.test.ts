// Unit tests for the webhook one-time-purchase branching
// (src/features/pricing/webhook-purchases.ts, used by /api/webhooks).
// Covers: draft credits (kind=draft_credit) and human services
// (kind=service, Expert Review $149 / Done-for-you $399) from product metadata.
import { describe, expect, it } from 'vitest';

import { resolveOneTimePurchase, resolveOneTimePurchases } from '@/features/pricing/webhook-purchases';

const OPTS = { userId: 'user-123', sessionId: 'cs_test_abc', grantId: 'grant-1', amountTotalCents: 2900 };

describe('draft_credit products', () => {
  it('adds credits x quantity via the add_draft_credits RPC', () => {
    expect(
      resolveOneTimePurchase({ metadata: { kind: 'draft_credit', credits: '1' }, quantity: 3 }, OPTS),
    ).toEqual({
      kind: 'draft_credit',
      rpc: 'add_draft_credits',
      rpcArgs: { p_user: 'user-123', p_n: 3 },
    });
  });

  it('defaults to 1 credit when the product has no credits metadata', () => {
    const action = resolveOneTimePurchase({ metadata: { kind: 'draft_credit' }, quantity: 1 }, OPTS);
    expect(action).toMatchObject({ kind: 'draft_credit', rpcArgs: { p_user: 'user-123', p_n: 1 } });
  });

  it('defaults quantity to 1 when Stripe omits it', () => {
    const action = resolveOneTimePurchase({ metadata: { kind: 'draft_credit', credits: '2' } }, OPTS);
    expect(action).toMatchObject({ rpcArgs: { p_n: 2 } });
  });

  it('supports multi-credit packs (credits=5, qty=2 -> 10)', () => {
    const action = resolveOneTimePurchase({ metadata: { kind: 'draft_credit', credits: '5' }, quantity: 2 }, OPTS);
    expect(action).toMatchObject({ rpcArgs: { p_n: 10 } });
  });
});

describe('service products', () => {
  it('creates a paid service_requests row for Expert Review ($149)', () => {
    const action = resolveOneTimePurchase(
      { metadata: { kind: 'service', package: 'review' }, quantity: 1 },
      { ...OPTS, amountTotalCents: 14900 },
    );
    expect(action).toEqual({
      kind: 'service',
      insert: {
        table: 'service_requests',
        row: {
          user_id: 'user-123',
          package: 'review',
          stripe_session_id: 'cs_test_abc',
          grant_id: 'grant-1',
          amount_paid_cents: 14900,
          currency: 'usd',
          status: 'paid',
        },
      },
    });
  });

  it('creates a paid service_requests row for Done-for-you ($399) with no grant attached', () => {
    const action = resolveOneTimePurchase(
      { metadata: { kind: 'service', package: 'done_for_you' }, quantity: 1 },
      { userId: 'user-123', sessionId: 'cs_test_xyz', grantId: null, amountTotalCents: 39900 },
    );
    expect(action).toMatchObject({
      kind: 'service',
      insert: { table: 'service_requests', row: { package: 'done_for_you', grant_id: null, amount_paid_cents: 39900 } },
    });
  });

  it('records a null amount when Stripe reports no total (never invents one)', () => {
    const action = resolveOneTimePurchase(
      { metadata: { kind: 'service', package: 'review' }, quantity: 1 },
      { userId: 'u', sessionId: 's', grantId: null, amountTotalCents: null },
    );
    expect(action).toMatchObject({ insert: { row: { amount_paid_cents: null } } });
  });
});

describe('unrecognised products', () => {
  it('ignores a product with no kind metadata (e.g. a subscription product)', () => {
    expect(resolveOneTimePurchase({ metadata: {}, quantity: 1 }, OPTS).kind).toBe('ignored');
    expect(resolveOneTimePurchase({ metadata: null, quantity: 1 }, OPTS).kind).toBe('ignored');
    expect(resolveOneTimePurchase({}, OPTS).kind).toBe('ignored');
  });

  it('ignores an unknown kind instead of creating rows', () => {
    const action = resolveOneTimePurchase({ metadata: { kind: 'mystery' }, quantity: 1 }, OPTS);
    expect(action.kind).toBe('ignored');
  });
});

describe('resolveOneTimePurchases (whole session)', () => {
  it('maps a mixed session: a draft credit + a service, in order', () => {
    const actions = resolveOneTimePurchases(
      [
        { metadata: { kind: 'draft_credit', credits: '1' }, quantity: 1 },
        { metadata: { kind: 'service', package: 'review' }, quantity: 1 },
      ],
      OPTS,
    );
    expect(actions.map((a) => a.kind)).toEqual(['draft_credit', 'service']);
  });
});
