import { ProductWithPrices } from '@/features/pricing/types';
import { getStripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { mapStripeProductsToProductWithPrices } from './map-stripe-products';
import { upsertPrice } from './upsert-price';
import { upsertProduct } from './upsert-product';

export async function getProducts() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  if (error) {
    console.error(error.message);
  }

  // The `.order('metadata->index')` JSON-path ordering collapses the
  // query's inferred type to `never`, so assert the known shape: the
  // select is `*, prices(*)`, which is exactly ProductWithPrices.
  const dbProducts = (data ?? []) as ProductWithPrices[];

  // The database copy is the fast path — but it only exists if the Stripe
  // webhook has synced at least one product+price. The six products were
  // created in the Stripe dashboard BEFORE the webhook endpoint existed,
  // so no product.created event ever fired and the tables stayed empty:
  // every "Choose …" button then rendered as a plain /signup link, and
  // /signup bounces a signed-in user to /quiz — the checkout loop.
  // If the DB has no sellable product, read live from Stripe instead and
  // backfill the tables so the next read is fast again.
  if (dbProducts.some((p) => (p.prices ?? []).length > 0)) {
    return dbProducts;
  }

  try {
    const stripe = getStripeAdmin();
    const [stripeProducts, stripePrices] = await Promise.all([
      stripe.products.list({ active: true, limit: 100 }),
      stripe.prices.list({ active: true, limit: 100 }),
    ]);
    const live = mapStripeProductsToProductWithPrices(
      stripeProducts.data,
      stripePrices.data,
    );

    // Best-effort backfill: the webhook keeps these tables in sync from
    // now on, but a failed backfill must never break the pricing page.
    for (const product of stripeProducts.data) {
      if (!live.some((p) => p.id === product.id)) continue;
      try {
        await upsertProduct(product);
      } catch (e) {
        console.error('Product backfill failed', product.id, e);
      }
    }
    for (const price of stripePrices.data) {
      if (!live.some((p) => p.prices.some((pr) => pr.id === price.id))) continue;
      try {
        await upsertPrice(price);
      } catch (e) {
        console.error('Price backfill failed', price.id, e);
      }
    }

    if (live.some((p) => p.prices.length > 0)) return live;
  } catch (e) {
    // No Stripe key in this environment, or Stripe unreachable: fall
    // through and return the (empty) DB result so the page still renders.
    console.error('Stripe product fallback failed', e);
  }

  return dbProducts;
}
