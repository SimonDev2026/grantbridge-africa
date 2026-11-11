import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { CmsTestimonialForm } from '@/app/admin/cms/cms-forms';
import { Button } from '@/components/ui/button';

export default async function AdminCmsTestimonialNewPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='New testimonial'
        subtitle='Add a testimonial only when a real user has actually said it — with their real name and organisation.'
        active='cms'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/cms'>← Back to content</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading eyebrow='Testimonials' title='Add a testimonial' />
        <div className='mt-6'>
          <CmsTestimonialForm
            initial={{
              id: null,
              name: '',
              role: '',
              quote: '',
              status: 'draft',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
