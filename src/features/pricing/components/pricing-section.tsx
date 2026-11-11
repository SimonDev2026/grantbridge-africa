import { BRAND } from '@/config/brand';
import { PlanCard } from '@/features/pricing/components/plan-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

import { createCheckoutAction } from '../actions/create-checkout-action';

/**
 * Pricing: subscriptions + one-time products, all in USD.
 * Products come from Stripe via the products table (synced by the webhook);
 * until Step 4 lands, the cards render from the brand config and send
 * visitors to sign up for the free account first.
 */
export async function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  const products = await getProducts();

  const pricesFor = (name: string) =>
    products.find((p) => (p.name ?? '').toLowerCase() === name.toLowerCase())?.prices ?? [];

  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  return (
    <section className='py-8 lg:py-16'>
      <div className='m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4'>
        <div className='text-center'>
          <HeadingLevel className='mx-auto max-w-3xl'>Pricing in US dollars</HeadingLevel>
          <p className='mt-3 text-lg text-brand-muted'>
            One price in every country. Start free, pay only when you’re ready to apply. Secure
            checkout by Stripe: cards, Apple Pay, Google Pay.
          </p>
        </div>

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

        <div className='w-full'>
          <h3 className='text-center'>Pay per application (no subscription)</h3>
          <div className='mt-4 flex flex-col items-stretch justify-center gap-4 lg:flex-row'>
            {BRAND.oneTime.map((item) => (
              <PlanCard
                key={item.key}
                plan={item}
                prices={pricesFor(item.name)}
                createCheckoutAction={createCheckoutAction}
              />
            ))}
          </div>
        </div>

        <div className='max-w-2xl text-center text-sm text-brand-muted'>
          <p>
            We never take a percentage of your grant. Funders usually forbid paying commissions
            from grant money.
          </p>
          <p className='mt-2'>
            Charged in US dollars in every country. Visa, Mastercard, Verve-Visa dual cards,
            dollar cards, Apple Pay and Google Pay.
          </p>
        </div>
      </div>
    </section>
  );
}
