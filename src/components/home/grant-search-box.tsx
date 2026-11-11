'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { cn } from '@/utils/cn';

import { type GrantSearchResult,searchGrants } from './search-actions';

function scopeLabel(scope: string | null): string {
  if (scope === 'international') return 'International';
  if (scope === 'africa') return 'Africa-focused';
  if (scope === 'national') return 'National';
  return 'Grant';
}

/** Live "Search grants" box — queries the real grants table as you type. */
export function GrantSearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GrantSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(() => {
      searchGrants(query)
        .then((r) => {
          setResults(r);
          setOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className='relative mx-auto w-full max-w-xl text-left'>
      <div className='flex items-center gap-2 rounded-full border border-brand-line bg-white p-1.5 pl-5 shadow-sm focus-within:border-brand-green focus-within:ring-2 focus-within:ring-brand-green/20'>
        <span aria-hidden className='text-brand-muted'>
          🔍
        </span>
        <input
          type='search'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter') router.push('/quiz');
          }}
          placeholder='Search grants — try “education”, “health”, “women”…'
          aria-label='Search grants'
          className='min-w-0 flex-1 bg-transparent text-sm text-brand-ink outline-none placeholder:text-brand-muted'
        />
        {searching && <span className='pr-2 text-xs text-brand-muted'>Searching…</span>}
        <button
          type='button'
          onClick={() => router.push('/quiz')}
          className={cn(
            'btn-shine flex-shrink-0 rounded-full bg-brand-green px-5 py-2.5 text-sm font-medium text-white',
            'transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-brand-green/90 hover:shadow-lg active:translate-y-0 active:scale-[0.97]'
          )}
        >
          Search
        </button>
      </div>

      {showDropdown && (
        <div className='search-dropdown-enter absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-brand-line bg-white shadow-xl'>
          {results.length > 0 ? (
            <ul>
              {results.map((g) => (
                <li key={g.id} className='border-b border-brand-line last:border-b-0'>
                  <Link
                    href='/quiz'
                    className='block px-5 py-3 transition-colors hover:bg-brand-greenSoft/60'
                  >
                    <span className='block font-semibold text-brand-ink'>{g.title}</span>
                    <span className='mt-0.5 block text-sm text-brand-muted'>
                      {g.funderName ?? 'Funder TBC'} · {scopeLabel(g.scope)} · {g.amountLabel} ·{' '}
                      {g.rolling ? 'Rolling deadline' : g.deadline ? `Deadline ${g.deadline}` : 'Deadline TBC'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            !searching && (
              <Link href='/quiz' className='block px-5 py-4 text-sm text-brand-muted hover:bg-brand-greenSoft/60'>
                No matching grants yet — <span className='font-semibold text-brand-green'>take the quiz</span>{' '}
                to see everything you qualify for.
              </Link>
            )
          )}
        </div>
      )}
    </div>
  );
}
