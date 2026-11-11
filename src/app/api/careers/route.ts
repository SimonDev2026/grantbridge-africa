// POST /api/careers — sends an expression of interest to the admin mailbox
// via Resend. Fails gracefully (503) when email is not configured.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { BRAND } from '@/config/brand';
import { getResendClient } from '@/libs/resend/resend-client';

const Body = z.object({
  email: z.string().email(),
  message: z.string().trim().min(1).max(1000),
});

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? BRAND.contact.email;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'GrantBridge Africa <onboarding@resend.dev>';

export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'Please fill in a valid email and tell us what you would like to do here.' }, { status: 400 });
  const { email, message } = parsed.data;

  if (!process.env.RESEND_API_KEY) {
    return Response.json(
      { error: `Email is not set up yet, so your message could not be sent. Please email us directly at ${BRAND.contact.email}.` },
      { status: 503 }
    );
  }

  try {
    await getResendClient().emails.send({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: email,
      subject: '[Careers] Expression of interest',
      text: `An expression of interest came in through the GrantBridge Africa careers page.\n\nFrom: ${email}\n\nWhat they would like to do here:\n${message}`,
    });
  } catch (e) {
    console.error('Careers email failed:', (e as Error).message);
    return Response.json(
      { error: `Your message could not be sent right now. Please try again, or email us directly at ${BRAND.contact.email}.` },
      { status: 502 }
    );
  }

  return Response.json({ ok: true });
}
