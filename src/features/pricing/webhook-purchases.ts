// One-time-purchase branching for the Stripe webhook — extracted from
// src/app/api/webhooks/route.ts (Step 10) so the product-metadata decisions
// can be unit-tested without Stripe or a database.
//
// Stripe products carry the routing in their metadata (set when the products
// are created in Step 4):
//   kind=draft_credit, credits=<n>   -> add <n> x quantity pay-per-application credits
//   kind=service, package=<key>      -> create a service_requests row (Expert
//                                        Review $149 / Done-for-you $399)
// Anything else (no kind, or an unknown kind) is ignored — the webhook must
// never fail, or create rows, for a product it does not recognise.

export type OneTimePurchaseAction =
  | { kind: 'draft_credit'; rpc: 'add_draft_credits'; rpcArgs: { p_user: string; p_n: number } }
  | {
      kind: 'service';
      insert: {
        table: 'service_requests';
        row: {
          user_id: string;
          package: string;
          stripe_session_id: string;
          grant_id: string | null;
          amount_paid_cents: number | null;
          currency: 'usd';
          status: 'paid';
        };
      };
    }
  | { kind: 'ignored'; reason: string };

export type LineItemInput = {
  /** Stripe product metadata (may be missing/empty for products without any). */
  metadata?: Record<string, string> | null;
  quantity?: number | null;
};

/**
 * Decide what one checkout line item does. Pure — the route still performs
 * the RPC / insert / admin email itself.
 */
export function resolveOneTimePurchase(
  item: LineItemInput,
  opts: { userId: string; sessionId: string; grantId?: string | null; amountTotalCents?: number | null },
): OneTimePurchaseAction {
  const md = item.metadata ?? {};
  if (md.kind === 'draft_credit') {
    const perUnit = Number(md.credits || 1);
    const qty = item.quantity || 1;
    return {
      kind: 'draft_credit',
      rpc: 'add_draft_credits',
      rpcArgs: { p_user: opts.userId, p_n: perUnit * qty },
    };
  }
  if (md.kind === 'service') {
    return {
      kind: 'service',
      insert: {
        table: 'service_requests',
        row: {
          user_id: opts.userId,
          package: md.package,
          stripe_session_id: opts.sessionId,
          grant_id: opts.grantId || null,
          amount_paid_cents: opts.amountTotalCents ?? null,
          currency: 'usd',
          status: 'paid',
        },
      },
    };
  }
  return { kind: 'ignored', reason: `no one-time-purchase handling for product metadata kind=${md.kind ?? '(none)'}` };
}

/** Map a whole checkout session's line items to their actions (subscription mode never reaches here). */
export function resolveOneTimePurchases(
  items: LineItemInput[],
  opts: { userId: string; sessionId: string; grantId?: string | null; amountTotalCents?: number | null },
): OneTimePurchaseAction[] {
  return items.map((item) => resolveOneTimePurchase(item, opts));
}
