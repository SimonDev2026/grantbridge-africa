import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';

import { resendConfirmationEmail, signInWithEmailPassword, signInWithOAuth, signUpWithEmailPassword } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function SignUp() {
  const session = await getSession();
  const subscription = await getSubscription();

  // Paid subscribers go to their account; a signed-in free user goes to the quiz.
  if (session && subscription) {
    redirect('/account');
  }

  if (session) {
    redirect('/quiz');
  }

  return (
    <section className='py-xl m-auto flex h-full max-w-lg items-center'>
      <AuthUI
        mode='signup'
        signInWithOAuth={signInWithOAuth}
        signUpWithEmailPassword={signUpWithEmailPassword}
        signInWithEmailPassword={signInWithEmailPassword}
        resendConfirmationEmail={resendConfirmationEmail}
      />
    </section>
  );
}
