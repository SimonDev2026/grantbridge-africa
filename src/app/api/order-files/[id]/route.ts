import { NextRequest } from 'next/server';

import { isAdmin } from '@/app/admin/actions';
import { getSession } from '@/features/account/controllers/get-session';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const db = supabaseAdminClient as any;

/**
 * GET /api/order-files/[id] — logs every view/download, then redirects to a
 * signed URL. Only the order's client or the admin may use it.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) return Response.json({ error: 'Sign in first' }, { status: 401 });

  const { data: file } = await db.from('order_files').select('*').eq('id', id).single();
  if (!file) return Response.json({ error: 'File not found' }, { status: 404 });

  const { data: order } = await db.from('service_requests').select('user_id').eq('id', file.service_request_id).single();
  const admin = await isAdmin();
  if (!admin && order?.user_id !== session.user.id) {
    return Response.json({ error: 'Not your file' }, { status: 403 });
  }

  await db.from('file_access_log').insert({
    file_id: id,
    user_id: session.user.id,
    action: 'download',
  });

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.storage.from('org-docs').createSignedUrl(file.file_path, 3600);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.redirect(data.signedUrl);
}
