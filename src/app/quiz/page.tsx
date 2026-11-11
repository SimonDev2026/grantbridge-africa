import QuizFlow from '@/components/quiz/quiz-flow';
import { getSession } from '@/features/account/controllers/get-session';

/**
 * Server wrapper around the quiz flow: the session is read here so the
 * results screen reliably knows whether the visitor is signed in. The
 * client-side gate used to render the logged-out email unlock and a
 * "Create your free account" link for signed-in users too.
 */
export default async function QuizPage() {
  const session = await getSession();
  return <QuizFlow signedIn={!!session} userEmail={session?.user.email ?? null} />;
}
