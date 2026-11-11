import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading } from '@/app/admin/admin-ui';
import { NewsPostForm } from '@/app/admin/news/news-form';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

export default async function AdminNewsEditPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect('/dashboard');
  const { id } = await params;

  const { data: post } = await db.from('news_posts').select('*').eq('id', id).maybeSingle();
  if (!post) notFound();

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Edit post'
        subtitle='Change the post below. Publishing status is set by the save buttons.'
        active='news'
        actions={
          <Button variant='outline' asChild>
            <Link href='/admin/news'>← Back to news</Link>
          </Button>
        }
      />
      <AdminCard>
        <AdminSectionHeading
          eyebrow={post.origin === 'curated' ? 'Curated post' : 'Original post'}
          title={post.title}
        />
        <div className='mt-6'>
          <NewsPostForm
            initial={{
              id: post.id,
              title: post.title ?? '',
              slug: post.slug ?? '',
              summary: post.summary ?? '',
              body: post.body ?? '',
              source_name: post.source_name ?? '',
              source_url: post.source_url ?? '',
              status: post.status === 'published' ? 'published' : 'draft',
              origin: post.origin === 'curated' ? 'curated' : 'original',
            }}
          />
        </div>
      </AdminCard>
    </div>
  );
}
