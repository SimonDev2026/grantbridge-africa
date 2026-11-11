import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { BRAND } from '@/config/brand';
import { cn } from '@/utils/cn';

/**
 * Shared visual kit for the admin back office. Visual only — no data fetching,
 * no auth, no API calls. Every admin page uses these so the back office reads
 * as one designed surface, matching the public site's light sand theme.
 */

type PillTone = 'green' | 'sun' | 'red' | 'muted' | 'blue';

const PILL_TONES: Record<PillTone, string> = {
  green: 'bg-brand-greenSoft text-brand-green',
  sun: 'bg-brand-sunSoft text-brand-ink',
  red: 'bg-red-50 text-red-700',
  muted: 'bg-brand-bg text-brand-muted',
  blue: 'bg-brand-blueTag text-brand-ink',
};

export function StatusPill({ tone, children }: { tone: PillTone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold',
        PILL_TONES[tone]
      )}
    >
      {children}
    </span>
  );
}

/** Page header band: logo mark, "Admin back office" label, title, subtitle, actions, nav. */
export function AdminPageHeader({
  title,
  subtitle,
  actions,
  active,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  active: 'overview' | 'orders' | 'support' | 'news';
}) {
  return (
    <div className='rounded-2xl border border-brand-line bg-white p-5 shadow-sm sm:p-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='flex items-start gap-3'>
          <Image
            src={BRAND.logo.mark}
            width={48}
            height={48}
            alt={BRAND.logo.alt}
            className='shrink-0 rounded-full'
          />
          <div>
            <span className='inline-block rounded-full bg-brand-greenSoft px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-green'>
              Admin · Back office
            </span>
            <h1 className='mt-2 text-3xl lg:text-4xl'>{title}</h1>
            <p className='mt-1 text-sm text-brand-muted'>{subtitle}</p>
          </div>
        </div>
        {actions && <div className='flex shrink-0 flex-wrap gap-2'>{actions}</div>}
      </div>
      <nav className='mt-5 flex gap-1 border-t border-brand-line pt-4 text-sm font-semibold'>
        <Link
          href='/admin'
          aria-current={active === 'overview' ? 'page' : undefined}
          className={cn(
            'rounded-full px-4 py-2 transition-colors',
            active === 'overview'
              ? 'bg-brand-green text-white'
              : 'text-brand-muted hover:bg-brand-greenSoft hover:text-brand-green'
          )}
        >
          Overview
        </Link>
        <Link
          href='/admin/orders'
          aria-current={active === 'orders' ? 'page' : undefined}
          className={cn(
            'rounded-full px-4 py-2 transition-colors',
            active === 'orders'
              ? 'bg-brand-green text-white'
              : 'text-brand-muted hover:bg-brand-greenSoft hover:text-brand-green'
          )}
        >
          Service orders
        </Link>
        <Link
          href='/admin/support'
          aria-current={active === 'support' ? 'page' : undefined}
          className={cn(
            'rounded-full px-4 py-2 transition-colors',
            active === 'support'
              ? 'bg-brand-green text-white'
              : 'text-brand-muted hover:bg-brand-greenSoft hover:text-brand-green'
          )}
        >
          Support messages
        </Link>
        <Link
          href='/admin/news'
          aria-current={active === 'news' ? 'page' : undefined}
          className={cn(
            'rounded-full px-4 py-2 transition-colors',
            active === 'news'
              ? 'bg-brand-green text-white'
              : 'text-brand-muted hover:bg-brand-greenSoft hover:text-brand-green'
          )}
        >
          News
        </Link>
      </nav>
    </div>
  );
}

/** Section heading: small eyebrow label + title + optional right-hand slot. */
export function AdminSectionHeading({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className='flex flex-wrap items-end justify-between gap-3'>
      <div>
        <p className='text-[11px] font-bold uppercase tracking-widest text-brand-green'>{eyebrow}</p>
        <h2 className='mt-1 text-xl lg:text-2xl'>{title}</h2>
      </div>
      {right}
    </div>
  );
}

/** White card shell used by every admin section. */
export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-2xl border border-brand-line bg-white p-5 shadow-sm sm:p-6', className)}>
      {children}
    </section>
  );
}
