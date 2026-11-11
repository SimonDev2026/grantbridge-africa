'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const db = supabaseAdminClient as any;

/** Client uploads an intake document into their own private folder. */
export async function uploadIntakeFile(orderId: string, formData: FormData) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const file = formData.get('file') as File | null;
  const kind = String(formData.get('kind') ?? 'other');
  if (!file || file.size === 0) return { error: 'Choose a file' };
  if (file.size > 10 * 1024 * 1024) return { error: 'File must be under 10 MB' };
  const { data: order } = await db.from('service_requests').select('user_id').eq('id', orderId).single();
  if (!order || order.user_id !== session.user.id) return { error: 'Order not found' };
  const supabase = await createSupabaseServerClient();
  const path = `${session.user.id}/orders/${orderId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error: upErr } = await supabase.storage
    .from('org-docs')
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (upErr) return { error: upErr.message };
  const { error: dbErr } = await db.from('order_files').insert({
    service_request_id: orderId,
    user_id: session.user.id,
    uploaded_by: session.user.id,
    kind,
    file_name: file.name,
    file_path: path,
  });
  if (dbErr) return { error: dbErr.message };
  revalidatePath(`/orders/${orderId}/intake`);
  return { ok: true };
}
