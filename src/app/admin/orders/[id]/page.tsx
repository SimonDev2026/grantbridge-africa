import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { WorkspaceActions } from '@/app/admin/orders/[id]/workspace-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

type PillTone = 'green' | 'sun' | 'red' | 'muted' | 'blue';

function statusTone(status: string): PillTone {
  switch (status) {
    case 'paid':
    case 'delivered':
      return 'green';
    case 'intake_pending':
    case 'in_progress':
    case 'review':
      return 'sun';
    case 'refunded':
      return 'red';
    case 'closed':
      return 'muted';
    default:
      return 'muted';
  }
}

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
    <div className='flex flex-col gap-6 py-8'>
      {/* Header */}
      <div className='rounded-2xl border border-brand-line bg-white p-5 shadow-sm sm:p-6'>
        <Link href='/admin/orders' className='text-sm font-semibold text-brand-green hover:underline'>
          ← All orders
        </Link>
        <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <span className='inline-block rounded-full bg-brand-greenSoft px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-green'>
              Admin · Service order
            </span>
            <h1 className='mt-2 text-3xl lg:text-4xl'>
              {order.package ?? 'Service'} order — {profile?.org_name ?? order.user_id.slice(0, 8)}
            </h1>
            <p className='mt-2 text-sm leading-relaxed text-brand-muted'>
              {order.grants?.title ?? 'No grant linked'}
              {order.amount_paid_cents ? ` · $${(order.amount_paid_cents / 100).toFixed(2)}` : ''}
              {order.deadline ? ` · Deadline ${order.deadline}` : ''}
              {order.revision_requested ? ' · Revision requested' : ''}
            </p>
          </div>
          <StatusPill tone={statusTone(order.status ?? 'paid')}>
            {(order.status ?? 'paid').replace('_', ' ')}
          </StatusPill>
        </div>
      </div>

      {/* Intake answers */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Client intake' title='Intake answers' />
        {!intake ? (
          <p className='mt-3 text-sm text-brand-muted'>
            The client has not filled in the intake form yet. Status is “{order.status}”.
          </p>
        ) : (
          <dl className='mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2'>
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
                <dt className='text-[11px] font-bold uppercase tracking-widest text-brand-muted'>{k}</dt>
                <dd className='mt-0.5 text-brand-ink'>{v || '—'}</dd>
              </div>
            ))}
          </dl>
        )}
      </AdminCard>

      {/* Files */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Documents' title='Files' />
        <p className='mt-1 text-sm text-brand-muted'>Private bucket — every view is logged.</p>
        {(files ?? []).length === 0 ? (
          <p className='mt-3 text-sm text-brand-muted'>No files yet.</p>
        ) : (
          <ul className='mt-4 flex flex-col gap-2'>
            {(files ?? []).map((f: any) => (
              <li
                key={f.id}
                className='flex items-center justify-between gap-3 rounded-xl border border-brand-line px-4 py-3 text-sm transition-colors hover:border-brand-green'
              >
                <span className='min-w-0'>
                  <span className='font-semibold text-brand-ink'>{f.kind}</span>{' '}
                  <span className='break-all text-brand-muted'>{f.file_name}</span>
                </span>
                <a href={`/api/order-files/${f.id}`} className='shrink-0 font-semibold text-brand-green hover:underline'>
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {/* Notes (private) */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Internal' title='Private notes' />
        {(notes ?? []).length === 0 ? (
          <p className='mt-3 text-sm text-brand-muted'>No notes yet.</p>
        ) : (
          <ul className='mt-4 flex flex-col gap-2'>
            {(notes ?? []).map((n: any) => (
              <li key={n.id} className='rounded-xl bg-brand-bg p-4 text-sm text-brand-ink'>
                {n.body}
                <span className='mt-1 block text-xs text-brand-muted'>{new Date(n.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {/* Message thread */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Communication' title='Client message thread' />
        {(messages ?? []).length === 0 ? (
          <p className='mt-3 text-sm text-brand-muted'>No messages yet.</p>
        ) : (
          <ul className='mt-4 flex flex-col gap-2'>
            {(messages ?? []).map((m: any) => (
              <li
                key={m.id}
                className={`rounded-xl p-4 text-sm text-brand-ink ${m.sender === 'admin' ? 'bg-brand-greenSoft' : 'bg-brand-bg'}`}
              >
                <span className='font-semibold'>{m.sender === 'admin' ? 'Us' : 'Client'}</span>: {m.body}
                <span className='mt-1 block text-xs text-brand-muted'>{new Date(m.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </AdminCard>

      {/* Deliveries */}
      {deliveries?.length > 0 && (
        <AdminCard>
          <AdminSectionHeading eyebrow='Handover' title='Deliveries' />
          <ul className='mt-4 flex flex-col gap-2 text-sm'>
            {deliveries.map((d: any) => (
              <li key={d.id} className='flex items-start gap-2 rounded-xl bg-brand-bg px-4 py-3 text-brand-ink'>
                <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-greenSoft text-xs font-bold text-brand-green'>
                  ✓
                </span>
                <span>
                  Delivered {new Date(d.delivered_at).toLocaleString()}
                  {d.note ? ` — ${d.note}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </AdminCard>
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
