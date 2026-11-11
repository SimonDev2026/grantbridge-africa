'use client';

import Link from 'next/link';

import { GrantCard, type GrantCardData } from '@/components/grant-card';
import { Button } from '@/components/ui/button';

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Results gate — anonymous visitors see their top 3 free and the rest blurred
 * behind the email unlock; signed-in users see every match, saved to their
 * account. Funders are shown with their real names (these are public
 * grants); nothing is hidden as "Confidential funder".
 */
export function ResultsGate({
  matches,
  matchError,
  totalValueUsd,
  email,
  setEmail,
  marketing,
  setMarketing,
  unlocked,
  unlocking,
  unlockError,
  onUnlock,
  signedIn,
}: {
  matches: GrantCardData[];
  matchError: string;
  /** Sum of amount_usd_max across matches, or null when no amounts published. */
  totalValueUsd: number | null;
  email: string;
  setEmail: (v: string) => void;
  marketing: boolean;
  setMarketing: (v: boolean) => void;
  unlocked: boolean;
  unlocking: boolean;
  unlockError: string;
  onUnlock: (e: React.FormEvent) => void;
  /** True when the visitor is signed in (read server-side by the quiz page). */
  signedIn: boolean;
}) {
  const top3 = matches.slice(0, 3);
  const rest = matches.slice(3);
  const emailValid = isValidEmail(email);

  return (
    <div className='mx-auto w-full max-w-4xl py-6 sm:py-10'>
      <h1 className='text-center text-3xl lg:text-4xl'>
        {matches.length > 0
          ? `We found ${matches.length} matching grant${matches.length === 1 ? '' : 's'}`
          : 'Your matches'}
      </h1>
      <p className='mx-auto mt-2 max-w-xl text-center text-brand-muted'>
        {matches.length > 0 ? (
          <>
            {totalValueUsd != null && totalValueUsd > 0 ? (
              <>
                Worth up to{' '}
                <span className='font-semibold text-brand-ink'>
                  ${totalValueUsd.toLocaleString()}
                </span>{' '}
                combined —{' '}
              </>
            ) : null}
            ranked by fit for your organisation. {signedIn ? (
              <>
                All {matches.length} shown below — saved to your account.
              </>
            ) : (
              <>
                Your top 3 are free to see below; unlock the rest with your email.
              </>
            )}
          </>
        ) : (
          'No open grants match your answers right now — new grants are added regularly, and we will email you when one fits.'
        )}
      </p>
      {matchError && (
        <p className='mt-4 rounded-xl bg-red-50 p-4 text-center text-sm text-red-700'>
          {matchError}
        </p>
      )}

      {top3.length > 0 && (
        <div className='mt-8 grid gap-4 md:grid-cols-3'>
          {top3.map((g) => (
            <GrantCard key={g.id} grant={g} />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className='mt-8'>
          {!unlocked && !signedIn ? (
            <div className='relative'>
              <div className='grid gap-4 opacity-40 blur-sm md:grid-cols-3' aria-hidden>
                {rest.slice(0, 3).map((g) => (
                  <GrantCard key={g.id} grant={g} />
                ))}
              </div>
              <form
                onSubmit={onUnlock}
                className='absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/80 p-6 text-center'
              >
                <h2 className='text-2xl'>See all {matches.length} matches</h2>
                <p className='max-w-md text-sm text-brand-muted'>
                  Enter your email to unlock the full shortlist. We&apos;ll also send you new
                  matches when they open. No spam, unsubscribe any time.
                </p>
                <div className='flex w-full max-w-md flex-col gap-2 sm:flex-row'>
                  <label htmlFor='quiz-unlock-email' className='sr-only'>
                    Email address
                  </label>
                  <input
                    id='quiz-unlock-email'
                    type='email'
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder='you@organisation.org'
                    autoComplete='email'
                    className='min-h-11 flex-1 rounded-lg border border-brand-line bg-white px-3 text-base'
                  />
                  <Button type='submit' disabled={unlocking || !emailValid} variant='brand'>
                    {unlocking ? 'Unlocking…' : 'Show my grants'}
                  </Button>
                </div>
                {!emailValid && email.length > 0 && (
                  <p className='text-sm text-red-600'>Enter a valid email address to continue.</p>
                )}
                <label className='flex max-w-md cursor-pointer items-start gap-2 text-left text-sm text-brand-muted'>
                  <input
                    type='checkbox'
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className='mt-0.5 h-4 w-4 shrink-0 accent-[#0E6B4A]'
                  />
                  <span>
                    Also send me the weekly email of new grants (optional — you can unsubscribe
                    any time).
                  </span>
                </label>
                {unlockError && <p className='text-sm text-red-600'>{unlockError}</p>}
              </form>
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-3'>
              {rest.map((g) => (
                <GrantCard key={g.id} grant={g} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className='mt-10 rounded-2xl bg-brand-greenSoft p-6 text-center'>
        {signedIn ? (
          <>
            <h2>Your matches are saved to your account</h2>
            <p className='mx-auto mt-2 max-w-xl text-sm text-brand-muted'>
              Your profile is filled in from these answers. Pick a plan to unlock AI drafts
              for every match.
            </p>
            <div className='mt-4 flex flex-wrap justify-center gap-3'>
              <Button variant='brand' asChild>
                <Link href='/pricing'>See plans →</Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href='/dashboard'>Go to your dashboard →</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2>Save these matches and get AI drafts</h2>
            <p className='mx-auto mt-2 max-w-xl text-sm text-brand-muted'>
              Create your free account to save matches, track deadlines, and draft applications.
            </p>
            <div className='mt-4'>
              <Button variant='brand' asChild>
                <Link href='/signup'>Create your free account →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
