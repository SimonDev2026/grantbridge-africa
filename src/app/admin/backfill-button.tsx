'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

/** Admin-only button: embeds every approved grant that has no vector yet. */
export function BackfillEmbeddingsButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);
    setFailed(false);
    try {
      const res = await fetch('/api/admin/backfill-embeddings', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Backfill failed');
      setResult(
        `${data.embedded} grant${data.embedded === 1 ? '' : 's'} embedded. ` +
          `${data.remaining} approved grant${data.remaining === 1 ? '' : 's'} still missing an embedding.` +
          (data.failed > 0 ? ` ${data.failed} failed — try again.` : '')
      );
    } catch (e) {
      setFailed(true);
      setResult((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='flex flex-col items-start gap-2'>
      <Button variant='brand' onClick={run} disabled={busy}>
        {busy ? 'Embedding…' : 'Backfill embeddings'}
      </Button>
      {result && (
        <p className={`text-sm ${failed ? 'text-red-700' : 'text-brand-muted'}`}>{result}</p>
      )}
    </div>
  );
}
