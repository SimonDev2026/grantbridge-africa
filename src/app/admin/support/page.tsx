import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { MarkRepliedButton } from '@/app/admin/support/support-actions';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function AdminSupportPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  const { data: messages, error } = await db
    .from('support_messages')
    .select('id, name, email, message, status, created_at')
    .order('created_at', { ascending: false });

  const list = messages ?? [];
  const unreplied = list.filter((m: any) => m.status === 'new').length;

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Support messages'
        subtitle='Messages from the floating chat button land here first — and in the shared mailbox (info@grantbridgeafrica.com). Reply by email, then mark each one as replied.'
        active='support'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin'>← Back to admin</Link>
          </Button>
        }
      />

      {error && (
        <AdminCard>
          <p className='text-sm text-red-700'>
            Could not load support messages: {error.message}. If the table does not exist yet, apply
            migration <code>supabase/migrations/20261111000600_support_messages.sql</code> in the
            Supabase dashboard SQL Editor.
          </p>
        </AdminCard>
      )}

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Inbox'
          title='All messages'
          right={<StatusPill tone={unreplied > 0 ? 'sun' : 'green'}>{unreplied > 0 ? `${unreplied} awaiting reply` : 'All replied'}</StatusPill>}
        />
        {list.length === 0 ? (
          <div className='mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-line bg-brand-bg px-6 py-10 text-center'>
            <span className='flex h-12 w-12 items-center justify-center rounded-full bg-brand-greenSoft text-2xl text-brand-green'>
              ✓
            </span>
            <p className='font-semibold text-brand-ink'>No messages yet</p>
            <p className='max-w-md text-sm text-brand-muted'>
              When a visitor sends a message through the chat button, it will appear here — and a
              copy goes to info@grantbridgeafrica.com.
            </p>
          </div>
        ) : (
          <div className='mt-6 flex flex-col gap-4'>
            {list.map((m: any) => (
              <article key={m.id} className='rounded-2xl border border-brand-line bg-white p-5 transition-shadow hover:shadow-sm'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div>
                    <p className='font-semibold text-brand-ink'>{m.name}</p>
                    <p className='text-sm text-brand-muted'>
                      <a href={`mailto:${m.email}`} className='font-medium text-brand-green hover:underline'>
                        {m.email}
                      </a>
                      {' · '}
                      {new Date(m.created_at).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className='flex items-center gap-3'>
                    <StatusPill tone={m.status === 'replied' ? 'green' : 'sun'}>
                      {m.status === 'replied' ? 'Replied' : 'New'}
                    </StatusPill>
                    {m.status !== 'replied' && <MarkRepliedButton messageId={m.id} />}
                  </div>
                </div>
                <p className='mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-ink'>{m.message}</p>
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
