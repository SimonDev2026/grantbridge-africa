// POST /api/quiz — saves quiz answers + email (the "unlock" step) and fires a Meta "Lead" event.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { getSession } from '@/features/account/controllers/get-session';
import { quizAnswersToProfile } from '@/features/profile/quiz-to-profile';
import { sendCapiEvent } from '@/libs/meta/capi';
import { hasMarketingConsent } from '@/libs/meta/consent';
import { clientIp, RATE_LIMITS, rateLimited, tooManyRequests } from '@/libs/rate-limit';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const Body = z.object({
  answers: z.object({
    org_name: z.string().max(120).optional(), applicant_type: z.string(), registration_type: z.string().optional(), country: z.string(),
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

  // A signed-in user unlocking also gets their profile saved from the quiz
  // answers (same save the quiz completion does). Finishing the quiz used
  // to write only the quiz_lead row, leaving /profile empty and the
  // checkout gate looping back to the quiz. A failed profile save never
  // fails the unlock itself.
  try {
    const session = await getSession();
    if (session?.user && b.answers.org_name) {
      const supabase = (await createSupabaseServerClient()) as any;
      await supabase.from('profiles').upsert(
        { user_id: session.user.id, ...quizAnswersToProfile({ ...b.answers, org_name: b.answers.org_name ?? '', registration_type: b.answers.registration_type ?? '' }) },
        { onConflict: 'user_id' },
      );
    }
  } catch {
    /* profile save is best-effort here */
  }

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
