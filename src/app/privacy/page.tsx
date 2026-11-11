import { BRAND } from '@/config/brand';

export default function PrivacyPage() {
  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>Privacy Policy</h1>
      <p className='mt-2 text-sm text-brand-muted'>Last updated: 11 November 2026</p>

      <div className='mt-6 flex flex-col gap-6 text-brand-muted'>
        <section>
          <h2>Who we are</h2>
          <p className='mt-2'>
            {BRAND.name} (“we”, “us”) helps organisations in Africa find grants they qualify for
            and draft applications. Contact: {BRAND.contact.email}.
          </p>
        </section>

        <section>
          <h2>What we collect</h2>
          <ul className='mt-2 flex list-disc flex-col gap-1 pl-5'>
            <li>Account details: your email address (and name, if you give it).</li>
            <li>Organisation details you enter in the quiz and your profile: organisation name, country, sector, beneficiaries, budget, and a short description.</li>
            <li>Documents you upload: registration certificates, constitutions, reports, budgets, support letters and photos.</li>
            <li>Usage data: which grants you save and track, and whether you open our emails.</li>
            <li>Advertising data (only if you accept cookies): Meta Pixel and Conversions API events such as page views, quiz completion and purchases, with a shared event ID so Meta can de-duplicate them.</li>
          </ul>
        </section>

        <section>
          <h2>Why we collect it</h2>
          <ul className='mt-2 flex list-disc flex-col gap-1 pl-5'>
            <li>To match you with grants and draft applications — the service you asked for.</li>
            <li>To send you the alerts and weekly digest you opted into (email and WhatsApp).</li>
            <li>To process payments through Stripe (we never see or store your card details).</li>
            <li>To measure our advertising, only with your cookie consent.</li>
          </ul>
        </section>

        <section>
          <h2>Where your data lives</h2>
          <p className='mt-2'>
            Your account, profile and documents are stored with Supabase (Postgres + Storage) and
            are protected by Row Level Security: you can only see your own records, and documents
            live in a private bucket. Payments are processed by Stripe. Emails are sent through
            Resend. AI drafting runs on Cloudflare Workers AI or Groq (our fallback); your
            documents are sent to the AI provider only to draft your application, and are not used
            to train models.
          </p>
        </section>

        <section>
          <h2>Your rights — NDPA 2023 (Nigeria), Kenya DPA, POPIA (South Africa), GDPR (EU/UK)</h2>
          <p className='mt-2'>
            Wherever you are in Africa or Europe, you have the same core rights with us: to see
            the personal data we hold about you, to correct it, to ask us to delete it, to withdraw
            consent for marketing and WhatsApp alerts at any time, and to object to processing. We
            act as the data controller for your account and profile data. We do not sell personal
            data. We keep your data only as long as your account is active, plus what the law
            requires for payment records.
          </p>
          <p className='mt-2'>
            Under Nigeria’s NDPA 2023 we process your data on the basis of your consent (marketing,
            cookies) and the contract to provide the service (matching, drafts, payments). Under
            Kenya’s Data Protection Act and South Africa’s POPIA we process it on the same bases,
            and we take reasonable steps to keep it secure and accurate. Under the GDPR, if you are
            in the EU/UK, you also have the right to data portability and to complain to your
            supervisory authority. Because our infrastructure is outside your country, your data may
            be transferred internationally; we rely on the safeguards of our providers (Supabase,
            Stripe, Resend, Cloudflare, Groq) for those transfers.
          </p>
          <p className='mt-2'>
            To exercise any right, email {BRAND.contact.email} — we reply within 30 days.
          </p>
        </section>

        <section>
          <h2>Cookies</h2>
          <p className='mt-2'>
            We ask for your consent before loading the Meta Pixel. You can change your choice any
            time from “Cookie settings” in the footer. Declining cookies does not affect the service.
          </p>
        </section>

        <section>
          <h2>Children</h2>
          <p className='mt-2'>
            This service is for organisations, not children. If you are under 18, please ask an
            adult in your organisation to create the account.
          </p>
        </section>

        <section>
          <h2>Changes</h2>
          <p className='mt-2'>
            If this policy changes in a way that affects you, we will tell you by email before the
            change takes effect.
          </p>
        </section>
      </div>
    </div>
  );
}
