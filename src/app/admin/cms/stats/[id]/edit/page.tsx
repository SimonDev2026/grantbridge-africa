import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { CmsStatForm } from '@/app/admin/cms/cms-forms';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function AdminCmsStatEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect('/dashboard');
  const { id } = await params;

  const { data: stat } = await db.from('cms_stats').select('*').eq('id', id).maybeSingle();
  if (!stat) notFound();

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Edit figure'
        subtitle='Change the figure below. Publishing status is set by the save buttons.'
        active='cms'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/cms'>← Back to content</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading eyebrow='Figures' title={stat.label} />
        <div className='mt-6'>
          <CmsStatForm
            initial={{
              id: stat.id,
              key: stat.key ?? '',
              label: stat.label ?? '',
              sub: stat.sub ?? '',
              value: stat.value ?? '',
              source: stat.source === 'live' ? 'live' : 'manual',
              sort_order: stat.sort_order ?? 0,
              status: stat.status === 'published' ? 'published' : 'draft',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
