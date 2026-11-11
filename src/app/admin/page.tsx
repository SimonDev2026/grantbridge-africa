import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin, reviewGrant } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  const [{ data: sources }, { data: queue }, { count: userCount }, { data: subs }] = await Promise.all([
    db.from('sources').select('id, name, url, last_run, last_ok, active').order('name'),
    db
      .from('grants')
      .select('id, title, official_url, funder_id, funders(name), created_at')
      .eq('approved', false)
      .order('created_at', { ascending: false })
      .limit(20),
    db.from('profiles').select('user_id', { count: 'exact', head: true }),
    db
      .from('subscriptions')
      .select('status, prices(unit_amount, interval, products(name))')
      .in('status', ['active', 'trialing']),
  ]);

  const mrr = (subs ?? []).reduce((sum: number, s: any) => {
    const amt = (s.prices?.unit_amount ?? 0) / 100;
    return sum + (s.prices?.interval === 'year' ? amt / 12 : amt);
  }, 0);

  return (
    <div className='flex flex-col gap-10 py-8'>
      <div className='flex items-center justify-between'>
        <h1>Admin</h1>
        <Button className='bg-brand-green text-white hover:bg-brand-green/90' asChild>
          <Link href='/admin/orders'>Service orders →</Link>
        </Button>
      </div>

      <section className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {[
          { label: 'Organisations', value: userCount ?? 0 },
          { label: 'MRR (USD)', value: `$${mrr.toFixed(2)}` },
          { label: 'Active subscriptions', value: (subs ?? []).length },
          { label: 'Grants awaiting review', value: (queue ?? []).length },
        ].map((s) => (
          <div key={s.label} className='rounded-2xl border border-brand-line bg-white p-5'>
            <div className='text-2xl font-bold text-brand-ink'>{s.value}</div>
            <div className='text-sm text-brand-muted'>{s.label}</div>
          </div>
        ))}
      </section>

      <section>
        <h2>Grant review queue</h2>
        <p className='mt-1 text-sm text-brand-muted'>
          Grants from the collector land here unapproved. Approve only after checking the funder’s
          official page. “Scam” flags fee-charging listings and hides them.
        </p>
        {(queue ?? []).length === 0 ? (
          <p className='mt-4 rounded-2xl border border-brand-line bg-white p-5 text-brand-muted'>
            Queue is clear — nothing awaiting review.
          </p>
        ) : (
          <div className='mt-4 flex flex-col gap-3'>
            {(queue ?? []).map((g: any) => (
              <div key={g.id} className='flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between'>
                <div>
                  <div className='font-semibold text-brand-ink'>{g.title}</div>
                  <div className='text-sm text-brand-muted'>
                    {g.funders?.name ?? 'Unknown funder'} ·{' '}
                    <a href={g.official_url} target='_blank' rel='noreferrer' className='text-brand-green hover:underline'>
                      Official page ↗
                    </a>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <form action={async () => { await reviewGrant(g.id, 'approve'); }}>

                    <Button size='sm' type='submit' className='bg-brand-green text-white hover:bg-brand-green/90'>
                      Approve
                    </Button>
                  </form>
                  <form action={async () => { await reviewGrant(g.id, 'reject'); }}>

                    <Button size='sm' type='submit' variant='outline'>
                      Reject
                    </Button>
                  </form>
                  <form action={async () => { await reviewGrant(g.id, 'scam'); }}>

                    <Button size='sm' type='submit' variant='destructive'>
                      Scam
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Source health</h2>
        <div className='mt-4 flex flex-col gap-2'>
          {(sources ?? []).map((s: any) => (
            <div key={s.id} className='flex flex-col gap-1 rounded-xl border border-brand-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <span className='font-medium text-brand-ink'>{s.name}</span>{' '}
                <span className='text-sm text-brand-muted'>{s.url}</span>
              </div>
              <div className='text-sm'>
                {s.last_ok === true ? (
                  <span className='font-semibold text-brand-green'>Healthy</span>
                ) : s.last_ok === false ? (
                  <span className='font-semibold text-red-600'>Failing</span>
                ) : (
                  <span className='text-brand-muted'>Never run</span>
                )}
                {s.last_run && <span className='text-brand-muted'> · last run {new Date(s.last_run).toLocaleDateString()}</span>}
              </div>
            </div>
          ))}
          {(sources ?? []).length === 0 && (
            <p className='rounded-2xl border border-brand-line bg-white p-5 text-brand-muted'>
              No sources yet — the collector registers them on its first run (daily 03:00 UTC).
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
