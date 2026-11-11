'use client';

import { cn } from '@/utils/cn';

/** Thin progress bar shown at the top of every quiz screen. */
export function QuizProgress({
  answered,
  total,
  label,
}: {
  answered: number;
  total: number;
  label: string;
}) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div>
      <div className='flex items-center justify-between text-sm text-brand-muted'>
        <span>{label}</span>
        <span>
          {answered} of {total} · {pct}%
        </span>
      </div>
      <div
        className='mt-2 h-1.5 overflow-hidden rounded-full bg-brand-line'
        role='progressbar'
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label='Quiz progress'
      >
        <div
          className='h-full rounded-full bg-brand-green transition-all duration-500'
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Small "Why this matters" explainer shown under a question (1–2 lines). */
export function WhyThisMatters({ text }: { text: string }) {
  return (
    <p className='mt-3 rounded-xl bg-brand-sunSoft px-4 py-3 text-sm text-brand-ink'>
      <span className='font-semibold'>Why this matters: </span>
      {text}
    </p>
  );
}

export function StepShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('mx-auto w-full max-w-xl py-6 sm:py-10', className)}>{children}</div>;
}
