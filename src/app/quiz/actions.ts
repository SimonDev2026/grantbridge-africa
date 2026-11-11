'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import {
  QuizAnswers,
  quizAnswersToProfile,
} from '@/features/profile/quiz-to-profile';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

/**
 * Save a signed-in user's completed quiz answers onto their profile.
 * Before this existed, finishing the quiz wrote only a quiz_lead row and
 * the profile stayed empty — so the checkout gate sent the user back to
 * the quiz forever. Anonymous users get { ok: false } (nothing to save
 * to); the caller must never fail the results screen on a save error.
 */
export async function saveQuizProfile(answers: QuizAnswers) {
  const session = await getSession();
  if (!session?.user) return { ok: false, reason: 'not-signed-in' };
  const supabase = (await createSupabaseServerClient()) as any;
  const { error } = await supabase.from('profiles').upsert(
    { user_id: session.user.id, ...quizAnswersToProfile(answers) },
    { onConflict: 'user_id' },
  );
  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return { ok: true };
}
