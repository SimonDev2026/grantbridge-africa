import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { DeleteCampaignButton, SendAllButton, TestSendButton } from '@/app/admin/email/email-actions';
import { Button } from '@/components/ui/button';
import { getSubscriberCount } from '@/libs/email/audience';
import { renderCampaignPreview } from '@/libs/email/render';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@grantbridgeafrica.com';

function displayDate(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function EmailCampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect('/dashboard');
  const { id } = await params;

  const [{ data: campaign }, { data: sends }, subscriberCount] = await Promise.all([
    db
      .from('email_campaigns')
      .select('id, subject, body_html, body_text, status, recipient_count, sent_count, failed_count, created_at, sent_at')
      .eq('id', id)
      .single(),
    db
      .from('email_sends')
      .select('email, status, error, sent_at')
      .eq('campaign_id', id)
      .order('sent_at', { ascending: true }),
    getSubscriberCount().catch(() => 0),
  ]);

  if (!campaign) {
    return (
      <div className='flex flex-col gap-6 py-8'>
        <AdminPageHeader title='Campaign not found' subtitle='This campaign does not exist.' active='email' />
        <AdminCard>
          <Button variant='outline' asChild>
            <Link href='/admin/email'>← Back to Email</Link>
          </Button>
        </AdminCard>
      </div>
    );
  }

  const isDraft = campaign.status === 'draft';
  const log = sends ?? [];
  // Preview uses the admin address so the unsubscribe link is real.
  const previewHtml = renderCampaignPreview(campaign.body_html, ADMIN_EMAIL);

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title={campaign.subject}
        subtitle={
          isDraft
            ? `Draft · created ${displayDate(campaign.created_at)}`
            : `Sent ${displayDate(campaign.sent_at)} · ${campaign.sent_count} sent of ${campaign.recipient_count}` +
              (campaign.failed_count > 0 ? ` · ${campaign.failed_count} failed` : '')
        }
        active='email'
        actions={
          <>
            {isDraft && (
              <Button variant='outline' asChild>
                <Link href={`/admin/email/${id}/edit`}>Edit draft</Link>
              </Button>
            )}
          </>
        }
      />

      <AdminCard>
        <AdminSectionHeading eyebrow='Preview' title='As the subscriber sees it' />
        <div className='mt-4 overflow-hidden rounded-2xl border border-brand-line bg-brand-bg'>
          <div className='border-b border-brand-line bg-white px-5 py-3'>
            <p className='text-xs font-semibold uppercase tracking-widest text-brand-muted'>Subject</p>
            <p className='mt-1 font-semibold text-brand-ink'>{campaign.subject}</p>
          </div>
          <div
            className='px-5 py-4 text-sm leading-relaxed text-brand-ink [&_a]:text-brand-green [&_a]:underline'
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
        <p className='mt-3 text-xs text-brand-muted'>
          Plain-text version is generated from the same body and sent alongside the HTML.
        </p>
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading eyebrow='Send' title={isDraft ? 'Send this campaign' : 'Sending is done'} />
        <div className='mt-4 flex flex-wrap items-start gap-4'>
          <TestSendButton campaignId={id} />
          {isDraft && <SendAllButton campaignId={id} recipientCount={subscriberCount} />}
          {isDraft && <DeleteCampaignButton campaignId={id} />}
        </div>
        {isDraft && (
          <p className='mt-4 text-sm text-brand-muted'>
            {subscriberCount} subscriber{subscriberCount === 1 ? '' : 's'} will receive this email.
            Send yourself a test first — delivery to real inboxes only works once the domain is
            verified in Resend.
          </p>
        )}
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Send log'
          title='Who got it'
          right={
            <StatusPill tone={log.some((s: any) => s.status === 'failed') ? 'red' : 'green'}>
              {log.length === 0 ? 'Nothing sent yet' : `${log.filter((s: any) => s.status === 'sent').length} sent · ${log.filter((s: any) => s.status === 'failed').length} failed`}
            </StatusPill>
          }
        />
        {log.length === 0 ? (
          <p className='mt-4 text-sm text-brand-muted'>
            No sends recorded yet. Every address this campaign goes to — and every failure, with
            the reason — is listed here after sending.
          </p>
        ) : (
          <div className='mt-4 flex flex-col gap-2'>
            {log.map((s: any) => (
              <div
                key={s.email}
                className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-brand-line bg-white px-4 py-3 text-sm'
              >
                <span className='font-medium text-brand-ink'>{s.email}</span>
                <span className='flex items-center gap-3'>
                  <span className='text-xs text-brand-muted'>{displayDate(s.sent_at)}</span>
                  <StatusPill tone={s.status === 'sent' ? 'green' : 'red'}>
                    {s.status === 'sent' ? 'Sent' : 'Failed'}
                  </StatusPill>
                </span>
                {s.status === 'failed' && s.error && (
                  <span className='w-full text-xs text-red-700'>{s.error}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
