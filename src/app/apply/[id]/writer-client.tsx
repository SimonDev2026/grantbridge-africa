'use client';

import { useState } from 'react';

import { saveDraftSections } from '@/app/apply/[id]/actions';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export type DraftSection = { title: string; body: string };

/** Renders [placeholders] highlighted in yellow — missing facts are never invented. */
function renderWithPlaceholders(text: string) {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((p, i) =>
    /^\[[^\]]+\]$/.test(p) ? (
      <mark key={i} className='hl-placeholder'>
        {p}
      </mark>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

export function WriterClient({
  grantId,
  grantTitle,
  initialDraftId,
  initialSections,
  documentsRequired,
  officialUrl,
}: {
  grantId: string;
  grantTitle: string;
  initialDraftId: string | null;
  initialSections: DraftSection[];
  documentsRequired: string[];
  officialUrl: string;
}) {
  const [draftId, setDraftId] = useState(initialDraftId);
  const [sections, setSections] = useState<DraftSection[]>(initialSections);
  const [active, setActive] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [checked, setChecked] = useState(false);

  async function generate(force = false) {
    setError('');
    setGenerating(true);
    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grantId, force }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Draft failed');
      setDraftId(data.id);
      setSections((data.sections as DraftSection[]) ?? []);
      setActive(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!draftId) return;
    const r = await saveDraftSections(draftId, sections);
    setSaved(r.error ? r.error : 'Saved.');
    setTimeout(() => setSaved(''), 3000);
  }

  const activeSection = sections[active];

  return (
    <div className='flex flex-col gap-6 py-8'>
      <div>
        <h1 className='text-3xl lg:text-4xl'>Write this application</h1>
        <p className='mt-1 text-brand-muted'>{grantTitle}</p>
        <p className='mt-2 text-sm text-brand-muted'>
          The AI drafts from your profile and uploaded documents only. Anything missing shows as a
          yellow <mark className='hl-placeholder'>[placeholder]</mark> — fill it in yourself; the
          writer never invents facts.
        </p>
      </div>

      {error && <p className='rounded-xl bg-red-50 p-4 text-sm text-red-700'>{error}</p>}

      <div className='flex flex-wrap gap-2'>
        <Button
          variant='brand'
          disabled={generating}
          onClick={() => generate(false)}
        >
          {generating ? 'Drafting…' : draftId ? 'Regenerate draft' : 'Generate AI draft'}
        </Button>
        {draftId && (
          <>
            <Button variant='outline' onClick={save}>
              Save edits
            </Button>
            <Button variant='outline' asChild>
              <a href={`/api/drafts/${draftId}/docx`}>Export Word</a>
            </Button>
            <Button variant='outline' asChild>
              <a href={`/api/drafts/${draftId}/pdf`}>Export PDF</a>
            </Button>
          </>
        )}
        {saved && <span className='self-center text-sm text-brand-green'>{saved}</span>}
      </div>

      {sections.length > 0 && activeSection ? (
        <div className='grid gap-4 lg:grid-cols-[280px_1fr]'>
          {/* Sections list */}
          <div className='flex flex-col gap-2'>
            {sections.map((s, i) => (
              <button
                key={i}
                type='button'
                onClick={() => setActive(i)}
                className={cn(
                  'rounded-xl border p-3 text-left text-sm font-medium',
                  i === active ? 'border-brand-green bg-brand-greenSoft' : 'border-brand-line bg-white'
                )}
              >
                {i + 1}. {s.title}
              </button>
            ))}
          </div>
          {/* Editor */}
          <div className='rounded-2xl border border-brand-line bg-white p-5'>
            <h2 className='text-xl'>{activeSection.title}</h2>
            <div className='mt-3 whitespace-pre-wrap rounded-xl bg-brand-bg p-4 text-sm leading-relaxed'>
              {renderWithPlaceholders(activeSection.body)}
            </div>
            <label className='mt-4 block text-sm font-medium text-brand-muted'>
              Edit this section
              <textarea
                value={activeSection.body}
                onChange={(e) =>
                  setSections((ss) => ss.map((s, i) => (i === active ? { ...s, body: e.target.value } : s)))
                }
                rows={10}
                className='mt-1 w-full rounded-xl border border-brand-line bg-white p-3 text-base'
              />
            </label>
          </div>
        </div>
      ) : (
        <div className='rounded-2xl border border-brand-line bg-white p-8 text-center text-brand-muted'>
          No draft yet. Generate one to see every section the funder asks for.
        </div>
      )}

      {/* Submission checklist */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Submission checklist</h2>
        <ul className='mt-3 flex flex-col gap-2 text-sm'>
          <li>
            <label className='flex items-start gap-2'>
              <input type='checkbox' checked={checked} onChange={(e) => setChecked(e.target.checked)} className='mt-1' />
              <span>I have reviewed every yellow [placeholder] and filled in the real facts.</span>
            </label>
          </li>
          {documentsRequired.map((d) => (
            <li key={d} className='text-brand-muted'>
              • Attach: {d}
            </li>
          ))}
          <li className='text-brand-muted'>
            • Submit on the funder’s own portal:{' '}
            <a href={officialUrl} target='_blank' rel='noreferrer' className='font-semibold text-brand-green hover:underline'>
              {officialUrl}
            </a>
          </li>
          <li className='text-brand-muted'>
            • We never ask for your portal password — you press submit yourself.
          </li>
        </ul>
        <p className={cn('mt-3 text-sm', checked ? 'text-brand-green' : 'text-brand-muted')}>
          {checked ? 'Ready to submit — good luck!' : 'Tick the review box when every placeholder is filled.'}
        </p>
      </section>
    </div>
  );
}
