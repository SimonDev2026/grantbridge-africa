// POST /api/quiz-results — public, no sign-in needed.
// Ranks approved, open grants against the quiz answers with the same weights
// as match_grants() (sectors, beneficiaries, amount, urgency), minus the
// vector step (that runs after sign-up in /api/match). Deterministic, no AI.
// Scoring/eligibility live in @/features/matching/score (Step 10 extraction)
// and are unit-tested there; this route is only the DB query + HTTP shell.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { rankGrants } from '@/features/matching/score';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

const Body = z.object({
  applicant_type: z.string(),
  registration_type: z.string().optional(),
  country: z.string(),
  description: z.string().max(240),
  sector: z.string(),
  beneficiaries: z.string(),
  funding_need: z.string(), // slug, e.g. 5000_25000
  annual_budget: z.string(),
  stage: z.string(),
});

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });
  const a = parsed.data;

  const [{ data: grants }, { data: cr }] = await Promise.all([
    db
      .from('grants')
      .select('*, funders(name)')
      .eq('approved', true)
      .eq('fee_charged', false)
      .in('status', ['open', 'upcoming']),
    db.from('country_regions').select('regions').eq('country', a.country).maybeSingle(),
  ]);
  const regions: string[] = cr?.regions ?? ['Africa'];

  const ranked = rankGrants(a, grants ?? [], regions).map((g: any) => ({
    id: g.id,
    title: g.title,
    funderName: g.funders?.name,
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
    score: g.score,
    reasons: g.reasons,
    country: a.country,
  }));

  return Response.json({ count: ranked.length, matches: ranked.slice(0, 50) });
}
