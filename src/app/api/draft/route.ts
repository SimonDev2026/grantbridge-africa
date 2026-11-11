// POST /api/draft { grantId } — drafts every document the funder asks for, using the user's profile
// and uploaded documents. Paid plans only (check the subscriptions table from the starter repo).
import { chat, parseJson } from '@/libs/ai/client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { DRAFT_APPLICATION_PROMPT } from '@/prompts/draft-application';

const db = supabaseAdminClient as any;
// Drafts included per month by plan (product names in Stripe). Pay-per-application credits: see migration 20261111000100.
const MONTHLY_LIMIT: Record<string, number> = { seeker: 1, writer: 10, pro: 100000 };

export async function POST(req: Request) {
  const { grantId, force } = await req.json();
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 });

  // Step 9 — AI result caching: reuse the latest draft for this grant instead
  // of spending free-tier AI calls again (unless the user asked to regenerate).
  if (!force) {
    const { data: existing } = await db
      .from('drafts')
      .select('*')
      .eq('user_id', user.id)
      .eq('grant_id', grantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) return Response.json({ ...existing, cached: true });
  }

  // Plan check: the starter stores subscriptions with price -> product metadata. Map your product names here.
  const { data: sub } = await db.from('subscriptions').select('status, prices(products(name))').eq('user_id', user.id)
    .in('status', ['active', 'trialing']).maybeSingle();
  const plan = (sub?.prices?.products?.name ?? '').toLowerCase();
  const since = new Date(); since.setDate(1);
  const { count } = await db.from('drafts').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since.toISOString());
  const withinPlan = (MONTHLY_LIMIT[plan] ?? 0) > (count ?? 0);
  if (!withinPlan) {
    // No plan allowance left: use a pay-per-application credit ($29 one-time Stripe price) if the user has one.
    const { data: used } = await db.rpc('use_draft_credit', { p_user: user.id });
    if (!used) return Response.json({ error: 'Buy a single application draft ($29) or upgrade your plan' }, { status: 402 });
  }

  const [{ data: p }, { data: g }, { data: docs }] = await Promise.all([
    db.from('profiles').select('*').eq('user_id', user.id).single(),
    db.from('grants').select('*, funders(name)').eq('id', grantId).single(),
    db.from('documents').select('kind, extracted_text').eq('user_id', user.id),
  ]);
  const library = (docs ?? []).map((d: any) => `### ${d.kind}\n${(d.extracted_text ?? '').slice(0, 6000)}`).join('\n\n');
  const system = DRAFT_APPLICATION_PROMPT;

  const out = await chat('write', [
    { role: 'system', content: system },
    { role: 'user', content: JSON.stringify({
        grant: { title: g.title, funder: g.funders?.name, summary: g.summary, documents_required: g.documents_required,
                 amount_usd_max: g.amount_usd_max, sectors: g.sectors, beneficiaries: g.beneficiaries, url: g.official_url },
        organisation: { name: p.org_name, country: p.country, state: p.state, type: p.applicant_type, registration: p.registration_type,
                        description: p.description, sectors: p.sectors, beneficiaries: p.beneficiaries,
                        annual_budget_usd: p.annual_budget, funding_need_usd: p.funding_need, team_size: p.team_size, stage: p.stage },
        organisation_documents: library,
      }) },
  ], { maxTokens: 8000 });

  let sections;
  try { sections = parseJson(out).sections; } catch { return Response.json({ error: 'AI returned invalid output, try again' }, { status: 502 }); }
  const { data: draft } = await db.from('drafts').insert({ user_id: user.id, grant_id: grantId, sections, model: 'writer' }).select().single();
  await db.from('matches').update({ status: 'applying' }).eq('user_id', user.id).eq('grant_id', grantId);
  return Response.json(draft);
}
