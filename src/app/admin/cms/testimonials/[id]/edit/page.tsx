import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { CmsTestimonialForm } from '@/app/admin/cms/cms-forms';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function AdminCmsTestimonialEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await isAdmin())) redirect('/dashboard');
  const { id } = await params;

  const { data: t } = await db.from('cms_testimonials').select('*').eq('id', id).maybeSingle();
  if (!t) notFound();

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Edit testimonial'
        subtitle='Change the testimonial below. Publishing status is set by the save buttons.'
        active='cms'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/cms'>← Back to content</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading eyebrow='Testimonials' title={t.name} />
        <div className='mt-6'>
          <CmsTestimonialForm
            initial={{
              id: t.id,
              name: t.name ?? '',
              role: t.role ?? '',
              quote: t.quote ?? '',
              status: t.status === 'published' ? 'published' : 'draft',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
