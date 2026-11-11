'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { type NewsPostInput,saveNewsPost } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { slugify } from '@/libs/news/rss';

export type NewsPostFormValues = {
  id: string | null;
  title: string;
  slug: string;
  summary: string;
  body: string;
  source_name: string;
  source_url: string;
  status: 'draft' | 'published';
  origin: 'original' | 'curated';
};

const inputClass =
  'w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30';

/** Admin-only form: write or edit a news post. Slug auto-follows the title. */
export function NewsPostForm({ initial }: { initial: NewsPostFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<NewsPostFormValues>(initial);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof NewsPostFormValues>(key: K, value: NewsPostFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function onTitle(title: string) {
    setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) }));
  }

  async function submit(status: 'draft' | 'published') {
    setBusy(true);
    setError('');
    const input: NewsPostInput = {
      title: values.title,
      slug: values.slug,
      summary: values.summary,
      body: values.body,
      source_name: values.source_name,
      source_url: values.source_url,
      status,
    };
    const res = await saveNewsPost(values.id, input);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push('/admin/news');
    router.refresh();
  }

  return (
    <form
      className='flex flex-col gap-5'
      onSubmit={(e) => {
        e.preventDefault();
        submit(values.status);
      }}
    >
      {values.origin === 'curated' && (
        <div className='rounded-2xl border border-brand-line bg-brand-sunSoft/60 p-4 text-sm text-brand-ink'>
          <p className='font-semibold'>Curated from {values.source_name || 'an RSS feed'}.</p>
          <p className='mt-1 text-brand-muted'>
            This draft came from the news feed. Check the title and summary, then publish it — or
            delete it if it is not relevant to African organisations. Only the short summary is
            published here; readers follow the link to the full article.
          </p>
        </div>
      )}

      <div>
        <label htmlFor='news-title' className='text-sm font-semibold text-brand-ink'>
          Title
        </label>
        <input
          id='news-title'
          className={inputClass}
          value={values.title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder='e.g. New $20,000 grant opens for youth-led NGOs in West Africa'
          required
        />
      </div>

      <div>
        <label htmlFor='news-slug' className='text-sm font-semibold text-brand-ink'>
          URL slug
        </label>
        <input
          id='news-slug'
          className={inputClass}
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set('slug', e.target.value);
          }}
          placeholder='auto-generated from the title'
        />
        <p className='mt-1 text-xs text-brand-muted'>The post will live at /news/{values.slug || '…'}</p>
      </div>

      <div>
        <label htmlFor='news-summary' className='text-sm font-semibold text-brand-ink'>
          Summary (shown on the news list)
        </label>
        <textarea
          id='news-summary'
          className={`${inputClass} min-h-20`}
          value={values.summary}
          onChange={(e) => set('summary', e.target.value)}
          placeholder='One or two sentences — what is this about, and why should an African organisation care?'
        />
      </div>

      <div>
        <label htmlFor='news-body' className='text-sm font-semibold text-brand-ink'>
          Body
        </label>
        <textarea
          id='news-body'
          className={`${inputClass} min-h-64`}
          value={values.body}
          onChange={(e) => set('body', e.target.value)}
          placeholder='The full article, one idea per paragraph. Leave a blank line between paragraphs.'
        />
        <p className='mt-1 text-xs text-brand-muted'>
          Plain text — blank lines separate paragraphs. For curated posts, keep the body to the
          short summary; the full article stays at the source.
        </p>
      </div>

      <div className='grid gap-5 sm:grid-cols-2'>
        <div>
          <label htmlFor='news-source-name' className='text-sm font-semibold text-brand-ink'>
            Source name (curated posts)
          </label>
          <input
            id='news-source-name'
            className={inputClass}
            value={values.source_name}
            onChange={(e) => set('source_name', e.target.value)}
            placeholder='e.g. fundsforNGOs'
          />
        </div>
        <div>
          <label htmlFor='news-source-url' className='text-sm font-semibold text-brand-ink'>
            Source URL (original article)
          </label>
          <input
            id='news-source-url'
            className={inputClass}
            value={values.source_url}
            onChange={(e) => set('source_url', e.target.value)}
            placeholder='https://…'
          />
        </div>
      </div>

      {error && <p className='text-sm text-red-700'>{error}</p>}

      <div className='flex flex-wrap gap-2'>
        <Button variant='outline' type='button' disabled={busy} onClick={() => submit('draft')}>
          {busy ? 'Saving…' : 'Save as draft'}
        </Button>
        <Button variant='brand' type='submit' disabled={busy}>
          {busy ? 'Saving…' : 'Save & publish'}
        </Button>
        <Button variant='ghost' type='button' disabled={busy} onClick={() => router.push('/admin/news')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
