import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { CmsStatForm } from '@/app/admin/cms/cms-forms';
import { Button } from '@/components/ui/button';

export default async function AdminCmsStatNewPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='New figure'
        subtitle='Add a figure to the homepage stats band. It shows exactly what you type — only enter a real, verified number.'
        active='cms'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/cms'>← Back to content</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading eyebrow='Figures' title='Add a figure' />
        <div className='mt-6'>
          <CmsStatForm
            initial={{
              id: null,
              key: '',
              label: '',
              sub: '',
              value: '',
              source: 'manual',
              sort_order: 50,
              status: 'draft',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
