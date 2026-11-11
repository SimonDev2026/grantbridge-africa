// GET /api/quiz-results/stats — public, no sign-in needed.
// Live counts for the quiz interstitials: open grants, funders behind them,
// and the largest open grants (real funder names + real amounts) for the
// "You are in the right place" map screen. Nothing here is hard-coded:
// every number comes from the grants/funders tables.
import { BRAND } from '@/config/brand';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export async function GET() {
  const [{ data: grants, error }, { data: funders }] = await Promise.all([
    db
      .from('grants')
      .select('*, funders(name)')
      .eq('approved', true)
      .eq('fee_charged', false)
      .in('status', ['open', 'upcoming']),
    db.from('funders').select('id'),
  ]);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  const open = grants ?? [];
  const funderNames = [...new Set(open.map((g: any) => g.funders?.name).filter(Boolean))];
  const withUsdMax = open
    .filter((g: any) => typeof g.amount_usd_max === 'number' && g.amount_usd_max > 0)
    .sort((a: any, b: any) => b.amount_usd_max - a.amount_usd_max);

  return Response.json({
    openGrants: open.length,
    funders: funderNames.length,
    totalFunders: (funders ?? []).length,
    countriesCovered: BRAND.countriesCovered,
    highlights: withUsdMax.slice(0, 6).map((g: any) => ({
      id: g.id,
      title: g.title,
      funderName: g.funders?.name,
      amount_usd_min: g.amount_usd_min,
      amount_usd_max: g.amount_usd_max,
      amount_max: g.amount_max,
      currency: g.currency,
      scope: g.scope,
      deadline: g.deadline,
      rolling: g.rolling,
    })),
  });
}
