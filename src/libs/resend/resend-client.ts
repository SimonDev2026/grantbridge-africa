import { Resend } from 'resend';

import { getEnvVar } from '@/utils/get-env-var';

let _resend: Resend | null = null;

/**
 * Lazily created Resend client — same reason as getStripeAdmin: `next build`
 * evaluates every route module, so an eager `new Resend(...)` would throw
 * "Reference to undefined env var: RESEND_API_KEY" on any build where the
 * Resend key is not set yet (it is set at Step 8).
 */
export function getResendClient(): Resend {
  if (!_resend) {
    _resend = new Resend(getEnvVar(process.env.RESEND_API_KEY, 'RESEND_API_KEY'));
  }
  return _resend;
}
