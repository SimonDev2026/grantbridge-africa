// Sends one campaign's emails via Resend and records every result in
// `email_sends` — the audit trail (who got it, who failed and why).
//
// Idempotent per recipient: an address already recorded as `sent` for this
// campaign is skipped, so a crashed or retried send never double-mails.
// Per-recipient failures are recorded, not fatal — one bad address must not
// stop the rest of the list.
//
// Delivery limit, stated plainly: Resend has no verified domain yet, so mail
// to real inboxes fails until the domain is verified (RESEND_FROM_EMAIL
// defaults to onboarding@resend.dev, which delivers only to the account
// owner). Those failures land in email_sends with Resend's error text.
import { renderCampaignEmail } from '@/libs/email/render';
import { getResendClient } from '@/libs/resend/resend-client';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;
export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ?? 'GrantBridge Africa <onboarding@resend.dev>';

export type CampaignSendResult = {
  sent: number;
  failed: number;
  skipped: number;
};

/** Send one campaign to a list of addresses. Caller must be admin-gated. */
export async function sendCampaignToRecipients(
  campaign: { id: string; subject: string; body_html: string },
  recipients: string[]
): Promise<CampaignSendResult> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Resend is not configured (RESEND_API_KEY is missing)');
  }
  const resend = getResendClient();
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  for (const email of recipients) {
    const { data: existing } = await db
      .from('email_sends')
      .select('status')
      .eq('campaign_id', campaign.id)
      .eq('email', email)
      .maybeSingle();
    if (existing?.status === 'sent') {
      skipped++;
      continue;
    }
    const { html, text } = renderCampaignEmail(campaign.body_html, email);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      subject: campaign.subject,
      html,
      text,
    });
    if (error) {
      failed++;
      await db.from('email_sends').upsert(
        {
          campaign_id: campaign.id,
          email,
          status: 'failed',
          error: error.message ?? 'Resend returned an error',
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'campaign_id,email' }
      );
    } else {
      sent++;
      await db.from('email_sends').upsert(
        { campaign_id: campaign.id, email, status: 'sent', error: null, sent_at: new Date().toISOString() },
        { onConflict: 'campaign_id,email' }
      );
    }
  }
  return { sent, failed, skipped };
}
