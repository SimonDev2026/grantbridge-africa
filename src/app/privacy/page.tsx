'use client';

import { useEffect, useState } from 'react';

import { CookieSettingsButton } from '@/components/cookie-settings-button';
import { BRAND } from '@/config/brand';

const SECTIONS = [
  { id: 'who-we-are', title: 'Who we are' },
  { id: 'what-we-collect', title: 'What data we collect' },
  { id: 'how-we-use-it', title: 'How we use your data' },
  { id: 'ai-matching', title: 'AI matching and drafting' },
  { id: 'who-we-share-with', title: 'Who we share data with' },
  { id: 'international-transfers', title: 'International transfers' },
  { id: 'retention', title: 'Data retention' },
  { id: 'cookies', title: 'Cookies' },
  { id: 'your-rights', title: 'Your rights' },
  { id: 'security', title: 'Security' },
  { id: 'third-party-links', title: 'Third-party links' },
  { id: 'under-18s', title: 'Under-18s' },
  { id: 'changes', title: 'Changes to this policy' },
  { id: 'contact', title: 'Contact us' },
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
    <nav aria-label='Privacy policy contents' className='flex flex-col gap-0.5'>
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

export default function PrivacyPage() {
  const active = useScrollSpy(SECTIONS.map((s) => s.id));

  return (
    <div className='mx-auto max-w-6xl px-4 py-10 lg:py-14'>
      <header className='max-w-3xl'>
        <p className='text-sm font-semibold uppercase tracking-wide text-brand-green'>Legal</p>
        <h1 className='mt-2'>Privacy Policy</h1>
        <p className='mt-3 text-brand-muted'>
          How {BRAND.name} collects, uses, shares and protects your information — in plain
          language, under the laws that apply to you.
        </p>
        <p className='mt-2 text-sm text-brand-muted'>Last updated: 11 November 2026</p>
      </header>

      {/* Mobile table of contents */}
      <nav
        aria-label='Privacy policy contents'
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
          <section id='who-we-are' className='scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Who we are</h2>
            <p className='mt-3 leading-relaxed'>
              {BRAND.name} (“we”, “us”, “our”) helps organisations in Africa find grants they
              qualify for and draft applications. We are the data controller for the account and
              profile data described in this policy — that means we decide how and why it is used.
              Contact: info@grantbridgeafrica.com.
            </p>
          </section>

          <section id='what-we-collect' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>What data we collect</h2>
            <p className='mt-3 leading-relaxed'>
              We only collect what we need to run the service. We collect:
            </p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                <strong className='font-semibold text-brand-ink'>Account details:</strong> your
                email address (and your name, if you give it), and the password you set — stored
                securely, never in plain text.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Organisation details:</strong>{' '}
                what you enter in the quiz and your profile — organisation name, country, sector,
                beneficiaries, budget, and a short description of your work.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Documents you upload:</strong>{' '}
                registration certificates, constitutions, reports, budgets, support letters and
                photos.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Your activity in the
                service:</strong> which grants you save and track, deadlines you follow, drafts
                you generate, and the service orders you place.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Messages to us:</strong> what
                you write when you contact support or reply to our emails.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Usage and email data:</strong>{' '}
                which pages you visit and whether you open our emails, so we can see what is
                useful and fix what is broken.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Advertising data (only if you
                accept cookies):</strong> Meta Pixel and Conversions API events such as page
                views, quiz completion and purchases, with a shared event ID so Meta can
                de-duplicate them.
              </li>
            </ul>
            <p className='mt-3 leading-relaxed'>
              We do not ask for your card details, your funder-portal passwords, or any
              government identity number — and you should never send those to us.
            </p>
          </section>

          <section id='how-we-use-it' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>How we use your data</h2>
            <p className='mt-3 leading-relaxed'>We use your data to:</p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                Match you with grants and draft applications — the service you asked for.
              </li>
              <li>Run your account, your tracker and your deadline notifications.</li>
              <li>
                Send you the alerts and weekly digest you opted into (by email and WhatsApp). You
                can stop these at any time.
              </li>
              <li>Process payments and manage your subscription through Stripe.</li>
              <li>
                Answer your support questions and fulfil Expert Review and Done-for-you orders.
              </li>
              <li>
                Measure our advertising — only with your cookie consent — and improve the service
                from aggregated, anonymised usage.
              </li>
              <li>Keep the service secure and prevent abuse.</li>
            </ul>
            <p className='mt-3 leading-relaxed'>
              We never sell your personal data. We never use your data for a purpose you did not
              agree to.
            </p>
          </section>

          <section id='ai-matching' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>AI matching and drafting</h2>
            <p className='mt-3 leading-relaxed'>
              Matching compares your profile — country, sector, budget, beneficiaries — against
              each funder’s eligibility rules, so you only see grants you can actually apply for.
              When you ask for a draft, the AI reads your profile and the documents you uploaded
              for that grant and writes a first draft of every document the funder asks for.
              Anything missing is shown as a highlighted placeholder, never invented.
            </p>
            <p className='mt-3 leading-relaxed'>
              <strong className='font-semibold text-brand-ink'>Your content is not used to train
              AI models.</strong> Your profile, documents and drafts are sent to our AI providers
              only to produce your match or your draft, and are not used to train models. We do
              not opt you into any model-training programme. If we ever introduce one, it will be
              opt-in only, with clear notice first — your content will never be used for training
              by default.
            </p>
          </section>

          <section id='who-we-share-with' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Who we share data with</h2>
            <p className='mt-3 leading-relaxed'>
              We share data only with the providers that run the service, and only what each one
              needs to do its job:
            </p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                <strong className='font-semibold text-brand-ink'>Supabase</strong> — stores your
                account, profile and documents (Postgres database and private storage). Your
                records are protected by Row Level Security, so you can only see your own data,
                and documents live in a private bucket.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Stripe</strong> — processes
                payments and subscriptions. Your card details go directly to Stripe; we never see
                or store them, and we only receive payment confirmations and subscription status.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Resend</strong> — sends our
                emails (account emails, deadline alerts, the weekly digest). Resend receives your
                email address and the content of the email.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Cloudflare Workers AI and
                Groq</strong> — our AI providers. Your profile and documents are sent to them
                only when you ask for a match or a draft, and only to produce that result. They do
                not use your content to train models (see “AI matching and drafting” above).
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Meta (Pixel and Conversions
                API)</strong> — only if you accept cookies. Meta receives advertising events such
                as page views, quiz completion and purchases, so we can measure our ads. Declining
                cookies stops this entirely and does not affect the service.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Aggregated analytics</strong> —
                we look at overall, anonymised usage (for example, which pages are visited most)
                to improve the site. This does not identify you.
              </li>
            </ul>
            <p className='mt-3 leading-relaxed'>
              We do not share your data with funders, advertisers or anyone else, except where the
              law requires it — for example, a valid legal request — in which case we will tell
              you first unless the law forbids it.
            </p>
          </section>

          <section id='international-transfers' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>International transfers</h2>
            <p className='mt-3 leading-relaxed'>
              Our providers (Supabase, Stripe, Resend, Cloudflare and Groq) host data outside
              your country, so your data may be transferred internationally when you use the
              service. We rely on the safeguards of those providers for those transfers, including
              their contractual protections and security measures. By using the service you
              understand that your data will be processed in the countries where our providers
              operate.
            </p>
          </section>

          <section id='retention' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Data retention</h2>
            <p className='mt-3 leading-relaxed'>
              We keep your data only as long as we need it:
            </p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                <strong className='font-semibold text-brand-ink'>Account, profile, documents and
                drafts:</strong> while your account is active. If you delete your account, we
                delete your profile, documents and drafts.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Payment records:</strong> kept
                for as long as the law requires us to keep financial records — these contain no
                card details.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Emails and support
                messages:</strong> kept while your account is active, and for a short period
                afterwards so we can answer follow-up questions.
              </li>
            </ul>
          </section>

          <section id='cookies' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Cookies</h2>
            <p className='mt-3 leading-relaxed'>
              We use a small number of cookies and similar storage:
            </p>
            <ul className='mt-3 flex list-disc flex-col gap-2 pl-5 leading-relaxed'>
              <li>
                <strong className='font-semibold text-brand-ink'>Strictly necessary:</strong>{' '}
                keeping you signed in and remembering your cookie choice. The service cannot work
                without these.
              </li>
              <li>
                <strong className='font-semibold text-brand-ink'>Advertising (Meta Pixel):</strong>{' '}
                loaded only after you accept. It measures our ads and is never loaded if you
                decline.
              </li>
            </ul>
            <p className='mt-3 leading-relaxed'>
              You can change your choice at any time from “Cookie settings” in the footer, or from
              the button at the end of this page. Declining cookies does not affect the service.
              You can also clear cookies in your browser settings.
            </p>
          </section>

          <section id='your-rights' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Your rights</h2>
            <p className='mt-3 leading-relaxed'>
              Wherever you are in Africa or Europe, you have the same core rights with us: to see
              the personal data we hold about you, to correct it, to ask us to delete it, to
              withdraw consent for marketing, cookies and WhatsApp alerts at any time, to ask for
              a copy of your data in a portable format, and to object to processing. We do not
              sell personal data.
            </p>
            <p className='mt-3 leading-relaxed'>
              Under Nigeria’s NDPA 2023 we process your data on the basis of your consent
              (marketing, cookies) and the contract to provide the service (matching, drafts,
              payments). Under Kenya’s Data Protection Act and South Africa’s POPIA we process it
              on the same bases, and we take reasonable steps to keep it secure and accurate.
              Under the GDPR, if you are in the EU/UK, you also have the right to data portability
              and to complain to your supervisory authority.
            </p>
            <p className='mt-3 leading-relaxed'>
              To exercise any right, email info@grantbridgeafrica.com — we reply within 30 days.
              If you believe we have not handled your request properly, you can also complain to
              your local data-protection authority.
            </p>
          </section>

          <section id='security' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Security</h2>
            <p className='mt-3 leading-relaxed'>
              We protect your data with the safeguards our providers give us: your records are
              protected by Row Level Security in Supabase, so only you can see your own data;
              documents live in a private storage bucket, not a public folder; and payments are
              handled by Stripe, so card details never touch our systems. Access to our systems is
              limited to what is needed to run the service. No system is perfectly secure, so
              please also keep your own password safe and do not share it — and never share your
              funder-portal passwords with us or anyone else.
            </p>
          </section>

          <section id='third-party-links' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Third-party links</h2>
            <p className='mt-3 leading-relaxed'>
              The service links out to funders’ own websites, to payment pages run by Stripe, and
              to our WhatsApp channel. Those sites have their own privacy policies, and we are not
              responsible for how they handle your data once you leave our site. Always check a
              funder’s own privacy notice before you create an account or submit an application
              on their portal.
            </p>
          </section>

          <section id='under-18s' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Under-18s</h2>
            <p className='mt-3 leading-relaxed'>
              This service is for organisations, run by adults. If you are under 18, please ask
              an adult in your organisation to create the account. We do not knowingly collect
              personal data from children; if we learn that we have, we will delete it.
            </p>
          </section>

          <section id='changes' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Changes to this policy</h2>
            <p className='mt-3 leading-relaxed'>
              If this policy changes in a way that affects you, we will tell you by email before
              the change takes effect. The “Last updated” date at the top of this page shows when
              it last changed.
            </p>
          </section>

          <section id='contact' className='mt-10 scroll-mt-6'>
            <h2 className='text-2xl lg:text-2xl'>Contact us</h2>
            <p className='mt-3 leading-relaxed'>
              Questions about this policy, or about your data: email{' '}
              <a
                href='mailto:info@grantbridgeafrica.com'
                className='font-medium text-brand-green underline'
              >
                info@grantbridgeafrica.com
              </a>
              . We reply within 30 days.
            </p>
          </section>

          <div className='mt-12 rounded-2xl border border-brand-line bg-white p-5'>
            <h3 className='text-lg'>Cookie settings</h3>
            <p className='mt-1 text-sm leading-relaxed'>
              Change your cookie choice at any time — this clears your saved choice and shows the
              consent banner again.
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
