'use client';

import { useEffect, useState } from 'react';

import { CookieSettingsButton } from '@/components/cookie-settings-button';
import { BRAND } from '@/config/brand';

const SECTIONS = [
  { id: 'what-we-do', title: 'What GrantBridge does' },
  { id: 'who-can-use', title: 'Who can use GrantBridge' },
  { id: 'your-account', title: 'Your account and responsibilities' },
  { id: 'plans-billing', title: 'Plans, billing and taxes' },
  { id: 'cancellation', title: 'Cancellation and refunds' },
  { id: 'plan-limits', title: 'Plan limits' },
  { id: 'service-orders', title: 'Service orders' },
  { id: 'ai-drafts', title: 'AI drafts and the informational-tool disclaimer' },
  { id: 'prohibited', title: 'Prohibited conduct' },
  { id: 'ip-content', title: 'Intellectual property and your content' },
  { id: 'ai-disclaimer', title: 'AI disclaimer' },
  { id: 'liability', title: 'Liability limits' },
  { id: 'indemnity', title: 'Indemnity' },
  { id: 'changes', title: 'Changes to these terms' },
  { id: 'contact', title: 'Contact' },
] as const;

function useScrollSpy(ids: readonly string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-15% 0px -70% 0px' },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function TableOfContents({ active }: { active: string }) {
  return (
    <nav aria-label='Terms of service contents' className='flex flex-col gap-0.5'>
      {SECTIONS.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          aria-current={active === s.id ? 'true' : undefined}
          className={
            active === s.id
              ? 'rounded-r-lg border-l-[3px] border-brand-green bg-brand-greenSoft px-3 py-2 text-sm font-semibold text-brand-green'
              : 'rounded-r-lg border-l-[3px] border-transparent px-3 py-2 text-sm text-brand-muted hover:bg-white hover:text-brand-ink'
          }
        >
          {s.title}
        </a>
      ))}
    </nav>
  );
}

