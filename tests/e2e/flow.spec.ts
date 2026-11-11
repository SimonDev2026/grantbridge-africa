// GrantBridge Africa — end-to-end flow: quiz → email unlock → signup →
// checkout → match → draft → export.
//
// REALITY CHECK (2026-11-11, Step 10): three live services are missing, so
// only part of this flow can run for real today:
//   - Stripe products are NOT created yet (Step 4, done separately) — the
//     pricing page therefore has no prices and every plan CTA falls back to
//     a link to /signup instead of a Stripe Checkout session.
//   - AI keys are NOT set (AI_API_KEY / AI_FALLBACK_API_KEY) — /api/match
//     (embeddings) and /api/draft (writer) cannot run.
//   - The 20 seed grants have NOT been applied to the live Supabase DB yet,
//     and this machine has no real Supabase keys — /api/quiz-results returns
//     an empty list and /api/quiz (unlock) returns "Invalid API key".
//
// So this suite does three things:
//   1. LIVE tests assert the app's HONEST behaviour without those services:
//      the quiz completes, the empty state is shown (not a crash), the
//      unlock error is shown, signup shows its auth error, pricing falls
//      back to signup.
//   2. One STUBBED-API test proves the full quiz → unlock → signup UI flow
//      end-to-end in the browser, with the two API responses intercepted
//      and canned (labelled STUBBED in the test name).
//   3. The live-service steps are test.skip() with a comment naming the
//      exact missing key/service — delete the skip the moment Step 4 + AI
//      keys + seed grants land and they should light up.
//
// Run: npm run test:e2e   (starts `npm run dev` if it is not already running)
import { expect, type Page,test } from '@playwright/test';

// --- Quiz answers: SCDI-style Nigerian NGO (matches the unit-test fixture) ---
async function answerQuiz(page: Page) {
  await page.goto('/quiz');
  await expect(page.getByRole('heading', { name: 'Who are you applying as?' })).toBeVisible();
  await page.getByRole('button', { name: 'NGO / non-profit' }).click();
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'How is your organisation registered?' })).toBeVisible();
  await page.getByRole('button', { name: 'Registered non-profit / Incorporated Trustees' }).click();
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'Which country are you based in?' })).toBeVisible();
  await page.locator('select').selectOption('Nigeria');
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'what does your organisation do' })).toBeVisible();
  await page.locator('textarea').fill('We train widows in Ikwo in tailoring and give them sewing machines.');
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'What is your main focus?' })).toBeVisible();
  await page.getByRole('button', { name: 'Economic empowerment & enterprise' }).click();
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'Who does your work mainly serve?' })).toBeVisible();
  await page.getByRole('button', { name: 'Rural / low-income families' }).click();
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'How much funding are you looking for?' })).toBeVisible();
  await page.getByRole('button', { name: 'US$5,000 – 25,000' }).click();
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'What is your annual budget?' })).toBeVisible();
  await page.getByRole('button', { name: 'US$10,000 – 50,000' }).click();
  await page.getByRole('button', { name: 'Continue →' }).click();

  await expect(page.getByRole('heading', { name: 'What stage is your project at?' })).toBeVisible();
  await page.getByRole('button', { name: 'Running' }).click();
  await page.getByRole('button', { name: 'See my matches →' }).click();
}

// Canned /api/quiz-results payload for the STUBBED test — four real seed grants
// (supabase/seed/seed-20-grants.sql), shaped exactly as the route returns them.
const STUBBED_MATCHES = {
  count: 4,
  matches: [
    {
      id: 'seed-d-prize', title: 'D-Prize Global Competition 2026', funderName: 'D-Prize',
      summary: 'Seed funding of up to $20,000 for first-time founders.',
      amount_usd_min: null, amount_usd_max: 20000, currency: 'USD',
      amount_min: null, amount_max: null, scope: 'international',
      deadline: '2026-12-06', rolling: false, official_url: 'https://d-prize.org/',
      score: 100, reasons: ['International funder that accepts applicants from Nigeria'], country: 'Nigeria',
    },
    {
      id: 'seed-usadf', title: 'U.S. African Development Foundation Grants', funderName: 'U.S. African Development Foundation',
      summary: 'Grants for African NGOs and community groups.',
      amount_usd_min: null, amount_usd_max: 250000, currency: 'USD',
      amount_min: null, amount_max: null, scope: 'africa',
      deadline: null, rolling: false, official_url: 'https://www.usadf.gov/',
      score: 95, reasons: ['Africa-focused funder'], country: 'Nigeria',
    },
    {
      id: 'seed-pollination', title: 'The Pollination Project Daily Grant', funderName: 'The Pollination Project',
      summary: 'Seed grants of up to $1,000 for grassroots changemakers.',
      amount_usd_min: null, amount_usd_max: 1000, currency: 'USD',
      amount_min: null, amount_max: null, scope: 'international',
      deadline: null, rolling: true, official_url: 'https://thepollinationproject.org/apply/',
      score: 90, reasons: ['International funder that accepts applicants from Nigeria'], country: 'Nigeria',
    },
    {
      id: 'seed-japan-ggp', title: 'Japan Grant Assistance for Grass-roots Human Security Projects (GGP) — Nigeria',
      funderName: 'Embassy of Japan in Nigeria',
      summary: 'Community-level projects in health, education and water.',
      amount_usd_min: null, amount_usd_max: null, currency: 'JPY',
      amount_min: 10000000, amount_max: 10000000, scope: 'national',
      deadline: '2025-06-13', rolling: false, official_url: 'https://www.ng.emb-japan.go.jp/',
      score: 90, reasons: ['National programme in Nigeria'], country: 'Nigeria',
    },
  ],
};

