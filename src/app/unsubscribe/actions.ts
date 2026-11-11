'use server';

import { headers } from 'next/headers';

import { normalizeEmail } from '@/libs/email/unsubscribe';
import { RATE_LIMITS, rateLimited } from '@/libs/rate-limit';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

/**
 * Unsubscribe one address without a token (the manual form on /unsubscribe).
 * Unsubscribing is low-risk and reversible (re-consent via the quiz), so no
 * token is required — but it is rate-limited per connection.
 */
export async function unsubscribeByEmail(rawEmail: string) {
  const ip =
    (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(`unsubscribe:${ip}`, RATE_LIMITS.unsubscribe.max, RATE_LIMITS.unsubscribe.windowMs)) {
    return { error: 'Too many attempts from your connection right now. Please wait a little and try again.' };
  }
  const email = normalizeEmail(rawEmail ?? '');
  if (!email.includes('@')) return { error: 'Enter a valid email address' };
  const { error } = await db
    .from('email_unsubscribes')
    .upsert({ email, unsubscribed_at: new Date().toISOString() }, { onConflict: 'email' });
  if (error) return { error: error.message };
  return { ok: true, email };
}
