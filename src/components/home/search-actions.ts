'use server';

// Live grant search for the homepage hero — reads the real grants table
// through the existing Supabase server client (same pattern as page.tsx).
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export type GrantSearchResult = {
  id: string;
  title: string;
  funderName: string | null;
  scope: string | null;
  deadline: string | null;
  rolling: boolean | null;
  amountLabel: string;
};

function amountLabel(g: {
  amount_usd_max?: number | null;
  amount_usd_min?: number | null;
  amount_max?: number | null;
  amount_min?: number | null;
  currency?: string | null;
}): string {
  if (g.amount_usd_max) return `Up to $${g.amount_usd_max.toLocaleString()}`;
  if (g.amount_usd_min) return `From $${g.amount_usd_min.toLocaleString()}`;
  if (g.amount_max && g.currency) return `Up to ${g.currency} ${g.amount_max.toLocaleString()}`;
  if (g.amount_min && g.currency) return `From ${g.currency} ${g.amount_min.toLocaleString()}`;
  return 'Amount varies';
}

export async function searchGrants(query: string): Promise<GrantSearchResult[]> {
  const q = query.trim().replace(/[%_,\\]/g, '').slice(0, 80);
  if (q.length < 2) return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('grants')
    .select(
      'id, title, scope, deadline, rolling, amount_usd_min, amount_usd_max, currency, amount_min, amount_max, funders(name)'
    )
    .eq('approved', true)
    .eq('status', 'open')
    .eq('fee_charged', false)
    .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(6);

  return (data ?? []).map((g: any) => ({
    id: g.id,
    title: g.title,
    funderName: g.funders?.name ?? null,
    scope: g.scope,
    deadline: g.deadline,
    rolling: g.rolling,
    amountLabel: amountLabel(g),
  }));
}
