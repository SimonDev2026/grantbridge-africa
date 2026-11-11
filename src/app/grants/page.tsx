// GET /grants — public directory of every approved open grant in the
// database. Previously this route 404'd (only /grants/[id] existed).
// Data comes only from the grants/funders tables via the anon client —
// nothing here is invented. Keyword + scope filters are plain query params
// (?q=…&scope=…) so the page is shareable and crawlable.
import Link from 'next/link';

import { GrantCard } from '@/components/grant-card';
import { supabasePublicClient } from '@/libs/supabase/supabase-public';

const db = supabasePublicClient as any;

const SCOPES = [
  { value: 'all', label: 'All regions' },
  { value: 'international', label: 'International' },
  { value: 'africa', label: 'Africa-focused' },
  { value: 'national', label: 'National' },
] as const;

export const metadata = {
  title: 'All open grants — GrantBridge Africa',
  description: 'Every approved open grant in our collection, from funders that accept African applicants.',
};

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; scope?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().toLowerCase();
  const scope = (sp.scope ?? 'all').toLowerCase();

  const [{ data: grants, error }, { data: funders }] = await Promise.all([
    db
      .from('grants')
      .select('*')
      .eq('approved', true)
      .eq('fee_charged', false)
      .in('status', ['open', 'upcoming'])
      .order('deadline', { ascending: true, nullsFirst: false }),
    db.from('funders').select('id, name'),
  ]);

  if (error) {
    return (
      <div className='mx-auto max-w-5xl py-10'>
        <h1>All open grants</h1>
        <p className='mt-4 text-brand-muted'>
          The grant list could not load just now — please try again, or take the quiz and we will
          match you instead.
        </p>
        <Link href='/quiz' className='mt-4 inline-block font-semibold text-brand-green hover:underline'>
          Find my grants →
        </Link>
      </div>
    );
  }

  const funderNameById = new Map<string, string>(
    (funders ?? []).map((f: any) => [f.id, f.name])
  );
  const rows = ((grants ?? []) as any[]).map((g) => ({
    ...g,
    funderName: funderNameById.get(g.funder_id) ?? null,
  }));
  const filtered = rows.filter((g: any) => {
    if (scope !== 'all' && g.scope !== scope) return false;
    if (!q) return true;
    return [g.title, g.summary, g.funderName].some(
      (v: any) => typeof v === 'string' && v.toLowerCase().includes(q)
    );
  });

  const scopeHref = (s: string) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (s !== 'all') p.set('scope', s);
    const qs = p.toString();
    return qs ? `/grants?${qs}` : '/grants';
  };

  return (
    <div className='mx-auto max-w-5xl py-10'>
      <h1>All open grants</h1>
      <p className='mt-3 max-w-2xl text-brand-muted'>
        Every approved open grant in our collection right now, from funders that accept African
        applicants. {rows.length} open grant{rows.length === 1 ? '' : 's'} — take the quiz to see
        which ones you actually qualify for, ranked by fit.
      </p>

      <form action='/grants' method='get' className='mt-6 flex flex-col gap-3 sm:flex-row'>
        <input
          type='search'
          name='q'
          defaultValue={sp.q ?? ''}
          placeholder='Search by keyword, funder or topic…'
          className='min-h-11 flex-1 rounded-lg border border-brand-line bg-white px-3 text-base outline-none focus:border-brand-green'
        />
        {scope !== 'all' && <input type='hidden' name='scope' value={scope} />}
        <button
          type='submit'
          className='min-h-11 rounded-lg bg-brand-green px-5 font-semibold text-white transition hover:-translate-y-0.5'
        >
          Search
        </button>
      </form>

      <div className='mt-4 flex flex-wrap gap-2'>
        {SCOPES.map((s) => (
          <Link
            key={s.value}
            href={scopeHref(s.value)}
            className={
              scope === s.value
                ? 'rounded-full bg-brand-green px-3 py-1 text-xs font-semibold text-white'
                : 'rounded-full border border-brand-line bg-white px-3 py-1 text-xs font-semibold text-brand-muted hover:text-brand-green'
            }
          >
            {s.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className='mt-8 rounded-2xl border border-brand-line bg-white p-6 text-center text-brand-muted'>
          No open grants match that search. Try a different keyword, or{' '}
          <Link href='/grants' className='font-semibold text-brand-green hover:underline'>
            clear the filters
          </Link>
          .
        </p>
      ) : (
        <>
          <p className='mt-6 text-sm text-brand-muted'>
            Showing {filtered.length} of {rows.length} open grant{rows.length === 1 ? '' : 's'}.
          </p>
          <div className='mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
            {filtered.map((g: any) => (
              <GrantCard key={g.id} grant={g} />
            ))}
          </div>
        </>
      )}

      <p className='mt-8 text-sm text-brand-muted'>
        Want your personal shortlist?{' '}
        <Link href='/quiz' className='font-semibold text-brand-green hover:underline'>
          Take the quiz — free →
        </Link>
      </p>
    </div>
  );
}
