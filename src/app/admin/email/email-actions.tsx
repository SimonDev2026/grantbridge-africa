'use client';

import { useState } from 'react';

import { deleteEmailCampaign, sendEmailCampaign, sendEmailTest } from '@/app/admin/actions';
import { Button } from '@/components/ui/button';

/** Admin-only button: send one test copy to the admin mailbox. */
export function TestSendButton({ campaignId }: { campaignId: string }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    setBusy(true);
    setResult(null);
    setFailed(false);
    const res = await sendEmailTest(campaignId);
    setBusy(false);
    if ('error' in res) {
      setFailed(true);
      setResult(res.error);
      return;
    }
    setResult(`Test email sent to ${res.to}. Check the inbox (and spam) before sending to everyone.`);
  }

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant='outline' onClick={run} disabled={busy}>
        {busy ? 'Sending…' : 'Send a test to admin'}
      </Button>
      {result && (
        <span className={`text-xs ${failed ? 'text-red-700' : 'text-brand-green'}`}>{result}</span>
      )}
    </span>
  );
}

/**
 * Admin-only button: send the campaign to every subscriber.
 * Two-step: the first click shows the exact recipient count, the second
 * confirms. A sent campaign can never be sent again.
 */
export function SendAllButton({
  campaignId,
  recipientCount,
}: {
  campaignId: string;
  recipientCount: number;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function run() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    setResult(null);
    setFailed(false);
    const res = await sendEmailCampaign(campaignId);
    setBusy(false);
    if ('error' in res) {
      setFailed(true);
      setResult(res.error);
      return;
    }
    setResult(
      `Sent to ${res.sent} of ${res.recipients} subscribers` +
        (res.failed > 0 ? ` — ${res.failed} failed (see the send log below)` : '') +
        (res.skipped > 0 ? ` — ${res.skipped} already sent, skipped` : '')
    );
  }

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant='brand' onClick={run} disabled={busy || recipientCount === 0}>
        {busy ? 'Sending…' : armed ? `Yes, send to ${recipientCount} subscribers` : 'Send to all subscribers'}
      </Button>
      {armed && !busy && (
        <button
          type='button'
          className='text-xs text-brand-muted hover:underline'
          onClick={() => setArmed(false)}
        >
          Cancel
        </button>
      )}
      {recipientCount === 0 && (
        <span className='text-xs text-brand-muted'>No subscribers yet — nobody to send to.</span>
      )}
      {result && (
        <span className={`text-xs ${failed ? 'text-red-700' : 'text-brand-green'}`}>{result}</span>
      )}
    </span>
  );
}

/** Admin-only button: two-step delete (drafts only — sent campaigns are the audit trail). */
export function DeleteCampaignButton({ campaignId }: { campaignId: string }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    const res = await deleteEmailCampaign(campaignId);
    setBusy(false);
    if (res.error) setError(res.error);
  }

  return (
    <span className='flex flex-col items-start gap-1'>
      <Button variant='destructive' size='sm' onClick={run} disabled={busy}>
        {busy ? 'Deleting…' : armed ? 'Click again to delete' : 'Delete draft'}
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
