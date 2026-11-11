'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

const STATUSES = ['new', 'saved', 'skipped', 'applying', 'submitted', 'won', 'lost'] as const;

export async function setMatchStatus(grantId: string, status: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  if (!STATUSES.includes(status as any)) return { error: 'Unknown status' };
  const supabase = (await createSupabaseServerClient()) as any;
  const { error } = await supabase
    .from('matches')
    .update({ status })
    .eq('user_id', session.user.id)
    .eq('grant_id', grantId);
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function saveGrant(grantId: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const supabase = (await createSupabaseServerClient()) as any;
  const { error } = await supabase.from('matches').upsert(
    { user_id: session.user.id, grant_id: grantId, score: 0, status: 'saved' },
    { onConflict: 'user_id,grant_id', ignoreDuplicates: false }
  );
  if (error) return { error: error.message };
  revalidatePath('/dashboard');
  return { ok: true };
}
