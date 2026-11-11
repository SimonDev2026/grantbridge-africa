// POST /api/support-message — saves a chat-support message and emails it to
// the shared mailbox (info@grantbridgeafrica.com).
//
// Safety net first: the message is saved to `support_messages` BEFORE any
// email is attempted, and success is returned as long as the save worked.
// Email delivery to real inboxes only works once the domain is verified in
// Resend — until then the email is best-effort and its outcome is reported
// separately (`emailSent`), so a message is never lost because email failed.
// If the migration (20261111000600) has not been applied yet, the insert
// fails and the route returns 500 with the direct-email fallback.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { BRAND } from '@/config/brand';
import { getResendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const Body = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().email(),
  message: z.string().trim().min(1).max(2000),
});

const MAILBOX = BRAND.contact.email;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'GrantBridge Africa <onboarding@resend.dev>';

// Basic spam guard: max 5 messages per IP per hour. In-memory, so it is
// per server instance — enough for a small support form; the planned
// rate-limiting pass will replace it with a shared limiter.
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Please fill in your name, a valid email and a message.' }, { status: 400 });
  }
  const { name, email, message } = parsed.data;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) {
    return Response.json(
      { error: 'You have sent several messages in a short time. Please wait a little and try again.' },
      { status: 429 }
    );
  }

  // 1) Save first — this is what must never fail silently.
  const { error: saveError } = await (supabaseAdminClient as any).from('support_messages').insert({
    name,
    email,
    message,
    status: 'new',
  });
  if (saveError) {
    console.error('Support message save failed:', saveError.message);
    return Response.json(
      { error: `Your message could not be saved right now. Please email us directly at ${MAILBOX}.` },
      { status: 500 }
    );
  }

  // 2) Email best-effort — the message is already safe in the database.
  let emailSent = false;
  if (!process.env.RESEND_API_KEY) {
    console.warn('Support message saved, but RESEND_API_KEY is not set — no email sent.');
  } else {
    try {
      await getResendClient().emails.send({
        from: FROM,
        to: MAILBOX,
        replyTo: email,
        subject: `[Support] ${name}`,
        text: `A message came in through the GrantBridge Africa chat button.\n\nFrom: ${name} <${email}>\n\n${message}\n\n(Also saved in the admin back office under Support messages.)`,
      });
      emailSent = true;
    } catch (e) {
      console.error('Support email failed (message is saved in the database):', (e as Error).message);
    }
  }

  return Response.json({ ok: true, emailSent });
}
