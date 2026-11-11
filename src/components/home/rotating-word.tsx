'use client';

import { useEffect, useState } from 'react';

const WORDS = ['NGO', 'startup', 'researcher', 'student', 'community group'];

/** Hero headline's rotating last word — smooth word-swap transition. */
export function RotatingWord() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);

  return (
    <span key={index} className='hero-word-swap text-brand-green' aria-live='polite'>
      {WORDS[index]}
    </span>
  );
}
