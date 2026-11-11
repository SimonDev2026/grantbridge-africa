import { SubscriptionWithProduct } from '@/features/pricing/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getSubscription() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  // The nested `prices(*, products(*))` select collapses the query's
  // inferred type to `never`, so assert the known shape.
  return data as SubscriptionWithProduct | null;
}
