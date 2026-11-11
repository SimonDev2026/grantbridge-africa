import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader } from '@/app/admin/admin-ui';
import { EmailCampaignForm } from '@/app/admin/email/email-form';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function EditEmailCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect('/dashboard');
  const { id } = await params;

  const { data: campaign } = await db
    .from('email_campaigns')
    .select('id, subject, body_html, status')
    .eq('id', id)
    .single();

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

  if (campaign.status === 'sent') {
    redirect(`/admin/email/${id}`);
  }

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Edit draft'
        subtitle='Change the subject or body, then save. Sending happens from the campaign page.'
        active='email'
      />
      <AdminCard>
        <EmailCampaignForm
          initial={{ id: campaign.id, subject: campaign.subject, body: campaign.body_html }}
        />
      </AdminCard>
    </div>
  );
}
