// GET /news — public news list. Only published posts, newest first.
// Data comes only from the news_posts table via the anon client (RLS allows
// SELECT on published posts). Curated cards always link out to the original
// article — we publish a short summary, never the full copied text.
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { supabasePublicClient } from '@/libs/supabase/supabase-public';

const db = supabasePublicClient as any;

export const metadata = {
  title: `News — ${BRAND.name}`,
  description:
    'Grant news and funding updates for African organisations — new calls, funder announcements, and what they mean for you.',
};

function displayDate(p: any): string {
  const d = new Date(p.published_at ?? p.created_at);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function NewsPage() {
  const { data: posts, error } = await db
    .from('news_posts')
    .select('id, title, slug, summary, source_name, source_url, origin, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  const list = posts ?? [];

  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>News</h1>
      <p className='mt-4 text-lg text-brand-muted'>
        Grant news and funding updates for African organisations — new calls, funder
        announcements, and what they mean for you.
      </p>

      {error ? (
        <div className='mt-8 rounded-2xl border border-brand-line bg-white p-6 text-sm text-brand-muted'>
          The news page could not load right now — please check back shortly.
        </div>
      ) : list.length === 0 ? (
        <div className='mt-8 rounded-2xl border border-dashed border-brand-line bg-white p-8 text-center'>
          <p className='font-semibold text-brand-ink'>No news yet</p>
          <p className='mx-auto mt-1 max-w-md text-sm text-brand-muted'>
            We are getting the news desk ready. New grant calls and funding updates will appear
            here as soon as they are published.
          </p>
          <div className='mt-5 flex justify-center'>
            <Button variant='brand' asChild>
              <Link href='/grants'>Browse open grants →</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className='mt-8 flex flex-col gap-5'>
          {list.map((p: any) => (
            <article
              key={p.id}
              className='overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm transition-shadow hover:shadow-md'
            >
              <div className='h-1.5 bg-brand-green' />
              <div className='p-5 sm:p-6'>
                <div className='flex flex-wrap items-center gap-2 text-xs font-semibold'>
                  <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-brand-green'>
                    {displayDate(p)}
                  </span>
                  {p.origin === 'curated' && p.source_name ? (
                    <span className='rounded-full bg-brand-sunSoft px-3 py-1 text-brand-ink'>
                      From {p.source_name}
                    </span>
                  ) : (
                    <span className='rounded-full bg-brand-sunSoft px-3 py-1 text-brand-ink'>
                      {BRAND.shortName}
                    </span>
                  )}
                </div>
                <h2 className='mt-3 text-xl lg:text-2xl'>
                  <Link href={`/news/${p.slug}`} className='hover:text-brand-green hover:underline'>
                    {p.title}
                  </Link>
                </h2>
                {p.summary && <p className='mt-2 text-sm leading-relaxed text-brand-muted'>{p.summary}</p>}
                <div className='mt-4 flex flex-wrap gap-4 text-sm font-semibold'>
                  <Link href={`/news/${p.slug}`} className='text-brand-green hover:underline'>
                    Read more →
                  </Link>
                  {p.origin === 'curated' && p.source_url && (
                    <a
                      href={p.source_url}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-brand-ink hover:underline'
                    >
                      Read the full story at {p.source_name ?? 'the source'} ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className='mt-10 rounded-2xl bg-brand-green p-6 text-center text-white sm:p-8'>
        <h2 className='text-white'>Find a grant to match the news</h2>
        <p className='mx-auto mt-2 max-w-xl text-sm text-white/85'>
          Read about a call that fits your organisation? Check in under a minute whether you
          qualify.
        </p>
        <div className='mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button variant='sun' asChild>
            <Link href='/quiz'>Find my grants</Link>
          </Button>
          <Button
            variant='outline'
            className='border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white'
            asChild
          >
            <Link href='/grants'>Browse open grants →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
