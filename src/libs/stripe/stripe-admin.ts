import Stripe from 'stripe';

import { getEnvVar } from '@/utils/get-env-var';

let _stripe: Stripe | null = null;

/**
 * Lazily created Stripe client. `next build` evaluates every route module
 * while collecting page data, and the eager `new Stripe(...)` threw
 * "Reference to undefined env var: STRIPE_SECRET_KEY" on any build where
 * the Stripe keys were not set yet (Step 3 preview). The client is only
 * needed at request time, once the keys exist (Step 4).
 */
export function getStripeAdmin(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getEnvVar(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY'), {
      // https://github.com/stripe/stripe-node#configuration
      apiVersion: '2023-10-16',
      // Register this as an official Stripe plugin.
      // https://stripe.com/docs/building-plugins#setappinfo
      appInfo: {
        name: 'GrantBridge Africa',
        version: '0.1.0',
      },
    });
  }
  return _stripe;
}
