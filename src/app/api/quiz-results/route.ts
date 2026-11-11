// POST /api/quiz-results — public, no sign-in needed.
// Ranks approved, open grants against the quiz answers with the same weights
// as match_grants() (sectors, beneficiaries, amount, urgency), minus the
// vector step (that runs after sign-up in /api/match). Deterministic, no AI.
import { NextRequest } from 'next/server';
import { z } from 'zod';

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

const NEED_RANGES: Record<string, [number, number]> = {
  under_5000: [0, 5000],
  '5000_25000': [5000, 25000],
  '25000_100000': [25000, 100000],
  '100000_500000': [100000, 500000],
  over_500000: [500000, 100000000],
};

function scoreGrant(a: z.infer<typeof Body>, g: any, regions: string[]): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  if (g.scope === 'international') {
    reasons.push(`International funder that accepts applicants from ${a.country}`);
    score += 20;
  } else if (g.scope === 'africa') {
    reasons.push('Africa-focused funder');
    score += 20;
  } else {
    reasons.push(`National programme in ${a.country}`);
    score += 20;
  }

  if ((g.applicant_types ?? []).includes(a.applicant_type)) {
    reasons.push(`Accepts ${a.applicant_type.replace('_', ' ')} applicants`);
    score += 20;
  }
  if ((g.sectors ?? []).includes(a.sector)) {
    reasons.push(`Funds ${a.sector.replace(/_/g, ' ')}`);
    score += 30;
  }
  if ((g.beneficiaries ?? []).includes(a.beneficiaries)) {
    reasons.push(`Prioritises ${a.beneficiaries.replace(/_/g, ' ')}`);
    score += 20;
  }
  const [needMin, needMax] = NEED_RANGES[a.funding_need] ?? [0, 100000000];
  if (g.amount_usd_max && g.amount_usd_max >= needMin && g.amount_usd_max <= needMax * 4) score += 10;
  else if (g.amount_usd_max && g.amount_usd_max >= needMin) score += 5;

  if (g.deadline) reasons.push(`Deadline ${g.deadline}`);
  if (g.partner_required) reasons.push(`Note: needs ${g.partner_required}`);
  return { score, reasons: reasons.slice(0, 4) };
}

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

  const ranked = (grants ?? [])
    .filter((g: any) => {
      // Eligibility: applicant type
      if (g.applicant_types?.length && !g.applicant_types.includes(a.applicant_type)) return false;
      // Eligibility: country
      if (g.all_countries) return true;
      if (g.eligible_countries?.length && g.eligible_countries.includes(a.country)) return true;
      if (g.scope === 'national') return false; // national grants for other countries
      if (g.eligible_regions?.length && g.eligible_regions.some((r: string) => regions.includes(r))) return true;
      if (!g.eligible_countries?.length && !g.eligible_regions?.length) return true; // no restriction stated
      return g.scope === 'international' || g.scope === 'africa';
    })
    .map((g: any) => {
      const { score, reasons } = scoreGrant(a, g, regions);
      return {
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
        score,
        reasons,
        country: a.country,
      };
    })
    .sort((x: any, y: any) => y.score - x.score || (x.deadline ?? '9999').localeCompare(y.deadline ?? '9999'));

  return Response.json({ count: ranked.length, matches: ranked.slice(0, 50) });
}
