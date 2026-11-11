'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { cn } from '@/utils/cn';

export type OpportunityCardData = {
  id: string;
  title: string;
  funderName: string | null;
  amountLabel: string;
  category: string;
  deadline: string | null;
  rolling: boolean | null;
  score: number;
};

const WINDOW = 3;

/**
 * Looping carousel of real seeded grants — auto-advances, pauses on hover,
 * with prev/next arrows and dots. Match % is the deterministic scorer's
 * result for a typical Nigeria/NGO profile, labelled "Example match".
 */
export function OpportunitiesCarousel({ cards }: { cards: OpportunityCardData[] }) {
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = cards.length;

  useEffect(() => {
    if (paused || total <= WINDOW) return;
    const t = setInterval(() => setStart((s) => (s + 1) % total), 4500);
    return () => clearInterval(t);
  }, [paused, total]);

  if (total === 0) return null;

  const visible: OpportunityCardData[] = Array.from({ length: Math.min(WINDOW, total) }, (_, i) => {
    return cards[(start + i) % total];
  });

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className='relative'
    >
      <div key={start} className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        {visible.map((g) => (
          <article
            key={g.id}
            className='carousel-card-in flex flex-col rounded-2xl border border-brand-line bg-white p-5'
          >
            <div className='flex flex-wrap items-center gap-2'>
              <span className='rounded-full bg-brand-blueTag px-3 py-1 text-xs font-semibold text-brand-ink'>
                {g.category}
              </span>
              <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green'>
                {g.score}% example match
              </span>
            </div>
            <h3 className='mt-3 text-lg'>{g.title}</h3>
            {g.funderName && <p className='mt-1 text-sm font-medium text-brand-muted'>{g.funderName}</p>}
            <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
              <span className='font-semibold text-brand-ink'>{g.amountLabel}</span>
              <span className='text-brand-muted'>
                {g.rolling ? 'Rolling deadline' : g.deadline ? `Deadline ${g.deadline}` : 'Deadline TBC'}
              </span>
            </div>
            <div className='mt-4'>
              <Link href='/quiz' className='text-sm font-semibold text-brand-green hover:underline'>
                See if you qualify →
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className='mt-6 flex items-center justify-center gap-4'>
        <button
          type='button'
          aria-label='Previous opportunities'
          onClick={() => setStart((s) => (s - 1 + total) % total)}
          className='flex h-9 w-9 items-center justify-center rounded-full border border-brand-line bg-white text-brand-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95'
        >
          ←
        </button>
        <div className='flex gap-2'>
          {cards.map((c, i) => (
            <button
              key={c.id}
              type='button'
              aria-label={`Go to opportunity ${i + 1}`}
              onClick={() => setStart(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === start ? 'w-6 bg-brand-green' : 'w-2 bg-brand-line hover:bg-brand-green/50'
              )}
            />
          ))}
        </div>
        <button
          type='button'
          aria-label='Next opportunities'
          onClick={() => setStart((s) => (s + 1) % total)}
          className='flex h-9 w-9 items-center justify-center rounded-full border border-brand-line bg-white text-brand-ink transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-95'
        >
          →
        </button>
      </div>
    </div>
  );
}
