'use server';

import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function saveDraftSections(draftId: string, sections: { title: string; body: string }[]) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const supabase = (await createSupabaseServerClient()) as any;
  const { error } = await supabase
    .from('drafts')
    .update({ sections: sections as any })
    .eq('id', draftId)
    .eq('user_id', session.user.id);
  if (error) return { error: error.message };
  return { ok: true };
}
