import Link from 'next/link';

import { cn } from '@/utils/cn';

export type GrantCardData = {
  id: string;
  title: string;
  funderName?: string | null;
  summary?: string | null;
  amount_usd_min?: number | null;
  amount_usd_max?: number | null;
  currency?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  scope?: string | null;
  deadline?: string | null;
  rolling?: boolean | null;
  score?: number | null;
  reasons?: string[] | null;
  country?: string | null;
  example?: boolean;
};

export function formatAmount(g: GrantCardData): string {
  if (g.amount_usd_max) return `Up to $${g.amount_usd_max.toLocaleString()}`;
  if (g.amount_usd_min) return `From $${g.amount_usd_min.toLocaleString()}`;
  if (g.amount_max && g.currency) return `Up to ${g.currency} ${g.amount_max.toLocaleString()}`;
  return 'Amount varies';
}

export function scopeTag(g: GrantCardData): string {
  if (g.scope === 'international') return `International · open to ${g.country ?? 'African applicants'}`;
  if (g.scope === 'africa') return 'Africa-focused';
  if (g.scope === 'national') return `National · ${g.country ?? ''}`;
  return 'Grant';
}

export function GrantCard({ grant }: { grant: GrantCardData }) {
  return (
    <article className='flex flex-col rounded-2xl border border-brand-line bg-white p-5'>
      <div className='flex flex-wrap items-center gap-2'>
        <span className='rounded-full bg-brand-blueTag px-3 py-1 text-xs font-semibold text-brand-ink'>
          {scopeTag(grant)}
        </span>
        {grant.score != null && (
          <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-semibold text-brand-green'>
            {grant.score}% fit
          </span>
        )}
        {grant.example && (
          <span className='rounded-full bg-brand-sunSoft px-3 py-1 text-xs font-semibold text-brand-ink'>
            Example funder we track
          </span>
        )}
      </div>
      <h3 className='mt-3'>{grant.title}</h3>
      {grant.funderName && <p className='mt-1 text-sm font-medium text-brand-muted'>{grant.funderName}</p>}
      {grant.summary && <p className='mt-2 line-clamp-3 text-sm text-brand-muted'>{grant.summary}</p>}
      <div className='mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm'>
        <span className='font-semibold text-brand-ink'>{formatAmount(grant)}</span>
        <span className='text-brand-muted'>
          {grant.rolling ? 'Rolling deadline' : grant.deadline ? `Deadline ${grant.deadline}` : 'Deadline TBC'}
        </span>
      </div>
      {grant.reasons && grant.reasons.length > 0 && (
        <ul className='mt-3 flex flex-col gap-1'>
          {grant.reasons.slice(0, 4).map((r) => (
            <li key={r} className='text-sm text-brand-muted'>
              ✓ {r}
            </li>
          ))}
        </ul>
      )}
      <div className='mt-4'>
        {grant.example ? (
          <span className='text-sm font-medium text-brand-green'>Tracked by {grant.funderName}</span>
        ) : (
          <Link href={`/grants/${grant.id}`} className='text-sm font-semibold text-brand-green hover:underline'>
            View grant →
          </Link>
        )}
      </div>
    </article>
  );
}

export function GrantCardSkeleton() {
  return <div className={cn('h-56 animate-pulse rounded-2xl bg-brand-greenSoft')} />;
}
