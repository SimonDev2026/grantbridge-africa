// Unsubscribe tokens for email marketing.
//
// One token per email address: HMAC-SHA256 of the normalised email, keyed by
// a server secret. No per-recipient row is needed to verify a link — the
// token itself proves the holder got the email. Unsubscribing writes the
// address into `email_unsubscribes`, which recipient selection always
// excludes. Re-consenting happens by taking the quiz again with the
// marketing box ticked (the quiz upserts nothing here — a re-consent simply
// means the address is in quiz_leads with marketing_consent = true again;
// the admin can remove the row from email_unsubscribes if asked).
import { createHmac, timingSafeEqual } from 'node:crypto';

import { getURL } from '@/utils/get-url';

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Lower-case, trim and de-duplicate a list of addresses, dropping blanks. */
export function dedupeEmails(emails: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const raw of emails) {
    if (!raw) continue;
    const email = normalizeEmail(raw);
    if (!email.includes('@')) continue;
    seen.add(email);
  }
  return [...seen];
}

function getUnsubscribeSecret(): string {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    throw new Error(
      'Unsubscribe secret is not configured (EMAIL_UNSUBSCRIBE_SECRET or CRON_SECRET)'
    );
  }
  return secret;
}

/** Deterministic token for an address — the same email always gets the same token. */
export function createUnsubscribeToken(email: string): string {
  return createHmac('sha256', getUnsubscribeSecret())
    .update(normalizeEmail(email))
    .digest('hex');
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = createUnsubscribeToken(email);
    const a = Buffer.from(token, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Full unsubscribe link for one recipient — goes in every campaign email. */
export function unsubscribeUrl(email: string): string {
  const clean = normalizeEmail(email);
  return getURL(
    `/unsubscribe?email=${encodeURIComponent(clean)}&token=${createUnsubscribeToken(clean)}`
  );
}
