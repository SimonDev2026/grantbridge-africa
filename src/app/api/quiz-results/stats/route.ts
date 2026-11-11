// GET /api/quiz-results/stats — public, no sign-in needed.
// Live counts for the quiz interstitials: open grants, funders behind them,
// and the largest open grants (real funder names + real amounts) for the
// "You are in the right place" map screen. Nothing here is hard-coded:
// every number comes from the grants/funders tables.
import { BRAND } from '@/config/brand';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export async function GET() {
  try {
    // NOTE: grants and funders are queried separately and joined in JS on
    // purpose — the embedded `funders(name)` select depends on PostgREST's
    // relationship cache, and a stale cache turns the whole endpoint into a
    // 500. The plain selects below work regardless.
    const [{ data: grants, error }, { data: funders }] = await Promise.all([
      db
        .from('grants')
        .select('*')
        .eq('approved', true)
        .eq('fee_charged', false)
        .in('status', ['open', 'upcoming']),
      db.from('funders').select('id, name'),
    ]);
    if (error) return Response.json({ error: error.message }, { status: 500 });

    const open = grants ?? [];
    const funderNameById = new Map<string, string>(
      (funders ?? []).map((f: any) => [f.id, f.name])
    );
    const funderName = (g: any) => funderNameById.get(g.funder_id) ?? null;
    const funderNames = [...new Set(open.map(funderName).filter(Boolean))];
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
        funderName: funderName(g),
        amount_usd_min: g.amount_usd_min,
        amount_usd_max: g.amount_usd_max,
        amount_max: g.amount_max,
        currency: g.currency,
        scope: g.scope,
        deadline: g.deadline,
        rolling: g.rolling,
      })),
    });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'Stats lookup failed' }, { status: 500 });
  }
}
