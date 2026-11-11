import { NextRequest } from 'next/server';

import { docxToPdf, draftToDocx } from '@/features/writer/export-docx';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.GOTENBERG_URL) {
    return Response.json(
      { error: 'PDF export is not configured yet (Gotenberg). Download the Word file instead.' },
      { status: 503 }
    );
  }
  const { id } = await params;
  const supabase = (await createSupabaseServerClient()) as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: 'Sign in first' }, { status: 401 });

  const [{ data: draft }, { data: profile }] = await Promise.all([
    supabase
      .from('drafts')
      .select('*, grants(title)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase.from('profiles').select('org_name').eq('user_id', user.id).maybeSingle(),
  ]);
  if (!draft) return Response.json({ error: 'Draft not found' }, { status: 404 });

  const sections = (draft.sections as { title: string; body: string }[]) ?? [];
  const docx = await draftToDocx(profile?.org_name ?? 'Organisation', (draft as any).grants?.title ?? 'Grant application', sections);
  const pdf = await docxToPdf(docx);
  return new Response(pdf as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="grant-application-${id.slice(0, 8)}.pdf"`,
    },
  });
}
