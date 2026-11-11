'use client';

import { useState } from 'react';

import { deleteNewsPost, setNewsPostStatus } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

/** Admin-only button: polls the RSS feeds and queues new items as drafts. */
export function FetchNewsButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);
    setFailed(false);
    try {
      const res = await fetch('/api/admin/fetch-news', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Fetch failed');
      const lines = (data.results ?? []).map(
        (r: any) =>
          `${r.source}: ${r.inserted} new, ${r.skipped} skipped${r.error ? ` — ${r.error}` : ''}`
      );
      setResult(lines.join(' · ') || 'No feeds configured.');
    } catch (e) {
      setFailed(true);
      setResult((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant='brand' onClick={run} disabled={busy}>
        {busy ? 'Fetching…' : 'Fetch latest news'}
      </Button>
      {result && (
        <span className={`text-xs ${failed ? 'text-red-700' : 'text-brand-muted'}`}>{result}</span>
      )}
    </span>
  );
}

/** Admin-only button: publish a draft or unpublish a live post. */
export function PublishToggleButton({
  postId,
  published,
}: {
  postId: string;
  published: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function run() {
    setBusy(true);
    setError('');
    const res = await setNewsPostStatus(postId, published ? 'draft' : 'published');
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) return <span className='text-sm font-semibold text-brand-green'>Saved ✓</span>;

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant={published ? 'outline' : 'brand'} size='sm' onClick={run} disabled={busy}>
        {busy ? 'Saving…' : published ? 'Unpublish' : 'Publish'}
      </Button>
      {error && <span className='text-xs text-red-700'>{error}</span>}
    </span>
  );
}

/** Admin-only button: two-step delete (first click arms, second confirms). */
export function DeletePostButton({ postId }: { postId: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    const res = await deleteNewsPost(postId);
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant='destructive' size='sm' onClick={run} disabled={busy}>
        {busy ? 'Deleting…' : armed ? 'Click again to delete' : 'Delete'}
      </Button>
      {armed && !busy && (
        <button type='button' className='text-xs text-brand-muted hover:underline' onClick={() => setArmed(false)}>
          Cancel
        </button>
      )}
      {error && <span className='text-xs text-red-700'>{error}</span>}
    </span>
  );
}
