import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader } from '@/app/admin/admin-ui';
import { EmailCampaignForm } from '@/app/admin/email/email-form';

export default async function NewEmailCampaignPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='New campaign'
        subtitle='Write the email, preview it, save it as a draft — then send yourself a test before it goes to anyone.'
        active='email'
      />
      <AdminCard>
        <EmailCampaignForm initial={{ id: null, subject: '', body: '' }} />
      </AdminCard>
    </div>
  );
}
