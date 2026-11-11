'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { IoEye, IoEyeOff, IoLogoGoogle, IoMailOpenOutline } from 'react-icons/io5';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ActionResponse } from '@/types/action-response';

const copy = {
  login: {
    title: 'Welcome back to GrantBridge Africa',
    subtitle: 'Log in to see your matches, your tracker and your drafts.',
    submit: 'Log in',
    pending: 'Logging you in…',
  },
  signup: {
    title: 'Create your free GrantBridge Africa account',
    subtitle: 'Free Explorer account — take the quiz and see your top 3 grant matches.',
    submit: 'Create my free account',
    pending: 'Creating your account…',
  },
} as const;

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'That email or password is not correct. Please try again.';
  }
  if (/email not confirmed/i.test(message)) {
    return 'Please confirm your email first — check your inbox for the confirmation link, then log in.';
  }
  if (/password should be at least/i.test(message)) {
    return 'Your password needs to be at least 8 characters long.';
  }
  if (/user already registered/i.test(message)) {
    return 'An account with this email already exists. Try logging in instead.';
  }
  return message || 'Something went wrong. Please try again.';
}

export function AuthUI({
  mode,
  signInWithOAuth,
  signUpWithEmailPassword,
  signInWithEmailPassword,
  resendConfirmationEmail,
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'google', next?: string) => Promise<ActionResponse>;
  signUpWithEmailPassword: (email: string, password: string) => Promise<ActionResponse>;
  signInWithEmailPassword: (email: string, password: string) => Promise<ActionResponse>;
  resendConfirmationEmail: (email: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleResend(email: string) {
    setResendState('sending');
    const response = await resendConfirmationEmail(email);
    setResendState(response?.error ? 'error' : 'sent');
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUnconfirmedEmail(null);
    setResendState('idle');
    const form = event.target as HTMLFormElement;
    const email = (form['email'].value as string).trim();
    const password = form['password'].value as string;
    const confirmPassword =
      mode === 'signup' ? (form['confirmPassword'].value as string) : null;

    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup') {
      if (password.length < 8) {
        setError('Your password needs to be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('The two passwords do not match.');
        return;
      }
    }

    setPending(true);
    const response =
      mode === 'signup'
        ? await signUpWithEmailPassword(email, password)
        : await signInWithEmailPassword(email, password);

    if (response?.error) {
      const message = response.error.message ?? '';
      setError(friendlyAuthError(message));
      // Unconfirmed account on login: offer a fresh confirmation link
      // (the first link may have expired or gone to the wrong place).
      if (mode === 'login' && /email not confirmed/i.test(message)) {
        setUnconfirmedEmail(email);
      }
      setPending(false);
      return;
    }

    if (mode === 'signup' && (response?.data as any)?.needsConfirmation) {
      setConfirmationSentTo(email);
      setPending(false);
      return;
    }

    // On success the server action redirects, so we never reach here.
    setPending(false);
  }

  async function handleOAuthClick() {
    setPending(true);
    setError(null);
    const response = await signInWithOAuth('google', mode === 'signup' ? '/quiz' : '/dashboard');

    if (response?.error) {
      setError(friendlyAuthError(response.error.message ?? ''));
      setPending(false);
    }
  }

  return (
    <section className='w-full rounded-2xl border border-brand-line bg-white p-6 shadow-lg sm:p-10'>
      <div className='flex flex-col items-center gap-3 text-center'>
        <Logo />
        <h1 className='mt-2 text-2xl font-bold text-brand-ink'>{copy[mode].title}</h1>
        <p className='text-sm text-brand-muted'>{copy[mode].subtitle}</p>
      </div>

      {confirmationSentTo ? (
        <div className='mt-8 rounded-xl bg-brand-greenSoft p-6 text-center'>
          <IoMailOpenOutline size={36} className='mx-auto text-brand-green' />
          <h2 className='mt-3 text-lg font-bold text-brand-ink'>Check your email to confirm</h2>
          <p className='mt-2 text-sm text-brand-muted'>
            We sent a confirmation link to <strong>{confirmationSentTo}</strong>. Click it, and
            you will land straight on the quiz to find your grants.
          </p>
          <div className='mt-4'>
            <button
              type='button'
              onClick={() => handleResend(confirmationSentTo)}
              disabled={resendState === 'sending'}
              className='font-semibold text-brand-green hover:underline disabled:opacity-50'
            >
              {resendState === 'sent'
                ? 'Confirmation email sent again ✓'
                : resendState === 'sending'
                  ? 'Sending…'
                  : 'Didn’t get the email? Send it again'}
            </button>
            {resendState === 'error' && (
              <p className='mt-2 text-sm text-red-700'>
                Couldn’t resend the email — please try again in a minute.
              </p>
            )}
          </div>
          <p className='mt-4 text-sm text-brand-muted'>
            Already confirmed?{' '}
            <Link href='/login' className='font-semibold text-brand-green hover:underline'>
              Log in
            </Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleEmailSubmit} className='mt-8 flex flex-col gap-4'>
          <label className='flex flex-col gap-1.5 text-left text-sm font-medium text-brand-ink'>
            Email
            <Input
              type='email'
              name='email'
              placeholder='you@your-organisation.org'
              aria-label='Email address'
              autoComplete='email'
              autoFocus
              required
            />
          </label>

          <label className='flex flex-col gap-1.5 text-left text-sm font-medium text-brand-ink'>
            Password
            <span className='relative block'>
              <Input
                type={showPassword ? 'text' : 'password'}
                name='password'
                placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}
                aria-label='Password'
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                className='pr-11'
              />
              <button
                type='button'
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-brand-muted transition-colors hover:text-brand-green'
              >
                {showPassword ? <IoEyeOff size={18} /> : <IoEye size={18} />}
              </button>
            </span>
          </label>

          {mode === 'signup' && (
            <label className='flex flex-col gap-1.5 text-left text-sm font-medium text-brand-ink'>
              Confirm password
              <Input
                type={showPassword ? 'text' : 'password'}
                name='confirmPassword'
                placeholder='Type your password again'
                aria-label='Confirm password'
                autoComplete='new-password'
                required
              />
            </label>
          )}

          {error && (
            <p className='rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>
          )}

          {unconfirmedEmail && (
            <div className='rounded-lg bg-brand-sunSoft px-3 py-2 text-sm text-brand-ink'>
              Your email is not confirmed yet.{' '}
              <button
                type='button'
                onClick={() => handleResend(unconfirmedEmail)}
                disabled={resendState === 'sending'}
                className='font-semibold text-brand-green hover:underline disabled:opacity-50'
              >
                {resendState === 'sent'
                  ? 'Confirmation email sent ✓ — check your inbox'
                  : resendState === 'sending'
                    ? 'Sending…'
                    : 'Send a fresh confirmation link'}
              </button>
              {resendState === 'error' && (
                <span className='block text-red-700'>
                  Couldn’t resend the email — please try again in a minute.
                </span>
              )}
            </div>
          )}

          <Button type='submit' variant='brand' size='lg' className='mt-2 w-full' disabled={pending}>
            {pending ? copy[mode].pending : copy[mode].submit}
          </Button>
        </form>
      )}

      <div className='my-6 flex items-center gap-3 text-xs text-brand-muted'>
        <span className='h-px flex-1 bg-brand-line' />
        or continue with
        <span className='h-px flex-1 bg-brand-line' />
      </div>

      <button
        type='button'
        className='flex w-full items-center justify-center gap-2 rounded-md border border-brand-line bg-white py-3 font-medium text-brand-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-green/40 hover:shadow-md active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50'
        onClick={handleOAuthClick}
        disabled={pending}
      >
        <IoLogoGoogle size={20} className='text-brand-green' />
        Continue with Google
      </button>

      <p className='mt-6 text-center text-sm text-brand-muted'>
        {mode === 'signup' ? (
          <>
            Already have an account?{' '}
            <Link href='/login' className='font-semibold text-brand-green hover:underline'>
              Log in
            </Link>
          </>
        ) : (
          <>
            New to GrantBridge?{' '}
            <Link href='/signup' className='font-semibold text-brand-green hover:underline'>
              Create a free account
            </Link>
          </>
        )}
      </p>

      {mode === 'signup' && (
        <p className='mt-4 text-center text-xs text-brand-muted'>
          By creating an account, you agree to our{' '}
          <Link href='/terms' className='underline hover:text-brand-green'>
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href='/privacy' className='underline hover:text-brand-green'>
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </section>
  );
}
