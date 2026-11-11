'use server';

import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { ActionResponse } from '@/types/action-response';
import { getURL } from '@/utils/get-url';

export async function signInWithOAuth(
  provider: 'google',
  next?: string
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const callback =
    next && next.startsWith('/') ? `/auth/callback?next=${encodeURIComponent(next)}` : '/auth/callback';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL(callback),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return redirect(data.url);
}

/**
 * Email + password sign-up (free Explorer account).
 * When Supabase email confirmation is on, no session is created yet — the
 * caller shows a "check your email to confirm" state instead of redirecting.
 * When confirmation is off, the new account lands straight on the quiz.
 */
export async function signUpWithEmailPassword(
  email: string,
  password: string
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getURL('/auth/callback?next=/quiz'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  if (!data.session) {
    return { data: { needsConfirmation: true }, error: null };
  }

  return redirect('/quiz');
}

/**
 * Email + password sign-in. Free (Explorer) users land on the dashboard;
 * users with an active or trialling subscription land on /account.
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  if (!data.session) {
    return { data: null, error: new Error('Sign-in did not create a session. Please try again.') };
  }

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .in('status', ['trialing', 'active'])
    .maybeSingle();

  return redirect(subscription ? '/account' : '/dashboard');
}

/**
 * Re-send the sign-up confirmation email to an address that has not
 * confirmed yet (for example when the first link expired or went to the
 * wrong place). Safe to call for an already-confirmed address — Supabase
 * simply does nothing harmful. The link lands on the quiz via /auth/callback.
 */
export async function resendConfirmationEmail(email: string): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback?next=/quiz'),
    },
  });

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: { resent: true }, error: null };
}

export async function signOut(): Promise<ActionResponse> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  return { data: null, error: null };
}
