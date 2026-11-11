import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;
const STATUSES = ['paid', 'intake_pending', 'in_progress', 'review', 'delivered', 'closed', 'refunded'] as const;

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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  if (!(await isAdmin())) redirect('/dashboard');
  const params = await searchParams;

  let query = db
    .from('service_requests')
    .select('*, grants(title)')
    .order('created_at', { ascending: false });
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  const { data: orders } = await query;
  const userIds = [...new Set((orders ?? []).map((o: any) => o.user_id))];
  const { data: profiles } = await db.from('profiles').select('user_id, org_name').in('user_id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);
  const orgByUser = new Map((profiles ?? []).map((p: any) => [p.user_id, p.org_name]));

  const total = (orders ?? []).length;

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Service orders'
        subtitle='Expert Review ($149) and Done-for-you ($399) orders land here after payment. Open one to work the intake, draft and delivery.'
        active='orders'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin'>← Back to admin</Link>
          </Button>
        }
      />

      <AdminCard className='!p-4 sm:!p-5'>
        <form method='get' className='flex flex-wrap items-center gap-2 text-sm'>
          <label htmlFor='status-filter' className='font-semibold text-brand-ink'>
            Status
          </label>
          <select
            id='status-filter'
            name='status'
            defaultValue={params.status ?? 'all'}
            className='min-h-10 rounded-lg border border-brand-line bg-white px-3 py-2 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30'
          >
            <option value='all'>All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' ')}
              </option>
            ))}
          </select>
          <Button type='submit' variant='outline'>
            Filter
          </Button>
          <span className='ml-auto text-sm text-brand-muted'>
            {total} order{total === 1 ? '' : 's'}
            {params.status && params.status !== 'all' ? ` · showing “${params.status.replace('_', ' ')}”` : ''}
          </span>
        </form>
      </AdminCard>

      {(orders ?? []).length === 0 ? (
        <AdminCard>
          <div className='flex flex-col items-center gap-3 px-5 py-8 text-center'>
            <span className='flex h-10 w-10 items-center justify-center rounded-full bg-brand-sunSoft text-lg font-bold text-brand-ink'>
              ✦
            </span>
            <p className='font-semibold text-brand-ink'>No service orders yet</p>
            <p className='max-w-md text-sm text-brand-muted'>
              Expert Review ($149) and Done-for-you ($399) orders land here after payment.
            </p>
          </div>
        </AdminCard>
      ) : (
        <div className='flex flex-col gap-3'>
          <AdminSectionHeading eyebrow='Orders' title='All orders' />
          {(orders ?? []).map((o: any) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className='flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-green hover:shadow-md sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='font-semibold text-brand-ink'>
                    {orgByUser.get(o.user_id) ?? o.user_id?.slice(0, 8) ?? 'Client'}
                  </span>
                  <StatusPill tone='blue'>{o.package ?? 'service'}</StatusPill>
                </div>
                <div className='mt-1 truncate text-sm text-brand-muted'>{o.grants?.title ?? 'No grant linked'}</div>
                <div className='mt-0.5 text-sm text-brand-muted'>
                  {o.amount_paid_cents ? `$${(o.amount_paid_cents / 100).toFixed(2)}` : ''}
                  {o.deadline ? ` · deadline ${o.deadline}` : ''}
                </div>
              </div>
              <div className='flex shrink-0 items-center gap-3'>
                <StatusPill tone={statusTone(o.status ?? 'paid')}>
                  {(o.status ?? 'paid').replace('_', ' ')}
                </StatusPill>
                <span className='font-semibold text-brand-green' aria-hidden='true'>
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