export default function TermsPage() {
  const active = useScrollSpy(SECTIONS.map((s) => s.id));

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 lg:py-14'>
      <header className='max-w-3xl'>
        <p className='text-sm font-semibold uppercase tracking-wide text-brand-green'>Legal</p>
        <h1 className='mt-2'>Terms of Service</h1>
        <p className='mt-3 text-brand-muted'>
          The rules for using {BRAND.name} — what we provide, what you are responsible for, and
          what happens if things go wrong.
        </p>
        <p className='mt-2 text-sm text-brand-muted'>Last updated: 11 November 2026</p>
      </header>

      {/* Mobile table of contents */}
      <nav
        aria-label='Terms of service contents'
        className='mt-8 flex gap-2 overflow-x-auto pb-2 lg:hidden'
      >
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className='whitespace-nowrap rounded-full border border-brand-line bg-white px-3 py-1.5 text-xs font-medium text-brand-muted hover:border-brand-green hover:text-brand-green'
          >
            {s.title}
          </a>
        ))}
      </nav>

      <div className='mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[260px_minmax(0,1fr)]'>
        {/* Sticky table of contents */}
        <aside className='hidden lg:block'>
          <div className='sticky top-6'>
            <p className='mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-brand-muted'>
              On this page
            </p>
            <TableOfContents active={active} />
          </div>
        </aside>

        {/* Document */}
        <article className='min-w-0 max-w-3xl text-brand-muted'>
          <section id='what-we-do' className='scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>What {BRAND.name} does</h2>
            <p className='mt-3 leading-relaxed'>
              {BRAND.name} is a grant-discovery and application-drafting tool for African
              organisations. It has four parts:
            </p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                <strong className='font-semibold text-brand-ink'>Grant Discovery:</strong> a
                searchable catalogue of grants from global funders that accept African applicants
                and Africa-focused donors.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>AI matching:</strong> we check
                each grant’s eligibility rules against your organisation’s country, sector,
                budget and beneficiaries, and show you the grants you may qualify for.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Application Workspace:</strong>{' '}
                track the grants you are applying for, save documents, and generate and edit AI
                drafts of every document the funder asks for, then export them as Word or PDF.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Deadline notifications:</strong>{' '}
                alerts and a weekly digest so you do not miss a closing date.
              </li>
            </ul>
            <p className='mt-3 leading-relaxed'>
              We do not award grants, guarantee funding, or submit applications on your behalf.
              Every application is submitted by you, on the funder’s own portal. Grant decisions
              are made by funders — never by us.
            </p>
          </section>

          <section id='who-can-use' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Who can use {BRAND.name}</h2>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                You must be <strong className='font-semibold text-brand-ink'>18 or older</strong>{' '}
                to create an account. The service is for organisations, run by adults; if you are
                under 18, ask an adult in your organisation to create the account.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>One account per person.</strong>{' '}
                Do not create multiple accounts for yourself, and do not create an account for
                someone else.
              </li>
              <li>
                You must give true information about yourself and your organisation, and keep it
                up to date.
              </li>
            </ul>
          </section>

          <section id='your-account' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Your account and responsibilities</h2>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                <strong className='font-semibold text-brand-ink'>Keep your credentials
                safe.</strong> Do not share your password or your account with anyone else. You
                are responsible for everything done through your account.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>One organisation per account,
                unless your plan allows more.</strong> Pro plans allow up to 10 organisations.
                Do not share your account with other organisations.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Never share your funder-portal
                passwords</strong> with us or anyone else. We will never ask for them.
              </li>
              <li>
                Give true information about your organisation. False information can get your
                application rejected and your account closed.
              </li>
              <li>
                Review every AI draft before you submit it. The writer never invents facts —
                missing facts appear as highlighted [placeholders] — but you are responsible for
                the final application.
              </li>
              <li>
                Tell us promptly if you believe your account has been used without your
                permission.
              </li>
            </ul>
          </section>

          <section id='plans-billing' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Plans, billing and taxes</h2>
            <p className='mt-3 leading-relaxed'>
              All prices are in US dollars, charged through Stripe. Subscriptions are billed
              monthly or yearly, at the price shown on the pricing page when you subscribe:
              Seeker $19 a month or $190 a year, Writer $49 a month or $490 a year, Pro $149 a
              month or $1,490 a year. Explorer is free.
            </p>
            <p className='mt-3 leading-relaxed'>
              Prices are shown excluding taxes. Where tax applies, it is calculated and added at
              checkout. Your card details go directly to Stripe — we never see or store them.
            </p>
            <p className='mt-3 leading-relaxed'>
              One-time purchases are charged once, for one grant each: Single Application Draft
              $29, Expert Review $149, Done-for-you Application $399. We never take a percentage
              of any grant you win.
            </p>
          </section>

          <section id='cancellation' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Cancellation and refunds</h2>
            <p className='mt-3 leading-relaxed'>
              Subscriptions renew automatically until you cancel. You can cancel at any time from
              your account; you keep access until the end of the paid period, and the subscription
              does not renew after that. There is no prorated refund for the unused part of a
              paid period.
            </p>
            <p className='mt-3 leading-relaxed'>
              If a service order (Expert Review or Done-for-you) has not started, contact us
              within 7 days of payment for a refund. Once work has started, refunds are at our
              discretion. Draft credits do not expire while your account is active.
            </p>
          </section>

          <section id='plan-limits' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Plan limits</h2>
            <p className='mt-3 leading-relaxed'>
              AI application drafts are included per calendar month, by plan:
            </p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                <strong className='font-semibold text-brand-ink'>Explorer (free):</strong> no AI
                drafts included — take the quiz, see your top 3 matches, and get the weekly email
                of new grants.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Seeker:</strong> 1 AI
                application draft a month.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Writer:</strong> 10 AI
                application drafts a month.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Pro:</strong> unlimited AI
                drafts, and up to 10 organisations on one account.
              </li>
            </ul>
            <p className='mt-3 leading-relaxed'>
              Unused draft allowances do not roll over to the next month. If you run out, extra
              drafts cost $29 each via a Single Application Draft credit. Fair use applies: do not
              use the service to generate drafts at industrial scale or to resell them.
            </p>
          </section>

          <section id='service-orders' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Service orders (Expert Review, Done-for-you)</h2>
            <p className='mt-3 leading-relaxed'>
              After payment you complete an intake form. We draft or review the application with
              you, deliver the documents, and guide you through submission on the funder’s
              portal — you press submit. One revision is included. After delivery you can mark
              the order complete; the order closes automatically when you do.
            </p>
          </section>

          <section id='ai-drafts' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>
              AI drafts and the informational-tool disclaimer
            </h2>
            <p className='mt-3 leading-relaxed'>
              {BRAND.name} is an informational tool. Grant listings, eligibility checks, matches
              and drafts are based on the information funders publish and the details you give us,
              and both can be out of date or incomplete. <strong className='font-semibold text-brand-ink'>Always
              verify everything with the funder</strong> — the eligibility rules, the deadline, the
              required documents and the submission instructions on the funder’s official page or
              portal — before you apply.
            </p>
            <p className='mt-3 leading-relaxed'>
              AI drafts are starting points, not submissions. They are generated from your profile
              and the documents you upload, and they may contain errors, gaps or wording that does
              not fit your organisation. You must read, correct and complete every draft before
              you submit it. You — not GrantBridge — are responsible for what you submit to a
              funder.
            </p>
          </section>

          <section id='prohibited' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Prohibited conduct</h2>
            <p className='mt-3 leading-relaxed'>Do not use the service to:</p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>Misrepresent your organisation, its registration, its finances or its work.</li>
              <li>Apply for grants you are not eligible for, or submit false information to a funder.</li>
              <li>Resell our drafts, accounts or plans, or share a paid account with other organisations beyond your plan’s limits.</li>
              <li>Copy, scrape or republish our grant database or site content at scale.</li>
              <li>Upload material you do not have the right to share, or that is unlawful, defamatory or infringing.</li>
              <li>Interfere with the service, probe it for vulnerabilities, or try to access other users’ data.</li>
              <li>Use the service for anything unlawful.</li>
            </ul>
            <p className='mt-3 leading-relaxed'>
              We may suspend or close accounts that abuse the service or break these terms, with
              or without notice where the abuse is serious or ongoing.
            </p>
          </section>

          <section id='ip-content' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Intellectual property and your content</h2>
            <p className='mt-3 leading-relaxed'>
              The {BRAND.name} site, brand, grant database and software belong to us (or our
              licensors) and are protected by intellectual property law. You may use the service
              for your own organisation’s grant applications, but you may not copy, resell or
              republish our content or database.
            </p>
            <p className='mt-3 leading-relaxed'>
              You keep ownership of everything you upload or enter — your profile, documents and
              drafts. By using the service you give us a licence to use that content only to run
              the service for you: to match you with grants, to generate your drafts, to store and
              display your work in your account, and to provide support. That licence ends when
              you delete the content or your account, except for payment records we must keep by
              law. We do not use your content to train AI models (see our Privacy Policy).
            </p>
          </section>

          <section id='ai-disclaimer' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>AI disclaimer</h2>
            <p className='mt-3 leading-relaxed'>
              AI-generated content can be wrong. Drafts may misstate facts, miss a funder’s
              requirement, use outdated information, or produce wording that does not reflect your
              organisation. We do not guarantee that a draft will win a grant, that it meets a
              funder’s requirements, or that any match is eligible — eligibility is decided by the
              funder, on the funder’s own terms. Always check the funder’s official guidance and
              use your own judgement before submitting anything.
            </p>
          </section>

          <section id='liability' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Liability limits</h2>
            <p className='mt-3 leading-relaxed'>
              The service is provided “as is” and “as available”, without warranties of any kind.
              We are not liable for a grant you do not win, a deadline you miss, a funder changing
              or withdrawing its call, or a funder rejecting your application for any reason. To
              the maximum extent allowed by law, our total liability for any claim relating to the
              service is limited to the amount you paid us in the 12 months before the claim.
              Nothing in these terms limits liability that cannot be limited by law.
            </p>
          </section>

          <section id='indemnity' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Indemnity</h2>
            <p className='mt-3 leading-relaxed'>
              You agree to indemnify and hold us harmless from claims, losses and costs (including
              reasonable legal costs) arising from your use of the service in breach of these
              terms, from information you submit that is false or misleading, or from content you
              upload that infringes someone else’s rights.
            </p>
          </section>

          <section id='changes' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Changes to these terms</h2>
            <p className='mt-3 leading-relaxed'>
              We may update these terms from time to time. If a change affects you, we will tell
              you by email before it takes effect. Continuing to use the service after the change
              takes effect means you accept the new terms.
            </p>
          </section>

          <section id='contact' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Contact</h2>
            <p className='mt-3 leading-relaxed'>
              Questions about these terms:{' '}
              <a
                href='mailto:info@grantbridgeafrica.com'
                className='font-medium text-brand-green underline'
              >
                info@grantbridgeafrica.com
              </a>
              .
            </p>
          </section>

          <div className='mt-12 rounded-2xl border border-brand-line bg-white p-5'>
            <h3 className='text-lg'>Cookie settings</h3>
            <p className='mt-1 text-sm leading-relaxed'>
              Change your cookie choice at any time — this clears your saved choice and shows the
              consent banner again. See our Privacy Policy for what cookies we use.
            </p>
            <div className='mt-3 text-sm font-medium text-brand-green'>
              <CookieSettingsButton />
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
