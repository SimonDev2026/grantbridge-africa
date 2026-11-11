'use client';

import { useEffect, useRef, useState } from 'react';

export type StatDef = {
  /** Numeric value for 'number'/'usd'; the exact text shown for 'text'. */
  value: number | string;
  label: string;
  sub: string;
  /**
   * 'number' renders with thousands separators; 'usd' renders as $ + compact
   * (e.g. $1.2M); 'text' renders the value exactly as written (admin-entered
   * figures such as "120+").
   */
  format: 'number' | 'usd' | 'text';
};

function formatValue(value: number | string, format: StatDef['format']): string {
  if (format === 'text') return String(value);
  const n = typeof value === 'number' ? value : Number(value) || 0;
  if (format === 'usd') {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
    return `$${n.toLocaleString()}`;
  }
  return n.toLocaleString();
}

function AnimatedCounter({ value, format }: { value: number | string; format: StatDef['format'] }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  const numeric = typeof value === 'number' ? value : Number(value) || 0;

  useEffect(() => {
    // Text figures are shown exactly as written — there is nothing to count.
    if (format === 'text') return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const duration = 1200;
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setDisplay(Math.round(numeric * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [numeric, format]);

  if (format === 'text') return <span>{String(value)}</span>;

  return <span ref={ref}>{formatValue(display, format)}</span>;
}

/** Animated stats strip — counters animate on scroll, values come from the live database. */
export function AnimatedStats({ stats }: { stats: StatDef[] }) {
  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-4'>
      {stats.map((s) => (
        <div key={s.label} className='rounded-2xl border border-brand-line bg-white p-5 text-center'>
          <div className='font-alt text-3xl font-bold text-brand-green lg:text-4xl'>
            <AnimatedCounter value={s.value} format={s.format} />
          </div>
          <div className='mt-1 font-semibold text-brand-ink'>{s.label}</div>
          <p className='mt-0.5 text-sm text-brand-muted'>{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
