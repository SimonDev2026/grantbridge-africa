/**
 * Security headers for every route.
 *
 * CSP allow-list — only what the site actually loads:
 * - scripts: our own code + inline scripts Next.js itself renders (the Meta
 *   Pixel snippet is an inline <script>), Meta Pixel, Stripe.js, Vercel Analytics
 * - styles: our own CSS + inline styles Next.js renders + Google Fonts (belt
 *   and braces — next/font serves the Montserrat files locally at build time)
 * - fonts: Google Fonts static host (same belt-and-braces reason)
 * - images: our own + data: URIs + any https host (funder logos are local,
 *   but the pixel beacon posts to facebook.com)
 * - connections (fetch/XHR/beacon): Supabase, Stripe API, Meta Pixel beacon,
 *   Vercel Analytics
 * - frames: Stripe.js / Stripe hooks only (checkout itself is a redirect, not
 *   an embed); nothing may embed THIS site (frame-ancestors 'none').
 * If a new third-party script is ever added, it must be added here first or
 * the browser will block it — that is the point.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://connect.facebook.net https://js.stripe.com https://va.vercel-scripts.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https://picdirzgyovjdonkwwsb.supabase.co https://api.stripe.com https://www.facebook.com https://vitals.vercel-insights.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
