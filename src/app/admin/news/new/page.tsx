import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { NewsPostForm } from '@/app/admin/news/news-form';
import { Button } from '@/components/ui/button';

export default async function AdminNewsNewPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='New post'
        subtitle='Write a news post for the public news page. It stays a draft until you publish it.'
        active='news'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/news'>← Back to news</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading eyebrow='Publisher' title='Write a post' />
        <div className='mt-6'>
          <NewsPostForm
            initial={{
              id: null,
              title: '',
              slug: '',
              summary: '',
              body: '',
              source_name: '',
              source_url: '',
              status: 'draft',
              origin: 'original',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
