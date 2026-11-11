// Public read-only Supabase client for the quiz's public endpoints
// (/api/quiz-results, /api/quiz-results/stats, /api/quiz-results/preview).
//
// These routes only read data RLS already exposes to the anon key —
// approved grants ("approved grants are public"), country_regions
// ("country regions are public") and, once migration
// 20261111000500 lands, funder names. They deliberately do NOT use the
// service-role key: the service key is for privileged writes, and a stale
// SUPABASE_SERVICE_ROLE_KEY in the Preview environment made every quiz
// endpoint fail with 500 {"error":"Invalid API key"} (verified live
// 2026-11-11) while the anon-key homepage kept working. The main
// /api/quiz-results route swallowed that error and returned empty matches,
// so the quiz failed silently. Using the anon client here removes the
// quiz's dependence on the service key entirely.
import type { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';
import { createClient } from '@supabase/supabase-js';

export const supabasePublicClient = createClient<Database>(
  getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
  getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
);
