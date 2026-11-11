import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ProductWithPrices } from '@/features/pricing/types';

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
  return (data ?? []) as ProductWithPrices[];
}
