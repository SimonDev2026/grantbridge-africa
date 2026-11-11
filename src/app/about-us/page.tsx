import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';

const VALUES: { title: string; body: string }[] = [
  {
    title: 'Accuracy before volume',
    body: 'A grant you cannot win is not a match. We check every listing against the funder’s official page and every eligibility rule for your country before it reaches you — a short honest list beats a long misleading one.',
  },
  {
    title: 'Do the research',
    body: 'Finding grants is research work: reading the call, the guidance and the small print. We do that reading for you, and we show our workings — the funder, the deadline and the eligibility rules — so you can check them yourself.',
  },
  {
    title: 'Simple enough for a small team',
    body: 'Most African organisations applying for grants are small teams with no fundraising department. Everything we build — the quiz, the tracker, the writer — has to work for a team of one, on a phone, with no jargon.',
  },
  {
    title: 'Fair to every country',
    body: 'We cover all 54 African countries, not just the ones with the biggest NGO scenes. Where you are based should not decide whether you hear about a grant you qualify for.',
  },
];

export default function AboutPage() {
  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>About {BRAND.name}</h1>
      <p className='mt-4 text-lg text-brand-muted'>{BRAND.description}</p>

      <section className='mt-8'>
        <h2>Our mission</h2>
        <p className='mt-2 text-brand-muted'>
          To put every African organisation — in every one of the {BRAND.countriesCovered} African
          countries — on an equal footing when it comes to finding and winning grants. The money is
          out there; the gap is finding the right call, understanding the rules, and writing the
          application. We exist to close that gap.
        </p>
      </section>

      <div className='mt-6 flex flex-col gap-4 text-brand-muted'>
        <p>
          Every year, billions of dollars in grants go unclaimed by African organisations — not
          because the work isn’t good enough, but because finding the right call, reading the
          eligibility rules, and writing the application takes time most small teams don’t have.
        </p>
        <p>
          {BRAND.shortName} does the searching, the reading and the first draft. We cover all{' '}
          {BRAND.countriesCovered} African countries, international funders that accept African
          applicants, and Africa-focused donors — and we check every listing against the funder’s
          official page before it reaches you.
        </p>
        <p>
          We never award grants, never take a percentage of a grant, and never ask for your
          funder-portal password. You always submit on the funder’s own portal.
        </p>
        <p>
          Contact us at{' '}
          <a href={`mailto:${BRAND.contact.email}`} className='font-semibold text-brand-green hover:underline'>
            {BRAND.contact.email}
          </a>
          .
        </p>
      </div>

      <section className='mt-10'>
        <h2>How it was built</h2>
        <div className='mt-4 flex flex-col gap-4 text-brand-muted'>
          <p>
            {BRAND.shortName} started with the hardest part: grant discovery. Funders publish
            calls in dozens of places, each with its own eligibility rules, deadlines and formats —
            and most of them are written for people who already know the system. So we built a
            collector that gathers open calls and checks each one against the funder’s official
            page, and a matcher that filters them by what actually disqualifies people: applicant
            type, registration, country, sector, budget and project stage.
          </p>
          <p>
            Discovery alone was not enough. The next barrier was the application itself — long
            forms, supporting documents, budgets and letters, usually written against a deadline.
            So we added an AI writer that drafts the documents from an organisation’s profile and
            the files it uploads, and marks anything it does not know as a highlighted placeholder
            instead of inventing it.
          </p>
          <p>
            The rest followed the same logic: a deadline tracker and alerts so good matches are
            not missed, Word and PDF export so drafts can be finished anywhere, and human help —
            Expert Review and Done-for-you — for the applications that matter most. At every step,
            the rule stayed the same: we find, check and draft; the funder decides, and you submit.
          </p>
        </div>
      </section>

      <section className='mt-10'>
        <h2>What we stand for</h2>
        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          {VALUES.map((v) => (
            <div key={v.title} className='rounded-2xl border border-brand-line bg-white p-5'>
              <h3 className='text-base font-semibold text-brand-ink'>{v.title}</h3>
              <p className='mt-1 text-sm text-brand-muted'>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className='mt-10 rounded-2xl bg-brand-green p-6 text-center text-white sm:p-8'>
        <h2 className='text-white'>Talk to us</h2>
        <p className='mx-auto mt-2 max-w-xl text-sm text-white/85'>
          Questions, feedback, or want to help build this? We read every message.
        </p>
        <div className='mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button variant='sun' asChild>
            <Link href='/contact'>Get in touch</Link>
          </Button>
          <Button
            variant='outline'
            className='border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white'
            asChild
          >
            <Link href='/careers'>Work with us →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
