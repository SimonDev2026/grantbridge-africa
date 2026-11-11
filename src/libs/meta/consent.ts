// Marketing-measurement consent, shared by browser and server.
//
// The consent banner stores the choice in localStorage ('gb_consent'), and
// mirrors it into a `gb_consent` cookie so server routes and server actions
// can read the same signal. The browser Pixel is gated on localStorage
// (pixel.tsx); server-side Meta events (Conversions API) must be gated on
// the cookie — never fire a server event for a visitor who declined or has
// not answered yet. Consent never blocks the underlying action (quiz save,
// checkout): the event is simply skipped.

export const CONSENT_COOKIE = 'gb_consent';

/** Server side (route handlers): read the consent cookie off the request. */
export function hasMarketingConsent(req: { cookies: { get: (name: string) => { value: string } | undefined } }): boolean {
  return req.cookies.get(CONSENT_COOKIE)?.value === 'yes';
}

/** Cookie header value the browser writes when the visitor answers the banner. */
export function consentCookieHeader(value: 'yes' | 'no'): string {
  return `${CONSENT_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}
