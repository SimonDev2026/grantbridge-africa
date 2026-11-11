import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    // The dev server needs env vars to boot (see .env.local). With only the
    // dummy keys from Step 10 the pages render, but every live Supabase /
    // Stripe / AI call fails honestly — the suite asserts that honest
    // behaviour and skips the steps that need the real services.
    command: 'npm run dev',
    url: 'http://localhost:3000/quiz',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
