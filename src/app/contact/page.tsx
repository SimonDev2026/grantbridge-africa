'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';

const MAX_MESSAGE_LENGTH = 1000;

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, subject, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'Your message could not be sent. Please try again.');
      setSent(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className='mx-auto max-w-2xl py-16 text-center'>
        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-greenSoft text-2xl text-brand-green'>
          ✓
        </div>
        <h1 className='mt-4'>Message sent</h1>
        <p className='mx-auto mt-3 max-w-md text-brand-muted'>
          Thank you — your message is on its way to the {BRAND.shortName} team. We reply within one
          working day.
        </p>
        <div className='mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button variant='brand' asChild>
            <Link href='/quiz'>Find my grants →</Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href='/faq'>Read the FAQ</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl py-10'>
      <h1>Contact us</h1>
      <p className='mt-3 max-w-2xl text-lg text-brand-muted'>
        Questions about a grant, your account, a plan, or the writer? Tell us what you need — we
        read every message and reply within one working day.
      </p>

      <div className='mt-8 grid gap-8 lg:grid-cols-5'>
        <div className='lg:col-span-2'>
          <div className='rounded-2xl border border-brand-line bg-white p-6'>
            <h2 className='text-lg'>Other ways to reach us</h2>
            <p className='mt-2 text-sm text-brand-muted'>
              Prefer email? Write to us directly at{' '}
              <a
                href={`mailto:${BRAND.contact.email}`}
                className='font-semibold text-brand-green hover:underline'
              >
                {BRAND.contact.email}
              </a>
              . For support questions, use{' '}
              <a
                href={`mailto:${BRAND.contact.supportEmail}`}
                className='font-semibold text-brand-green hover:underline'
              >
                {BRAND.contact.supportEmail}
              </a>
              .
            </p>
            <p className='mt-3 text-sm text-brand-muted'>
              For quick updates, join our{' '}
              <a
                href={BRAND.social.whatsappChannel}
                target='_blank'
                rel='noreferrer'
                className='font-semibold text-brand-green hover:underline'
              >
                WhatsApp channel
              </a>
              .
            </p>
            <p className='mt-3 text-sm text-brand-muted'>
              Before writing, the{' '}
              <Link href='/faq' className='font-semibold text-brand-green hover:underline'>
                FAQ
              </Link>{' '}
              answers the most common questions about matching, pricing and privacy.
            </p>
          </div>
        </div>

        <form
          onSubmit={submit}
          className='rounded-2xl border border-brand-line bg-white p-6 lg:col-span-3'
        >
          <div className='flex flex-col gap-5'>
            <div>
              <label htmlFor='contact-email' className='mb-1 block text-sm font-semibold text-brand-ink'>
                Your email
              </label>
              <input
                id='contact-email'
                type='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='you@organisation.org'
                className='min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'
              />
            </div>

            <div>
              <label htmlFor='contact-subject' className='mb-1 block text-sm font-semibold text-brand-ink'>
                Subject
              </label>
              <input
                id='contact-subject'
                type='text'
                required
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder='e.g. Question about my Writer plan'
                className='min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'
              />
            </div>

            <div>
              <label htmlFor='contact-message' className='mb-1 block text-sm font-semibold text-brand-ink'>
                Message
              </label>
              <textarea
                id='contact-message'
                required
                rows={6}
                maxLength={MAX_MESSAGE_LENGTH}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder='Tell us what you need help with…'
                className='w-full rounded-lg border border-brand-line bg-white p-3 text-base'
              />
              <p className='mt-1 text-right text-xs text-brand-muted'>
                {message.length}/{MAX_MESSAGE_LENGTH}
              </p>
            </div>

            {error && (
              <p role='alert' className='rounded-xl bg-red-50 p-3 text-sm text-red-700'>
                {error}
              </p>
            )}

            <Button type='submit' variant='brand' disabled={sending}>
              {sending ? 'Sending…' : 'Send message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
