import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { OrderClientActions } from '@/app/orders/[id]/order-client';
import { getSession } from '@/features/account/controllers/get-session';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function ClientOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect('/login');

  const { data: order } = await db
    .from('service_requests')
    .select('*, grants(title, official_url)')
    .eq('id', id)
    .single();
  if (!order || order.user_id !== session.user.id) notFound();

  const [{ data: messages }, { data: deliveries }, { data: files }] = await Promise.all([
    db.from('order_messages').select('*').eq('service_request_id', id).order('created_at', { ascending: true }),
    db.from('order_deliveries').select('*').eq('service_request_id', id).order('delivered_at', { ascending: false }),
    db.from('order_files').select('*').eq('service_request_id', id).eq('kind', 'delivery').order('created_at', { ascending: false }),
  ]);

  const steps = ['paid', 'intake_pending', 'in_progress', 'review', 'delivered', 'closed'];
  const currentStep = steps.indexOf(order.status ?? 'paid');

  return (
    <div className='flex flex-col gap-8 py-8'>
      <div>
        <h1 className='text-3xl lg:text-4xl'>
          {order.package ?? 'Service'} order
        </h1>
        <p className='mt-1 text-brand-muted'>
          {order.grants?.title ?? 'No grant linked'} ·{' '}
          {order.amount_paid_cents ? `$${(order.amount_paid_cents / 100).toFixed(2)} paid` : ''}
        </p>
      </div>

      {/* Progress */}
      <ol className='flex flex-wrap gap-2'>
        {steps.map((s, i) => (
          <li
            key={s}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              i <= currentStep ? 'bg-brand-green text-white' : 'bg-brand-greenSoft text-brand-green'
            }`}
          >
            {s.replace('_', ' ')}
          </li>
        ))}
      </ol>

      {['paid', 'intake_pending'].includes(order.status ?? '') && (
        <div className='rounded-2xl border border-brand-sun bg-brand-sunSoft p-5'>
          <h2 className='text-lg'>Next step: complete your intake form</h2>
          <p className='mt-1 text-sm text-brand-muted'>
            We need your organisation and project details before our writer can start.
          </p>
          <div className='mt-3'>
            <Link
              href={`/orders/${id}/intake`}
              className='inline-block rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-brand-green/90'
            >
              Complete intake form →
            </Link>
          </div>
        </div>
      )}

      {deliveries?.length > 0 && (
        <section className='rounded-2xl border border-brand-line bg-white p-5'>
          <h2>Your delivered application</h2>
          <ul className='mt-3 flex flex-col gap-2 text-sm'>
            {(files ?? []).map((f: any) => (
              <li key={f.id} className='flex items-center justify-between gap-3'>
                <span>{f.file_name}</span>
                <a href={`/api/order-files/${f.id}`} className='font-semibold text-brand-green hover:underline'>
                  Download
                </a>
              </li>
            ))}
          </ul>
          <div className='mt-4 rounded-xl bg-brand-bg p-4 text-sm text-brand-muted'>
            <strong className='text-brand-ink'>Submission checklist</strong>
            <ul className='mt-2 flex flex-col gap-1'>
              <li>• Review every section and fill in any remaining [placeholders].</li>
              <li>• Attach the documents the funder asks for.</li>
              <li>
                • Submit on the funder’s official portal:{' '}
                <a href={order.grants?.official_url} target='_blank' rel='noreferrer' className='font-semibold text-brand-green hover:underline'>
                  {order.grants?.official_url ?? 'see your grant'}
                </a>
              </li>
              <li>• We never ask for your portal password — you press submit yourself.</li>
            </ul>
          </div>
        </section>
      )}

      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Messages</h2>
        {(messages ?? []).length === 0 ? (
          <p className='mt-2 text-sm text-brand-muted'>No messages yet.</p>
        ) : (
          <ul className='mt-3 flex flex-col gap-2'>
            {(messages ?? []).map((m: any) => (
              <li key={m.id} className={`rounded-xl p-3 text-sm ${m.sender === 'admin' ? 'bg-brand-greenSoft' : 'bg-brand-bg'}`}>
                <span className='font-semibold'>{m.sender === 'admin' ? 'GrantBridge team' : 'You'}</span>: {m.body}
                <span className='block text-xs text-brand-muted'>{new Date(m.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <OrderClientActions orderId={id} status={order.status ?? 'paid'} revisionCount={order.revision_count ?? 0} />
    </div>
  );
}
