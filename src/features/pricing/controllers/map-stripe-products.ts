import Stripe from 'stripe';

import { BRAND } from '@/config/brand';
import { ProductWithPrices } from '@/features/pricing/types';

/** The products this site sells, by their exact Stripe product names. */
export const GRANTBRIDGE_PRODUCT_NAMES = [
  ...BRAND.plans.map((p) => p.name),
  ...BRAND.oneTime.map((p) => p.name),
];

/**
 * Map live Stripe products + prices into the ProductWithPrices shape the
 * pricing cards render from. Only GrantBridge products (by exact name) and
 * USD prices are kept — the Stripe account is shared with other businesses,
 * so unfiltered listing would leak their products onto our pricing page.
 * Pure function, unit-tested. Kept in its own module so tests can import
 * it without pulling in the Supabase/Stripe clients.
 */
export function mapStripeProductsToProductWithPrices(
  stripeProducts: Stripe.Product[],
  stripePrices: Stripe.Price[],
  allowedNames: string[] = GRANTBRIDGE_PRODUCT_NAMES,
): ProductWithPrices[] {
  const allowed = new Set(allowedNames.map((n) => n.toLowerCase()));
  const byName = new Map<string, number>();
  allowedNames.forEach((n, i) => byName.set(n.toLowerCase(), i));

  const products = stripeProducts
    .filter((p) => p.active && allowed.has((p.name ?? '').toLowerCase()))
    .sort(
      (a, b) =>
        (byName.get((a.name ?? '').toLowerCase()) ?? 999) -
        (byName.get((b.name ?? '').toLowerCase()) ?? 999),
    );

  return products.map((p) => {
    const prices = stripePrices
      .filter(
        (pr) =>
          pr.active &&
          (typeof pr.product === 'string' ? pr.product : pr.product?.id) === p.id &&
          (pr.currency ?? '').toLowerCase() === 'usd',
      )
      .map((pr) => ({
        id: pr.id,
        product_id: p.id,
        active: pr.active,
        currency: pr.currency,
        description: pr.nickname ?? null,
        type: pr.type,
        unit_amount: pr.unit_amount ?? null,
        interval: pr.recurring?.interval ?? null,
        interval_count: pr.recurring?.interval_count ?? null,
        trial_period_days: pr.recurring?.trial_period_days ?? null,
        metadata: pr.metadata ?? {},
      }));
    return {
      id: p.id,
      active: p.active,
      name: p.name,
      description: p.description ?? null,
      image: p.images?.[0] ?? null,
      metadata: p.metadata ?? {},
      prices: prices as ProductWithPrices['prices'],
    };
  });
}