test.describe('quiz → results (LIVE, no live services)', () => {
  test('quiz completes and shows the honest empty state when no grants are in the live DB', async ({ page }) => {
    await answerQuiz(page);
    // Matching animation, then the results page.
    await expect(page.getByRole('heading', { name: 'Your matches' })).toBeVisible({ timeout: 20_000 });
    // Seed grants are not applied to the live DB and this machine has no real
    // Supabase key, so /api/quiz-results returns { count: 0, matches: [] }.
    // The app must say so plainly — not crash, not show fake grants.
    await expect(page.getByText('No open grants match your answers right now')).toBeVisible();
    await expect(page.getByText('new grants are added daily')).toBeVisible();
  });
});

test.describe('quiz → unlock → signup (STUBBED API)', () => {
  test('full UI flow: quiz → 4 matches → email unlock → signup page', async ({ page }) => {
    // STUBBED: the two API calls are intercepted because the live Supabase DB
    // has no seed grants and no real keys exist on this machine yet. The UI
    // (quiz steps, results, unlock form, signup link) is exercised for real.
    await page.route('**/api/quiz-results', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(STUBBED_MATCHES) }),
    );
    await page.route('**/api/quiz', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }),
    );

    await answerQuiz(page);
    await expect(page.getByRole('heading', { name: 'Your matches' })).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('4 grants match your organisation')).toBeVisible();
    await expect(page.getByText('D-Prize Global Competition 2026')).toBeVisible();

    // Matches beyond the top 3 sit behind the email unlock.
    await expect(page.getByRole('heading', { name: 'See all 4 matches' })).toBeVisible();
    await page.getByPlaceholder('you@organisation.org').fill('test-org@example.org');
    await page.getByRole('button', { name: 'Unlock my matches' }).click();
    // Unlock succeeds (stubbed) and the 4th match is revealed.
    await expect(page.getByText('Japan Grant Assistance for Grass-roots Human Security Projects')).toBeVisible();

    await page.getByRole('link', { name: 'Create your free account →' }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
  });
});

test.describe('signup (LIVE, no live services)', () => {
  test('signup page renders and shows an honest error when the magic link cannot be sent', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('button', { name: 'Continue with Email' })).toBeVisible();
    await page.getByRole('button', { name: 'Continue with Email' }).click();
    await page.getByPlaceholder('Enter your email').fill('test-org@example.org');
    await page.getByRole('button', { name: 'Submit' }).click();
    // No real Supabase anon key on this machine: signInWithEmail fails and
    // the UI toasts the failure instead of pretending the email was sent.
    // (Exact text: the same words also appear inside the aria-live status
    //  wrapper, so the exact toast div is the unambiguous target.)
    await expect(
      page.getByText('An error occurred while authenticating. Please try again.', { exact: true }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/signup$/);
  });
});

test.describe('pricing → checkout fallback (LIVE, no Stripe products yet)', () => {
  test('pricing shows all four plans and every CTA falls back to signup', async ({ page }) => {
    await page.goto('/pricing');
    for (const plan of ['Explorer', 'Seeker', 'Writer', 'Pro']) {
      await expect(page.getByText(plan, { exact: true }).first()).toBeVisible();
    }
    // No Stripe products exist yet (Step 4), so there are no prices and no
    // Checkout button — each plan CTA is a plain link to /signup.
    await page.getByRole('link', { name: 'Choose Seeker' }).click();
    await expect(page).toHaveURL(/\/signup$/);
  });
});

// --- Live-service steps: SKIPPED until Step 4 + AI keys + seed grants land. ---
// Each skip names the exact missing piece. Remove the skip (and only the skip)
// when that piece exists; the test bodies below are written against the real
// behaviour, not stubs.

test.describe('live-service steps (SKIPPED — blocked on missing services)', () => {
  test.skip('checkout: Seeker $19/mo opens a real Stripe Checkout session', async () => {
    // BLOCKED: Stripe products/prices not created yet (Step 4, separate work).
    // Needs STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY and the
    // Seeker/Writer/Pro products in Stripe (test mode first), synced to the
    // products/prices tables by the webhook. Then: sign in, click
    // "Choose Seeker", expect a redirect to checkout.stripe.com.
  });

  test.skip('match: signed-in user gets AI-ranked matches from the live DB', async () => {
    // BLOCKED on two things: (1) the 20 seed grants have not been applied to
    // the live Supabase DB, so /api/match has nothing to rank; (2) AI keys
    // (AI_BASE_URL + AI_API_KEY, or the Groq fallback) are not set, so the
    // profile embedding step in /api/match cannot run. Then: sign in with a
    // completed profile, POST /api/match, expect ranked rows in /dashboard.
  });

  test.skip('draft: Writer plan generates an AI draft for a matched grant', async () => {
    // BLOCKED: AI writer key (AI_API_KEY / AI_WRITER_MODEL) not set, and no
    // live match exists to draft against (see match test above). Then:
    // sign in as a Writer subscriber, POST /api/draft { grantId }, expect a
    // 200 with sections for every document the funder requires.
  });

  test.skip('draft: quota exhausted falls back to the $29 draft credit, then 402', async () => {
    // BLOCKED: needs a real subscription + drafts rows in the live DB (see
    // draft test above). Then: use the Seeker allowance (1/month), draft
    // twice — the 2nd draft spends a purchased credit, the 3rd returns 402
    // "Buy a single application draft ($29) or upgrade your plan".
  });

  test.skip('export: a generated draft exports to Word and PDF', async () => {
    // BLOCKED: needs a generated draft first (see draft test above). Then:
    // open the draft, click export, expect a .docx download and a PDF
    // (GOTENBERG_URL) that both contain the funder name and grant title.
  });
});
