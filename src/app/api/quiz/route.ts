// POST /api/quiz — saves quiz answers + email (the "unlock" step) and fires a Meta "Lead" event.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { sendCapiEvent } from '@/libs/meta/capi';
import { hasMarketingConsent } from '@/libs/meta/consent';
import { clientIp, RATE_LIMITS, rateLimited, tooManyRequests } from '@/libs/rate-limit';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const Body = z.object({
  answers: z.object({
    applicant_type: z.string(), registration_type: z.string().optional(), country: z.string(),
    description: z.string().max(240), sector: z.string(), beneficiaries: z.string(),
    funding_need: z.string(), annual_budget: z.string(), stage: z.string(),
  }),
  email: z.string().email(),
  marketingConsent: z.boolean().default(false),
  eventId: z.string(),                 // same id the browser used for fbq('track','Lead')
  fbp: z.string().optional(), fbc: z.string().optional(),
  utm: z.record(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  // Rate-limit before any DB write or Meta event: a bot must not be able to
  // spam quiz leads or pollute Meta events.
  if (rateLimited(`quiz:${clientIp(req)}`, RATE_LIMITS.quizUnlock.max, RATE_LIMITS.quizUnlock.windowMs)) {
    return tooManyRequests();
  }
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });
  const b = parsed.data;

  const { error } = await supabaseAdminClient.from('quiz_leads' as any).insert({
    answers: b.answers, email: b.email, marketing_consent: b.marketingConsent,
    utm: b.utm ?? null, fbp: b.fbp ?? null, fbc: b.fbc ?? null,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Server-side Meta event only when the visitor consented to measurement
  // (the gb_consent cookie mirrors the browser consent banner). The lead
  // itself is always saved; consent never blocks the quiz.
  if (hasMarketingConsent(req)) {
    await sendCapiEvent({
      eventName: 'Lead', eventId: b.eventId, email: b.email,
      ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
      userAgent: req.headers.get('user-agent'), fbp: b.fbp, fbc: b.fbc,
      eventSourceUrl: req.headers.get('referer') ?? undefined,
    });
  }

  // Next step in the UI: show the full shortlist and invite sign-up (Supabase Auth).
  return Response.json({ ok: true });
}
