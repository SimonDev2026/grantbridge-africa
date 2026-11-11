'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { notifyAdminIntakeComplete, notifyClient } from '@/features/service-orders/notify';
import { chat, parseJson } from '@/libs/ai/client';
import { slugify } from '@/libs/news/rss';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { DRAFT_APPLICATION_PROMPT } from '@/prompts/draft-application';

const db = supabaseAdminClient as any;

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@grantbridgeafrica.com';
  return Boolean(session?.user?.email && session.user.email.toLowerCase() === adminEmail.toLowerCase());
}

async function requireAdmin() {
  if (!(await isAdmin())) throw new Error('Admin only');
}

async function clientEmail(userId: string): Promise<string | null> {
  const { data } = await supabaseAdminClient.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

// ---------- Grant review queue ----------
export async function reviewGrant(grantId: string, action: 'approve' | 'reject' | 'scam') {
  await requireAdmin();
  const patch =
    action === 'approve'
      ? { approved: true, fee_charged: false }
      : action === 'scam'
        ? { approved: false, fee_charged: true }
        : { approved: false };
  const { error } = await db.from('grants').update(patch).eq('id', grantId);
  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { ok: true };
}

// ---------- Service orders ----------
const ORDER_STATUSES = ['paid', 'intake_pending', 'in_progress', 'review', 'delivered', 'closed', 'refunded'] as const;

export async function setOrderStatus(orderId: string, status: string) {
  await requireAdmin();
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return { error: 'Unknown status' };
  const { error } = await db.from('service_requests').update({ status }).eq('id', orderId);
  if (error) return { error: error.message };
  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function addOrderNote(orderId: string, body: string) {
  const session = await getSession();
  await requireAdmin();
  const { error } = await db.from('order_notes').insert({
    service_request_id: orderId,
    author_id: session!.user!.id,
    body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function sendOrderMessage(orderId: string, body: string) {
  const session = await getSession();
  await requireAdmin();
  const { data: order } = await db.from('service_requests').select('user_id, package').eq('id', orderId).single();
  if (!order) return { error: 'Order not found' };
  const { error } = await db.from('order_messages').insert({
    service_request_id: orderId,
    author_id: session!.user!.id,
    sender: 'admin',
    body,
  });
  if (error) return { error: error.message };
  const email = await clientEmail(order.user_id);
  if (email) {
    await notifyClient({ id: orderId }, email, `Message about your ${order.package ?? 'service'} order`, body);
  }
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

/** Draft the application for the CLIENT from their intake + profile + documents. */
export async function generateOrderDraft(orderId: string) {
  await requireAdmin();
  const { data: order } = await db
    .from('service_requests')
    .select('*, service_order_intakes(*), grants(*)')
    .eq('id', orderId)
    .single();
  if (!order) return { error: 'Order not found' };
  const intake = (order.service_order_intakes as any[])?.[0];
  const [{ data: profile }, { data: docs }] = await Promise.all([
    db.from('profiles').select('*').eq('user_id', order.user_id).single(),
    db.from('documents').select('kind, extracted_text').eq('user_id', order.user_id),
  ]);
  const library = (docs ?? []).map((d: any) => `### ${d.kind}\n${(d.extracted_text ?? '').slice(0, 6000)}`).join('\n\n');
  const out = await chat('write', [
    { role: 'system', content: DRAFT_APPLICATION_PROMPT },
    {
      role: 'user',
      content: JSON.stringify({
        grant: order.grants
          ? { title: order.grants.title, summary: order.grants.summary, documents_required: order.grants.documents_required, amount_usd_max: order.grants.amount_usd_max, sectors: order.grants.sectors, beneficiaries: order.grants.beneficiaries, url: order.grants.official_url }
          : null,
        organisation: profile
          ? { name: profile.org_name, country: profile.country, state: profile.state, type: profile.applicant_type, registration: profile.registration_type, description: profile.description, sectors: profile.sectors, beneficiaries: profile.beneficiaries, annual_budget_usd: profile.annual_budget, funding_need_usd: profile.funding_need, team_size: profile.team_size, stage: profile.stage }
          : null,
        intake: intake ?? null,
        organisation_documents: library,
      }),
    },
  ], { maxTokens: 8000 });
  let sections;
  try {
    sections = parseJson(out).sections;
  } catch {
    return { error: 'AI returned invalid output, try again' };
  }
  const { data: draft, error } = await db
    .from('drafts')
    .insert({ user_id: order.user_id, grant_id: order.grant_id, sections, model: 'writer' })
    .select()
    .single();
  if (error) return { error: error.message };
  await db.from('service_requests').update({ status: 'review' }).eq('id', orderId);
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, draftId: draft.id };
}

export async function saveOrderDraftSections(draftId: string, sections: { title: string; body: string }[]) {
  await requireAdmin();
  const { error } = await db.from('drafts').update({ sections: sections as any }).eq('id', draftId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function uploadOrderFile(orderId: string, formData: FormData) {
  await requireAdmin();
  const session = await getSession();
  const file = formData.get('file') as File | null;
  const kind = String(formData.get('kind') ?? 'delivery');
  if (!file || file.size === 0) return { error: 'Choose a file' };
  const { data: order } = await db.from('service_requests').select('user_id').eq('id', orderId).single();
  if (!order) return { error: 'Order not found' };
  // Service-role storage client: the file lives under the CLIENT's folder, which
  // the admin's own session could not write under the storage RLS policy.
  const path = `${order.user_id}/orders/${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error: upErr } = await supabaseAdminClient.storage
    .from('org-docs')
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (upErr) return { error: upErr.message };
  const { error: dbErr } = await db.from('order_files').insert({
    service_request_id: orderId,
    user_id: order.user_id,
    uploaded_by: session!.user!.id,
    kind,
    file_name: file.name,
    file_path: path,
  });
  if (dbErr) return { error: dbErr.message };
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true };
}

export async function deliverOrder(orderId: string, note: string) {
  await requireAdmin();
  const session = await getSession();
  const { data: order } = await db
    .from('service_requests')
    .select('*, grants(title, official_url)')
    .eq('id', orderId)
    .single();
  if (!order) return { error: 'Order not found' };
  const { data: files } = await db.from('order_files').select('id').eq('service_request_id', orderId).eq('kind', 'delivery');
  const { error } = await db.from('order_deliveries').insert({
    service_request_id: orderId,
    delivered_by: session!.user!.id,
    file_ids: (files ?? []).map((f: any) => f.id),
    note,
  });
  if (error) return { error: error.message };
  await db.from('service_requests').update({ status: 'delivered', completed_at: new Date().toISOString() }).eq('id', orderId);
  const email = await clientEmail(order.user_id);
  if (email) {
    await notifyClient(
      { id: orderId },
      email,
      `Your ${order.package ?? 'service'} application is delivered`,
      `Your application for "${order.grants?.title ?? 'your grant'}" is ready to download in your dashboard.\n\n${note ? `Note from our team: ${note}\n\n` : ''}Submission checklist:\n- Review every section and fill in any remaining [placeholders].\n- Attach the documents the funder asks for.\n- Submit on the funder's official portal: ${order.grants?.official_url ?? ''}\n\nYou have one revision included — reply to this thread if anything needs changing, then mark the order complete.`
    );
  }
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath('/admin/orders');
  return { ok: true };
}

// ---------- Client-side order actions ----------
export async function submitIntake(orderId: string, intake: Record<string, unknown>) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const { data: order } = await db.from('service_requests').select('user_id, package').eq('id', orderId).single();
  if (!order || order.user_id !== session.user.id) return { error: 'Order not found' };
  const { error } = await db.from('service_order_intakes').upsert(
    { service_request_id: orderId, user_id: session.user.id, status: 'submitted', submitted_at: new Date().toISOString(), ...intake },
    { onConflict: 'service_request_id' }
  );
  if (error) return { error: error.message };
  await db.from('service_requests').update({ status: 'in_progress' }).eq('id', orderId);
  try {
    await notifyAdminIntakeComplete({ id: orderId, package: order.package });
  } catch (e) {
    console.error('notifyAdminIntakeComplete failed:', (e as Error).message);
  }
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function saveIntakeDraft(orderId: string, intake: Record<string, unknown>) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const { data: order } = await db.from('service_requests').select('user_id').eq('id', orderId).single();
  if (!order || order.user_id !== session.user.id) return { error: 'Order not found' };
  const { error } = await db.from('service_order_intakes').upsert(
    { service_request_id: orderId, user_id: session.user.id, status: 'draft', ...intake },
    { onConflict: 'service_request_id' }
  );
  if (error) return { error: error.message };
  return { ok: true };
}

export async function markOrderComplete(orderId: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const { data: order } = await db.from('service_requests').select('user_id, status').eq('id', orderId).single();
  if (!order || order.user_id !== session.user.id) return { error: 'Order not found' };
  if (order.status !== 'delivered') return { error: 'Only delivered orders can be marked complete' };
  const { error } = await db.from('service_requests').update({ status: 'closed' }).eq('id', orderId);
  if (error) return { error: error.message };
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function requestOrderRevision(orderId: string, note: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const { data: order } = await db
    .from('service_requests')
    .select('user_id, status, revision_count')
    .eq('id', orderId)
    .single();
  if (!order || order.user_id !== session.user.id) return { error: 'Order not found' };
  if (order.status !== 'delivered') return { error: 'Revisions apply to delivered orders' };
  if ((order.revision_count ?? 0) >= 1) return { error: 'Your one included revision has already been used' };
  const { error } = await db
    .from('service_requests')
    .update({ revision_requested: true, revision_count: (order.revision_count ?? 0) + 1, status: 'review' })
    .eq('id', orderId);
  if (error) return { error: error.message };
  await db.from('order_messages').insert({
    service_request_id: orderId,
    author_id: session.user.id,
    sender: 'client',
    body: `Revision requested: ${note}`,
  });
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

export async function sendClientMessage(orderId: string, body: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const { data: order } = await db.from('service_requests').select('user_id').eq('id', orderId).single();
  if (!order || order.user_id !== session.user.id) return { error: 'Order not found' };
  const { error } = await db.from('order_messages').insert({
    service_request_id: orderId,
    author_id: session.user.id,
    sender: 'client',
    body,
  });
  if (error) return { error: error.message };
  revalidatePath(`/orders/${orderId}`);
  return { ok: true };
}

// ---------- Support messages (chat button) ----------
export async function markSupportMessageReplied(messageId: string) {
  await requireAdmin();
  const { error } = await db.from('support_messages').update({ status: 'replied' }).eq('id', messageId);
  if (error) return { error: error.message };
  revalidatePath('/admin/support');
  return { ok: true };
}

// ---------- News publisher ----------
export type NewsPostInput = {
  title: string;
  slug: string;
  summary: string;
  body: string;
  source_name: string;
  source_url: string;
  status: 'draft' | 'published';
};

function cleanNewsInput(input: NewsPostInput) {
  const title = (input.title ?? '').trim();
  const slug = slugify(title || input.slug || 'news-post') || 'news-post';
  return {
    title,
    slug,
    summary: (input.summary ?? '').trim(),
    body: (input.body ?? '').trim(),
    source_name: (input.source_name ?? '').trim() || null,
    source_url: (input.source_url ?? '').trim() || null,
    status: input.status === 'published' ? ('published' as const) : ('draft' as const),
  };
}

/** Insert with a unique slug: appends -2, -3… when the slug is taken. */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  for (let n = 0; n < 10; n++) {
    const slug = n === 0 ? base : `${base}-${n + 1}`;
    const { data } = await db.from('news_posts').select('id').eq('slug', slug).maybeSingle();
    if (!data || (ignoreId && data.id === ignoreId)) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function saveNewsPost(id: string | null, input: NewsPostInput) {
  await requireAdmin();
  const patch = cleanNewsInput(input);
  if (!patch.title) return { error: 'A title is required' };
  if (patch.status === 'published' && !patch.body && !patch.summary) {
    return { error: 'A published post needs a body or a summary' };
  }
  const slug = await uniqueSlug(patch.slug, id ?? undefined);
  const row: Record<string, unknown> = {
    ...patch,
    slug,
    published_at: patch.status === 'published' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    // Keep the original published_at and origin when editing an existing post
    // (curated drafts stay curated — only the admin's edits change).
    const { data: existing } = await db
      .from('news_posts')
      .select('published_at, origin')
      .eq('id', id)
      .single();
    if (existing?.published_at && patch.status === 'published') row.published_at = existing.published_at;
    if (existing?.origin) row.origin = existing.origin;
    const { error } = await db.from('news_posts').update(row).eq('id', id);
    if (error) return { error: error.message };
  } else {
    row.origin = 'original';
    const { error } = await db.from('news_posts').insert(row);
    if (error) return { error: error.message };
  }
  revalidatePath('/admin/news');
  revalidatePath('/news');
  return { ok: true, slug };
}

export async function setNewsPostStatus(id: string, status: 'draft' | 'published') {
  await requireAdmin();
  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  if (status === 'published') {
    const { data: existing } = await db.from('news_posts').select('published_at').eq('id', id).single();
    if (!existing?.published_at) patch.published_at = new Date().toISOString();
  }
  const { error } = await db.from('news_posts').update(patch).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/news');
  revalidatePath('/news');
  return { ok: true };
}

export async function deleteNewsPost(id: string) {
  await requireAdmin();
  const { error } = await db.from('news_posts').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/news');
  revalidatePath('/news');
  return { ok: true };
}
