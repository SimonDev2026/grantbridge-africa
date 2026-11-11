'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  type CmsEventInput,
  type CmsStatInput,
  type CmsTestimonialInput,
  saveCmsEvent,
  saveCmsStat,
  saveCmsTestimonial,
} from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

const inputClass =
  'w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30';

/** Shared save bar: save as draft / save & publish / cancel. */
function SaveBar({
  busy,
  onSave,
  onCancel,
}: {
  busy: boolean;
  onSave: (status: 'draft' | 'published') => void;
  onCancel: () => void;
}) {
  return (
    <div className='flex flex-wrap gap-2'>
      <Button variant='outline' type='button' disabled={busy} onClick={() => onSave('draft')}>
        {busy ? 'Saving…' : 'Save as draft'}
      </Button>
      <Button variant='brand' type='submit' disabled={busy}>
        {busy ? 'Saving…' : 'Save & publish'}
      </Button>
      <Button variant='ghost' type='button' disabled={busy} onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

export type EventFormValues = {
  id: string | null;
  title: string;
  starts_at: string;
  location: string;
  description: string;
  status: 'draft' | 'published';
};

/** Admin-only form: write or edit a public event. */
export function CmsEventForm({ initial }: { initial: EventFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<EventFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(status: 'draft' | 'published') {
    setBusy(true);
    setError('');
    const input: CmsEventInput = {
      title: values.title,
      starts_at: values.starts_at,
      location: values.location,
      description: values.description,
      status,
    };
    const res = await saveCmsEvent(values.id, input);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push('/admin/cms');
    router.refresh();
  }

  return (
    <form
      className='flex flex-col gap-5'
      onSubmit={(e) => {
        e.preventDefault();
        submit(values.status);
      }}
    >
      <div>
        <label htmlFor='event-title' className='text-sm font-semibold text-brand-ink'>
          Title
        </label>
        <input
          id='event-title'
          className={inputClass}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder='e.g. Live webinar: How to win a D-Prize grant'
          required
        />
      </div>
      <div className='grid gap-5 sm:grid-cols-2'>
        <div>
          <label htmlFor='event-starts' className='text-sm font-semibold text-brand-ink'>
            Date and time
          </label>
          <input
            id='event-starts'
            type='datetime-local'
            className={inputClass}
            value={values.starts_at}
            onChange={(e) => set('starts_at', e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor='event-location' className='text-sm font-semibold text-brand-ink'>
            Location
          </label>
          <input
            id='event-location'
            className={inputClass}
            value={values.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder='e.g. Online (Zoom) or Lagos, Nigeria'
          />
        </div>
      </div>
      <div>
        <label htmlFor='event-description' className='text-sm font-semibold text-brand-ink'>
          Description
        </label>
        <textarea
          id='event-description'
          className={`${inputClass} min-h-32`}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder='What will happen, who it is for, and how to join.'
        />
      </div>
      {error && <p className='text-sm text-red-700'>{error}</p>}
      <SaveBar busy={busy} onSave={submit} onCancel={() => router.push('/admin/cms')} />
    </form>
  );
}

export type StatFormValues = {
  id: string | null;
  key: string;
  label: string;
  sub: string;
  value: string;
  source: 'live' | 'manual';
  sort_order: number;
  status: 'draft' | 'published';
};

/** Admin-only form: add or edit a figure in the homepage stats band. */
export function CmsStatForm({ initial }: { initial: StatFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<StatFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof StatFormValues>(key: K, value: StatFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(status: 'draft' | 'published') {
    setBusy(true);
    setError('');
    const input: CmsStatInput = {
      key: values.key,
      label: values.label,
      sub: values.sub,
      value: values.value,
      sort_order: values.sort_order,
      status,
    };
    const res = await saveCmsStat(values.id, input);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push('/admin/cms');
    router.refresh();
  }

  const isLive = initial.source === 'live';

  return (
    <form
      className='flex flex-col gap-5'
      onSubmit={(e) => {
        e.preventDefault();
        submit(values.status);
      }}
    >
      {isLive && (
        <div className='rounded-2xl border border-brand-line bg-brand-greenSoft/60 p-4 text-sm text-brand-ink'>
          <p className='font-semibold'>Live figure — computed from the grants database.</p>
          <p className='mt-1 text-brand-muted'>
            The value is always the real count right now, so it cannot be typed here. You can
            change the label, the explanation, the order, and whether it shows.
          </p>
        </div>
      )}
      <div className='grid gap-5 sm:grid-cols-2'>
        <div>
          <label htmlFor='stat-key' className='text-sm font-semibold text-brand-ink'>
            Key
          </label>
          <input
            id='stat-key'
            className={inputClass}
            value={values.key}
            onChange={(e) => set('key', e.target.value)}
            placeholder='e.g. organisations_helped'
            disabled={!!values.id}
            required
          />
          <p className='mt-1 text-xs text-brand-muted'>Unique identifier — cannot change once saved.</p>
        </div>
        <div>
          <label htmlFor='stat-order' className='text-sm font-semibold text-brand-ink'>
            Display order
          </label>
          <input
            id='stat-order'
            type='number'
            className={inputClass}
            value={values.sort_order}
            onChange={(e) => set('sort_order', Number(e.target.value) || 0)}
          />
        </div>
      </div>
      <div>
        <label htmlFor='stat-label' className='text-sm font-semibold text-brand-ink'>
          Label
        </label>
        <input
          id='stat-label'
          className={inputClass}
          value={values.label}
          onChange={(e) => set('label', e.target.value)}
          placeholder='e.g. Organisations helped'
          required
        />
      </div>
      <div>
        <label htmlFor='stat-sub' className='text-sm font-semibold text-brand-ink'>
          Explanation (shown under the figure)
        </label>
        <input
          id='stat-sub'
          className={inputClass}
          value={values.sub}
          onChange={(e) => set('sub', e.target.value)}
          placeholder='e.g. African organisations matched since launch'
        />
      </div>
      <div>
        <label htmlFor='stat-value' className='text-sm font-semibold text-brand-ink'>
          Value
        </label>
        <input
          id='stat-value'
          className={inputClass}
          value={values.value}
          onChange={(e) => set('value', e.target.value)}
          placeholder='e.g. 120+'
          disabled={isLive}
        />
        <p className='mt-1 text-xs text-brand-muted'>
          {isLive
            ? 'Live figures ignore this field — the value is computed from the database.'
            : 'Shown exactly as typed — only enter a real, verified number.'}
        </p>
      </div>
      {error && <p className='text-sm text-red-700'>{error}</p>}
      <SaveBar busy={busy} onSave={submit} onCancel={() => router.push('/admin/cms')} />
    </form>
  );
}

export type TestimonialFormValues = {
  id: string | null;
  name: string;
  role: string;
  quote: string;
  status: 'draft' | 'published';
};

/** Admin-only form: add or edit a testimonial. Only real quotes from real people. */
export function CmsTestimonialForm({ initial }: { initial: TestimonialFormValues }) {
  const router = useRouter();
  const [values, setValues] = useState<TestimonialFormValues>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof TestimonialFormValues>(key: K, value: TestimonialFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function submit(status: 'draft' | 'published') {
    setBusy(true);
    setError('');
    const input: CmsTestimonialInput = {
      name: values.name,
      role: values.role,
      quote: values.quote,
      status,
    };
    const res = await saveCmsTestimonial(values.id, input);
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push('/admin/cms');
    router.refresh();
  }

  return (
    <form
      className='flex flex-col gap-5'
      onSubmit={(e) => {
        e.preventDefault();
        submit(values.status);
      }}
    >
      <div className='rounded-2xl border border-brand-line bg-brand-sunSoft/60 p-4 text-sm text-brand-ink'>
        <p className='font-semibold'>Only real testimonials from real people.</p>
        <p className='mt-1 text-brand-muted'>
          Add a quote only when a real user has actually said it — with their real name and
          organisation. Never invent a quote, a name, or an organisation.
        </p>
      </div>
      <div className='grid gap-5 sm:grid-cols-2'>
        <div>
          <label htmlFor='testimonial-name' className='text-sm font-semibold text-brand-ink'>
            Name
          </label>
          <input
            id='testimonial-name'
            className={inputClass}
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder='e.g. Adaeze Okonkwo'
            required
          />
        </div>
        <div>
          <label htmlFor='testimonial-role' className='text-sm font-semibold text-brand-ink'>
            Role / organisation
          </label>
          <input
            id='testimonial-role'
            className={inputClass}
            value={values.role}
            onChange={(e) => set('role', e.target.value)}
            placeholder='e.g. Executive Director, Hope for Girls Foundation'
          />
        </div>
      </div>
      <div>
        <label htmlFor='testimonial-quote' className='text-sm font-semibold text-brand-ink'>
          Quote
        </label>
        <textarea
          id='testimonial-quote'
          className={`${inputClass} min-h-32`}
          value={values.quote}
          onChange={(e) => set('quote', e.target.value)}
          placeholder='The exact words they said — do not paraphrase into a stronger claim.'
          required
        />
      </div>
      {error && <p className='text-sm text-red-700'>{error}</p>}
      <SaveBar busy={busy} onSave={submit} onCancel={() => router.push('/admin/cms')} />
    </form>
  );
}
