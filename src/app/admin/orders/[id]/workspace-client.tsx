'use client';

import { useState } from 'react';

import {
  addOrderNote,
  deliverOrder,
  generateOrderDraft,
  saveOrderDraftSections,
  sendOrderMessage,
  setOrderStatus,
  uploadOrderFile,
} from '@/app/admin/actions';
import { AdminCard, AdminSectionHeading } from '@/app/admin/admin-ui';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export type OrderDraftSection = { title: string; body: string };

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

const inputClass =
  'min-h-11 flex-1 rounded-lg border border-brand-line bg-white px-3 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30';

export function WorkspaceActions({
  orderId,
  status,
  draftId,
  initialSections,
}: {
  orderId: string;
  status: string;
  draftId: string | null;
  initialSections: OrderDraftSection[];
}) {
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');
  const [deliverNote, setDeliverNote] = useState('');
  const [sections, setSections] = useState(initialSections);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState('');

  async function run(label: string, fn: () => Promise<{ ok?: boolean; error?: string; draftId?: string }>) {
    setBusy(label);
    setResult('');
    const r = await fn();
    setResult(r.error ?? 'Done.');
    setBusy('');
    if (r.ok) window.location.reload();
  }

  return (
    <div className='flex flex-col gap-6'>
      {/* Status + draft generation */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Controls' title='Order controls' />
        <div className='mt-4 flex flex-wrap items-center gap-3'>
          <label className='flex items-center gap-2 text-sm font-semibold text-brand-ink'>
            Status
            <select
              value={status}
              onChange={(e) => run('status', () => setOrderStatus(orderId, e.target.value))}
              className='min-h-10 rounded-lg border border-brand-line bg-white px-3 text-sm focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30'
            >
              {['paid', 'intake_pending', 'in_progress', 'review', 'delivered', 'closed', 'refunded'].map((s) => (
                <option key={s} value={s}>
                  {s.replace('_', ' ')}
                </option>
              ))}
            </select>
          </label>
          <Button
            disabled={busy !== ''}
            onClick={() => run('draft', () => generateOrderDraft(orderId))}
            variant='brand'
          >
            {busy === 'draft' ? 'Drafting…' : 'Generate AI draft'}
          </Button>
          {result && (
            <span className='rounded-full bg-brand-greenSoft px-3 py-1.5 text-sm font-medium text-brand-green'>
              {result}
            </span>
          )}
        </div>
        <p className='mt-3 text-sm leading-relaxed text-brand-muted'>
          Generate AI draft builds the application from the client’s intake, profile and documents.
          It moves the order to “review”.
        </p>
      </AdminCard>

      {/* Draft editor */}
      {sections.length > 0 && draftId && (
        <AdminCard>
          <AdminSectionHeading eyebrow='Application' title='Draft sections' />
          <div className='mt-4 grid gap-4 lg:grid-cols-[220px_1fr]'>
            <div className='flex flex-col gap-2'>
              {sections.map((s, i) => (
                <button
                  key={i}
                  type='button'
                  onClick={() => setActive(i)}
                  className={cn(
                    'rounded-xl border p-3 text-left text-sm font-medium transition-colors',
                    i === active
                      ? 'border-brand-green bg-brand-greenSoft text-brand-green'
                      : 'border-brand-line bg-white text-brand-ink hover:border-brand-green'
                  )}
                >
                  {i + 1}. {s.title}
                </button>
              ))}
            </div>
            <div>
              <h3 className='text-lg lg:text-xl'>{sections[active]?.title}</h3>
              <div className='mt-2 whitespace-pre-wrap rounded-xl bg-brand-bg p-4 text-sm leading-relaxed text-brand-ink'>
                {renderWithPlaceholders(sections[active]?.body ?? '')}
              </div>
              <textarea
                value={sections[active]?.body ?? ''}
                onChange={(e) =>
                  setSections((ss) => ss.map((s, i) => (i === active ? { ...s, body: e.target.value } : s)))
                }
                rows={8}
                className='mt-3 w-full rounded-xl border border-brand-line bg-white p-3 text-base focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30'
              />
              <div className='mt-2'>
                <Button
                  onClick={() => run('save-draft', () => saveOrderDraftSections(draftId, sections))}
                  variant='brand'
                >
                  Save draft edits
                </Button>
              </div>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Private notes */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Internal' title='Private notes (admin only)' />
        <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Internal note — the client never sees this'
            className={inputClass}
          />
          <Button
            disabled={!note.trim()}
            onClick={() => run('note', () => addOrderNote(orderId, note))}
            variant='brand'
          >
            Add note
          </Button>
        </div>
      </AdminCard>

      {/* Message thread */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Communication' title='Message the client (also emailed)' />
        <div className='mt-4 flex flex-col gap-2 sm:flex-row'>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Write to the client…'
            className={inputClass}
          />
          <Button
            disabled={!message.trim()}
            onClick={() => run('message', () => sendOrderMessage(orderId, message))}
            variant='brand'
          >
            Send
          </Button>
        </div>
      </AdminCard>

      {/* Delivery */}
      <AdminCard>
        <AdminSectionHeading eyebrow='Handover' title='Delivery' />
        <p className='mt-2 text-sm leading-relaxed text-brand-muted'>
          Upload the finished Word/PDF files first, then press Deliver — the client gets an email
          with the download link, the submission checklist and the funder’s official link.
        </p>
        <form
          className='mt-4 flex flex-col gap-2 sm:flex-row'
          onSubmit={async (e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            setBusy('upload');
            const r = await uploadOrderFile(orderId, fd);
            setResult(r.error ?? 'File uploaded.');
            setBusy('');
            if (r.ok) window.location.reload();
          }}
        >
          <input type='file' name='file' required className={inputClass} />
          <input type='hidden' name='kind' value='delivery' />
          <Button type='submit' disabled={busy === 'upload'} variant='outline'>
            {busy === 'upload' ? 'Uploading…' : 'Upload delivery file'}
          </Button>
        </form>
        <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
          <input
            value={deliverNote}
            onChange={(e) => setDeliverNote(e.target.value)}
            placeholder='Note to the client (optional)'
            className={inputClass}
          />
          <Button
            onClick={() => run('deliver', () => deliverOrder(orderId, deliverNote))}
            variant='brand'
          >
            Deliver order
          </Button>
        </div>
        {result && (
          <p className='mt-3 w-fit rounded-full bg-brand-greenSoft px-3 py-1.5 text-sm font-medium text-brand-green'>
            {result}
          </p>
        )}
      </AdminCard>
    </div>
  );
}
