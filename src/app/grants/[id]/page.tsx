import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { saveGrant } from '@/app/dashboard/actions';
import { formatAmount, scopeTag } from '@/components/grant-card';
import { Button } from '@/components/ui/button';
import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export default async function GrantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = (await createSupabaseServerClient()) as any;
  const [{ data: grant }, session] = await Promise.all([
    supabase
      .from('grants')
      .select('*, funders(name, website, type, hq_country)')
      .eq('id', id)
      .eq('approved', true)
      .maybeSingle(),
    getSession(),
  ]);
  if (!grant) notFound();

  let profile: any = null;
  if (session?.user) {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle();
    profile = data;
  }

  const checks: { label: string; state: 'yes' | 'check' | 'no' }[] = [
    {
      label: `Country: ${profile ? `you are based in ${profile.country}` : 'sign in to check your country'}`,
      state: !profile
        ? 'check'
        : grant.all_countries ||
            grant.eligible_countries?.includes(profile.country) ||
            grant.scope !== 'national'
          ? 'yes'
          : 'no',
    },
    {
      label: `Applicant type: ${profile ? profile.applicant_type?.replace('_', ' ') : 'sign in to check'}`,
      state: !profile
        ? 'check'
        : !grant.applicant_types?.length || grant.applicant_types.includes(profile.applicant_type)
          ? 'yes'
          : 'no',
    },
    {
      label: `Sector: ${profile ? (profile.sectors ?? []).join(', ').replace(/_/g, ' ') || 'not set' : 'sign in to check'}`,
      state: !profile
        ? 'check'
        : !grant.sectors?.length || (profile.sectors ?? []).some((s: string) => grant.sectors.includes(s))
          ? 'yes'
          : 'check',
    },
    {
      label: grant.fee_charged ? 'This grant charges applicants a fee — we do not list fee-charging grants' : 'No application fee',
      state: grant.fee_charged ? 'no' : 'yes',
    },
    {
      label: grant.registration_required?.length
        ? `Registration needed: ${grant.registration_required.join(', ')}`
        : 'Registration requirements as published by the funder',
      state: 'check',
    },
  ];

  const g: any = grant;
  const tag = scopeTag({ ...g, country: profile?.country });

  return (
    <div className='mx-auto max-w-3xl py-8'>
      <Link href='/dashboard' className='text-sm font-medium text-brand-green hover:underline'>
        ← Back to dashboard
      </Link>
      <div className='mt-4 flex flex-wrap gap-2'>
        <span className='rounded-full bg-brand-blueTag px-3 py-1 text-xs font-semibold'>{tag}</span>
        <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green'>
          {g.status === 'open' ? 'Open' : g.status === 'upcoming' ? 'Opening soon' : g.status}
        </span>
      </div>
      <h1 className='mt-3'>{g.title}</h1>
      <p className='mt-1 text-lg text-brand-muted'>
        {g.funders?.name}
        {g.funders?.hq_country ? ` · ${g.funders.hq_country}` : ''}
      </p>
      <div className='mt-4 flex flex-wrap gap-x-6 gap-y-1 text-base'>
        <span className='font-bold text-brand-ink'>{formatAmount(g)}</span>
        <span className='text-brand-muted'>
          {g.rolling ? 'Rolling deadline' : g.deadline ? `Deadline: ${g.deadline}` : 'Deadline: see funder page'}
        </span>
      </div>

      {g.summary && (
        <section className='mt-6'>
          <h2>About this grant</h2>
          <p className='mt-2 whitespace-pre-line text-brand-muted'>{g.summary}</p>
        </section>
      )}

      <section className='mt-8 rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Eligibility checklist</h2>
        <ul className='mt-3 flex flex-col gap-2'>
          {checks.map((c) => (
            <li key={c.label} className='flex items-start gap-2 text-sm'>
              <span className={c.state === 'yes' ? 'text-brand-green' : c.state === 'no' ? 'text-red-600' : 'text-brand-sun'}>
                {c.state === 'yes' ? '✓' : c.state === 'no' ? '✕' : '?'}
              </span>
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
        {!profile && (
          <p className='mt-3 text-sm text-brand-muted'>
            <Link href='/signup' className='font-semibold text-brand-green hover:underline'>
              Create a free account
            </Link>{' '}
            and complete your profile to check eligibility automatically.
          </p>
        )}
      </section>

      {g.documents_required?.length > 0 && (
        <section className='mt-8'>
          <h2>Documents the funder asks for</h2>
          <ul className='mt-3 flex flex-col gap-1'>
            {g.documents_required.map((d: string) => (
              <li key={d} className='text-sm text-brand-muted'>
                • {d}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className='mt-8 flex flex-col gap-3 sm:flex-row'>
        <Button variant='brand' asChild>
          <Link href={session?.user ? `/apply/${g.id}` : '/signup'}>Write this application →</Link>
        </Button>
        <Button variant='outline' asChild>
          <a href={g.official_url} target='_blank' rel='noreferrer'>
            Official funder page ↗
          </a>
        </Button>
        {session?.user && (
          <form
            action={async () => {
              'use server';
              await saveGrant(g.id);
              redirect('/dashboard?status=saved');
            }}
          >
            <Button type='submit' variant='outline'>
              Save for later
            </Button>
          </form>
        )}
      </section>

      <p className='mt-6 text-xs text-brand-muted'>
        Last checked: {g.last_checked_at ? new Date(g.last_checked_at).toLocaleDateString() : 'recently'}.
        Always confirm the details on the funder’s official page — funders change calls without
        notice. {BRAND_NOTE}
      </p>
    </div>
  );
}

const BRAND_NOTE =
  'GrantBridge finds and drafts; the funder decides. We never ask for your portal password.';
