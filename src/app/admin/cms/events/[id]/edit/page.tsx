import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { CmsEventForm } from '@/app/admin/cms/cms-forms';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

/** Convert an ISO timestamp to the datetime-local input format (YYYY-MM-DDTHH:mm). */
function toInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminCmsEventEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect('/dashboard');
  const { id } = await params;

  const { data: event } = await db.from('cms_events').select('*').eq('id', id).maybeSingle();
  if (!event) notFound();

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Edit event'
        subtitle='Change the event below. Publishing status is set by the save buttons.'
        active='cms'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/cms'>← Back to content</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading eyebrow='Events' title={event.title} />
        <div className='mt-6'>
          <CmsEventForm
            initial={{
              id: event.id,
              title: event.title ?? '',
              starts_at: event.starts_at ? toInputValue(event.starts_at) : '',
              location: event.location ?? '',
              description: event.description ?? '',
              status: event.status === 'published' ? 'published' : 'draft',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
