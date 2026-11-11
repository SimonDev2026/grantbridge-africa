// POST /api/quiz-results — public, no sign-in needed.
// Ranks approved, open grants against the quiz answers with the same weights
// as match_grants() (sectors, beneficiaries, amount, urgency), minus the
// vector step (that runs after sign-up in /api/match). Deterministic, no AI.
// Scoring/eligibility live in @/features/matching/score (Step 10 extraction)
// and are unit-tested there; this route is only the DB query + HTTP shell.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { rankGrants } from '@/features/matching/score';
import { clientIp, RATE_LIMITS, rateLimited, tooManyRequests } from '@/libs/rate-limit';
import { supabasePublicClient } from '@/libs/supabase/supabase-public';

// Public read-only client (anon key) — see supabase-public.ts. A stale
// service-role key in Preview made this route fail with "Invalid API key",
// and the error was swallowed here so the quiz returned empty matches
// instead of an error. DB errors are now surfaced as a 500 so the UI
// shows a real error instead of a false "no matches".
const db = supabasePublicClient as any;

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
  // Rate-limit before the DB-heavy scoring run.
  if (rateLimited(`quiz-results:${clientIp(req)}`, RATE_LIMITS.quizResults.max, RATE_LIMITS.quizResults.windowMs)) {
    return tooManyRequests();
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });
  const a = parsed.data;

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
    db.from('country_regions').select('regions').eq('country', a.country).maybeSingle(),
  ]);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const funderNameById = new Map<string, string>(
    (funders ?? []).map((f: any) => [f.id, f.name])
  );
  const rows = ((grants ?? []) as any[]).map((g) => ({
    ...g,
    funderName: funderNameById.get(g.funder_id) ?? null,
  }));
  const regions: string[] = cr?.regions ?? ['Africa'];

  const ranked = rankGrants(a, rows, regions).map((g: any) => ({
    id: g.id,
    title: g.title,
    funderName: g.funderName,
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
