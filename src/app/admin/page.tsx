import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin, reviewGrant } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { BackfillEmbeddingsButton } from '@/app/admin/backfill-button';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  const [{ data: sources }, { data: queue }, { count: userCount }, { data: subs }, { count: missingEmbeddings }] = await Promise.all([
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
    db
      .from('grants')
      .select('id', { count: 'exact', head: true })
      .eq('approved', true)
      .is('embedding', null),
  ]);

  const mrr = (subs ?? []).reduce((sum: number, s: any) => {
    const amt = (s.prices?.unit_amount ?? 0) / 100;
    return sum + (s.prices?.interval === 'year' ? amt / 12 : amt);
  }, 0);

  const missing = missingEmbeddings ?? 0;
  const awaiting = (queue ?? []).length;

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Admin back office'
        subtitle='Grants, matching, subscriptions and service orders — everything that runs GrantBridge, in one place.'
        active='overview'
        actions={
          <Button variant='brand' asChild>
            <Link href='/admin/orders'>Service orders →</Link>
          </Button>
        }
      />

      <section aria-label='Key numbers' className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {[
          {
            label: 'Organisations',
            sub: 'Registered profiles',
            value: userCount ?? 0,
            accent: 'border-t-brand-green',
          },
          {
            label: 'MRR (USD)',
            sub: 'Monthly recurring revenue',
            value: `$${mrr.toFixed(2)}`,
            accent: 'border-t-brand-sun',
          },
          {
            label: 'Active subscriptions',
            sub: 'Paying plans right now',
            value: (subs ?? []).length,
            accent: 'border-t-brand-green',
          },
          {
            label: 'Grants awaiting review',
            sub: 'Collector finds to check',
            value: awaiting,
            accent: awaiting > 0 ? 'border-t-brand-sun' : 'border-t-brand-green',
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border border-brand-line border-t-4 bg-white p-5 shadow-sm ${s.accent}`}
          >
            <div className='font-alt text-3xl font-bold text-brand-ink'>{s.value}</div>
            <div className='mt-1 text-sm font-semibold text-brand-ink'>{s.label}</div>
            <div className='text-xs text-brand-muted'>{s.sub}</div>
          </div>
        ))}
      </section>

      <AdminCard>
        <AdminSectionHeading
          eyebrow='AI matching'
          title='Matching'
          right={
            missing === 0 ? (
              <StatusPill tone='green'>Vector score active</StatusPill>
            ) : (
              <StatusPill tone='sun'>Backfill needed</StatusPill>
            )
          }
        />
        <p className='mt-2 text-sm leading-relaxed text-brand-muted'>
          {missing === 0
            ? 'Every approved grant has a matching vector — the vector score is active.'
            : `${missing} approved grant${missing === 1 ? '' : 's'} ${missing === 1 ? 'has' : 'have'} no matching vector yet. Matching still works without vectors (fallback score), but the vector ranking only applies after a backfill. The collector embeds new grants on its daily run; this button embeds the missing ones now.`}
        </p>
        <div className='mt-4'>
          <BackfillEmbeddingsButton />
        </div>
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Review queue'
          title='Grant review queue'
          right={
            awaiting === 0 ? (
              <StatusPill tone='green'>Queue clear</StatusPill>
            ) : (
              <StatusPill tone='sun'>
                {awaiting} awaiting review
              </StatusPill>
            )
          }
        />
        <p className='mt-2 text-sm leading-relaxed text-brand-muted'>
          Grants from the collector land here unapproved. Approve only after checking the funder’s
          official page. “Scam” flags fee-charging listings and hides them.
        </p>
        {awaiting === 0 ? (
          <div className='mt-5 flex flex-col items-center gap-3 rounded-2xl bg-brand-bg px-5 py-8 text-center'>
            <span className='flex h-10 w-10 items-center justify-center rounded-full bg-brand-greenSoft text-lg font-bold text-brand-green'>
              ✓
            </span>
            <p className='font-semibold text-brand-ink'>Queue is clear</p>
            <p className='text-sm text-brand-muted'>Nothing awaiting review right now.</p>
          </div>
        ) : (
          <div className='mt-5 flex flex-col gap-3'>
            {(queue ?? []).map((g: any) => (
              <div
                key={g.id}
                className='flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-4 shadow-sm transition-colors hover:border-brand-green sm:flex-row sm:items-center sm:justify-between'
              >
                <div>
                  <div className='font-semibold text-brand-ink'>{g.title}</div>
                  <div className='mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-brand-muted'>
                    <span className='inline-block h-2 w-2 rounded-full bg-brand-green' aria-hidden='true' />
                    {g.funders?.name ?? 'Unknown funder'} ·{' '}
                    <a
                      href={g.official_url}
                      target='_blank'
                      rel='noreferrer'
                      className='font-medium text-brand-green hover:underline'
                    >
                      Official page ↗
                    </a>
                  </div>
                </div>
                <div className='flex gap-2'>
                  <form
                    action={async () => {
                      await reviewGrant(g.id, 'approve');
                    }}
                  >
                    <Button size='sm' type='submit' variant='brand'>
                      Approve
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      await reviewGrant(g.id, 'reject');
                    }}
                  >
                    <Button size='sm' type='submit' variant='outline'>
                      Reject
                    </Button>
                  </form>
                  <form
                    action={async () => {
                      await reviewGrant(g.id, 'scam');
                    }}
                  >
                    <Button size='sm' type='submit' variant='destructive'>
                      Scam
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading eyebrow='Collector' title='Source health' />
        <div className='mt-4 flex flex-col gap-2'>
          {(sources ?? []).map((s: any) => (
            <div
              key={s.id}
              className='flex flex-col gap-2 rounded-xl border border-brand-line bg-white px-4 py-3 transition-colors hover:border-brand-green sm:flex-row sm:items-center sm:justify-between'
            >
              <div className='min-w-0'>
                <span className='font-medium text-brand-ink'>{s.name}</span>{' '}
                <span className='break-all text-sm text-brand-muted'>{s.url}</span>
              </div>
              <div className='flex shrink-0 items-center gap-2 text-sm'>
                {s.last_ok === true ? (
                  <StatusPill tone='green'>Healthy</StatusPill>
                ) : s.last_ok === false ? (
                  <StatusPill tone='red'>Failing</StatusPill>
                ) : (
                  <StatusPill tone='muted'>Never run</StatusPill>
                )}
                {s.last_run && (
                  <span className='text-brand-muted'>last run {new Date(s.last_run).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          ))}
          {(sources ?? []).length === 0 && (
            <div className='rounded-2xl bg-brand-bg px-5 py-8 text-center'>
              <p className='font-semibold text-brand-ink'>No sources yet</p>
              <p className='mt-1 text-sm text-brand-muted'>
                The collector registers them on its first run (daily 03:00 UTC).
              </p>
            </div>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
