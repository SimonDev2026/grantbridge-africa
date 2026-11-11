'use client';

import { useState } from 'react';

import { unsubscribeByEmail } from '@/app/unsubscribe/actions';
import { Button } from '@/components/ui/button';

const inputClass =
  'w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30';

/** Manual unsubscribe form — no token needed (unsubscribing is reversible by re-consenting). */
export function UnsubscribeForm() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await unsubscribeByEmail(email);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(res.email!);
  }

  if (done) {
    return (
      <p className='text-sm text-brand-ink'>
        <strong>{done}</strong> is unsubscribed — you will not receive GrantBridge marketing
        emails again. If you change your mind, take the quiz again and tick the marketing box.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className='flex flex-col gap-3'>
      <label htmlFor='unsub-email' className='text-sm font-semibold text-brand-ink'>
        Your email address
      </label>
      <input
        id='unsub-email'
        type='email'
        required
        className={inputClass}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder='you@example.org'
      />
      {error && <p className='text-sm text-red-700'>{error}</p>}
      <Button variant='brand' type='submit' disabled={busy} className='w-fit'>
        {busy ? 'Unsubscribing…' : 'Unsubscribe me'}
      </Button>
    </form>
  );
}
