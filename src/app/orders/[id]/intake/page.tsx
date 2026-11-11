import { notFound, redirect } from 'next/navigation';

import { IntakeForm } from '@/app/orders/[id]/intake/intake-form';
import { getSession } from '@/features/account/controllers/get-session';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function IntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const { data: order } = await db.from('service_requests').select('user_id, package').eq('id', id).single();
  if (!order || order.user_id !== session.user.id) notFound();

  const [{ data: intake }, { data: files }] = await Promise.all([
    db.from('service_order_intakes').select('*').eq('service_request_id', id).maybeSingle(),
    db.from('order_files').select('id, kind, file_name').eq('service_request_id', id).order('created_at', { ascending: false }),
  ]);

  return <IntakeForm orderId={id} initial={intake} files={files ?? []} />;
}
