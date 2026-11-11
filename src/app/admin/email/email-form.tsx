'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { saveEmailCampaign } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';
import { EMAIL_TEMPLATES } from '@/libs/email/templates';

export type EmailCampaignFormValues = {
  id: string | null;
  subject: string;
  body: string;
};

const inputClass =
  'w-full rounded-lg border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted/60 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/30';

/** Admin-only composer: subject + HTML body, starter templates, live preview. */
export function EmailCampaignForm({ initial }: { initial: EmailCampaignFormValues }) {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [subject, setSubject] = useState(initial.subject);
  const [body, setBody] = useState(initial.body);
  const [templateKey, setTemplateKey] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  /** Wrap the selected text (or insert at the cursor) with open/close tags. */
  function wrapSelection(open: string, close: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end);
    const replacement = selected ? `${open}${selected}${close}` : `${open}${close}`;
    setBody(body.slice(0, start) + replacement + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + open.length + selected.length;
      el.setSelectionRange(pos, pos);
    });
  }

  function insertLink() {
    const url = window.prompt('Link URL (https://…)', 'https://');
    if (!url) return;
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end) || 'link text';
    const replacement = `<a href="${url}">${selected}</a>`;
    setBody(body.slice(0, start) + replacement + body.slice(end));
  }

  function insertList() {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    const selected = body.slice(start, end) || 'First point\nSecond point';
    const items = selected
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => `<li>${line.trim()}</li>`)
      .join('');
    const replacement = `<ul>${items}</ul>`;
    setBody(body.slice(0, start) + replacement + body.slice(end));
  }

  function applyTemplate(key: string) {
    setTemplateKey(key);
    const template = EMAIL_TEMPLATES.find((t) => t.key === key);
    if (!template) return;
    setSubject(template.subject);
    setBody(template.body);
  }

  async function save() {
    setBusy(true);
    setError('');
    const res = await saveEmailCampaign(initial.id, { subject, body });
    setBusy(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push(`/admin/email/${res.id}`);
    router.refresh();
  }

  return (
    <div className='flex flex-col gap-5'>
      <div>
        <label htmlFor='email-template' className='text-sm font-semibold text-brand-ink'>
          Start from a template
        </label>
        <select
          id='email-template'
          className={inputClass}
          value={templateKey}
          onChange={(e) => applyTemplate(e.target.value)}
        >
          <option value=''>Blank email</option>
          {EMAIL_TEMPLATES.map((t) => (
            <option key={t.key} value={t.key}>
              {t.name} — {t.subject}
            </option>
          ))}
        </select>
        <p className='mt-1 text-xs text-brand-muted'>
          Choosing a template replaces the subject and body below. Templates use real copy only —
          fill in any [bracketed] lines with real grants or news before sending.
        </p>
      </div>

      <div>
        <label htmlFor='email-subject' className='text-sm font-semibold text-brand-ink'>
          Subject
        </label>
        <input
          id='email-subject'
          className={inputClass}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder='e.g. New grants open to African organisations this week'
          required
        />
      </div>

      <div>
        <label htmlFor='email-body' className='text-sm font-semibold text-brand-ink'>
          Body
        </label>
        <div className='mb-2 flex flex-wrap gap-2'>
          <Button type='button' variant='outline' size='sm' onClick={() => wrapSelection('<strong>', '</strong>')}>
            Bold
          </Button>
          <Button type='button' variant='outline' size='sm' onClick={() => wrapSelection('<em>', '</em>')}>
            Italic
          </Button>
          <Button type='button' variant='outline' size='sm' onClick={insertLink}>
            Link
          </Button>
          <Button type='button' variant='outline' size='sm' onClick={insertList}>
            Bullet list
          </Button>
        </div>
        <textarea
          id='email-body'
          ref={bodyRef}
          className={`${inputClass} min-h-72 font-mono text-[13px] leading-relaxed`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='<p>Hello,</p><p>Write the email here. Simple HTML is allowed: <strong>bold</strong>, <em>italic</em>, links and lists.</p>'
        />
        <p className='mt-1 text-xs text-brand-muted'>
          Simple HTML — paragraphs, bold, italic, links and lists. The GrantBridge header, footer
          and unsubscribe link are added automatically when the email is sent.
        </p>
      </div>

      <div>
        <Button
          type='button'
          variant='outline'
          onClick={() => setShowPreview((v) => !v)}
          disabled={!subject.trim() && !body.trim()}
        >
          {showPreview ? 'Hide preview' : 'Show preview'}
        </Button>
        {showPreview && (
          <div className='mt-3 overflow-hidden rounded-2xl border border-brand-line bg-brand-bg'>
            <div className='border-b border-brand-line bg-white px-5 py-3'>
              <p className='text-xs font-semibold uppercase tracking-widest text-brand-muted'>Preview — as the subscriber sees it</p>
              <p className='mt-1 font-semibold text-brand-ink'>{subject || '(no subject)'}</p>
            </div>
            <div className='px-5 py-4'>
              <p className='text-lg font-bold text-brand-green'>GrantBridge Africa</p>
              <p className='text-xs text-brand-muted'>Find the grants your African organisation actually qualifies for</p>
              <div
                className='mt-4 text-sm leading-relaxed text-brand-ink [&_a]:text-brand-green [&_a]:underline'
                dangerouslySetInnerHTML={{ __html: body || '<p>(empty body)</p>' }}
              />
              <hr className='my-6 border-brand-line' />
              <p className='text-xs leading-relaxed text-brand-muted'>
                You are receiving this email because you asked GrantBridge Africa to email you
                about new grants. Questions? Write to info@grantbridgeafrica.com.
                <br />
                <span className='text-brand-green underline'>Unsubscribe</span> — you will stop
                receiving these emails.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && <p className='text-sm text-red-700'>{error}</p>}

      <div className='flex flex-wrap gap-2'>
        <Button variant='brand' type='button' disabled={busy} onClick={save}>
          {busy ? 'Saving…' : 'Save campaign'}
        </Button>
        <Button variant='ghost' type='button' disabled={busy} onClick={() => router.push('/admin/email')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
