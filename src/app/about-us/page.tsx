import { BRAND } from '@/config/brand';

export default function AboutPage() {
  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>About {BRAND.name}</h1>
      <p className='mt-4 text-lg text-brand-muted'>{BRAND.description}</p>
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
    </div>
  );
}
