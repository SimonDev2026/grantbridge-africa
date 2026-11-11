import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { createCheckoutAction } from '@/features/pricing/actions/create-checkout-action';
import { PlanCard } from '@/features/pricing/components/plan-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

export const metadata = {
  title: 'Pricing — GrantBridge Africa',
  description:
    'Simple pricing in US dollars. Start free, pay only when you’re ready to apply — find the grants your African organisation actually qualifies for.',
};

/**
 * Pricing page: headline + promise, the 4 plan cards, one-time services,
 * a quiz nudge, a purchase-recovery link, and a closing call to action.
 * Plan cards and checkout are unchanged — cards render from the brand config
 * and open Stripe Checkout via the existing server action.
 */
export default async function PricingPage() {
  const products = await getProducts();

  const pricesFor = (name: string) =>
    products.find((p) => (p.name ?? '').toLowerCase() === name.toLowerCase())?.prices ?? [];

  return (
    <div className='mx-auto flex max-w-[1200px] flex-col gap-12 px-4 py-8 lg:py-16'>
      {/* Headline + promise */}
      <header className='text-center'>
        <h1 className='mx-auto max-w-3xl'>Simple pricing, in US dollars</h1>
        <p className='mx-auto mt-3 max-w-2xl text-lg text-brand-muted'>
          One price in every country. Start free, pay only when you’re ready to apply. We search
          global funders that accept African applicants, check every eligibility rule for your
          country, and draft the application.
        </p>
      </header>

      {/* The 4 plan cards (monthly/yearly toggle lives on each card) */}
      <section aria-label='Subscription plans'>
        <div className='flex w-full flex-col items-stretch justify-center gap-4 lg:flex-row'>
          {BRAND.plans.map((plan) => (
            <PlanCard
              key={plan.key}
              plan={plan}
              prices={pricesFor(plan.name)}
              createCheckoutAction={createCheckoutAction}
            />
          ))}
        </div>
      </section>

      {/* One-time services */}
      <section aria-label='One-time services'>
        <h2 className='text-center'>Pay per application (no subscription)</h2>
        <div className='mt-4 flex w-full flex-col items-stretch justify-center gap-4 lg:flex-row'>
          {BRAND.oneTime.map((item) => (
            <PlanCard
              key={item.key}
              plan={item}
              prices={pricesFor(item.name)}
              createCheckoutAction={createCheckoutAction}
            />
          ))}
        </div>
        <div className='mx-auto mt-6 max-w-2xl text-center text-sm text-brand-muted'>
          <p>
            We never take a percentage of your grant. Funders usually forbid paying commissions
            from grant money.
          </p>
          <p className='mt-2'>
            Charged in US dollars in every country. Visa, Mastercard, Verve-Visa dual cards,
            dollar cards, Apple Pay and Google Pay. Secure checkout by Stripe.
          </p>
        </div>
      </section>

      {/* Not sure which plan? → quiz */}
      <section
        aria-label='Not sure which plan?'
        className='rounded-2xl border border-brand-line bg-brand-greenSoft p-6 text-center lg:p-8'
      >
        <h2>Not sure which plan?</h2>
        <p className='mx-auto mt-2 max-w-xl text-brand-muted'>
          Take the quiz first. We’ll show you the grants your organisation qualifies for — then
          pick the plan that fits how much help you want writing them.
        </p>
        <Button variant='sun' size='lg' className='mt-5' asChild>
          <Link href='/quiz'>Take the quiz</Link>
        </Button>
      </section>

      {/* Recover your purchase? */}
      <p className='text-center text-sm text-brand-muted'>
        Already paid but can’t get in?{' '}
        <Link href='/recover' className='font-semibold text-brand-green hover:underline'>
          Recover your purchase
        </Link>
      </p>

      {/* Closing panel */}
      <section
        aria-label='Find grants faster than ever'
        className='rounded-2xl bg-brand-green p-8 text-center text-white lg:p-12'
      >
        <h2 className='text-white'>Find grants faster than ever</h2>
        <p className='mx-auto mt-2 max-w-xl text-white/85'>
          Start with the quiz — see the grants you actually qualify for, in minutes.
        </p>
        <Button variant='sun' size='lg' className='mt-6' asChild>
          <Link href='/quiz'>Find my grants</Link>
        </Button>
      </section>
    </div>
  );
}
