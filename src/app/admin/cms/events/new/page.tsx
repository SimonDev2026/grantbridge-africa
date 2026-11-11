import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { CmsEventForm } from '@/app/admin/cms/cms-forms';
import { Button } from '@/components/ui/button';

export default async function AdminCmsEventNewPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='New event'
        subtitle='Add a webinar, info session or launch day. It stays a draft until you publish it.'
        active='cms'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/cms'>← Back to content</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading eyebrow='Events' title='Create an event' />
        <div className='mt-6'>
          <CmsEventForm
            initial={{
              id: null,
              title: '',
              starts_at: '',
              location: '',
              description: '',
              status: 'draft',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
