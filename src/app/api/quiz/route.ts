// POST /api/quiz — saves quiz answers + email (the "unlock" step) and fires a Meta "Lead" event.
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { sendCapiEvent } from '@/libs/meta/capi';
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
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 });
  const b = parsed.data;

  const { error } = await supabaseAdminClient.from('quiz_leads' as any).insert({
    answers: b.answers, email: b.email, marketing_consent: b.marketingConsent,
    utm: b.utm ?? null, fbp: b.fbp ?? null, fbc: b.fbc ?? null,
  });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  await sendCapiEvent({
    eventName: 'Lead', eventId: b.eventId, email: b.email,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0] ?? null,
    userAgent: req.headers.get('user-agent'), fbp: b.fbp, fbc: b.fbc,
    eventSourceUrl: req.headers.get('referer') ?? undefined,
  });

  // Next step in the UI: show the full shortlist and invite sign-up (Supabase Auth).
  return Response.json({ ok: true });
}
