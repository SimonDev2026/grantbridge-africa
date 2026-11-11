'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IoCheckmark } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { Price } from '@/features/pricing/types';
import { cn } from '@/utils/cn';

type PlanDef = (typeof BRAND.plans)[number] | (typeof BRAND.oneTime)[number];

function isSubscription(plan: PlanDef): plan is (typeof BRAND.plans)[number] {
  return 'monthlyUsd' in plan;
}

/**
 * One pricing card. When the matching Stripe price exists in the database
 * (Step 4 done), the button opens Stripe Checkout; until then it sends the
 * visitor to sign up for the free account first.
 */
export function PlanCard({
  plan,
  prices,
  createCheckoutAction,
}: {
  plan: PlanDef;
  prices?: Price[];
  createCheckoutAction?: (args: { price: Price; grantId?: string }) => void;
}) {
  const subscription = isSubscription(plan);
  const [interval, setInterval] = useState<'month' | 'year'>('month');

  const price = prices?.find((p) =>
    subscription ? p.interval === interval : p.type === 'one_time'
  );

  const shownPrice = subscription
    ? interval === 'month'
      ? plan.monthlyUsd
      : plan.yearlyUsd
    : plan.priceUsd;
  const shownPer = subscription ? (interval === 'month' ? '/month' : '/year') : 'one-time';

  const popular = 'popular' in plan && plan.popular;

  return (
    <div
      className={cn(
        'flex w-full flex-1 flex-col rounded-2xl border bg-white p-6',
        popular ? 'border-brand-green shadow-lg ring-2 ring-brand-green' : 'border-brand-line'
      )}
    >
      {popular && (
        <span className='mb-2 w-fit rounded-full bg-brand-green px-3 py-1 text-xs font-semibold text-white'>
          Most popular
        </span>
      )}
      <div className='font-alt text-xl font-bold text-brand-ink'>{plan.name}</div>
      <div className='mt-1 text-sm text-brand-muted'>{plan.tagline}</div>
      <div className='mt-4 flex items-baseline gap-1'>
        <span className='text-4xl font-bold text-brand-ink'>${shownPrice}</span>
        <span className='text-sm text-brand-muted'>{shownPer}</span>
      </div>
      {subscription && plan.yearlyUsd > 0 && (
        <div className='mt-3 flex gap-2 text-sm'>
          <button
            type='button'
            onClick={() => setInterval('month')}
            className={cn(
              'rounded-full px-3 py-1 font-medium',
              interval === 'month' ? 'bg-brand-green text-white' : 'bg-brand-greenSoft text-brand-green'
            )}
          >
            Monthly
          </button>
          <button
            type='button'
            onClick={() => setInterval('year')}
            className={cn(
              'rounded-full px-3 py-1 font-medium',
              interval === 'year' ? 'bg-brand-green text-white' : 'bg-brand-greenSoft text-brand-green'
            )}
          >
            Yearly — 2 months free
          </button>
        </div>
      )}
      <ul className='mt-4 flex flex-1 flex-col gap-2'>
        {plan.features.map((f) => (
          <li key={f} className='flex items-start gap-2 text-sm text-brand-ink'>
            <IoCheckmark className='mt-0.5 flex-shrink-0 text-brand-green' />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <div className='mt-6'>
        {price && createCheckoutAction ? (
          <Button
            className='w-full bg-brand-green text-white hover:bg-brand-green/90'
            onClick={() => createCheckoutAction({ price })}
          >
            {plan.cta}
          </Button>
        ) : (
          <Button className='w-full bg-brand-green text-white hover:bg-brand-green/90' asChild>
            <Link href='/signup'>{plan.cta}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
