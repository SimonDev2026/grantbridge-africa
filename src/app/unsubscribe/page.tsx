import Link from 'next/link';

import { UnsubscribeForm } from '@/app/unsubscribe/unsubscribe-form';
import { BRAND } from '@/config/brand';
import { normalizeEmail, verifyUnsubscribeToken } from '@/libs/email/unsubscribe';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

/**
 * Public unsubscribe page.
 *
 * Token links from campaign emails (?email&token) are verified against the
 * HMAC secret and unsubscribed immediately. Without a token, the manual form
 * unsubscribes any address (low-risk, reversible by re-consenting via the
 * quiz). Either way the address lands in `email_unsubscribes`, which
 * recipient selection always excludes.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email ? normalizeEmail(sp.email) : null;
  const token = sp.token ?? null;

  let tokenResult: 'ok' | 'bad' | null = null;
  if (email && token) {
    if (verifyUnsubscribeToken(email, token)) {
      const { error } = await db
        .from('email_unsubscribes')
        .upsert({ email, unsubscribed_at: new Date().toISOString() }, { onConflict: 'email' });
      tokenResult = error ? 'bad' : 'ok';
    } else {
      tokenResult = 'bad';
    }
  }

  return (
    <main className='mx-auto flex min-h-[70vh] w-full max-w-2xl flex-col justify-center px-4 py-16'>
      <p className='text-[11px] font-bold uppercase tracking-widest text-brand-green'>
        {BRAND.name}
      </p>
      <h1 className='mt-2 text-3xl lg:text-4xl'>Unsubscribe</h1>

      {tokenResult === 'ok' && email ? (
        <div className='mt-6 rounded-2xl border border-brand-line bg-white p-6 shadow-sm'>
          <p className='font-semibold text-brand-ink'>You are unsubscribed.</p>
          <p className='mt-2 text-sm text-brand-muted'>
            <strong>{email}</strong> will not receive GrantBridge marketing emails again. Your
            account, matches and drafts are untouched — only the emails stop. If you change your
            mind, take the quiz again and tick the marketing box.
          </p>
          <p className='mt-4 text-sm'>
            <Link href='/' className='font-semibold text-brand-green hover:underline'>
              ← Back to {BRAND.name}
            </Link>
          </p>
        </div>
      ) : (
        <div className='mt-6 rounded-2xl border border-brand-line bg-white p-6 shadow-sm'>
          {tokenResult === 'bad' && (
            <p className='mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700'>
              That unsubscribe link is not valid. Use the form below instead — or write to{' '}
              {BRAND.contact.email}.
            </p>
          )}
          <p className='mb-4 text-sm text-brand-muted'>
            Enter the email address that receives our emails and we will stop sending marketing
            emails to it. Your account, matches and drafts are untouched — only the emails stop.
          </p>
          <UnsubscribeForm />
        </div>
      )}
    </main>
  );
}
