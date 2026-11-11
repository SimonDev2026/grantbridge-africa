'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { cn } from '@/utils/cn';

type FaqGroup = {
  id: string;
  title: string;
  questions: { q: string; a: string }[];
};

const GROUPS: FaqGroup[] = [
  {
    id: 'about',
    title: 'About GrantBridge',
    questions: [
      {
        q: `What is ${BRAND.name}?`,
        a: `${BRAND.name} helps African organisations find grants they actually qualify for and draft the application. We search international funders that accept African applicants and Africa-focused donors in one place, check every eligibility rule for your country, and draft the application documents. We cover all ${BRAND.countriesCovered} African countries.`,
      },
      {
        q: 'Who can use GrantBridge?',
        a: 'NGOs and non-profits, startups and small businesses, researchers and universities, students and individuals, and community groups — including unregistered ones. The quiz asks who you are applying as, because most funders only accept one type of applicant, and we filter on that first.',
      },
      {
        q: `Does ${BRAND.shortName} award grants or guarantee funding?`,
        a: 'No. Grant decisions are made by the funders, never by us. We never award grants, never take a percentage of a grant, and never charge applicants on a funder’s behalf. We help you find the right calls and write a stronger application — whether you win is the funder’s decision.',
      },
      {
        q: 'Which countries do you cover?',
        a: `All ${BRAND.countriesCovered} African countries. We list international funders that accept African applicants as well as Africa-focused donors, and we check every listing against the funder’s official page before it reaches you.`,
      },
    ],
  },
  {
    id: 'how-it-works',
    title: 'How it works',
    questions: [
      {
        q: 'How does grant matching work?',
        a: 'Take the 9-question quiz: who you are applying as, how your organisation is registered, your country, what you do, your sector, who you serve, how much funding you need, your annual budget, and your project stage. We check every open grant against your answers and rank the matches by eligibility fit. You see your top 3 matches free; enter your email to unlock the full shortlist and get new matches by email each week.',
      },
      {
        q: 'What does the AI writer do?',
        a: 'The writer drafts the application documents from your profile and the documents you upload — registration certificates, constitutions, reports, budgets and support letters. You review every draft, edit it, and export it as Word or PDF. If the AI does not have a fact, it shows a highlighted [placeholder] instead of inventing one — fill each one in yourself and never leave a placeholder in a submitted application.',
      },
      {
        q: 'Do you submit applications for me, or ask for my funder-portal password?',
        a: 'No — and we never will. You always submit on the funder’s own portal, with your own account. Never share your funder-portal password with us or anyone else. With the Done-for-you service we write the full application with you and guide you through submission on the funder’s portal — you press submit.',
      },
      {
        q: 'What if no grants match my answers right now?',
        a: 'That can happen, especially for very specific combinations of country, sector and budget. New grants are added daily, so check back — and make sure your email is correct so we can send you new matches when one fits. Double-check your country and applicant type too: those are the strongest filters.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing',
    questions: [
      {
        q: 'Is there a free plan?',
        a: 'Yes. Explorer is free, forever: take the quiz, see your top 3 matches, and get a weekly email of new grants. There is no card required for the free account.',
      },
      {
        q: 'What do the paid plans cost?',
        a: 'Seeker is $19 a month, Writer is $49 a month, and Pro is $149 a month — one price in every country, in US dollars. Yearly billing is 2 months free: Seeker $190 a year, Writer $490 a year, Pro $1,490 a year. You can also pay per application with no subscription: a Single Application Draft is $29, Expert Review is $149, and Done-for-you is $399.',
      },
      {
        q: 'How do I pay, and how do I cancel?',
        a: 'All payments are in US dollars through Stripe — cards, Apple Pay and Google Pay. Subscriptions renew until you cancel. Cancel any time from your account page (Manage subscription): you keep access until the end of the paid period.',
      },
      {
        q: 'What is your refund policy?',
        a: 'If a service order (Expert Review or Done-for-you) has not started, contact us within 7 days of payment for a refund; once work has started, refunds are at our discretion. Draft credits do not expire while your account is active, but unused monthly draft allowances do not roll over to the next month.',
      },
    ],
  },
  {
    id: 'privacy-support',
    title: 'Privacy and support',
    questions: [
      {
        q: 'What data do you collect, and how is it used?',
        a: 'Your email and account details, the organisation details you enter in the quiz and your profile, the documents you upload, and which grants you save and track. We use it to match you with grants, draft applications, and send the alerts and weekly digest you opted into. We do not sell personal data.',
      },
      {
        q: 'Are my documents private?',
        a: 'Yes. Your documents live in a private storage bucket, protected so you can only see your own records. They are sent to our AI provider only to draft your application, and are not used to train models.',
      },
      {
        q: 'How do I get support, or ask for my data to be deleted?',
        a: `Email us at ${BRAND.contact.supportEmail} — we reply within one working day. You can also join our WhatsApp channel for quick updates. To see, correct or delete the personal data we hold about you, or to withdraw consent for marketing, email ${BRAND.contact.email} — we reply within 30 days.`,
      },
      {
        q: 'Can I change my plan?',
        a: 'Yes — manage your subscription from your account page. Upgrades apply immediately; downgrades apply at the next renewal.',
      },
    ],
  },
];

export default function FaqPage() {
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className='mx-auto max-w-5xl py-10'>
      <h1>Frequently asked questions</h1>
      <p className='mt-3 max-w-2xl text-lg text-brand-muted'>
        How {BRAND.shortName} finds grants, what the writer does, what it costs, and how your data
        is handled. Anything else — ask us.
      </p>

      <div className='mt-8 flex flex-col gap-8 lg:flex-row'>
        {/* Sticky "On this page" nav */}
        <aside className='lg:sticky lg:top-6 lg:h-fit lg:w-56 lg:shrink-0'>
          <nav
            aria-label='On this page'
            className='flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0'
          >
            <span className='hidden text-xs font-semibold uppercase tracking-wide text-brand-muted lg:block'>
              On this page
            </span>
            {GROUPS.map((g) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                className='whitespace-nowrap rounded-full border border-brand-line bg-white px-3 py-1.5 text-sm font-medium text-brand-ink hover:border-brand-green hover:text-brand-green lg:whitespace-normal lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-2 lg:py-1.5 lg:text-left'
              >
                {g.title}
              </a>
            ))}
          </nav>
        </aside>

        <div className='min-w-0 flex-1'>
          {GROUPS.map((group) => (
            <section key={group.id} id={group.id} className='scroll-mt-6'>
              <h2 className='mt-8 first:mt-0'>{group.title}</h2>
              <div className='mt-4 flex flex-col gap-3'>
                {group.questions.map((item) => {
                  const key = `${group.id}:${item.q}`;
                  const isOpen = open.has(key);
                  return (
                    <div key={key} className='rounded-2xl border border-brand-line bg-white'>
                      <button
                        type='button'
                        onClick={() => toggle(key)}
                        aria-expanded={isOpen}
                        className='flex w-full items-center justify-between gap-4 p-5 text-left'
                      >
                        <span className='text-base font-semibold text-brand-ink'>{item.q}</span>
                        <span
                          aria-hidden
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-greenSoft text-lg font-medium text-brand-green transition-transform',
                            isOpen && 'rotate-45'
                          )}
                        >
                          +
                        </span>
                      </button>
                      {isOpen && (
                        <p className='px-5 pb-5 text-sm leading-relaxed text-brand-muted'>
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Closing panel */}
          <div className='mt-10 rounded-2xl bg-brand-green p-6 text-center text-white sm:p-8'>
            <h2 className='text-white'>Still have a question?</h2>
            <p className='mx-auto mt-2 max-w-xl text-sm text-white/85'>
              Send us a message and we will get back to you — or take the quiz and see the grants
              you qualify for right now.
            </p>
            <div className='mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <Button variant='sun' asChild>
                <Link href='/contact'>Contact us</Link>
              </Button>
              <Button
                variant='outline'
                className='border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white'
                asChild
              >
                <Link href='/quiz'>Find my grants →</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
