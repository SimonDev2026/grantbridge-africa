// Step 8 — alerts. Email via Resend, WhatsApp via the Cloud API.
// BOTH channels are no-ops until their keys exist (RESEND_API_KEY,
// WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_TOKEN), so the cron never fails for
// a missing key. The free channel is WhatsApp: the public channel +
// click-to-chat links are free; Cloud API template messages are charged
// per message, so they only fire for users who opted in.
import { getResendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { sendWhatsAppTemplate } from '@/libs/whatsapp/send';

const db = supabaseAdminClient as any;
const FROM = process.env.RESEND_FROM_EMAIL ?? 'GrantBridge Africa <onboarding@resend.dev>';
const REMINDER_DAYS = [14, 7, 2];

async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    await getResendClient().emails.send({ from: FROM, to, subject, text });
    return true;
  } catch (e) {
    console.error('Alert email failed:', (e as Error).message);
    return false;
  }
}

async function userEmail(userId: string): Promise<string | null> {
  const { data } = await supabaseAdminClient.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

function daysUntil(deadline: string): number {
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

/** Deadline reminders 14, 7 and 2 days before each tracked grant's deadline. */
export async function sendDeadlineReminders() {
  const { data: matches } = await db
    .from('matches')
    .select('user_id, grants(title, deadline, official_url)')
    .in('status', ['saved', 'applying']);
  let sent = 0;
  for (const m of matches ?? []) {
    const g = m.grants;
    if (!g?.deadline) continue;
    const days = daysUntil(g.deadline);
    if (!REMINDER_DAYS.includes(days)) continue;
    const email = await userEmail(m.user_id);
    const { data: profile } = await db
      .from('profiles')
      .select('whatsapp_number, whatsapp_opt_in')
      .eq('user_id', m.user_id)
      .maybeSingle();
    const subject = `Deadline in ${days} days: ${g.title}`;
    const text = `Your tracked grant "${g.title}" closes in ${days} days (${g.deadline}).\n\nFinish and submit it on the funder's portal: ${g.official_url}\n\nYou can change your alerts in your GrantBridge profile.`;
    if (email) {
      const ok = await sendEmail(email, subject, text);
      if (ok) sent++;
    }
    if (profile?.whatsapp_opt_in && profile?.whatsapp_number) {
      await sendWhatsAppTemplate(profile.whatsapp_number, 'deadline_reminder', [
        g.title,
        String(days),
        g.deadline,
      ]);
      sent++;
    }
  }
  return { remindersSent: sent };
}

/** Weekly digest: new approved grants from the last 7 days, per active user. */
export async function sendWeeklyDigest() {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: fresh } = await db
    .from('grants')
    .select('id, title, amount_usd_max, scope, deadline')
    .eq('approved', true)
    .eq('status', 'open')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10);
  if (!fresh?.length) return { digestSent: 0, note: 'No new grants this week' };

  const { data: users } = await db.from('matches').select('user_id').limit(500);
  const userIds: string[] = [...new Set(((users ?? []) as { user_id: string }[]).map((u) => u.user_id))];
  const lines = fresh
    .map((g: any) => `- ${g.title}${g.amount_usd_max ? ` (up to $${g.amount_usd_max.toLocaleString()})` : ''}${g.deadline ? ` — deadline ${g.deadline}` : ''}`)
    .join('\n');
  let sent = 0;
  for (const userId of userIds) {
    const email = await userEmail(userId);
    if (!email) continue;
    const ok = await sendEmail(
      email,
      `Your weekly GrantBridge digest — ${fresh.length} new grant${fresh.length === 1 ? '' : 's'}`,
      `New grants this week:\n\n${lines}\n\nSee your matches: https://grantbridge-africa-git-main-simondev2026.vercel.app/dashboard\n\nYou get this because you have an account with us. Reply to unsubscribe.`
    );
    if (ok) sent++;
  }
  return { digestSent: sent };
}
