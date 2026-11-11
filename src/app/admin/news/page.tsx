import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { DeletePostButton, FetchNewsButton, PublishToggleButton } from '@/app/admin/news/news-actions';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

function displayDate(p: any): string {
  const d = new Date(p.published_at ?? p.created_at);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function AdminNewsPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  const [{ data: posts, error }, { data: sources }] = await Promise.all([
    db
      .from('news_posts')
      .select('id, title, slug, summary, source_name, source_url, origin, status, published_at, created_at')
      .order('created_at', { ascending: false }),
    db.from('news_sources').select('name, feed_url, active, last_fetched_at, last_status').order('name'),
  ]);

  const list = posts ?? [];
  const drafts = list.filter((p: any) => p.status === 'draft').length;

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='News'
        subtitle='Write and publish news posts, and review grant news pulled from real RSS feeds. Fetched items land here as drafts — nothing goes public until you publish it.'
        active='news'
        actions={
          <>
            <FetchNewsButton />
            <Button variant='sun' asChild>
              <Link href='/admin/news/new'>+ New post</Link>
            </Button>
          </>
        }
      />

      {error && (
        <AdminCard>
          <p className='text-sm text-red-700'>
            Could not load news posts: {error.message}. If the tables do not exist yet, apply
            migration <code>supabase/migrations/20261111000700_news.sql</code> in the Supabase
            dashboard SQL Editor.
          </p>
        </AdminCard>
      )}

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Review queue'
          title='All posts'
          right={
            <StatusPill tone={drafts > 0 ? 'sun' : 'green'}>
              {drafts > 0 ? `${drafts} awaiting review` : 'Nothing awaiting review'}
            </StatusPill>
          }
        />
        {list.length === 0 ? (
          <div className='mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-brand-line bg-brand-bg px-6 py-10 text-center'>
            <span className='flex h-12 w-12 items-center justify-center rounded-full bg-brand-greenSoft text-2xl text-brand-green'>
              ✎
            </span>
            <p className='font-semibold text-brand-ink'>No news posts yet</p>
            <p className='max-w-md text-sm text-brand-muted'>
              Click “Fetch latest news” to pull real grant news into the review queue, or write
              your own post. Drafts stay private until you publish them.
            </p>
          </div>
        ) : (
          <div className='mt-6 flex flex-col gap-4'>
            {list.map((p: any) => (
              <article
                key={p.id}
                className='rounded-2xl border border-brand-line bg-white p-5 transition-shadow hover:shadow-sm'
              >
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='font-semibold text-brand-ink'>{p.title}</p>
                    <p className='mt-1 text-sm text-brand-muted'>
                      {displayDate(p)}
                      {p.origin === 'curated' && p.source_name ? ` · From ${p.source_name}` : ' · Written by GrantBridge'}
                      {p.source_url ? (
                        <>
                          {' · '}
                          <a
                            href={p.source_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='font-medium text-brand-green hover:underline'
                          >
                            Original article ↗
                          </a>
                        </>
                      ) : null}
                    </p>
                    {p.summary && (
                      <p className='mt-2 line-clamp-2 text-sm text-brand-muted'>{p.summary}</p>
                    )}
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <StatusPill tone={p.status === 'published' ? 'green' : 'sun'}>
                      {p.status === 'published' ? 'Published' : 'Draft'}
                    </StatusPill>
                    {p.origin === 'curated' && <StatusPill tone='blue'>Curated</StatusPill>}
                  </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/admin/news/${p.id}/edit`}>Edit</Link>
                  </Button>
                  <PublishToggleButton postId={p.id} published={p.status === 'published'} />
                  {p.status === 'published' && (
                    <Button variant='outline' size='sm' asChild>
                      <Link href={`/news/${p.slug}`} target='_blank' rel='noopener noreferrer'>
                        View live ↗
                      </Link>
                    </Button>
                  )}
                  <DeletePostButton postId={p.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading eyebrow='Sources' title='RSS feeds' />
        {!sources || sources.length === 0 ? (
          <p className='mt-4 text-sm text-brand-muted'>
            No feeds configured. Apply migration 20261111000700_news.sql to seed the verified
            feeds.
          </p>
        ) : (
          <div className='mt-4 flex flex-col gap-3'>
            {(sources as any[]).map((s) => (
              <div
                key={s.feed_url}
                className='flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-brand-line bg-white p-4'
              >
                <div>
                  <p className='font-semibold text-brand-ink'>{s.name}</p>
                  <p className='text-sm text-brand-muted'>{s.feed_url}</p>
                  {s.last_status && (
                    <p className='text-xs text-brand-muted'>
                      Last fetch{s.last_fetched_at ? ` ${new Date(s.last_fetched_at).toLocaleString('en-GB')}` : ''}:{' '}
                      {s.last_status}
                    </p>
                  )}
                </div>
                <StatusPill tone={s.active ? 'green' : 'muted'}>{s.active ? 'Active' : 'Paused'}</StatusPill>
              </div>
            ))}
          </div>
        )}
        <p className='mt-4 text-xs text-brand-muted'>
          Feeds are polled only when you click “Fetch latest news”. Items are queued as drafts —
          never auto-published — and only a short summary is kept, never the full article text.
        </p>
      </AdminCard>
    </div>
  );
}
