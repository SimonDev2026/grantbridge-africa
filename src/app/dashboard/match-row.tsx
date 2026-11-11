'use client';

import { useState } from 'react';
import Link from 'next/link';

import { setMatchStatus } from '@/app/dashboard/actions';
import { GrantCardData } from '@/components/grant-card';

const KANBAN = ['saved', 'applying', 'submitted', 'won', 'lost'] as const;

export function MatchRow({ match }: { match: GrantCardData & { status?: string | null } }) {
  const [status, setStatus] = useState(match.status ?? 'new');
  const [busy, setBusy] = useState(false);

  async function change(next: string) {
    setStatus(next);
    setBusy(true);
    await setMatchStatus(match.id, next);
    setBusy(false);
  }

  return (
    <div className='flex flex-col gap-3 rounded-2xl border border-brand-line bg-white p-5 sm:flex-row sm:items-start sm:justify-between'>
      <div className='min-w-0'>
        <div className='flex flex-wrap items-center gap-2'>
          <span className='rounded-full bg-brand-blueTag px-3 py-1 text-xs font-semibold'>
            {match.scope === 'international'
              ? `International · open to ${match.country ?? 'African applicants'}`
              : match.scope === 'africa'
                ? 'Africa-focused'
                : 'Grant'}
          </span>
          {match.score != null && match.score > 0 && (
            <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green'>
              {match.score}% fit
            </span>
          )}
        </div>
        <Link href={`/grants/${match.id}`} className='mt-2 block font-alt text-lg font-bold text-brand-ink hover:underline'>
          {match.title}
        </Link>
        {match.funderName && <p className='text-sm text-brand-muted'>{match.funderName}</p>}
        <p className='mt-1 text-sm text-brand-muted'>
          {match.amount_usd_max ? `Up to $${match.amount_usd_max.toLocaleString()}` : 'Amount varies'} ·{' '}
          {match.rolling ? 'Rolling deadline' : match.deadline ? `Deadline ${match.deadline}` : 'Deadline TBC'}
        </p>
        {match.reasons && match.reasons.length > 0 && (
          <p className='mt-1 text-sm text-brand-muted'>✓ {match.reasons[0]}</p>
        )}
      </div>
      <div className='flex flex-shrink-0 flex-col gap-2'>
        <label className='text-xs font-medium text-brand-muted'>
          Tracker
          <select
            value={status}
            disabled={busy}
            onChange={(e) => change(e.target.value)}
            className='mt-1 block min-h-10 rounded-lg border border-brand-line bg-white px-2 text-sm'
          >
            <option value='new'>New</option>
            {KANBAN.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
            <option value='skipped'>Skipped</option>
          </select>
        </label>
        <Link
          href={`/apply/${match.id}`}
          className='rounded-lg bg-brand-green px-4 py-2 text-center text-sm font-semibold text-white hover:bg-brand-green/90'
        >
          Write application
        </Link>
      </div>
    </div>
  );
}
