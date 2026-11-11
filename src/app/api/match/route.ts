// POST /api/match — (re)builds the signed-in user's profile vector and stores ranked matches with reasons.
// Also run nightly for all users (Supabase pg_cron or a GitHub Action calling this with the service key).
import { embed, toVector } from '@/libs/ai/client';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

function reasonsFor(p: any, g: any): string[] {
  const r: string[] = [];
  if (g.scope === 'international') r.push(`International funder that accepts applicants from ${p.country}`);
  else if (g.scope === 'africa') r.push('Africa-focused funder');
  else r.push(`National programme in ${p.country}`);
  if (g.applicant_types?.includes(p.applicant_type)) r.push(`Accepts ${p.applicant_type.replace('_', ' ')} applicants`);
  const s = (g.sectors ?? []).filter((x: string) => p.sectors?.includes(x));
  if (s.length) r.push(`Funds ${s.join(', ').replace(/_/g, ' ')}`);
  const b = (g.beneficiaries ?? []).filter((x: string) => p.beneficiaries?.includes(x));
  if (b.length) r.push(`Prioritises ${b.join(', ').replace(/_/g, ' ')}`);
  if (g.partner_required) r.push(`Note: needs ${g.partner_required}`);
  if (g.deadline) r.push(`Deadline ${g.deadline}`);
  return r.slice(0, 5);
}

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 });

  const { data: p } = await db.from('profiles').select('*').eq('user_id', user.id).single();
  if (!p) return Response.json({ error: 'Complete your profile first' }, { status: 400 });

  // 1) Profile text -> bge-m3 vector; regions from the lookup table
  const text = [p.description, p.sectors?.join(' '), p.beneficiaries?.join(' '), p.country].filter(Boolean).join('. ');
  const [vec] = await embed([text]);
  const { data: cr } = await db.from('country_regions').select('regions').eq('country', p.country).maybeSingle();
  await db.from('profiles').update({ embedding: toVector(vec), regions: cr?.regions ?? ['Africa'] }).eq('user_id', user.id);

  // 2) Eligibility filter + score in Postgres (see migration: match_grants)
  const { data: ranked, error } = await db.rpc('match_grants', { p_user: user.id, p_limit: 50 });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // 3) Plain-language reasons, then save
  const ids = ranked.map((m: any) => m.grant_id);
  const { data: grants } = await db.from('grants').select('*').in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  const byId = new Map((grants ?? []).map((g: any) => [g.id, g]));
  const rows = ranked.map((m: any) => ({
    user_id: user.id, grant_id: m.grant_id, score: Math.round(Number(m.score) * 100),
    reasons: reasonsFor({ ...p, regions: cr?.regions }, byId.get(m.grant_id)),
  }));
  if (rows.length) await db.from('matches').upsert(rows, { onConflict: 'user_id,grant_id', ignoreDuplicates: false });

  return Response.json({ count: rows.length, matches: rows.slice(0, 50) });
}
