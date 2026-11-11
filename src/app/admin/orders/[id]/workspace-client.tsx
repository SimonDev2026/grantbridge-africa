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
    <div className='flex flex-col gap-8'>
      {/* Status + draft generation */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Order controls</h2>
        <div className='mt-3 flex flex-wrap items-center gap-2'>
          <label className='text-sm font-medium'>
            Status
            <select
              value={status}
              onChange={(e) => run('status', () => setOrderStatus(orderId, e.target.value))}
              className='ml-2 min-h-10 rounded-lg border border-brand-line bg-white px-2 text-sm'
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
            className='bg-brand-green text-white hover:bg-brand-green/90'
          >
            {busy === 'draft' ? 'Drafting…' : 'Generate AI draft'}
          </Button>
          {result && <span className='text-sm text-brand-green'>{result}</span>}
        </div>
        <p className='mt-2 text-sm text-brand-muted'>
          Generate AI draft builds the application from the client’s intake, profile and documents.
          It moves the order to “review”.
        </p>
      </section>

      {/* Draft editor */}
      {sections.length > 0 && draftId && (
        <section className='rounded-2xl border border-brand-line bg-white p-5'>
          <h2>Draft sections</h2>
          <div className='mt-3 grid gap-4 lg:grid-cols-[220px_1fr]'>
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
            <div>
              <h3>{sections[active]?.title}</h3>
              <div className='mt-2 whitespace-pre-wrap rounded-xl bg-brand-bg p-4 text-sm leading-relaxed'>
                {renderWithPlaceholders(sections[active]?.body ?? '')}
              </div>
              <textarea
                value={sections[active]?.body ?? ''}
                onChange={(e) =>
                  setSections((ss) => ss.map((s, i) => (i === active ? { ...s, body: e.target.value } : s)))
                }
                rows={8}
                className='mt-3 w-full rounded-xl border border-brand-line p-3 text-base'
              />
              <div className='mt-2'>
                <Button
                  onClick={() => run('save-draft', () => saveOrderDraftSections(draftId, sections))}
                  className='bg-brand-green text-white hover:bg-brand-green/90'
                >
                  Save draft edits
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Private notes */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Private notes (admin only)</h2>
        <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Internal note — the client never sees this'
            className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 text-sm'
          />
          <Button
            disabled={!note.trim()}
            onClick={() => run('note', () => addOrderNote(orderId, note))}
            className='bg-brand-green text-white hover:bg-brand-green/90'
          >
            Add note
          </Button>
        </div>
      </section>

      {/* Message thread */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Message the client (also emailed)</h2>
        <div className='mt-3 flex flex-col gap-2 sm:flex-row'>
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder='Write to the client…'
            className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 text-sm'
          />
          <Button
            disabled={!message.trim()}
            onClick={() => run('message', () => sendOrderMessage(orderId, message))}
            className='bg-brand-green text-white hover:bg-brand-green/90'
          >
            Send
          </Button>
        </div>
      </section>

      {/* Delivery */}
      <section className='rounded-2xl border border-brand-line bg-white p-5'>
        <h2>Delivery</h2>
        <p className='mt-1 text-sm text-brand-muted'>
          Upload the finished Word/PDF files first, then press Deliver — the client gets an email
          with the download link, the submission checklist and the funder’s official link.
        </p>
        <form
          className='mt-3 flex flex-col gap-2 sm:flex-row'
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
          <input type='file' name='file' required className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 py-2 text-sm' />
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
            className='min-h-11 flex-1 rounded-lg border border-brand-line px-3 text-sm'
          />
          <Button
            onClick={() => run('deliver', () => deliverOrder(orderId, deliverNote))}
            className='bg-brand-green text-white hover:bg-brand-green/90'
          >
            Deliver order
          </Button>
        </div>
        {result && <p className='mt-2 text-sm text-brand-green'>{result}</p>}
      </section>
    </div>
  );
}
