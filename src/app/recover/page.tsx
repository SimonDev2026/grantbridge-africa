import Link from 'next/link';

import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Recover your purchase — GrantBridge Africa',
  description:
    'How to regain access to a GrantBridge Africa purchase or account: sign in, confirm your email, and check your subscription.',
};

const steps = [
  {
    title: 'Sign in with the email you used at purchase',
    body: 'Go to the login page and sign in with the same email address you used when you paid. Your plan and purchases are tied to that email.',
    link: { href: '/login', label: 'Go to the login page' },
  },
  {
    title: 'If your email is not confirmed, send a fresh link',
    body: 'If you signed up but never confirmed your email, your account may be waiting on that step. On the login page, use the “Send a fresh confirmation link” action, then open the new link from your inbox (check spam too).',
    link: { href: '/login', label: 'Go to the login page' },
  },
  {
    title: 'Check your subscription once you are signed in',
    body: 'Open your account page — or your dashboard — and look for your plan and subscription status. If your plan shows there, your purchase is active and you are in the right place.',
    link: { href: '/account', label: 'Go to your account' },
  },
  {
    title: 'Still stuck? Contact support',
    body: 'Tell us the email you used at purchase and what you see when you try to sign in. We will look into it and get back to you.',
    link: { href: '/support', label: 'Contact support' },
  },
];

/**
 * Honest help page for regaining access to a purchase or account.
 * No purchase lookup and no invented order numbers — just the real steps:
 * sign in, confirm the email, check the account, then contact support.
 */
export default function RecoverPage() {
  return (
    <div className='mx-auto max-w-3xl px-4 py-10'>
      <h1>Recover your purchase</h1>
      <p className='mt-4 text-lg text-brand-muted'>
        Paid for a plan or a one-time service but can’t get into it? Work through these steps —
        most people are back in within a few minutes.
      </p>

      <ol className='mt-8 flex flex-col gap-4'>
        {steps.map((step, i) => (
          <li
            key={step.title}
            className='rounded-2xl border border-brand-line bg-white p-6'
          >
            <div className='flex items-start gap-4'>
              <span className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-green font-alt text-base font-bold text-white'>
                {i + 1}
              </span>
              <div>
                <h2 className='text-lg'>{step.title}</h2>
                <p className='mt-1 text-brand-muted'>{step.body}</p>
                <Button variant='outline' size='sm' className='mt-4' asChild>
                  <Link href={step.link.href}>{step.link.label}</Link>
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className='mt-8 rounded-2xl border border-brand-line bg-brand-sunSoft p-6'>
        <h2 className='text-lg'>A few things that help</h2>
        <ul className='mt-2 flex list-disc flex-col gap-1 pl-5 text-brand-muted'>
          <li>Use the exact email you paid with — a different email is a different account.</li>
          <li>
            If you paid as a guest or with another email by mistake, tell support which email
            you used.
          </li>
          <li>
            We will never ask for your password or card details by email — only sign in on this
            site.
          </li>
        </ul>
        <p className='mt-4 text-brand-muted'>
          Email us directly at{' '}
          <a
            href='mailto:info@grantbridgeafrica.com'
            className='font-semibold text-brand-green hover:underline'
          >
            info@grantbridgeafrica.com
          </a>{' '}
          or reach us through the{' '}
          <Link href='/support' className='font-semibold text-brand-green hover:underline'>
            support page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
