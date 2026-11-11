import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { getSubscriberCount } from '@/libs/email/audience';
import { EMAIL_FROM } from '@/libs/email/send-campaign';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@grantbridgeafrica.com';

function displayDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminEmailPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  const [{ data: campaigns, error }, subscriberCount, { count: unsubCount }] = await Promise.all([
    db
      .from('email_campaigns')
      .select('id, subject, status, recipient_count, sent_count, failed_count, created_at, sent_at')
      .order('created_at', { ascending: false }),
    getSubscriberCount().catch(() => 0),
    db.from('email_unsubscribes').select('email', { count: 'exact', head: true }),
  ]);

  const list = campaigns ?? [];
  const drafts = list.filter((c: any) => c.status === 'draft').length;
  const usingTestSender = EMAIL_FROM.includes('onboarding@resend.dev');

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Email marketing'
        subtitle='Design an email once and send it to every subscriber — quiz-takers who asked to hear about new grants. Nothing sends without your click.'
        active='email'
        actions={
          <Button variant='sun' asChild>
            <Link href='/admin/email/new'>+ New campaign</Link>
          </Button>
        }
      />

      {error && (
        <AdminCard>
          <p className='text-sm text-red-700'>
            Could not load campaigns: {error.message}. If the tables do not exist yet, apply
            migration <code>supabase/migrations/20261111000900_email_marketing.sql</code> in the
            Supabase dashboard SQL Editor.
          </p>
        </AdminCard>
      )}

      <AdminCard>
        <AdminSectionHeading eyebrow='Audience' title='Who gets these emails' />
        <div className='mt-4 flex flex-wrap gap-6 text-sm'>
          <p>
            <span className='block text-2xl font-bold text-brand-ink'>{subscriberCount}</span>
            <span className='text-brand-muted'>subscribers (quiz-takers with marketing consent)</span>
          </p>
          <p>
            <span className='block text-2xl font-bold text-brand-ink'>{unsubCount ?? 0}</span>
            <span className='text-brand-muted'>unsubscribed — never mailed again</span>
          </p>
        </div>
        <p className='mt-4 text-sm text-brand-muted'>
          Only quiz-takers who ticked the marketing box are subscribers. Signed-up users are not
          included — profiles have no email-marketing opt-in on file, so there is no consent to
          mail them.
        </p>
        {usingTestSender ? (
          <div className='mt-4 rounded-2xl border border-brand-line bg-brand-sunSoft/60 p-4 text-sm text-brand-ink'>
            <p className='font-semibold'>⚠ Delivery is limited right now</p>
            <p className='mt-1 text-brand-muted'>
              Emails are sent from the Resend test address ({EMAIL_FROM}), which delivers only to
              the Resend account owner. Mail to real subscribers will fail until the domain is
              verified in Resend and RESEND_FROM_EMAIL is set — test sends to {ADMIN_EMAIL} work
              today, and every failure is recorded in the send log.
            </p>
          </div>
        ) : (
          <p className='mt-4 text-sm text-brand-muted'>
            Sending from <span className='font-semibold text-brand-ink'>{EMAIL_FROM}</span>.
          </p>
        )}
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Campaigns'
          title='All campaigns'
          right={
            <StatusPill tone={drafts > 0 ? 'sun' : 'green'}>
              {drafts > 0 ? `${drafts} draft${drafts > 1 ? 's' : ''}` : 'No drafts'}
            </StatusPill>
          }
        />
        {list.length === 0 ? (
          <div className='mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-line bg-brand-bg px-6 py-10 text-center'>
            <span className='flex h-12 w-12 items-center justify-center rounded-full bg-brand-greenSoft text-2xl text-brand-green'>
              ✉
            </span>
            <p className='font-semibold text-brand-ink'>No campaigns yet</p>
            <p className='max-w-md text-sm text-brand-muted'>
              Write your first email — a welcome, a new-grants roundup, or an announcement. Save
              it as a draft, send yourself a test, then send it to all subscribers.
            </p>
          </div>
        ) : (
          <div className='mt-6 flex flex-col gap-4'>
            {list.map((c: any) => (
              <article
                key={c.id}
                className='rounded-2xl border border-brand-line bg-white p-5 transition-shadow hover:shadow-sm'
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='font-semibold text-brand-ink'>{c.subject}</p>
                    <p className='mt-1 text-sm text-brand-muted'>
                      Created {displayDate(c.created_at)}
                      {c.status === 'sent' && c.sent_at ? ` · Sent ${displayDate(c.sent_at)}` : ''}
                      {c.status === 'sent'
                        ? ` · ${c.sent_count} sent of ${c.recipient_count}` +
                          (c.failed_count > 0 ? ` · ${c.failed_count} failed` : '')
                        : ''}
                    </p>
                  </div>
                  <StatusPill tone={c.status === 'sent' ? 'green' : 'sun'}>
                    {c.status === 'sent' ? 'Sent' : 'Draft'}
                  </StatusPill>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/admin/email/${c.id}`}>View</Link>
                  </Button>
                  {c.status === 'draft' && (
                    <Button variant='outline' size='sm' asChild>
                      <Link href={`/admin/email/${c.id}/edit`}>Edit</Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
