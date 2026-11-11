// Renders a campaign email: the admin's body HTML inside the GrantBridge
// shell, with the footer every campaign must carry (contact + unsubscribe
// link), plus a plain-text fallback generated from the same content.
import { BRAND } from '@/config/brand';
import { unsubscribeUrl } from '@/libs/email/unsubscribe';
import { plainTextFromHtml } from '@/libs/news/rss';

export function renderCampaignEmail(
  bodyHtml: string,
  recipientEmail: string
): { html: string; text: string } {
  const unsub = unsubscribeUrl(recipientEmail);
  const html = `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#FAF8F3;font-family:Arial,Helvetica,sans-serif;color:#14211B;">
<div style="max-width:600px;margin:0 auto;padding:24px 16px;">
${campaignInnerHtml(bodyHtml, unsub)}
</div>
</body>
</html>`;
  const text =
    `${plainTextFromHtml(bodyHtml)}\n\n` +
    `—\n${BRAND.name} — ${BRAND.tagline}\n` +
    `You are receiving this email because you asked GrantBridge Africa to email you about new grants.\n` +
    `Questions? Write to ${BRAND.contact.email}.\n` +
    `Unsubscribe: ${unsub}`;
  return { html, text };
}

/**
 * Inner email content only (no doctype/html/body) — for the in-page preview,
 * where a full document would be invalid markup inside a div.
 */
export function renderCampaignPreview(bodyHtml: string, recipientEmail: string): string {
  return campaignInnerHtml(bodyHtml, unsubscribeUrl(recipientEmail));
}

function campaignInnerHtml(bodyHtml: string, unsubUrl: string): string {
  return `<p style="font-size:20px;font-weight:bold;color:#0E6B4A;margin:0 0 4px;">${BRAND.name}</p>
<p style="font-size:13px;color:#5C6B63;margin:0 0 24px;">${BRAND.tagline}</p>
<div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>
<hr style="border:none;border-top:1px solid #E3E7E1;margin:32px 0 16px;" />
<p style="font-size:12px;line-height:1.6;color:#5C6B63;margin:0;">
You are receiving this email because you asked GrantBridge Africa to email you about new grants.
Questions? Write to <a href="mailto:${BRAND.contact.email}" style="color:#0E6B4A;">${BRAND.contact.email}</a>.<br />
<a href="${unsubUrl}" style="color:#0E6B4A;">Unsubscribe</a> — you will stop receiving these emails.
</p>`;
}
