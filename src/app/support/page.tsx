import { BRAND } from '@/config/brand';

export default function SupportPage() {
  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>Get support</h1>
      <p className='mt-4 text-brand-muted'>
        Email us at{' '}
        <a href={`mailto:${BRAND.contact.supportEmail}`} className='font-semibold text-brand-green hover:underline'>
          {BRAND.contact.supportEmail}
        </a>{' '}
        — we reply within one working day.
      </p>
      <div className='mt-6 flex flex-col gap-4'>
        {[
          { q: 'I can’t see any matches after the quiz.', a: 'Make sure your country and applicant type are right — those are the strongest filters. New grants are added daily, so check back, and make sure your email is correct so we can send new matches.' },
          { q: 'My draft has yellow [placeholders].', a: 'That means the AI did not have that fact — from your profile or your uploaded documents. Fill each one in yourself before submitting. Never leave a placeholder in a submitted application.' },
          { q: 'How do I pay?', a: 'All payments are in US dollars through Stripe — cards, Apple Pay, Google Pay. If your card is declined, try a dollar card or Apple/Google Pay.' },
          { q: 'Can I change my plan?', a: 'Yes — manage your subscription from your account page. Upgrades apply immediately; downgrades apply at the next renewal.' },
          { q: 'I paid for Expert Review / Done-for-you. What next?', a: 'Complete the intake form linked from your order page. Our team starts as soon as it arrives and will message you in the order thread.' },
        ].map((f) => (
          <div key={f.q} className='rounded-2xl border border-brand-line bg-white p-5'>
            <h2 className='text-base'>{f.q}</h2>
            <p className='mt-1 text-sm text-brand-muted'>{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
