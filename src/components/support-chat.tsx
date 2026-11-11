'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { cn } from '@/utils/cn';

/**
 * Floating chat support button (bottom-right, every page via the root layout).
 * Visitors send name + email + message; POST /api/support-message saves it to
 * the database first and emails the shared mailbox (info@grantbridgeafrica.com).
 * The thread stays visible in the panel (kept in localStorage so a reload
 * does not wipe it).
 */

type ChatLine = { role: 'team' | 'you'; text: string };

const TEAM_GREETING: ChatLine = {
  role: 'team',
  text: 'Hi! Tell us what you need — a person on our team will reply to your email, usually within one working day.',
};

const STORAGE_KEY = 'gb-support-thread';

function loadThread(): ChatLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [TEAM_GREETING];
    const parsed = JSON.parse(raw) as ChatLine[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [TEAM_GREETING];
    return parsed;
  } catch {
    return [TEAM_GREETING];
  }
}

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [thread, setThread] = useState<ChatLine[]>([TEAM_GREETING]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setThread(loadThread());
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(thread));
    } catch {
      // Storage full or unavailable — the thread still shows this session.
    }
  }, [thread]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/support-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? 'Could not send your message.');
      setThread((t) => [...t, { role: 'you', text: message }]);
      setMessage('');
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  function startAnother() {
    setSent(false);
    setName('');
    setEmail('');
    setMessage('');
  }

  const inputClass =
    'min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted/70 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30';

  return (
    <div className='fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6'>
      {open && (
        <div className='bubble-pop flex w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xl'>
          <div className='flex items-start justify-between gap-3 bg-brand-green px-5 py-4 text-white'>
            <div>
              <p className='font-alt text-base font-semibold'>Chat with us</p>
              <p className='mt-0.5 text-xs text-white/80'>
                We reply within one working day — to {BRAND.contact.email}
              </p>
            </div>
            <button
              type='button'
              onClick={() => setOpen(false)}
              aria-label='Close chat'
              className='rounded-full p-1 text-white/80 transition-colors hover:bg-white/10 hover:text-white'
            >
              <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
                <path d='M18 6 6 18M6 6l12 12' />
              </svg>
            </button>
          </div>

          <div className='flex max-h-72 flex-col gap-2 overflow-y-auto bg-brand-bg px-4 py-4'>
            {thread.map((line, i) => (
              <div
                key={i}
                className={cn(
                  'w-fit max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                  line.role === 'team'
                    ? 'self-start rounded-bl-sm bg-white text-brand-ink shadow-sm'
                    : 'self-end rounded-br-sm bg-brand-greenSoft text-brand-ink'
                )}
              >
                {line.text}
              </div>
            ))}
            {sent && (
              <div className='self-start w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-brand-sunSoft px-3 py-2 text-sm leading-relaxed text-brand-ink shadow-sm'>
                Thanks — your message is with the team. We&rsquo;ll reply to {email} within one
                working day.
              </div>
            )}
          </div>

          {sent ? (
            <div className='border-t border-brand-line p-4'>
              <Button variant='outline' onClick={startAnother} className='w-full'>
                Send another message
              </Button>
              <p className='mt-3 text-center text-xs text-brand-muted'>
                Prefer email? Write to us directly at{' '}
                <a href={`mailto:${BRAND.contact.email}`} className='font-semibold text-brand-green hover:underline'>
                  {BRAND.contact.email}
                </a>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={send} className='flex flex-col gap-3 border-t border-brand-line p-4'>
              <input
                type='text'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Your name'
                aria-label='Your name'
                className={inputClass}
              />
              <input
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Your email'
                aria-label='Your email'
                className={inputClass}
              />
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='How can we help?'
                aria-label='Your message'
                rows={3}
                className={cn(inputClass, 'resize-none')}
              />
              {error && <p className='text-sm text-red-700'>{error}</p>}
              <Button type='submit' variant='brand' disabled={sending} className='w-full'>
                {sending ? 'Sending…' : 'Send message'}
              </Button>
            </form>
          )}
        </div>
      )}

      <button
        type='button'
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat support' : 'Open chat support'}
        aria-expanded={open}
        className='group flex h-14 w-14 items-center justify-center rounded-full bg-brand-sun text-brand-ink shadow-lg transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green focus-visible:ring-offset-2 active:scale-[0.97]'
      >
        {open ? (
          <svg width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round'>
            <path d='M18 6 6 18M6 6l12 12' />
          </svg>
        ) : (
          <svg width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z' />
          </svg>
        )}
      </button>
    </div>
  );
}
