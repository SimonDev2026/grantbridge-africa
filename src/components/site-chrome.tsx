'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Site chrome wrapper: renders the header and footer on every page except
 * the quiz, which runs distraction-free with only its own progress bar.
 */
export function SiteChrome({
  header,
  footer,
  children
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isQuiz = pathname === '/quiz' || pathname.startsWith('/quiz/');

  return (
    <div className='m-auto flex h-full max-w-[1440px] flex-col px-4'>
      {!isQuiz && header}
      <main className='relative flex-1'>
        <div className='relative h-full'>{children}</div>
      </main>
      {!isQuiz && footer}
    </div>
  );
}
