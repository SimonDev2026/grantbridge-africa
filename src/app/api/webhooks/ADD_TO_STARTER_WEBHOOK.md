# Add to the starter's `src/app/api/webhooks/route.ts`

## 1. Products to create in Stripe (USD only, existing Canadian account)

| Product name (must match) | Price | Type | Metadata |
|---|---|---|---|
| Seeker | $19 / month and $190 / year | recurring | `plan=seeker` |
| Writer | $49 / month and $490 / year | recurring | `plan=writer` |
| Pro | $149 / month and $1,490 / year | recurring | `plan=pro` |
| Single Application Draft | $29 | one-time | `kind=draft_credit`, `credits=1` |
| Expert Review | $149 | one-time | `kind=service`, `package=review` |
| Done-for-you Application | $399 | one-time | `kind=service`, `package=done_for_you` |

The starter syncs products and prices into Supabase automatically through the webhook.

## 2. Inside `case 'checkout.session.completed':`

```ts
import { sendCapiEvent } from '@/libs/meta/capi';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const cs = event.data.object as Stripe.Checkout.Session;
const userId = cs.client_reference_id!;

if (cs.mode === 'payment') {
  // One-time purchases: draft credits or human services
  const items = await stripeAdmin.checkout.sessions.listLineItems(cs.id, { expand: ['data.price.product'] });
  for (const li of items.data) {
    const md = (li.price?.product as Stripe.Product).metadata;
    if (md.kind === 'draft_credit')
      await (supabaseAdminClient as any).rpc('add_draft_credits', { p_user: userId, p_n: Number(md.credits || 1) * (li.quantity || 1) });
    if (md.kind === 'service')
      await (supabaseAdminClient as any).from('service_requests').insert({ user_id: userId, package: md.package, stripe_session_id: cs.id, grant_id: cs.metadata?.grant_id || null });
  }
}

await sendCapiEvent({
  eventName: cs.mode === 'subscription' ? 'Subscribe' : 'Purchase',
  eventId: cs.metadata?.event_id || cs.id,
  email: cs.customer_details?.email,
  externalId: userId,
  fbp: cs.metadata?.fbp || undefined,
  fbc: cs.metadata?.fbc || undefined,
  value: (cs.amount_total ?? 0) / 100,
  currency: 'USD',
});
```

Also add `'invoice.payment_failed'` to `relevantEvents` and email the user a link to `/manage-subscription` (Stripe customer portal).

## 3. Stripe Dashboard settings
1. Payment methods: Cards, Apple Pay, Google Pay, Link **on**.
2. Adaptive Pricing **off** (everyone sees USD).
3. Add a **USD** payout bank account (avoid conversion to CAD).
4. Billing: Smart Retries, failed-payment emails, customer portal **on**.
5. Webhook endpoint `https://yourdomain.com/api/webhooks`: product.*, price.*, checkout.session.completed, customer.subscription.*, invoice.payment_failed.
