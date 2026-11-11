'use client';

import { useEffect, useRef, useState } from 'react';

import { deleteDocument, saveProfile, uploadDocument } from '@/app/profile/actions';
import { Button } from '@/components/ui/button';
import {
  AFRICAN_COUNTRIES,
  ANNUAL_BUDGETS,
  APPLICANT_TYPES,
  BENEFICIARIES,
  FUNDING_NEEDS,
  PROJECT_STAGES,
  REGISTRATION_TYPES,
  SECTORS,
} from '@/config/countries';
import { cn } from '@/utils/cn';

export type ProfileData = {
  org_name: string | null;
  applicant_type: string | null;
  registration_type: string | null;
  country: string | null;
  state: string | null;
  description: string | null;
  sectors: string[] | null;
  beneficiaries: string[] | null;
  funding_need: number | null;
  annual_budget: number | null;
  stage: string | null;
  team_size: string | null;
  whatsapp_number: string | null;
  whatsapp_opt_in: boolean | null;
};

const DOC_KINDS = [
  'Registration certificate',
  'Constitution',
  'Annual report',
  'Budget',
  'Support letter',
  'Photo',
  'Other',
];

export function ProfileClient({
  initial,
  documents,
}: {
  initial: ProfileData | null;
  documents: { id: string; kind: string | null; file_path: string; created_at: string | null }[];
}) {
  const [form, setForm] = useState<ProfileData>(
    initial ?? {
      org_name: '',
      applicant_type: '',
      registration_type: '',
      country: '',
      state: '',
      description: '',
      sectors: [],
      beneficiaries: [],
      funding_need: null,
      annual_budget: null,
      stage: '',
      team_size: '',
      whatsapp_number: '',
      whatsapp_opt_in: false,
    }
  );
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadKind, setUploadKind] = useState(DOC_KINDS[0]);

  // Pre-fill from the quiz (stored in localStorage when the email unlock ran).
  useEffect(() => {
    if (initial) return;
    try {
      const raw = localStorage.getItem('gb_quiz');
      if (!raw) return;
      const q = JSON.parse(raw);
      const need = FUNDING_NEEDS.find((n) => n.value === q.funding_need);
      const budget = ANNUAL_BUDGETS.find((b) => b.value === q.annual_budget);
      setForm((f) => ({
        ...f,
        applicant_type: q.applicant_type ?? f.applicant_type,
        registration_type: q.registration_type ?? f.registration_type,
        country: q.country ?? f.country,
        description: q.description ?? f.description,
        sectors: q.sector ? [q.sector] : f.sectors,
        beneficiaries: q.beneficiaries ? [q.beneficiaries] : f.beneficiaries,
        funding_need: need ? need.max : f.funding_need,
        annual_budget: budget ? budget.amount : f.annual_budget,
        stage: q.stage ?? f.stage,
      }));
    } catch {
      /* ignore bad stored quiz data */
    }
  }, [initial]);

  const toggle = (field: 'sectors' | 'beneficiaries', value: string) => {
    setForm((f) => {
      const list = [...(f[field] ?? [])];
      const i = list.indexOf(value);
      if (i >= 0) list.splice(i, 1);
      else list.push(value);
      return { ...f, [field]: list };
    });
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setNotice('');
    const r = await saveProfile({
      org_name: form.org_name ?? '',
      applicant_type: form.applicant_type ?? '',
      registration_type: form.registration_type ?? '',
      country: form.country ?? '',
      state: form.state ?? '',
      description: form.description ?? '',
      sectors: form.sectors ?? [],
      beneficiaries: form.beneficiaries ?? [],
      funding_need: form.funding_need,
      annual_budget: form.annual_budget,
      stage: form.stage ?? '',
      team_size: form.team_size ?? '',
      whatsapp_number: form.whatsapp_number ?? '',
      whatsapp_opt_in: form.whatsapp_opt_in ?? false,
    });
    setNotice(r.error ?? 'Profile saved.');
    setSaving(false);
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set('file', file);
    fd.set('kind', uploadKind);
    const r = await uploadDocument(fd);
    setNotice(r.error ?? 'Document uploaded to your private library.');
    setUploading(false);
    if (!r.error) window.location.reload();
  }

  return (
    <form onSubmit={save} className='flex flex-col gap-8 py-8'>
      <div>
        <h1 className='text-3xl lg:text-4xl'>My organisation</h1>
        <p className='mt-1 text-brand-muted'>
          Matching and AI drafts use this. Your documents stay in a private bucket — only you (and
          the admin, for service orders) can see them.
        </p>
      </div>
      {notice && <p className='rounded-xl bg-brand-greenSoft p-3 text-sm text-brand-ink'>{notice}</p>}

      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Organisation details</h2>
        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          <label className='text-sm font-medium'>
            Organisation name *
            <input required value={form.org_name ?? ''} onChange={(e) => setForm({ ...form, org_name: e.target.value })} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line px-3 text-base' />
          </label>
          <label className='text-sm font-medium'>
            State / province
            <input value={form.state ?? ''} onChange={(e) => setForm({ ...form, state: e.target.value })} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line px-3 text-base' />
          </label>
          <label className='text-sm font-medium'>
            Applicant type *
            <select required value={form.applicant_type ?? ''} onChange={(e) => setForm({ ...form, applicant_type: e.target.value })} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'>
              <option value=''>Select…</option>
              {APPLICANT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className='text-sm font-medium'>
            Registration type
            <select value={form.registration_type ?? ''} onChange={(e) => setForm({ ...form, registration_type: e.target.value })} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'>
              <option value=''>Select…</option>
              {REGISTRATION_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className='text-sm font-medium'>
            Country *
            <select required value={form.country ?? ''} onChange={(e) => setForm({ ...form, country: e.target.value })} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'>
              <option value=''>Select…</option>
              {AFRICAN_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className='text-sm font-medium'>
            Team size
            <input value={form.team_size ?? ''} onChange={(e) => setForm({ ...form, team_size: e.target.value })} placeholder='e.g. 12' className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line px-3 text-base' />
          </label>
          <label className='text-sm font-medium sm:col-span-2'>
            What does your organisation do? (max 240 characters)
            <textarea maxLength={240} value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className='mt-1 block w-full rounded-lg border border-brand-line px-3 py-2 text-base' />
          </label>
          <label className='text-sm font-medium'>
            Funding need (USD)
            <select value={form.funding_need ? String(FUNDING_NEEDS.find((n) => n.max === form.funding_need)?.value ?? '') : ''} onChange={(e) => { const n = FUNDING_NEEDS.find((x) => x.value === e.target.value); setForm({ ...form, funding_need: n ? n.max : null }); }} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'>
              <option value=''>Select…</option>
              {FUNDING_NEEDS.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </label>
          <label className='text-sm font-medium'>
            Annual budget (USD)
            <select value={form.annual_budget ? String(ANNUAL_BUDGETS.find((b) => b.amount === form.annual_budget)?.value ?? '') : ''} onChange={(e) => { const b = ANNUAL_BUDGETS.find((x) => x.value === e.target.value); setForm({ ...form, annual_budget: b ? b.amount : null }); }} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'>
              <option value=''>Select…</option>
              {ANNUAL_BUDGETS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
          </label>
          <label className='text-sm font-medium'>
            Project stage
            <select value={form.stage ?? ''} onChange={(e) => setForm({ ...form, stage: e.target.value })} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line bg-white px-3 text-base'>
              <option value=''>Select…</option>
              {PROJECT_STAGES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className='mt-4 grid gap-4 sm:grid-cols-2'>
          <fieldset>
            <legend className='text-sm font-medium'>Main focus (sectors)</legend>
            <div className='mt-2 flex flex-wrap gap-2'>
              {SECTORS.map((s) => (
                <button type='button' key={s.value} onClick={() => toggle('sectors', s.value)} className={cn('rounded-full border px-3 py-1.5 text-sm', (form.sectors ?? []).includes(s.value) ? 'border-brand-green bg-brand-greenSoft font-semibold' : 'border-brand-line bg-white')}>
                  {s.label}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className='text-sm font-medium'>Who you serve (beneficiaries)</legend>
            <div className='mt-2 flex flex-wrap gap-2'>
              {BENEFICIARIES.map((b) => (
                <button type='button' key={b.value} onClick={() => toggle('beneficiaries', b.value)} className={cn('rounded-full border px-3 py-1.5 text-sm', (form.beneficiaries ?? []).includes(b.value) ? 'border-brand-green bg-brand-greenSoft font-semibold' : 'border-brand-line bg-white')}>
                  {b.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>WhatsApp & alerts</h2>
        <p className='mt-1 text-sm text-brand-muted'>
          WhatsApp is free and the fastest way to reach most African organisations. We only message
          you if you opt in.
        </p>
        <div className='mt-3 grid gap-4 sm:grid-cols-2'>
          <label className='text-sm font-medium'>
            WhatsApp number (international format, e.g. 2348012345678)
            <input value={form.whatsapp_number ?? ''} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line px-3 text-base' />
          </label>
          <label className='flex items-center gap-2 text-sm font-medium'>
            <input type='checkbox' checked={form.whatsapp_opt_in ?? false} onChange={(e) => setForm({ ...form, whatsapp_opt_in: e.target.checked })} />
            Send me new matches and deadline reminders on WhatsApp
          </label>
        </div>
      </section>

      <div>
        <Button type='submit' disabled={saving} className='bg-brand-green text-white hover:bg-brand-green/90'>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </div>

      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Document library</h2>
        <p className='mt-1 text-sm text-brand-muted'>
          Upload your registration certificate, constitution, reports, budgets and support letters.
          The AI writer drafts from these. Text files are read straight away; scanned PDFs are
          stored securely for now.
        </p>
        <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
          <select value={uploadKind} onChange={(e) => setUploadKind(e.target.value)} className='min-h-11 rounded-lg border border-brand-line bg-white px-3 text-sm'>
            {DOC_KINDS.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input ref={fileRef} type='file' className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 py-2 text-sm' />
          <Button type='button' disabled={uploading} onClick={upload} className='bg-brand-green text-white hover:bg-brand-green/90'>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
        {documents.length > 0 && (
          <ul className='mt-4 flex flex-col gap-2'>
            {documents.map((d) => (
              <li key={d.id} className='flex items-center justify-between gap-3 rounded-xl border border-brand-line px-3 py-2 text-sm'>
                <span>
                  <span className='font-medium'>{d.kind ?? 'Document'}</span>{' '}
                  <span className='text-brand-muted'>{d.file_path.split('/').pop()}</span>
                </span>
                <button type='button' onClick={async () => { await deleteDocument(d.id, d.file_path); window.location.reload(); }} className='text-red-600 hover:underline'>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </form>
  );
}
