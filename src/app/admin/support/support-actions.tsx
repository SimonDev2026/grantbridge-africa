'use client';

import { useState } from 'react';

import { markSupportMessageReplied } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

/** Admin-only button: marks one support message as replied. */
export function MarkRepliedButton({ messageId }: { messageId: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    setBusy(true);
    setError('');
    const res = await markSupportMessageReplied(messageId);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) return <span className='text-sm font-semibold text-brand-green'>Replied ✓</span>;

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant='outline' size='sm' onClick={run} disabled={busy}>
        {busy ? 'Saving…' : 'Mark as replied'}
      </Button>
      {error && <span className='text-xs text-red-700'>{error}</span>}
    </span>
  );
}
