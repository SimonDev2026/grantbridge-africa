import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';

import { resendConfirmationEmail, signInWithEmailPassword, signInWithOAuth, signUpWithEmailPassword } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function LoginPage() {
  const session = await getSession();
  const subscription = await getSubscription();

  // Paid subscribers go to their account; free (Explorer) users go to the dashboard.
  if (session && subscription) {
    redirect('/account');
  }

  if (session) {
    redirect('/dashboard');
  }

  return (
    <section className='py-xl m-auto flex h-full max-w-lg items-center'>
      <AuthUI
        mode='login'
        signInWithOAuth={signInWithOAuth}
        signUpWithEmailPassword={signUpWithEmailPassword}
        signInWithEmailPassword={signInWithEmailPassword}
        resendConfirmationEmail={resendConfirmationEmail}
      />
    </section>
  );
}
