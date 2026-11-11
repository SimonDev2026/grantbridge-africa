import { notFound, redirect } from 'next/navigation';

import { WriterClient } from '@/app/apply/[id]/writer-client';
import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user) redirect('/login');
  const supabase = (await createSupabaseServerClient()) as any;

  const [{ data: grant }, { data: draft }] = await Promise.all([
    supabase
      .from('grants')
      .select('*')
      .eq('id', id)
      .eq('approved', true)
      .maybeSingle(),
    supabase
      .from('drafts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('grant_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!grant) notFound();

  return (
    <WriterClient
      grantId={grant.id}
      grantTitle={grant.title}
      initialDraftId={draft?.id ?? null}
      initialSections={(draft?.sections as { title: string; body: string }[]) ?? []}
      documentsRequired={grant.documents_required ?? []}
      officialUrl={grant.official_url}
    />
  );
}
