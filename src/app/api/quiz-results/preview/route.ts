// POST /api/quiz-results/preview — public, no sign-in needed.
// Mid-quiz "matches found so far" count for the AI-scan interstitial.
// Accepts PARTIAL quiz answers (every field optional). When applicant type
// and country are both answered, the count comes from the same deterministic
// scorer as the final results (rankGrants on the partial answers —
// unanswered fields simply score no points). Before that point it falls
// back to the count of open grants (country-filtered when a country is
// known), and `scored` tells the UI which basis the number has.
// Scoring logic itself is NOT duplicated or changed — it is imported from
// @/features/matching/score, exactly as /api/quiz-results does.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { type GrantRow, type QuizAnswers,rankGrants } from '@/features/matching/score';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

const Body = z.object({
  applicant_type: z.string().optional().default(''),
  registration_type: z.string().optional().default(''),
  country: z.string().optional().default(''),
  description: z.string().max(240).optional().default(''),
  sector: z.string().optional().default(''),
  beneficiaries: z.string().optional().default(''),
  funding_need: z.string().optional().default(''),
  annual_budget: z.string().optional().default(''),
  stage: z.string().optional().default(''),
});

function mapGrant(g: any, country: string) {
  return {
    id: g.id,
    title: g.title,
    funderName: g.funderName ?? g.funders?.name,
    summary: g.summary,
    amount_usd_min: g.amount_usd_min,
    amount_usd_max: g.amount_usd_max,
    currency: g.currency,
    amount_min: g.amount_min,
    amount_max: g.amount_max,
    scope: g.scope,
    deadline: g.deadline,
    rolling: g.rolling,
    official_url: g.official_url,
    score: g.score ?? null,
    reasons: g.reasons ?? null,
    country,
    example: true,
  };
}

/** Country-only eligibility (used before applicant type is known). */
function countryEligible(g: GrantRow, country: string, regions: string[]): boolean {
  if (!country) return true;
  if (g.all_countries) return true;
  if (g.eligible_countries?.length && g.eligible_countries.includes(country)) return true;
  if (g.scope === 'national') return false;
  if (g.eligible_regions?.length && g.eligible_regions.some((r: string) => regions.includes(r)))
    return true;
  if (!g.eligible_countries?.length && !g.eligible_regions?.length) return true;
  return g.scope === 'international' || g.scope === 'africa';
}

export async function POST(req: NextRequest) {
  try {
    const parsed = Body.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });
    const a = parsed.data as QuizAnswers;

    // Grants and funders are queried separately and joined in JS — the
    // embedded `funders(name)` select depends on PostgREST's relationship
    // cache, and a stale cache turns the whole endpoint into a 500.
    const [{ data: grants, error }, { data: funders }, { data: cr }] = await Promise.all([
      db
        .from('grants')
        .select('*')
        .eq('approved', true)
        .eq('fee_charged', false)
        .in('status', ['open', 'upcoming']),
      db.from('funders').select('id, name'),
      a.country
        ? db.from('country_regions').select('regions').eq('country', a.country).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    const funderNameById = new Map<string, string>(
      (funders ?? []).map((f: any) => [f.id, f.name])
    );
    const open = ((grants ?? []) as GrantRow[]).map((g: any) => ({
      ...g,
      funderName: funderNameById.get(g.funder_id) ?? null,
    }));
    const regions: string[] = cr?.regions ?? ['Africa'];

    if (a.applicant_type && a.country) {
      // Deterministic scorer on the partial answers.
      const ranked = rankGrants(a, open, regions);
      return Response.json({
        eligibleCount: ranked.length,
        openGrants: open.length,
        scored: true,
        examples: ranked.slice(0, 2).map((g: any) => mapGrant(g, a.country)),
      });
    }

    // Fallback: open grants, country-filtered when a country is known.
    const eligible = open.filter((g) => countryEligible(g, a.country, regions));
    const byAmount = [...eligible].sort(
      (x, y) => (y.amount_usd_max ?? 0) - (x.amount_usd_max ?? 0),
    );
    return Response.json({
      eligibleCount: eligible.length,
      openGrants: open.length,
      scored: false,
      examples: byAmount.slice(0, 2).map((g: any) => mapGrant(g, a.country)),
    });
  } catch (err: any) {
    return Response.json({ error: err?.message ?? 'Preview lookup failed' }, { status: 500 });
  }
}
