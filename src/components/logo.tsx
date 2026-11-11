import Image from 'next/image';
import Link from 'next/link';

import { BRAND } from '@/config/brand';

export function Logo() {
  return (
    <Link href='/' className='flex w-fit items-center gap-2'>
      <Image
        src={BRAND.logo.mark}
        width={40}
        height={40}
        priority
        quality={100}
        alt={BRAND.logo.alt}
        className='rounded-full'
      />
      <span className='font-alt text-xl font-bold text-brand-ink'>{BRAND.name}</span>
    </Link>
  );
}
