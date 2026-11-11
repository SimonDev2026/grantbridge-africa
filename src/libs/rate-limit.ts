// Shared in-memory rate limiter for unauthenticated public API routes.
// Same pattern as POST /api/support-message (5/hour/IP): a bot must not be
// able to spam leads, burn the Resend quota, or pollute Meta events.
// In-memory, so it is per server instance — enough at this scale; a shared
// store (e.g. Upstash) replaces it if traffic ever needs it. No new dependency.
const hits = new Map<string, number[]>();

export function rateLimited(key: string, maxPerWindow: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= maxPerWindow) return true;
  recent.push(now);
  hits.set(key, recent);
  return false;
}

/** Client IP from the request (Vercel sets x-forwarded-for). */
export function clientIp(req: { headers: { get: (name: string) => string | null } }): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
}

const HOUR = 60 * 60 * 1000;

/** Per-route budgets. Writes (leads, emails) are tight; reads are generous. */
export const RATE_LIMITS = {
  /** Quiz unlock: writes a lead + fires a Meta Lead event. */
  quizUnlock: { max: 10, windowMs: HOUR },
  /** Contact / careers / support forms: each send costs Resend quota. */
  formSend: { max: 5, windowMs: HOUR },
  /** Full quiz match run (DB-heavy deterministic scoring). */
  quizResults: { max: 20, windowMs: HOUR },
  /** Mid-quiz "matches so far" count — called as the user answers. */
  quizPreview: { max: 30, windowMs: HOUR },
  /** Live counts for the quiz interstitials — cheap read-only GET. */
  quizStats: { max: 60, windowMs: HOUR },
} as const;

export function tooManyRequests() {
  return Response.json(
    { error: 'Too many requests from your connection right now. Please wait a little and try again.' },
    { status: 429 }
  );
}
