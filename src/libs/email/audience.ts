// Email-marketing audience — server only (service-role reads).
//
// Recipients are quiz-takers who gave marketing consent: quiz_leads rows with
// marketing_consent = true and a non-null email, minus anyone in
// email_unsubscribes.
//
// Signed-up users are deliberately NOT included: the profiles table has no
// email-marketing opt-in (only whatsapp_opt_in), so there is no consent on
// file to mail them. If an email opt-in is ever added to the profile form,
// add those users here with the same unsubscribe exclusion.
import { dedupeEmails, normalizeEmail } from '@/libs/email/unsubscribe';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

/** All current subscriber addresses, normalised and de-duplicated. */
export async function getSubscriberEmails(): Promise<string[]> {
  const [{ data: leads }, { data: unsubs }] = await Promise.all([
    db.from('quiz_leads').select('email').eq('marketing_consent', true).not('email', 'is', null),
    db.from('email_unsubscribes').select('email'),
  ]);
  const blocked = new Set((unsubs ?? []).map((r: any) => normalizeEmail(r.email)));
  return dedupeEmails((leads ?? []).map((l: any) => l.email)).filter(
    (email) => !blocked.has(email)
  );
}

export async function getSubscriberCount(): Promise<number> {
  return (await getSubscriberEmails()).length;
}
