'use client';

import { useRef, useState } from 'react';

import { saveIntakeDraft, submitIntake } from '@/app/admin/actions';
import { uploadIntakeFile } from '@/app/orders/[id]/actions';
import { Button } from '@/components/ui/button';

const UPLOAD_KINDS = [
  'Registration certificate',
  'Constitution',
  'Annual report',
  'Budget',
  'Support letter',
  'Photo',
  'Other',
];

const REQUIRED = ['org_name', 'org_country', 'contact_name', 'contact_email', 'project_title', 'project_summary'] as const;

export function IntakeForm({
  orderId,
  initial,
  files,
}: {
  orderId: string;
  initial: any | null;
  files: { id: string; kind: string; file_name: string }[];
}) {
  const [form, setForm] = useState<Record<string, any>>({
    org_name: initial?.org_name ?? '',
    org_type: initial?.org_type ?? '',
    org_country: initial?.org_country ?? '',
    org_registration_no: initial?.org_registration_no ?? '',
    contact_name: initial?.contact_name ?? '',
    contact_email: initial?.contact_email ?? '',
    contact_phone: initial?.contact_phone ?? '',
    project_title: initial?.project_title ?? '',
    project_summary: initial?.project_summary ?? '',
    project_objectives: initial?.project_objectives ?? '',
    beneficiaries: (initial?.beneficiaries ?? []).join(', '),
    budget_total: initial?.budget_total ?? '',
    budget_currency: initial?.budget_currency ?? 'USD',
    amount_requested: initial?.amount_requested ?? '',
    timeline: initial?.timeline ?? '',
  });
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState('');
  const [kind, setKind] = useState(UPLOAD_KINDS[0]);
  const fileRef = useRef<HTMLInputElement>(null);

  const missing = REQUIRED.filter((k) => !String(form[k] ?? '').trim());

  function payload() {
    return {
      ...form,
      beneficiaries: String(form.beneficiaries ?? '')
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean),
      budget_total: form.budget_total === '' ? null : Number(form.budget_total),
      amount_requested: form.amount_requested === '' ? null : Number(form.amount_requested),
    };
  }

  async function saveDraft() {
    setBusy('draft');
    const r = await saveIntakeDraft(orderId, payload());
    setNotice(r.error ?? 'Draft saved — come back any time to finish it.');
    setBusy('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (missing.length > 0) {
      setNotice(`Please fill in the required fields: ${missing.join(', ')}`);
      return;
    }
    setBusy('submit');
    const r = await submitIntake(orderId, payload());
    setNotice(r.error ?? 'Intake submitted — our team will start on your application.');
    setBusy('');
    if (r.ok) window.location.href = `/orders/${orderId}`;
  }

  const field = (label: string, key: string, opts?: { required?: boolean; type?: string; textarea?: boolean }) => (
    <label className='text-sm font-medium'>
      {label} {opts?.required ? '*' : ''}
      {opts?.textarea ? (
        <textarea
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          rows={3}
          className='mt-1 block w-full rounded-lg border border-brand-line px-3 py-2 text-base'
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={form[key]}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          className='mt-1 block min-h-11 w-full rounded-lg border border-brand-line px-3 text-base'
        />
      )}
    </label>
  );

  return (
    <div className='flex flex-col gap-6 py-8'>
      <div>
        <h1 className='text-3xl lg:text-4xl'>Your application intake</h1>
        <p className='mt-1 text-brand-muted'>
          Tell us about your organisation and project so our writer can draft the application.
          Fields marked * are required. You can save a draft and return later.
        </p>
      </div>
      {notice && <p className='rounded-xl bg-brand-greenSoft p-3 text-sm text-brand-ink'>{notice}</p>}

      <form onSubmit={submit} className='flex flex-col gap-6'>
        <section className='rounded-2xl border border-brand-line bg-white p-5'>
          <h2>Organisation</h2>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            {field('Organisation name', 'org_name', { required: true })}
            {field('Organisation type (NGO, startup, researcher…)', 'org_type')}
            {field('Country', 'org_country', { required: true })}
            {field('Registration number', 'org_registration_no')}
          </div>
        </section>

        <section className='rounded-2xl border border-brand-line bg-white p-5'>
          <h2>Contact</h2>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            {field('Contact name', 'contact_name', { required: true })}
            {field('Contact email', 'contact_email', { required: true, type: 'email' })}
            {field('Contact phone / WhatsApp', 'contact_phone')}
          </div>
        </section>

        <section className='rounded-2xl border border-brand-line bg-white p-5'>
          <h2>Project</h2>
          <div className='mt-4 grid gap-4 sm:grid-cols-2'>
            {field('Project title', 'project_title', { required: true })}
            {field('Timeline', 'timeline')}
            <div className='sm:col-span-2'>{field('Project summary', 'project_summary', { required: true, textarea: true })}</div>
            <div className='sm:col-span-2'>{field('Project objectives', 'project_objectives', { textarea: true })}</div>
            {field('Beneficiaries (comma separated)', 'beneficiaries')}
            {field('Total project budget', 'budget_total', { type: 'number' })}
            {field('Budget currency', 'budget_currency')}
            {field('Amount requested from this funder', 'amount_requested', { type: 'number' })}
          </div>
        </section>

        <div className='flex flex-wrap gap-2'>
          <Button type='button' variant='outline' disabled={busy !== ''} onClick={saveDraft}>
            {busy === 'draft' ? 'Saving…' : 'Save draft & return later'}
          </Button>
          <Button type='submit' disabled={busy !== ''} variant='brand'>
            {busy === 'submit' ? 'Submitting…' : 'Submit intake'}
          </Button>
        </div>
      </form>

      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Upload supporting documents</h2>
        <p className='mt-1 text-sm text-brand-muted'>
          Registration certificate, constitution, reports, budget, support letters, photos. Stored
          privately; only you and our team see them.
        </p>
        <form
          className='mt-3 flex flex-col gap-2 sm:flex-row'
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy('upload');
            const r = await uploadIntakeFile(orderId, fd);
            setNotice(r.error ?? 'File uploaded.');
            setBusy('');
            if (r.ok) window.location.reload();
          }}
        >
          <select value={kind} onChange={(e) => setKind(e.target.value)} name='kind' className='min-h-11 rounded-lg border border-brand-line bg-white px-3 text-sm'>
            {UPLOAD_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <input ref={fileRef} type='file' name='file' required className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 py-2 text-sm' />
          <Button type='submit' disabled={busy === 'upload'} variant='brand'>
            {busy === 'upload' ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
        {files.length > 0 && (
          <ul className='mt-4 flex flex-col gap-2 text-sm'>
            {files.map((f) => (
              <li key={f.id}>
                <span className='font-medium'>{f.kind}</span> · {f.file_name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
