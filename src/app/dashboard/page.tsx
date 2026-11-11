import Link from 'next/link';
import { redirect } from 'next/navigation';

import { MatchRow } from '@/app/dashboard/match-row';
import { Button } from '@/components/ui/button';
import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const KANBAN_COLUMNS = [
  { key: 'saved', label: 'Saved' },
  { key: 'applying', label: 'Applying' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
] as const;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; scope?: string; sort?: string }>;
}) {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const params = await searchParams;
  const supabase = (await createSupabaseServerClient()) as any;

  const [{ data: profile }, subscription] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
    getSubscription(),
  ]);

  let query = supabase
    .from('matches')
    .select('*, grants(*, funders(name))')
    .eq('user_id', session.user.id)
    .order('score', { ascending: false });

  if (params.status && params.status !== 'all') query = query.eq('status', params.status);

  const { data: matches } = await query;
  const rows = (matches ?? []).map((m: any) => ({
    id: m.grants?.id ?? m.grant_id,
    title: m.grants?.title ?? 'Grant',
    funderName: m.grants?.funders?.name,
    summary: m.grants?.summary,
    amount_usd_max: m.grants?.amount_usd_max,
    amount_usd_min: m.grants?.amount_usd_min,
    scope: m.grants?.scope,
    deadline: m.grants?.deadline,
    rolling: m.grants?.rolling,
    score: m.score,
    reasons: Array.isArray(m.reasons) ? m.reasons : [],
    status: m.status,
    country: profile?.country,
  }));

  const filtered =
    params.scope && params.scope !== 'all'
      ? rows.filter((r: any) => r.scope === params.scope)
      : rows;
  const sorted = [...filtered].sort((a: any, b: any) => {
    if (params.sort === 'deadline') return (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999');
    if (params.sort === 'amount') return (b.amount_usd_max ?? 0) - (a.amount_usd_max ?? 0);
    return (b.score ?? 0) - (a.score ?? 0);
  });

  const byStatus = (s: string) => rows.filter((r: any) => r.status === s).length;
  const upcoming = rows
    .filter((r: any) => r.deadline && !r.rolling && r.deadline >= new Date().toISOString().slice(0, 10))
    .sort((a: any, b: any) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))
    .slice(0, 5);

  const planName = (subscription as any)?.prices?.products?.name ?? 'Explorer (free)';

  return (
    <div className='flex flex-col gap-8 py-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1>Dashboard</h1>
          <p className='mt-1 text-brand-muted'>
            {profile?.org_name ? `Welcome back, ${profile.org_name}. ` : ''}
            Plan: <span className='font-semibold text-brand-ink'>{planName}</span>
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link href='/profile'>My profile</Link>
          </Button>
          <Button variant='brand' asChild>
            <Link href='/quiz'>Find more grants</Link>
          </Button>
        </div>
      </div>

      {!profile && (
        <div className='rounded-2xl border border-brand-sun bg-brand-sunSoft p-5'>
          <h2 className='text-lg'>Complete your profile to get matched</h2>
          <p className='mt-1 text-sm text-brand-muted'>
            Add your organisation details and documents once — matching and AI drafts use them.
          </p>
          <div className='mt-3'>
            <Button variant='brand' asChild>
              <Link href='/profile'>Complete my profile →</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Kanban summary */}
      <section>
        <h2>Tracker</h2>
        <div className='mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5'>
          {KANBAN_COLUMNS.map((c) => (
            <Link
              key={c.key}
              href={`/dashboard?status=${c.key}`}
              className='rounded-2xl border border-brand-line bg-white p-4 hover:border-brand-green'
            >
              <div className='text-2xl font-bold text-brand-ink'>{byStatus(c.key)}</div>
              <div className='text-sm text-brand-muted'>{c.label}</div>
            </Link>
          ))}
        </div>
        <p className='mt-2 text-sm text-brand-muted'>
          {byStatus('new')} new · {rows.length} matches total.{' '}
          <Link href='/dashboard?status=all' className='font-semibold text-brand-green hover:underline'>
            Show all
          </Link>
        </p>
      </section>

      {/* Deadline calendar */}
      {upcoming.length > 0 && (
        <section>
          <h2>Deadlines coming up</h2>
          <div className='mt-3 flex flex-col gap-2'>
            {upcoming.map((r: any) => (
              <Link
                key={r.id}
                href={`/grants/${r.id}`}
                className='flex items-center justify-between rounded-xl border border-brand-line bg-white px-4 py-3 hover:border-brand-green'
              >
                <span className='font-medium text-brand-ink'>{r.title}</span>
                <span className='text-sm text-brand-muted'>{r.deadline}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Matches with filters */}
      <section>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <h2>Your matches</h2>
          <form className='flex flex-wrap gap-2 text-sm' method='get'>
            <select name='status' defaultValue={params.status ?? 'all'} className='rounded-lg border border-brand-line bg-white px-2 py-2'>
              <option value='all'>All statuses</option>
              <option value='new'>New</option>
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
              <option value='skipped'>Skipped</option>
            </select>
            <select name='scope' defaultValue={params.scope ?? 'all'} className='rounded-lg border border-brand-line bg-white px-2 py-2'>
              <option value='all'>All funders</option>
              <option value='international'>International</option>
              <option value='africa'>Africa-focused</option>
              <option value='national'>National</option>
            </select>
            <select name='sort' defaultValue={params.sort ?? 'score'} className='rounded-lg border border-brand-line bg-white px-2 py-2'>
              <option value='score'>Best fit first</option>
              <option value='deadline'>Deadline soonest</option>
              <option value='amount'>Largest amount</option>
            </select>
            <Button type='submit' variant='outline'>
              Filter
            </Button>
          </form>
        </div>

        {sorted.length === 0 ? (
          <div className='mt-4 rounded-2xl border border-brand-line bg-white p-8 text-center'>
            <p className='text-brand-muted'>
              No matches here yet. Take the quiz to find grants for your organisation.
            </p>
            <div className='mt-4'>
              <Button variant='brand' asChild>
                <Link href='/quiz'>Take the quiz →</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className='mt-4 flex flex-col gap-3'>
            {sorted.map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
