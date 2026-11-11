'use client';

import { useState } from 'react';

import { markOrderComplete, requestOrderRevision, sendClientMessage } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

export function OrderClientActions({ orderId, status, revisionCount }: { orderId: string; status: string; revisionCount: number }) {
  const [message, setMessage] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<{ ok?: boolean; error?: string }>) {
    setBusy(true);
    const r = await fn();
    setResult(r.error ?? 'Done.');
    setBusy(false);
    if (r.ok) window.location.reload();
  }

  return (
    <div className='flex flex-col gap-6'>
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Message our team</h2>
        <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Ask a question about your order…'
            className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 text-sm'
          />
          <Button disabled={!message.trim() || busy} onClick={() => run(() => sendClientMessage(orderId, message))} variant='brand'>
            Send
          </Button>
        </div>
      </section>

      {status === 'delivered' && (
        <section className='rounded-2xl border border-brand-line bg-white p-5'>
          <h2>Your application is delivered</h2>
          <p className='mt-1 text-sm text-brand-muted'>
            One revision is included. If anything needs changing, describe it below — after that,
            mark the order complete.
          </p>
          {revisionCount >= 1 ? (
            <p className='mt-3 text-sm text-brand-muted'>Your included revision has been used.</p>
          ) : (
            <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
              <input
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder='What should we change?'
                className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 text-sm'
              />
              <Button disabled={!revisionNote.trim() || busy} variant='outline' onClick={() => run(() => requestOrderRevision(orderId, revisionNote))}>
                Request my one revision
              </Button>
            </div>
          )}
          <div className='mt-4'>
            <Button disabled={busy} onClick={() => run(() => markOrderComplete(orderId))} variant='brand'>
              Mark order complete
            </Button>
          </div>
        </section>
      )}
      {result && <p className='text-sm text-brand-green'>{result}</p>}
    </div>
  );
}
