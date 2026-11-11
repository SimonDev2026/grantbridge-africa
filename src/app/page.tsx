import Link from 'next/link';

import { GrantCard } from '@/components/grant-card';
import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { PricingSection } from '@/features/pricing/components/pricing-section';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

// Funders we track, shown as examples until the first verified grants land.
// Only names — no invented amounts, deadlines or grant titles.
const EXAMPLE_FUNDERS = [
  { name: 'Tony Elumelu Foundation', sector: 'Entrepreneurship' },
  { name: 'African Women’s Development Fund', sector: 'Women & girls' },
  { name: 'GEF Small Grants Programme', sector: 'Climate & environment' },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: grants } = await supabase
    .from('grants')
    .select('id, title, summary, amount_usd_min, amount_usd_max, currency, amount_min, amount_max, scope, deadline, rolling, funders(name)')
    .eq('approved', true)
    .eq('status', 'open')
    .order('deadline', { ascending: true, nullsFirst: false })
    .limit(3);

  const sample = (grants ?? []).map((g: any) => ({
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
  }));

  return (
    <div className='flex flex-col gap-16 lg:gap-24'>
      {/* Hero */}
      <section className='pt-10 text-center lg:pt-20'>
        <p className='text-sm font-semibold text-brand-green'>
          Built for all {BRAND.countriesCovered} African countries · international + African funders
        </p>
        <h1 className='mx-auto mt-4 max-w-3xl'>{BRAND.tagline}</h1>
        <p className='mx-auto mt-4 max-w-2xl text-lg text-brand-muted'>{BRAND.description}</p>
        <div className='mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center'>
          <Button size='lg' variant='brand' asChild>
            <Link href='/quiz'>Find my grants — free →</Link>
          </Button>
          <Button size='lg' variant='outline' asChild>
            <Link href='/#how-it-works'>How it works</Link>
          </Button>
        </div>
        <p className='mt-4 text-sm text-brand-muted'>
          Takes 2 minutes. For NGOs, startups, researchers, students and community groups.
        </p>
      </section>

      {/* Trust strip */}
      <section className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
        {[
          { title: `${BRAND.countriesCovered} African countries`, text: 'Every country covered, from Algeria to Zimbabwe' },
          { title: 'Global + African funders', text: 'International grants open to your country, plus African funders' },
          { title: 'Verified listings', text: 'Every listing checked against the funder’s official page' },
          { title: 'AI writer', text: 'First drafts of every document the funder asks for' },
        ].map((s) => (
          <div key={s.title} className='rounded-2xl border border-brand-line bg-white p-5'>
            <div className='font-alt text-lg font-bold text-brand-ink'>{s.title}</div>
            <p className='mt-1 text-sm text-brand-muted'>{s.text}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section id='how-it-works'>
        <h2 className='text-center'>How it works</h2>
        <p className='mx-auto mt-2 max-w-2xl text-center text-brand-muted'>
          Describe your organisation once. We do the searching, the reading and the first draft.
        </p>
        <div className='mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {[
            { icon: '🌍', title: 'International and African grants', text: 'Global foundations, the EU, UN agencies, foreign embassies and US/UK/Canadian funders that accept African applicants, plus African foundations, governments and CSR funds.' },
            { icon: '✅', title: 'Eligibility checked for you', text: 'Country, registration type (for example CAC Incorporated Trustees in Nigeria, the NGO Board in Kenya or an NPC in South Africa), budget size and sector are all checked.' },
            { icon: '🎯', title: 'Ranked by fit score', text: 'Each match shows a score and the reasons you qualify, so you only spend time on grants you can win.' },
            { icon: '✍️', title: 'AI application drafts', text: 'Upload your registration documents, past reports and budgets. Every document the funder asks for gets drafted from them.' },
            { icon: '📲', title: 'WhatsApp and email alerts', text: 'New matches and deadline reminders go to WhatsApp, which most of Africa uses every day, and to email.' },
            { icon: '🛡️', title: 'Scam-free listings', text: 'Fake “grant” adverts and fee-charging schemes are flagged and removed. We never list a grant that asks applicants to pay.' },
          ].map((c) => (
            <div key={c.title} className='rounded-2xl border border-brand-line bg-white p-5'>
              <div className='text-2xl'>{c.icon}</div>
              <h3 className='mt-2'>{c.title}</h3>
              <p className='mt-1 text-sm text-brand-muted'>{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sample matches */}
      <section>
        <h2 className='text-center'>Get matched, no searching</h2>
        <p className='mx-auto mt-2 max-w-2xl text-center text-brand-muted'>
          Tell us about your organisation and see the grants you qualify for — ranked by fit, with
          the reasons in plain language.
        </p>
        <div className='mt-8 grid gap-4 md:grid-cols-3'>
          {sample.length > 0
            ? sample.map((g) => <GrantCard key={g.id} grant={g} />)
            : EXAMPLE_FUNDERS.map((f) => (
                <GrantCard
                  key={f.name}
                  grant={{
                    id: f.name,
                    title: `${f.sector} grants from this funder`,
                    funderName: f.name,
                    summary:
                      'Our collector checks this funder’s official page every day. Take the quiz to see its open calls matched to your organisation.',
                    scope: 'africa',
                    example: true,
                  }}
                />
              ))}
        </div>
        <div className='mt-6 text-center'>
          <Button variant='brand' asChild>
            <Link href='/quiz'>Find my grants — free →</Link>
          </Button>
        </div>
      </section>

      {/* Setup in 5 minutes */}
      <section className='rounded-2xl bg-brand-greenSoft p-8 text-center lg:p-12'>
        <h2>Setup takes 5 minutes</h2>
        <div className='mx-auto mt-6 grid max-w-3xl gap-4 text-left sm:grid-cols-3'>
          {[
            { n: '1', title: 'Take the 2-minute quiz', text: 'Who you are, where you work, what you need.' },
            { n: '2', title: 'See your matches', text: 'Top 3 free. Unlock the full list with your email.' },
            { n: '3', title: 'Apply with AI drafts', text: 'Upload your documents once; every section gets drafted.' },
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

      {/* Pricing */}
      <PricingSection />

      {/* FAQ */}
      <section className='mx-auto w-full max-w-3xl'>
        <h2 className='text-center'>Questions, answered</h2>
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
      </section>

      {/* Final CTA */}
      <section className='rounded-2xl bg-brand-ink p-8 text-center text-white lg:p-12'>
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
      </section>
    </div>
  );
}
