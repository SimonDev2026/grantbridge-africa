import Stripe from 'stripe';

import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { sendCapiEvent } from '@/libs/meta/capi';
import { getStripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = getEnvVar(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return;
    event = getStripeAdmin().webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    return Response.json(`Webhook Error: ${(error as any).message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProduct(event.data.object as Stripe.Product);
          break;
        case 'price.created':
        case 'price.updated':
          await upsertPrice(event.data.object as Stripe.Price);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await upsertUserSubscription({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            isCreateAction: false,
          });
          break;
        case 'invoice.payment_failed': {
          // TODO (Step 8): email the customer a link to /manage-subscription via Resend.
          // Until the Resend key is set, Stripe's own failed-payment email covers this.
          const invoice = event.data.object as Stripe.Invoice;
          console.error('Stripe invoice payment failed', invoice.id, invoice.customer);
          break;
        }
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          const checkoutUserId = checkoutSession.client_reference_id!;

          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            await upsertUserSubscription({
              subscriptionId: subscriptionId as string,
              customerId: checkoutSession.customer as string,
              isCreateAction: true,
            });
          }

          if (checkoutSession.mode === 'payment') {
            // One-time purchases: draft credits or human services.
            const items = await getStripeAdmin().checkout.sessions.listLineItems(checkoutSession.id, { expand: ['data.price.product'] });
            for (const li of items.data) {
              const md = (li.price?.product as Stripe.Product).metadata;
              if (md.kind === 'draft_credit')
                await (supabaseAdminClient as any).rpc('add_draft_credits', { p_user: checkoutUserId, p_n: Number(md.credits || 1) * (li.quantity || 1) });
              if (md.kind === 'service')
                await (supabaseAdminClient as any).from('service_requests').insert({ user_id: checkoutUserId, package: md.package, stripe_session_id: checkoutSession.id, grant_id: checkoutSession.metadata?.grant_id || null });
            }
          }

          await sendCapiEvent({
            eventName: checkoutSession.mode === 'subscription' ? 'Subscribe' : 'Purchase',
            eventId: checkoutSession.metadata?.event_id || checkoutSession.id,
            email: checkoutSession.customer_details?.email,
            externalId: checkoutUserId,
            fbp: checkoutSession.metadata?.fbp || undefined,
            fbc: checkoutSession.metadata?.fbc || undefined,
            value: (checkoutSession.amount_total ?? 0) / 100,
            currency: 'USD',
          });
          break;
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error) {
      console.error(error);
      return Response.json('Webhook handler failed. View your nextjs function logs.', {
        status: 400,
      });
    }
  }
  return Response.json({ received: true });
}
