// WhatsApp Cloud API (official, Meta). Only message users who opted in.
// Templates must be approved in WhatsApp Manager first (e.g. "new_grant_match", "deadline_reminder").
// Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
export async function sendWhatsAppTemplate(to: string, template: string, params: string[], lang = 'en') {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID, token = process.env.WHATSAPP_TOKEN;
  if (!phoneId || !token) return;
  const version = process.env.META_GRAPH_VERSION || 'v21.0';
  const res = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: to.replace(/[^\d]/g, ''),            // international format, e.g. 2348012345678
      type: 'template',
      template: {
        name: template,
        language: { code: lang },
        components: [{ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) }],
      },
    }),
  });
  if (!res.ok) console.error('WhatsApp error', res.status, await res.text());
}
