'use client';
// Meta (Facebook) Pixel for Next.js App Router — loads only after cookie consent.
// Add <MetaPixel /> inside <body> in src/app/layout.tsx.
// Browser + server (Conversions API) events share the same eventId so Meta de-duplicates them.
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
declare global { interface Window { fbq?: (...args: unknown[]) => void } }

export const hasConsent = () => typeof window !== 'undefined' && localStorage.getItem('gb_consent') === 'yes';
export const newEventId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now()) + Math.random());

/** Track a standard event, e.g. track('Lead', {}, eventId) or track('InitiateCheckout', { value: 9, currency: 'USD' }, id) */
export function track(event: string, params: Record<string, unknown> = {}, eventId?: string) {
  if (!hasConsent() || !window.fbq) return;
  window.fbq('track', event, params, eventId ? { eventID: eventId } : undefined);
}

/** Read Meta's _fbp/_fbc cookies to send to the server for better Conversions API matching */
export function metaCookies() {
  const get = (n: string) => document.cookie.split('; ').find((c) => c.startsWith(n + '='))?.split('=')[1];
  return { fbp: get('_fbp'), fbc: get('_fbc') };
}

export function MetaPixel() {
  const pathname = usePathname();
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(hasConsent()); }, []);
  useEffect(() => { if (ok && window.fbq) window.fbq('track', 'PageView'); }, [pathname, ok]);
  if (!PIXEL_ID || !ok) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">{`
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
      document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${PIXEL_ID}');
    `}</Script>
  );
}

/** Minimal consent banner. Store 'yes' or 'no'. Link "Cookie settings" in the footer to reset. */
export function ConsentBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { setShow(localStorage.getItem('gb_consent') === null); }, []);
  if (!show) return null;
  const set = (v: 'yes' | 'no') => { localStorage.setItem('gb_consent', v); setShow(false); if (v === 'yes') location.reload(); };
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-xl border bg-white p-4 text-sm shadow-lg">
      We use cookies to measure our ads (Meta) and improve the site. You can change this any time in Cookie settings.
      <div className="mt-3 flex gap-2">
        <button className="rounded-lg bg-black px-4 py-2 text-white" onClick={() => set('yes')}>Accept</button>
        <button className="rounded-lg border px-4 py-2" onClick={() => set('no')}>Decline</button>
      </div>
    </div>
  );
}
