'use client';

import { useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';

import { ROLES } from './roles';

const MAX_MESSAGE_LENGTH = 1000;

function ExpressionOfInterestForm() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      const res = await fetch('/api/careers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message }),
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
      <div className='rounded-2xl border border-brand-line bg-white p-6 text-center'>
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-greenSoft text-xl text-brand-green'>
          ✓
        </div>
        <h2 className='mt-3 text-lg'>Thank you — noted</h2>
        <p className='mx-auto mt-2 max-w-md text-sm text-brand-muted'>
          Your expression of interest is on its way to the {BRAND.shortName} team. We will be in
          touch if a fitting role opens up.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className='rounded-2xl border border-brand-line bg-white p-6'
    >
      <h2 className='text-lg'>Expression of interest</h2>
      <p className='mt-1 text-sm text-brand-muted'>
        Tell us what you would like to do here and we will keep your note for when a role opens.
      </p>
      <div className='mt-5 flex flex-col gap-5'>
        <div>
          <label htmlFor='careers-email' className='mb-1 block text-sm font-semibold text-brand-ink'>
            Your email
          </label>
          <input
            id='careers-email'
            type='email'
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='you@example.org'
            className='min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'
          />
        </div>
        <div>
          <label htmlFor='careers-message' className='mb-1 block text-sm font-semibold text-brand-ink'>
            What would you like to do here?
          </label>
          <textarea
            id='careers-message'
            required
            rows={5}
            maxLength={MAX_MESSAGE_LENGTH}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='e.g. I write grant applications for health NGOs in Kenya and would love to help review drafts…'
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
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </form>
  );
}

export default function CareersPage() {
  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>Careers at {BRAND.name}</h1>
      <p className='mt-3 text-lg text-brand-muted'>
        We are building the tool that helps African organisations find and win the grants they
        qualify for. When we hire, the openings will be listed here.
      </p>

      <div className='mt-8 rounded-2xl border border-brand-line bg-white p-6 text-center sm:p-8'>
        <h2>No open roles right now</h2>
        <p className='mx-auto mt-2 max-w-md text-sm text-brand-muted'>
          {BRAND.shortName} is not hiring at the moment. If you would like to work with us in the
          future, leave an expression of interest below — we will be in touch if a fitting role
          opens up.
        </p>
      </div>

      {ROLES.length > 0 && (
        <section className='mt-8'>
          <h2>Open roles</h2>
          <div className='mt-4 flex flex-col gap-3'>
            {ROLES.map((role) => (
              <Link
                key={role.slug}
                href={`/careers/${role.slug}`}
                className='rounded-2xl border border-brand-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand-green hover:shadow-lg'
              >
                <span className='text-base font-semibold text-brand-ink'>{role.title}</span>
                <span className='mt-1 block text-sm text-brand-muted'>{role.summary}</span>
                <span className='mt-2 flex flex-wrap gap-2'>
                  <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-medium text-brand-green'>
                    {role.team}
                  </span>
                  <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-medium text-brand-green'>
                    {role.location}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className='mt-8'>
        <ExpressionOfInterestForm />
      </div>

      <p className='mt-6 text-center text-sm text-brand-muted'>
        Prefer email? Write to{' '}
        <a
          href={`mailto:${BRAND.contact.email}`}
          className='font-semibold text-brand-green hover:underline'
        >
          {BRAND.contact.email}
        </a>
        .
      </p>
    </div>
  );
}
