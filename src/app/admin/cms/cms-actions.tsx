'use client';

import { useState } from 'react';

import {
  deleteCmsEvent,
  deleteCmsStat,
  deleteCmsTestimonial,
  setCmsEventStatus,
  setCmsStatStatus,
  setCmsTestimonialStatus,
} from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

type Kind = 'event' | 'stat' | 'testimonial';

const SET_STATUS: Record<Kind, (id: string, status: 'draft' | 'published') => Promise<{ error?: string }>> = {
  event: setCmsEventStatus,
  stat: setCmsStatStatus,
  testimonial: setCmsTestimonialStatus,
};

const DELETE: Record<Kind, (id: string) => Promise<{ error?: string }>> = {
  event: deleteCmsEvent,
  stat: deleteCmsStat,
  testimonial: deleteCmsTestimonial,
};

/** Admin-only button: publish a draft or unpublish a live CMS row. */
export function CmsPublishToggleButton({
  kind,
  id,
  published,
}: {
  kind: Kind;
  id: string;
  published: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function run() {
    setBusy(true);
    setError('');
    const res = await SET_STATUS[kind](id, published ? 'draft' : 'published');
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setDone(true);
  }

  if (done) return <span className='text-sm font-semibold text-brand-green'>Saved ✓</span>;

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant={published ? 'outline' : 'brand'} size='sm' onClick={run} disabled={busy}>
        {busy ? 'Saving…' : published ? 'Unpublish' : 'Publish'}
      </Button>
      {error && <span className='text-xs text-red-700'>{error}</span>}
    </span>
  );
}

/** Admin-only button: two-step delete (first click arms, second confirms). */
export function CmsDeleteButton({ kind, id }: { kind: Kind; id: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    const res = await DELETE[kind](id);
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant='destructive' size='sm' onClick={run} disabled={busy}>
        {busy ? 'Deleting…' : armed ? 'Click again to delete' : 'Delete'}
      </Button>
      {armed && !busy && (
        <button type='button' className='text-xs text-brand-muted hover:underline' onClick={() => setArmed(false)}>
          Cancel
        </button>
      )}
      {error && <span className='text-xs text-red-700'>{error}</span>}
    </span>
  );
}
