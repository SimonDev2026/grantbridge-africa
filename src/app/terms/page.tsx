import { BRAND } from '@/config/brand';

export default function TermsPage() {
  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>Terms of Service</h1>
      <p className='mt-2 text-sm text-brand-muted'>Last updated: 11 November 2026</p>

      <div className='mt-6 flex flex-col gap-6 text-brand-muted'>
        <section>
          <h2>What {BRAND.name} does</h2>
          <p className='mt-2'>
            We find grants you may qualify for, check eligibility, and draft application documents.
            We do not award grants, guarantee funding, or submit applications on your behalf. Every
            application is submitted by you, on the funder’s own portal.
          </p>
        </section>

        <section>
          <h2>Your responsibilities</h2>
          <ul className='mt-2 flex list-disc flex-col gap-1 pl-5'>
            <li>Give true information about your organisation. False information can get your application rejected and your account closed.</li>
            <li>Review every AI draft before you submit it. The writer never invents facts — missing facts appear as highlighted [placeholders] — but you are responsible for the final application.</li>
            <li>Never share your funder-portal password with us or anyone else. We will never ask for it.</li>
            <li>Keep your account credentials safe and do not share your account with other organisations (Pro plans allow up to 10 organisations).</li>
          </ul>
        </section>

        <section>
          <h2>Plans, payments and refunds</h2>
          <p className='mt-2'>
            All prices are in US dollars, charged through Stripe. Subscriptions renew until you
            cancel; you keep access until the end of the paid period. One-time purchases (Single
            Draft $29, Expert Review $149, Done-for-you $399) are for one grant each. Draft credits
            do not expire while your account is active. If a service order has not started, contact
            us within 7 days of payment for a refund; once work has started, refunds are at our
            discretion. We never take a percentage of any grant you win.
          </p>
        </section>

        <section>
          <h2>AI drafts</h2>
          <p className='mt-2'>
            Drafts are generated from your profile and the documents you upload. We do not
            guarantee that a draft will win a grant, or that it meets a funder’s requirements — you
            must check the funder’s official guidance. Draft allowances are: Seeker 1 per month,
            Writer 10 per month, Pro unlimited. Unused allowances do not roll over. Extra drafts
            cost $29 each via a draft credit.
          </p>
        </section>

        <section>
          <h2>Service orders (Expert Review, Done-for-you)</h2>
          <p className='mt-2'>
            After payment you complete an intake form. We draft or review the application with you,
            deliver the documents, and guide you through submission on the funder’s portal — you
            press submit. One revision is included. After delivery you can mark the order complete;
            the order closes automatically when you do.
          </p>
        </section>

        <section>
          <h2>Acceptable use</h2>
          <p className='mt-2'>
            Do not use the service to misrepresent your organisation, to apply for grants you are
            not eligible for, or to resell our drafts or accounts. We may suspend accounts that
            abuse the service or break these terms.
          </p>
        </section>

        <section>
          <h2>Liability</h2>
          <p className='mt-2'>
            The service is provided “as is”. We are not liable for a grant you do not win, a
            deadline you miss, or a funder changing its call. Our total liability for any claim is
            limited to the amount you paid us in the 12 months before the claim.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p className='mt-2'>
            Questions about these terms: {BRAND.contact.email}.
          </p>
        </section>
      </div>
    </div>
  );
}
