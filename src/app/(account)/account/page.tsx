import { PropsWithChildren, ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { PricingSection } from '@/features/pricing/components/pricing-section';
import { getProducts } from '@/features/pricing/controllers/get-products';
import { Price, ProductWithPrices } from '@/features/pricing/types';

export default async function AccountPage() {
  const [session, subscription, products] = await Promise.all([getSession(), getSubscription(), getProducts()]);

  if (!session) {
    redirect('/login');
  }

  let userProduct: ProductWithPrices | undefined;
  let userPrice: Price | undefined;

  if (subscription) {
    for (const product of products) {
      for (const price of product.prices) {
        if (price.id === subscription.price_id) {
          userProduct = product;
          userPrice = price;
        }
      }
    }
  }

  const planDef =
    userProduct &&
    BRAND.plans.find((p) => p.name.toLowerCase() === (userProduct.name ?? '').toLowerCase());
  const planName = planDef?.name ?? userProduct?.name ?? 'Explorer (free)';
  const amount = userPrice?.unit_amount ? `$${(userPrice.unit_amount / 100).toFixed(0)}` : '$0';
  const interval = userPrice?.interval ? `/${userPrice.interval === 'year' ? 'year' : 'month'}` : '';
  const draftsIncluded =
    planDef?.name === 'Pro' ? 'Unlimited' : planDef?.name === 'Seeker' ? '1 per month' : planDef?.name === 'Writer' ? '10 per month' : '—';

  return (
    <div className='mx-auto max-w-5xl px-4 py-10'>
      <h1 className='text-3xl font-bold text-brand-ink'>Account</h1>
      <p className='mt-1 text-brand-muted'>Signed in as {session.user.email}</p>

      <div className='mt-6 flex flex-col gap-4'>
        <Card
          title='Your plan'
          footer={
            subscription ? (
              <Button size='sm' asChild className='bg-brand-green text-white hover:bg-brand-green/90'>
                <Link href='/manage-subscription'>Manage your subscription</Link>
              </Button>
            ) : (
              <Button size='sm' asChild className='bg-brand-green text-white hover:bg-brand-green/90'>
                <Link href='/pricing'>Start a subscription</Link>
              </Button>
            )
          }
        >
          {userProduct && userPrice ? (
            <div>
              <p className='text-2xl font-bold text-brand-ink'>
                {planName} <span className='text-lg font-medium text-brand-muted'>{amount}{interval}</span>
              </p>
              <p className='mt-1 text-sm text-brand-muted'>
                Status: {subscription?.status ?? 'active'} · Drafts included: {draftsIncluded}
              </p>
              <p className='mt-2 text-sm'>
                <Link href='/dashboard' className='font-medium text-brand-green underline'>
                  Go to your dashboard →
                </Link>
              </p>
            </div>
          ) : (
            <p className='text-brand-ink'>
              You don&apos;t have an active subscription — you&apos;re on the free Explorer plan.
            </p>
          )}
        </Card>

        <Card title='Your account'>
          <div className='flex flex-col gap-2 text-sm'>
            <Link href='/profile' className='font-medium text-brand-green underline'>
              Edit your organisation profile →
            </Link>
            <Link href='/dashboard' className='font-medium text-brand-green underline'>
              View your matches and drafts →
            </Link>
            <Link href='/support' className='font-medium text-brand-green underline'>
              Help and support →
            </Link>
          </div>
        </Card>
      </div>

      <div className='mt-10'>
        <h2 className='text-xl font-bold text-brand-ink'>Change your plan</h2>
        <PricingSection />
      </div>
    </div>
  );
}

function Card({
  title,
  footer,
  children,
}: PropsWithChildren<{
  title: string;
  footer?: ReactNode;
}>) {
  return (
    <div className='m-auto w-full max-w-3xl rounded-2xl border border-brand-line bg-white'>
      <div className='p-4'>
        <h2 className='mb-1 text-xl font-semibold text-brand-ink'>{title}</h2>
        <div className='py-4'>{children}</div>
      </div>
      <div className='flex justify-end rounded-b-2xl border-t border-brand-line bg-brand-bg p-4'>{footer}</div>
    </div>
  );
}
