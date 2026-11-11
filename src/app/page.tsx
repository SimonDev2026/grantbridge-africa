import Link from 'next/link';

import { GrantCard } from '@/components/grant-card';
import { AnimatedStats, type StatDef } from '@/components/home/animated-stats';
import { GrantSearchBox } from '@/components/home/grant-search-box';
import { OpportunitiesCarousel, type OpportunityCardData } from '@/components/home/opportunities-carousel';
import { Reveal } from '@/components/home/reveal';
import { RotatingWord } from '@/components/home/rotating-word';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { type QuizAnswers,rankGrants } from '@/features/matching/score';
import { PricingSection } from '@/features/pricing/components/pricing-section';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// Example profile used ONLY to illustrate matching on this page.
// Every visitor gets their own list from the quiz — nothing here is a promise
// about what any real organisation will match.
const EXAMPLE_PROFILE: QuizAnswers = {
  applicant_type: 'ngo',
  registration_type: 'registered_nonprofit',
  country: 'Nigeria',
  description: 'A registered Nigerian NGO working on food security and livelihoods for rural families.',
  sector: 'food_agriculture',
  beneficiaries: 'rural_low_income',
  funding_need: '25000_100000',
  annual_budget: '50000_250000',
  stage: 'pilot',
};

function sectorLabel(slug: string): string {
  return slug
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function amountLabel(g: {
  amount_usd_max?: number | null;
  amount_usd_min?: number | null;
  amount_max?: number | null;
  amount_min?: number | null;
  currency?: string | null;
}): string {
  if (g.amount_usd_max) return `Up to $${g.amount_usd_max.toLocaleString()}`;
  if (g.amount_usd_min) return `From $${g.amount_usd_min.toLocaleString()}`;
  if (g.amount_max && g.currency) return `Up to ${g.currency} ${g.amount_max.toLocaleString()}`;
  if (g.amount_min && g.currency) return `From ${g.currency} ${g.amount_min.toLocaleString()}`;
  return 'Amount varies';
}

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: grants }, { data: cr }] = await Promise.all([
    supabase
      .from('grants')
      .select('*, funders(name)')
      .eq('approved', true)
      .eq('status', 'open')
      .eq('fee_charged', false)
      .order('deadline', { ascending: true, nullsFirst: false }),
    supabase.from('country_regions').select('regions').eq('country', 'Nigeria').maybeSingle(),
  ]);

  const rows = (grants ?? []) as any[];
  const regions: string[] = (cr as any)?.regions ?? ['Africa'];

  // Live stats — computed at request time, never hard-coded.
  const totalFunding = rows.reduce(
    (sum, g) => sum + (g.amount_usd_max ?? g.amount_usd_min ?? 0),
    0
  );
  const funderCount = new Set(rows.map((g) => g.funder_id).filter(Boolean)).size;
  const stats: StatDef[] = [
    { value: rows.length, label: 'Open grants', sub: 'Live listings, checked against funder pages', format: 'number' },
    { value: totalFunding, label: 'Total funding available', sub: 'Combined maximum value of open grants, in USD', format: 'usd' },
    { value: funderCount, label: 'Funders with open calls', sub: 'International and African funders', format: 'number' },
    { value: BRAND.countriesCovered, label: 'African countries covered', sub: 'Every country, from Algeria to Zimbabwe', format: 'number' },
  ];

  // Ranked example matches for the typical Nigeria/NGO profile.
  const ranked = rankGrants(EXAMPLE_PROFILE, rows, regions);
  const matched = ranked.map((g: any) => ({
    id: g.id,
    title: g.title,
    funderName: g.funders?.name,
    summary: g.summary,
    amount_usd_min: g.amount_usd_min,
    amount_usd_max: g.amount_usd_max,
    currency: g.currency,
    amount_min: g.amount_min,
    amount_max: g.amount_max,
    scope: g.scope,
    deadline: g.deadline,
    rolling: g.rolling,
    score: g.score,
    reasons: g.reasons,
    country: 'Nigeria',
  }));

  const carouselCards: OpportunityCardData[] = ranked.slice(0, 8).map((g: any) => ({
    id: g.id,
    title: g.title,
    funderName: g.funders?.name ?? null,
    amountLabel: amountLabel(g),
    category: g.sectors?.[0] ? sectorLabel(g.sectors[0]) : 'General',
    deadline: g.deadline,
    rolling: g.rolling,
    score: g.score,
  }));

  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const deadlinesSoon = matched.filter(
    (g) => g.deadline && new Date(g.deadline) >= now && new Date(g.deadline) <= in30Days
  ).length;

  return (
    <div className='flex flex-col gap-16 lg:gap-24'>
      {/* 1. Hero */}
      <section className='pt-10 text-center lg:pt-20'>
        <span className='inline-block rounded-full bg-brand-greenSoft px-4 py-1.5 text-sm font-semibold text-brand-green'>
          Trusted by organisations across Africa
        </span>
        <h1 className='mx-auto mt-5 max-w-3xl'>
          Find the grants your <RotatingWord /> actually qualifies for
        </h1>
        <p className='mx-auto mt-4 max-w-2xl text-lg text-brand-muted'>
          GrantBridge searches funders across all {BRAND.countriesCovered} African countries, checks
          every eligibility rule for your country, and drafts the application — so you spend your
          time applying, not searching.
        </p>
        <div className='mt-8'>
          <GrantSearchBox />
        </div>
        <div className='mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
          <Button size='lg' variant='brand' asChild>
            <Link href='/quiz'>Find my grants — free →</Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link href='/#get-matched'>How matching works</Link>
          </Button>
        </div>
        <p className='mt-4 text-sm text-brand-muted'>
          Takes 2 minutes. For NGOs, startups, researchers, students and community groups.
        </p>
      </section>

      {/* 2. Animated stats strip — live counts from the database */}
      <Reveal>
        <AnimatedStats stats={stats} />
      </Reveal>

      {/* 3. Get matched — ranked list, ranking transparency, dashboard preview */}
      <section id='get-matched'>
        <Reveal>
          <h2 className='text-center'>Get matched, no searching</h2>
          <p className='mx-auto mt-2 max-w-2xl text-center text-brand-muted'>
            Tell us about your organisation and see the grants you qualify for — ranked by fit, with
            the reasons in plain language. Below is an example: every grant a registered Nigerian
            NGO working on food security qualifies for right now, ranked the same way yours will be.
          </p>
        </Reveal>
        <div className='mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {matched.length > 0 ? (
            matched.map((g) => <GrantCard key={g.id} grant={g} />)
          ) : (
            <p className='text-center text-brand-muted md:col-span-2 lg:col-span-3'>
              No matching grants yet — take the quiz to see everything you qualify for.
            </p>
          )}
        </div>
        <div className='mt-6 text-center'>
          <Button variant='brand' asChild>
            <Link href='/quiz'>Find my grants — free →</Link>
          </Button>
        </div>

        {/* How results are ranked — transparency */}
        <Reveal className='mt-12'>
          <div className='rounded-2xl border border-brand-line bg-white p-6 lg:p-8'>
            <h3 className='text-center'>How results are ranked</h3>
            <p className='mx-auto mt-2 max-w-2xl text-center text-sm text-brand-muted'>
              Every match gets a fit score out of 100. The score is a fixed formula — no funder can
              pay to rank higher, and nothing about it is hidden.
            </p>
            <div className='mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-5'>
              {[
                { pts: '30', label: 'Your sector', text: 'The grant funds your focus area.' },
                { pts: '20', label: 'Who you are', text: 'The funder accepts your applicant type.' },
                { pts: '20', label: 'Who you serve', text: 'The grant prioritises your beneficiaries.' },
                { pts: '20', label: 'Where you work', text: 'International, Africa-wide or national — your country is covered.' },
                { pts: '10', label: 'Amount fit', text: 'The grant size fits what you asked for.' },
              ].map((r) => (
                <div key={r.label} className='rounded-xl bg-brand-greenSoft/60 p-4 text-center'>
                  <div className='font-alt text-2xl font-bold text-brand-green'>{r.pts} pts</div>
                  <div className='mt-1 text-sm font-semibold text-brand-ink'>{r.label}</div>
                  <p className='mt-0.5 text-xs text-brand-muted'>{r.text}</p>
                </div>
              ))}
            </div>
            <p className='mt-4 text-center text-xs text-brand-muted'>
              Grants that fail the hard rules — wrong applicant type, or a country the funder does
              not cover — never appear in your list at all.
            </p>
          </div>
        </Reveal>

        {/* In-page dashboard preview — real data, same shape as /dashboard */}
        <Reveal className='mt-8'>
          <div className='overflow-hidden rounded-2xl border border-brand-line bg-white'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-brand-line bg-brand-greenSoft/50 px-6 py-4'>
              <div>
                <h3 className='text-lg'>Your dashboard, once you sign in</h3>
                <p className='text-sm text-brand-muted'>
                  Matches, deadlines and drafts in one place — this preview uses today&apos;s live
                  listings.
                </p>
              </div>
              <Button variant='outline' size='sm' asChild>
                <Link href='/dashboard'>Open dashboard →</Link>
              </Button>
            </div>
            <div className='grid gap-4 p-6 sm:grid-cols-3'>
              <div className='rounded-xl bg-brand-greenSoft/60 p-4'>
                <div className='font-alt text-2xl font-bold text-brand-ink'>{matched.length}</div>
                <div className='text-sm text-brand-muted'>Open matches for the example profile</div>
              </div>
              <div className='rounded-xl bg-brand-greenSoft/60 p-4'>
                <div className='font-alt text-2xl font-bold text-brand-ink'>{deadlinesSoon}</div>
                <div className='text-sm text-brand-muted'>Deadlines in the next 30 days</div>
              </div>
              <div className='rounded-xl bg-brand-greenSoft/60 p-4'>
                <div className='font-alt text-2xl font-bold text-brand-ink'>{BRAND.countriesCovered}</div>
                <div className='text-sm text-brand-muted'>African countries covered</div>
              </div>
            </div>
            <ul className='border-t border-brand-line px-6 py-4'>
              {matched.slice(0, 3).map((g) => (
                <li key={g.id} className='flex flex-wrap items-center justify-between gap-2 border-b border-brand-line py-3 last:border-b-0'>
                  <span className='font-medium text-brand-ink'>{g.title}</span>
                  <span className='text-sm text-brand-muted'>
                    <span className='font-semibold text-brand-green'>{g.score}% fit</span>
                    {' · '}
                    {g.rolling ? 'Rolling deadline' : g.deadline ? `Deadline ${g.deadline}` : 'Deadline TBC'}
                  </span>
                </li>
              ))}
              {matched.length === 0 && (
                <li className='py-3 text-sm text-brand-muted'>
                  No open matches for the example profile right now — take the quiz for your own list.
                </li>
              )}
            </ul>
          </div>
        </Reveal>
      </section>

      {/* 4. Quality applications, written automatically */}
      <section>
        <Reveal>
          <h2 className='text-center'>Quality applications, written automatically</h2>
          <p className='mx-auto mt-2 max-w-2xl text-center text-brand-muted'>
            Finding the grant is half the work. The other half is the application — and our writer
            already does the first draft for you.
          </p>
        </Reveal>
        <div className='mt-8 grid gap-4 md:grid-cols-3'>
          {[
            {
              n: '1',
              title: 'Press Apply on a match',
              text: 'Pick a grant from your list and press Apply. The writer pulls in your organisation profile and every document you have uploaded.',
            },
            {
              n: '2',
              title: 'A full draft of every document',
              text: 'Every document the funder asks for — proposal, budget, cover letter — gets a complete first draft written from your own facts. Anything missing becomes a highlighted [placeholder], never an invented fact.',
            },
            {
              n: '3',
              title: 'Review, then submit yourself',
              text: 'Read the draft, fill in the placeholders, export to Word or PDF, and submit on the funder’s own portal. You always press submit — we never ask for your funder portal password.',
            },
          ].map((s) => (
            <div key={s.n} className='rounded-2xl border border-brand-line bg-white p-6'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-brand-green font-bold text-white'>
                {s.n}
              </div>
              <h3 className='mt-3 text-base'>{s.title}</h3>
              <p className='mt-1 text-sm text-brand-muted'>{s.text}</p>
            </div>
          ))}
        </div>
        <div className='mt-6 text-center'>
          <Button variant='sun' asChild>
            <Link href='/pricing'>See plans with AI drafts →</Link>
          </Button>
        </div>
      </section>

      {/* 5. Curated opportunities — carousel of real seeded grants */}
      <section>
        <Reveal>
          <h2 className='text-center'>Curated opportunities</h2>
          <p className='mx-auto mt-2 max-w-2xl text-center text-brand-muted'>
            A few of the open grants in our collection right now. Match percentages are example
            scores for a registered Nigerian NGO — take the quiz to see your own.
          </p>
        </Reveal>
        <div className='mt-8'>
          {carouselCards.length > 0 ? (
            <OpportunitiesCarousel cards={carouselCards} />
          ) : (
            <p className='text-center text-brand-muted'>
              No open grants to show right now — take the quiz to see everything you qualify for.
            </p>
          )}
        </div>
      </section>

      {/* 6. Setup takes 5 minutes */}
      <section className='rounded-2xl bg-brand-greenSoft p-8 text-center lg:p-12'>
        <Reveal>
          <h2>Setup takes 5 minutes</h2>
          <p className='mx-auto mt-2 max-w-xl text-brand-muted'>
            Describe your organisation once. The service remembers it — every match and every draft
            after that builds on the same profile.
          </p>
        </Reveal>
        <div className='mx-auto mt-6 grid max-w-3xl gap-4 text-left sm:grid-cols-3'>
          {[
            { n: '1', title: 'Describe your organisation once', text: 'A 2-minute quiz: who you are, where you work, what you need funding for.' },
            { n: '2', title: 'Upload your existing documents', text: 'Registration papers, past reports, budgets. The writer draws on them for every draft.' },
            { n: '3', title: 'The service remembers it', text: 'Update your profile once and every future match and draft uses the new details. No re-typing.' },
          ].map((s) => (
            <div key={s.n} className='rounded-xl bg-white p-5'>
              <div className='flex h-8 w-8 items-center justify-center rounded-full bg-brand-green font-bold text-white'>
                {s.n}
              </div>
              <h3 className='mt-3 text-base'>{s.title}</h3>
              <p className='mt-1 text-sm text-brand-muted'>{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Pricing — monthly prices, with a note about yearly saving */}
      <section>
        <Reveal>
          <p className='text-center text-sm font-semibold text-brand-green'>
            Prices shown monthly. Pay yearly on any plan and get 2 months free — switch to Yearly on
            the card. One-time services need no subscription.
          </p>
        </Reveal>
        <PricingSection />
        <div className='text-center'>
          <Button variant='outline' asChild>
            <Link href='/pricing'>See full pricing →</Link>
          </Button>
        </div>
      </section>

      {/* FAQ — the 6 homepage questions */}
      <section className='mx-auto w-full max-w-3xl'>
        <Reveal>
          <h2 className='text-center'>Questions, answered</h2>
        </Reveal>
        <div className='mt-8 flex flex-col gap-4'>
          {[
            { q: 'Does GrantBridge award grants?', a: 'No. Funders award grants. We find the ones you qualify for, check your eligibility, and draft the application. You always submit on the funder’s own portal.' },
            { q: 'Why US dollars?', a: 'One price in every country, with no currency conversion surprises. Stripe charges in USD; your bank converts at its own rate if you pay in another currency.' },
            { q: 'Do you take a percentage of grants?', a: 'Never. Many funders forbid paying commissions from grant money, and it damages trust. You pay only for the plan or service you choose.' },
            { q: 'Will the AI invent facts about my organisation?', a: 'No. The writer only uses your profile and the documents you upload. Anything missing becomes a highlighted [placeholder] for you to fill in — it never invents.' },
            { q: 'Do you ask for my funder portal password?', a: 'Never. For Done-for-you applications we guide you through the funder’s portal live, and you press submit yourself.' },
            { q: 'What if a grant asks applicants to pay?', a: 'We never list it. Fee-charging “grants” are a scam pattern; our review queue flags and removes them.' },
          ].map((f) => (
            <div key={f.q} className='rounded-2xl border border-brand-line bg-white p-5'>
              <h3 className='text-base'>{f.q}</h3>
              <p className='mt-1 text-sm text-brand-muted'>{f.a}</p>
            </div>
          ))}
        </div>
        <p className='mt-6 text-center text-sm text-brand-muted'>
          More questions? See the full list on our{' '}
          <Link href='/faq' className='font-semibold text-brand-green hover:underline'>
            FAQ page
          </Link>
          .
        </p>
      </section>

      {/* 8. Final CTA */}
      <section className='rounded-2xl bg-brand-ink p-8 text-center text-white lg:p-12'>
        <Reveal>
          <h2 className='text-white'>Your next grant is out there.</h2>
          <p className='mx-auto mt-2 max-w-xl text-white/70'>
            Two minutes from now you could be looking at the grants your organisation actually
            qualifies for.
          </p>
          <div className='mt-6'>
            <Button size='lg' variant='sun' asChild>
              <Link href='/quiz'>Find my grants — free →</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
