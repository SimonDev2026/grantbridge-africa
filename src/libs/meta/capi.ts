// Meta Conversions API (server-side). Works even when browsers block the Pixel.
// Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
// Official SDK alternative: github.com/facebook/facebook-nodejs-business-sdk
import crypto from 'crypto';

const sha256 = (v?: string | null) => (v ? crypto.createHash('sha256').update(v.trim().toLowerCase()).digest('hex') : undefined);

export type CapiEvent = {
  eventName: 'Lead' | 'CompleteRegistration' | 'InitiateCheckout' | 'Subscribe' | 'Purchase' | 'ViewContent';
  eventId: string;              // same id as the browser Pixel event -> de-duplication
  eventSourceUrl?: string;
  email?: string | null;        // hashed before sending; never sent in plain text
  externalId?: string | null;   // our user id (hashed)
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  value?: number;               // USD
  currency?: 'USD';
};

export async function sendCapiEvent(e: CapiEvent) {
  const pixel = process.env.META_PIXEL_ID, token = process.env.META_CAPI_TOKEN;
  if (!pixel || !token) return; // not configured: skip silently
  const version = process.env.META_GRAPH_VERSION || 'v21.0'; // set to the current Graph API version
  const body = {
    data: [{
      event_name: e.eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: e.eventId,
      action_source: 'website',
      event_source_url: e.eventSourceUrl,
      user_data: {
        em: e.email ? [sha256(e.email)] : undefined,
        external_id: e.externalId ? [sha256(e.externalId)] : undefined,
        client_ip_address: e.ip ?? undefined,
        client_user_agent: e.userAgent ?? undefined,
        fbp: e.fbp ?? undefined,
        fbc: e.fbc ?? undefined,
      },
      custom_data: e.value != null ? { value: e.value, currency: e.currency ?? 'USD' } : undefined,
    }],
    ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}),
  };
  const res = await fetch(`https://graph.facebook.com/${version}/${pixel}/events?access_token=${token}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!res.ok) console.error('CAPI error', res.status, await res.text());
}
