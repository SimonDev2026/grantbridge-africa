'use server';
// REPLACES the starter's file. Changes: USD-only guard, Apple Pay / Google Pay / Link enabled
// (automatic payment methods instead of card-only), and Meta ids passed through for the Purchase event.
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { getSession } from '@/features/account/controllers/get-session';
import { Price } from '@/features/pricing/types';
import { sendCapiEvent } from '@/libs/meta/capi';
import { getStripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export async function createCheckoutAction({ price, eventId, fbp, fbc, grantId }: { price: Price; eventId?: string; fbp?: string; fbc?: string; grantId?: string }) {
  const session = await getSession();
  if (!session?.user) return redirect(`${getURL()}/signup`);
  if (!session.user.email) throw Error('Could not get email');

  // We only sell in US dollars, in every country.
  if ((price.currency ?? '').toLowerCase() !== 'usd') throw Error('Only USD prices are allowed');

  const customer = await getOrCreateCustomer({ userId: session.user.id, email: session.user.email });

  const checkoutSession = await getStripeAdmin().checkout.sessions.create({
    // No payment_method_types: Stripe shows every method enabled in the Dashboard
    // (cards, Apple Pay, Google Pay, Link). Keep Adaptive Pricing OFF in Dashboard so prices stay in USD.
    billing_address_collection: 'required',
    customer,
    customer_update: { address: 'auto' },
    line_items: [{ price: price.id, quantity: 1 }],
    mode: price.type === 'recurring' ? 'subscription' : 'payment',
    allow_promotion_codes: true,
    client_reference_id: session.user.id,
    metadata: { user_id: session.user.id, fbp: fbp ?? '', fbc: fbc ?? '', event_id: eventId ?? '', grant_id: grantId ?? '' },
    success_url: `${getURL()}/dashboard?checkout=success`,
    cancel_url: `${getURL()}/pricing`,
  });
  if (!checkoutSession?.url) throw Error('checkoutSession is not defined');

  const h = await headers();
  await sendCapiEvent({
    eventName: 'InitiateCheckout', eventId: eventId ?? checkoutSession.id, email: session.user.email,
    externalId: session.user.id, ip: h.get('x-forwarded-for')?.split(',')[0], userAgent: h.get('user-agent'),
    fbp, fbc, value: (price.unit_amount ?? 0) / 100, currency: 'USD',
  });

  redirect(checkoutSession.url);
}
