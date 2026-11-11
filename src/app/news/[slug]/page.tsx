// GET /news/[slug] — public article page. Only published posts.
// Curated posts show the short GrantBridge summary and link out to the
// original article — the full text lives at the source, never here.
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { supabasePublicClient } from '@/libs/supabase/supabase-public';

const db = supabasePublicClient as any;

function displayDate(p: any): string {
  const d = new Date(p.published_at ?? p.created_at);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await db
    .from('news_posts')
    .select('title, summary')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();
  if (!data) return { title: `News — ${BRAND.name}` };
  return { title: `${data.title} — ${BRAND.name}`, description: data.summary || BRAND.description };
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data: post } = await db
    .from('news_posts')
    .select('*')
    .eq('status', 'published')
    .eq('slug', slug)
    .maybeSingle();

  if (!post) notFound();

  const paragraphs = (post.body as string)
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className='mx-auto max-w-3xl py-10'>
      <Link href='/news' className='text-sm font-semibold text-brand-green hover:underline'>
        ← Back to news
      </Link>

      <div className='mt-6 flex flex-wrap items-center gap-2 text-xs font-semibold'>
        <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-brand-green'>
          {displayDate(post)}
        </span>
        {post.origin === 'curated' && post.source_name ? (
          <span className='rounded-full bg-brand-sunSoft px-3 py-1 text-brand-ink'>
            From {post.source_name}
          </span>
        ) : (
          <span className='rounded-full bg-brand-sunSoft px-3 py-1 text-brand-ink'>
            {BRAND.shortName}
          </span>
        )}
      </div>

      <h1 className='mt-4'>{post.title}</h1>
      {post.summary && <p className='mt-4 text-lg text-brand-muted'>{post.summary}</p>}

      {post.origin === 'curated' && (
        <div className='mt-6 rounded-2xl border border-brand-line bg-brand-sunSoft/60 p-5 text-sm text-brand-ink'>
          <p className='font-semibold'>This is a short summary by {BRAND.shortName}.</p>
          <p className='mt-1 text-brand-muted'>
            The full article lives at {post.source_name ?? 'the source'} — we only ever publish a
            brief summary here, never the full text.
          </p>
          {post.source_url && (
            <a
              href={post.source_url}
              target='_blank'
              rel='noopener noreferrer'
              className='mt-3 inline-flex items-center font-semibold text-brand-green hover:underline'
            >
              Read the full story at {post.source_name ?? 'the source'} ↗
            </a>
          )}
        </div>
      )}

      <div className='mt-8 flex flex-col gap-5 text-brand-muted'>
        {paragraphs.length > 0 ? (
          paragraphs.map((para, i) => (
            <p key={i} className='whitespace-pre-wrap leading-relaxed'>
              {para}
            </p>
          ))
        ) : (
          <p className='leading-relaxed'>No further detail yet.</p>
        )}
      </div>

      {post.origin === 'curated' && post.source_url && (
        <div className='mt-8'>
          <Button variant='brand' asChild>
            <a href={post.source_url} target='_blank' rel='noopener noreferrer'>
              Read the full story at {post.source_name ?? 'the source'} ↗
            </a>
          </Button>
        </div>
      )}

      <div className='mt-10 rounded-2xl bg-brand-green p-6 text-center text-white sm:p-8'>
        <h2 className='text-white'>Does this call fit your organisation?</h2>
        <p className='mx-auto mt-2 max-w-xl text-sm text-white/85'>
          Take the quiz and find out in under five minutes — or browse every open grant in the
          directory.
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
