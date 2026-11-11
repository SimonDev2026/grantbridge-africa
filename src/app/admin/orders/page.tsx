import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;
const STATUSES = ['paid', 'intake_pending', 'in_progress', 'review', 'delivered', 'closed', 'refunded'] as const;

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

  return (
    <div className='flex flex-col gap-6 py-8'>
      <div className='flex items-center justify-between'>
        <h1>Service orders</h1>
        <Button variant='outline' asChild>
          <Link href='/admin'>← Back to admin</Link>
        </Button>
      </div>

      <form method='get' className='flex gap-2 text-sm'>
        <select name='status' defaultValue={params.status ?? 'all'} className='rounded-lg border border-brand-line bg-white px-2 py-2'>
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
      </form>

      {(orders ?? []).length === 0 ? (
        <p className='rounded-2xl border border-brand-line bg-white p-8 text-center text-brand-muted'>
          No service orders yet. Expert Review ($149) and Done-for-you ($399) orders land here
          after payment.
        </p>
      ) : (
        <div className='flex flex-col gap-3'>
          {(orders ?? []).map((o: any) => (
            <Link
              key={o.id}
              href={`/admin/orders/${o.id}`}
              className='flex flex-col gap-1 rounded-2xl border border-brand-line bg-white p-4 hover:border-brand-green sm:flex-row sm:items-center sm:justify-between'
            >
              <div>
                <span className='font-semibold text-brand-ink'>
                  {orgByUser.get(o.user_id) ?? o.user_id?.slice(0, 8) ?? 'Client'}
                </span>{' '}
                <span className='text-brand-muted'>· {o.package ?? 'service'} · {o.grants?.title ?? 'No grant linked'}</span>
                <div className='text-sm text-brand-muted'>
                  {o.amount_paid_cents ? `$${(o.amount_paid_cents / 100).toFixed(2)}` : ''}{' '}
                  {o.deadline ? `· deadline ${o.deadline}` : ''}
                </div>
              </div>
              <span className='w-fit rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green'>
                {(o.status ?? 'paid').replace('_', ' ')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
