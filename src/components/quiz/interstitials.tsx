'use client';

import { useEffect, useState } from 'react';

import { formatAmount,GrantCard } from '@/components/grant-card';
import { Button } from '@/components/ui/button';

import type { PreviewResult, QuizStats } from './types';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function InterstitialShell({
  eyebrow,
  title,
  intro,
  onBack,
  onContinue,
  continueLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  onBack: () => void;
  onContinue: () => void;
  continueLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className='mx-auto w-full max-w-xl py-6 text-center sm:py-10'>
      <p className='text-xs font-semibold uppercase tracking-widest text-brand-green'>{eyebrow}</p>
      <h1 className='mt-2 text-3xl lg:text-4xl'>{title}</h1>
      <p className='mx-auto mt-3 max-w-md text-brand-muted'>{intro}</p>
      <div className='mt-6 text-left'>{children}</div>
      <div className='mt-8 flex items-center justify-between gap-3'>
        <Button variant='outline' onClick={onBack}>
          ← Back
        </Button>
        <Button variant='brand' size='lg' onClick={onContinue}>
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* a. After "who you are": "You are in the right place"                */
/* ------------------------------------------------------------------ */

/** Stylised Africa outline (decorative, not to scale) with funder dots. */
function AfricaMap() {
  return (
    <svg
      viewBox='0 0 240 240'
      className='mx-auto h-56 w-auto sm:h-64'
      role='img'
      aria-label='Stylised map of Africa'
    >
      <path
        d='M78 28 C95 18 120 20 138 30 C160 32 175 40 182 55 C190 70 200 82 198 96 C196 108 186 116 180 128 C176 146 172 162 164 178 C158 194 148 206 134 208 C122 210 110 202 104 190 C96 176 92 160 88 144 C84 128 78 116 66 108 C54 100 44 96 38 86 C32 76 30 64 38 54 C46 44 60 36 78 28 Z'
        fill='#E7F3EC'
        stroke='#0E6B4A'
        strokeWidth='2'
        strokeLinejoin='round'
      />
      {/* Madagascar */}
      <ellipse cx='206' cy='176' rx='7' ry='18' fill='#E7F3EC' stroke='#0E6B4A' strokeWidth='1.5' transform='rotate(12 206 176)' />
      {/* Decorative funder dots across the continent */}
      <circle cx='70' cy='80' r='5' fill='#E8A33D' />
      <circle cx='120' cy='60' r='5' fill='#0E6B4A' />
      <circle cx='160' cy='110' r='5' fill='#E8A33D' />
      <circle cx='110' cy='130' r='5' fill='#0E6B4A' />
      <circle cx='140' cy='180' r='5' fill='#E8A33D' />
      <circle cx='90' cy='160' r='5' fill='#0E6B4A' />
    </svg>
  );
}

export function MapInterstitial({
  stats,
  onBack,
  onContinue,
}: {
  stats: QuizStats | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  const highlights = stats?.highlights ?? [];
  return (
    <InterstitialShell
      eyebrow='Good news'
      title='You are in the right place'
      intro='Funders from around the world give to African organisations like yours. These are real grants open right now in our database — not a sample list.'
      onBack={onBack}
      onContinue={onContinue}
      continueLabel='Continue →'
    >
      <div className='rounded-2xl border border-brand-line bg-white p-4 sm:p-6'>
        <AfricaMap />
        {highlights.length > 0 ? (
          <div className='mt-4 flex flex-wrap justify-center gap-2'>
            {highlights.map((h) => (
              <span
                key={h.id}
                className='rounded-full border border-brand-line bg-brand-sunSoft px-3 py-1.5 text-xs font-semibold text-brand-ink'
              >
                {h.funderName ?? h.title} · {formatAmount(h)}
              </span>
            ))}
          </div>
        ) : (
          <p className='mt-4 text-center text-sm text-brand-muted'>
            The live funder list could not load just now — your matches will still be checked
            against the live database at the end.
          </p>
        )}
        {stats && (
          <p className='mt-4 text-center text-sm text-brand-muted'>
            {stats.openGrants} open grant{stats.openGrants === 1 ? '' : 's'} from {stats.funders}{' '}
            funder{stats.funders === 1 ? '' : 's'} right now.
          </p>
        )}
      </div>
    </InterstitialShell>
  );
}

/* ------------------------------------------------------------------ */
/* b. Mid-quiz animated scan: "AI agents working"                      */
/* ------------------------------------------------------------------ */

// Real capabilities of the quiz matcher — what the deterministic scorer
// actually does (see src/features/matching/score.ts). No invented powers.
const SCAN_CAPABILITIES = [
  'Checking every eligibility rule for your country',
  'Matching your sector and the people you serve',
  'Filtering by the amount you need',
  'Ranking every match by fit, soonest deadline first',
];

export function ScanInterstitial({
  preview,
  previewLoading,
  onBack,
  onContinue,
}: {
  preview: PreviewResult | null;
  previewLoading: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    if (revealed >= SCAN_CAPABILITIES.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 650);
    return () => clearTimeout(t);
  }, [revealed]);

  return (
    <InterstitialShell
      eyebrow='Working on it'
      title='AI agents working'
      intro='While you answer, we are already checking your answers against every open grant — no waiting at the end.'
      onBack={onBack}
      onContinue={onContinue}
      continueLabel='Keep going →'
    >
      <div className='rounded-2xl border border-brand-line bg-white p-4 sm:p-6'>
        <ul className='flex flex-col gap-3'>
          {SCAN_CAPABILITIES.map((c, i) => (
            <li key={c} className='flex items-start gap-3 text-sm sm:text-base'>
              <span
                className={
                  i < revealed
                    ? 'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-white'
                    : 'mt-0.5 flex h-6 w-6 shrink-0 animate-pulse items-center justify-center rounded-full bg-brand-line text-xs text-brand-muted'
                }
                aria-hidden
              >
                {i < revealed ? '✓' : '…'}
              </span>
              <span className={i < revealed ? 'text-brand-ink' : 'text-brand-muted'}>{c}</span>
            </li>
          ))}
        </ul>

        <div className='mt-6 rounded-xl bg-brand-greenSoft p-4 text-center'>
          {previewLoading || !preview ? (
            <p className='animate-pulse text-sm text-brand-muted'>Checking open grants…</p>
          ) : (
            <>
              <p className='text-3xl font-bold text-brand-green'>{preview.eligibleCount}</p>
              <p className='mt-1 text-sm font-medium text-brand-ink'>
                match{preview.eligibleCount === 1 ? '' : 'es'} found so far
              </p>
              <p className='mt-1 text-xs text-brand-muted'>
                {preview.scored
                  ? 'Based on your answers so far — the full ranking runs at the end.'
                  : `Open grants in our database${preview.openGrants ? ` (${preview.openGrants} open right now)` : ''} — answer the next questions to narrow this down.`}
              </p>
            </>
          )}
        </div>

        {preview?.examples?.length ? (
          <div className='mt-6'>
            <p className='mb-3 text-center text-xs font-semibold uppercase tracking-widest text-brand-muted'>
              Examples from the database
            </p>
            <div className='grid gap-3 sm:grid-cols-2'>
              {preview.examples.map((g) => (
                <GrantCard key={g.id} grant={g} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </InterstitialShell>
  );
}

/* ------------------------------------------------------------------ */
/* c. Near the end: "Your results are almost ready"                    */
/* ------------------------------------------------------------------ */

export function AlmostReadyInterstitial({
  stats,
  onBack,
  onContinue,
}: {
  stats: QuizStats | null;
  onBack: () => void;
  onContinue: () => void;
}) {
  const tiles = [
    { value: stats ? String(stats.openGrants) : '…', label: 'open grants in the database' },
    { value: stats ? String(stats.funders) : '…', label: 'funders with open calls' },
    { value: stats ? String(stats.countriesCovered) : '…', label: 'African countries covered' },
  ];
  return (
    <InterstitialShell
      eyebrow='Nearly there'
      title='Your results are almost ready'
      intro='One last question, then we rank every grant that fits you. Nothing is hidden or held back — your list is every open grant that matches your answers, ranked by fit.'
      onBack={onBack}
      onContinue={onContinue}
      continueLabel='Last question →'
    >
      <div className='grid grid-cols-3 gap-3'>
        {tiles.map((t) => (
          <div
            key={t.label}
            className='rounded-2xl border border-brand-line bg-white p-4 text-center'
          >
            <p className='text-2xl font-bold text-brand-green sm:text-3xl'>{t.value}</p>
            <p className='mt-1 text-xs text-brand-muted'>{t.label}</p>
          </div>
        ))}
      </div>
      <p className='mt-4 text-center text-sm text-brand-muted'>
        Your top 3 matches are free to see. The rest unlock with your email — no card, no trial,
        no commitment.
      </p>
    </InterstitialShell>
  );
}

/* ------------------------------------------------------------------ */
/* Completion screen (after the last step, before the loading screen)  */
/* ------------------------------------------------------------------ */

export function CompletionScreen({
  recap,
  onSeeMatches,
  onBack,
}: {
  recap: { label: string; value: string }[];
  onSeeMatches: () => void;
  onBack: () => void;
}) {
  return (
    <div className='mx-auto w-full max-w-xl py-6 text-center sm:py-10'>
      <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green text-2xl font-bold text-white'>
        ✓
      </div>
      <h1 className='mt-4 text-3xl lg:text-4xl'>That&apos;s everything — your answers are in</h1>
      <p className='mx-auto mt-3 max-w-md text-brand-muted'>
        We&apos;ll now check every open grant against your answers and rank the ones you qualify
        for. This usually takes a few seconds.
      </p>
      {recap.length > 0 && (
        <div className='mt-6 flex flex-wrap justify-center gap-2'>
          {recap.map((r) => (
            <span
              key={r.label}
              className='rounded-full border border-brand-line bg-white px-3 py-1.5 text-xs font-medium text-brand-ink'
            >
              <span className='text-brand-muted'>{r.label}: </span>
              {r.value}
            </span>
          ))}
        </div>
      )}
      <div className='mt-8 flex items-center justify-between gap-3'>
        <Button variant='outline' onClick={onBack}>
          ← Back
        </Button>
        <Button variant='sun' size='lg' onClick={onSeeMatches}>
          See my matches →
        </Button>
      </div>
    </div>
  );
}
