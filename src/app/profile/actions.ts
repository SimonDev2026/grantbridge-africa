'use server';

import { revalidatePath } from 'next/cache';

import { getSession } from '@/features/account/controllers/get-session';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function saveProfile(form: {
  org_name: string;
  applicant_type: string;
  registration_type: string;
  country: string;
  state: string;
  description: string;
  sectors: string[];
  beneficiaries: string[];
  funding_need: number | null;
  annual_budget: number | null;
  stage: string;
  team_size: string;
  whatsapp_number: string;
  whatsapp_opt_in: boolean;
}) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const supabase = (await createSupabaseServerClient()) as any;
  const { error } = await supabase.from('profiles').upsert(
    { user_id: session.user.id, ...form },
    { onConflict: 'user_id' }
  );
  if (error) return { error: error.message };
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  return { ok: true };
}

export async function uploadDocument(formData: FormData) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const file = formData.get('file') as File | null;
  const kind = String(formData.get('kind') ?? 'other');
  if (!file || file.size === 0) return { error: 'Choose a file' };
  if (file.size > 10 * 1024 * 1024) return { error: 'File must be under 10 MB' };

  const supabase = (await createSupabaseServerClient()) as any;
  const path = `${session.user.id}/documents/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error: upErr } = await supabase.storage
    .from('org-docs')
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false });
  if (upErr) return { error: upErr.message };

  // Plain-text documents can be used by the AI writer straight away.
  let extracted: string | null = null;
  if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
    extracted = (await file.text()).slice(0, 20000);
  }

  const { error: dbErr } = await supabase
    .from('documents')
    .insert({ user_id: session.user.id, kind, file_path: path, extracted_text: extracted });
  if (dbErr) return { error: dbErr.message };
  revalidatePath('/profile');
  return { ok: true };
}

export async function deleteDocument(id: string, filePath: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const supabase = (await createSupabaseServerClient()) as any;
  await supabase.storage.from('org-docs').remove([filePath]);
  const { error } = await supabase.from('documents').delete().eq('id', id).eq('user_id', session.user.id);
  if (error) return { error: error.message };
  revalidatePath('/profile');
  return { ok: true };
}

export async function documentDownloadUrl(filePath: string) {
  const session = await getSession();
  if (!session?.user) return { error: 'Sign in first' };
  const supabase = (await createSupabaseServerClient()) as any;
  const { data, error } = await supabase.storage.from('org-docs').createSignedUrl(filePath, 3600);
  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
