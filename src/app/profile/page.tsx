import { redirect } from 'next/navigation';

import { ProfileClient } from '@/app/profile/profile-client';
import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export default async function ProfilePage() {
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const supabase = await createSupabaseServerClient();

  const [{ data: profile }, { data: documents }] = await Promise.all([
    supabase.from('profiles').select('*').eq('user_id', session.user.id).maybeSingle(),
    supabase
      .from('documents')
      .select('id, kind, file_path, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false }),
  ]);

  return <ProfileClient initial={profile as any} documents={documents ?? []} />;
}
