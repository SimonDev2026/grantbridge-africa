import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { WorkspaceActions } from '@/app/admin/orders/[id]/workspace-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function OrderWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdmin())) redirect('/dashboard');

  const [{ data: order }, { data: intake }, { data: files }, { data: notes }, { data: messages }, { data: deliveries }] =
    await Promise.all([
      db.from('service_requests').select('*, grants(title, official_url)').eq('id', id).single(),
      db.from('service_order_intakes').select('*').eq('service_request_id', id).maybeSingle(),
      db.from('order_files').select('*').eq('service_request_id', id).order('created_at', { ascending: false }),
      db.from('order_notes').select('*').eq('service_request_id', id).order('created_at', { ascending: false }),
      db.from('order_messages').select('*').eq('service_request_id', id).order('created_at', { ascending: true }),
      db.from('order_deliveries').select('*').eq('service_request_id', id).order('delivered_at', { ascending: false }),
    ]);
  if (!order) notFound();

  const [{ data: profile }, { data: draft }] = await Promise.all([
    db.from('profiles').select('*').eq('user_id', order.user_id).maybeSingle(),
    db
      .from('drafts')
      .select('*')
      .eq('user_id', order.user_id)
      .eq('grant_id', order.grant_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <div className='flex flex-col gap-8 py-8'>
      <div>
        <Link href='/admin/orders' className='text-sm font-medium text-brand-green hover:underline'>
          ← All orders
        </Link>
        <h1 className='mt-2'>
          {order.package ?? 'Service'} order — {profile?.org_name ?? order.user_id.slice(0, 8)}
        </h1>
        <p className='mt-1 text-brand-muted'>
          {order.grants?.title ?? 'No grant linked'} ·{' '}
          {order.amount_paid_cents ? `$${(order.amount_paid_cents / 100).toFixed(2)}` : ''} · Status:{' '}
          <span className='font-semibold text-brand-ink'>{(order.status ?? 'paid').replace('_', ' ')}</span>
          {order.deadline ? ` · Deadline ${order.deadline}` : ''}
          {order.revision_requested ? ' · Revision requested' : ''}
        </p>
      </div>

      {/* Intake answers */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Intake answers</h2>
        {!intake ? (
          <p className='mt-2 text-sm text-brand-muted'>
            The client has not filled in the intake form yet. Status is “{order.status}”.
          </p>
        ) : (
          <dl className='mt-3 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2'>
            {[
              ['Organisation', intake.org_name],
              ['Type', intake.org_type],
              ['Country', intake.org_country],
              ['Registration no.', intake.org_registration_no],
              ['Contact', `${intake.contact_name ?? ''} ${intake.contact_email ?? ''} ${intake.contact_phone ?? ''}`.trim()],
              ['Project', intake.project_title],
              ['Summary', intake.project_summary],
              ['Objectives', intake.project_objectives],
              ['Beneficiaries', (intake.beneficiaries ?? []).join(', ')],
              ['Budget', intake.budget_total ? `${intake.budget_currency ?? 'USD'} ${intake.budget_total}` : '—'],
              ['Amount requested', intake.amount_requested ? `${intake.budget_currency ?? 'USD'} ${intake.amount_requested}` : '—'],
              ['Timeline', intake.timeline],
              ['Intake status', intake.status],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className='font-semibold text-brand-ink'>{k}</dt>
                <dd className='text-brand-muted'>{v || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      {/* Files */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Files (private bucket — every view is logged)</h2>
        {(files ?? []).length === 0 ? (
          <p className='mt-2 text-sm text-brand-muted'>No files yet.</p>
        ) : (
          <ul className='mt-3 flex flex-col gap-2'>
            {(files ?? []).map((f: any) => (
              <li key={f.id} className='flex items-center justify-between gap-3 rounded-xl border border-brand-line px-3 py-2 text-sm'>
                <span>
                  <span className='font-medium'>{f.kind}</span>{' '}
                  <span className='text-brand-muted'>{f.file_name}</span>
                </span>
                <a href={`/api/order-files/${f.id}`} className='font-semibold text-brand-green hover:underline'>
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notes (private) */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Private notes</h2>
        {(notes ?? []).length === 0 ? (
          <p className='mt-2 text-sm text-brand-muted'>No notes yet.</p>
        ) : (
          <ul className='mt-3 flex flex-col gap-2'>
            {(notes ?? []).map((n: any) => (
              <li key={n.id} className='rounded-xl bg-brand-bg p-3 text-sm'>
                {n.body}
                <span className='block text-xs text-brand-muted'>{new Date(n.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Message thread */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Client message thread</h2>
        {(messages ?? []).length === 0 ? (
          <p className='mt-2 text-sm text-brand-muted'>No messages yet.</p>
        ) : (
          <ul className='mt-3 flex flex-col gap-2'>
            {(messages ?? []).map((m: any) => (
              <li
                key={m.id}
                className={`rounded-xl p-3 text-sm ${m.sender === 'admin' ? 'bg-brand-greenSoft' : 'bg-brand-bg'}`}
              >
                <span className='font-semibold'>{m.sender === 'admin' ? 'Us' : 'Client'}</span>: {m.body}
                <span className='block text-xs text-brand-muted'>{new Date(m.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Deliveries */}
      {deliveries?.length > 0 && (
        <section className='rounded-2xl border border-brand-line bg-white p-5'>
          <h2>Deliveries</h2>
          <ul className='mt-3 flex flex-col gap-2 text-sm'>
            {deliveries.map((d: any) => (
              <li key={d.id}>
                Delivered {new Date(d.delivered_at).toLocaleString()}
                {d.note ? ` — ${d.note}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      <WorkspaceActions
        orderId={order.id}
        status={order.status ?? 'paid'}
        draftId={draft?.id ?? null}
        initialSections={(draft?.sections as { title: string; body: string }[]) ?? []}
      />
    </div>
  );
}
