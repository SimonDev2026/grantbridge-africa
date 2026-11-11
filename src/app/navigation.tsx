import Link from 'next/link';
import { IoMenu } from 'react-icons/io5';

import { AccountMenu } from '@/components/account-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { getSession } from '@/features/account/controllers/get-session';

import { signOut } from './(auth)/auth-actions';

const PUBLIC_LINKS = [
  { href: '/pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export async function Navigation() {
  const session = await getSession();

  return (
    <div className='relative flex items-center gap-6'>
      {session ? (
        <AccountMenu signOut={signOut} />
      ) : (
        <>
          <Button variant='default' className='hidden flex-shrink-0 rounded-full lg:flex' asChild>
            <Link href='/login'>Sign in</Link>
          </Button>
          <Sheet>
            <SheetTrigger className='block lg:hidden' aria-label='Open menu'>
              <IoMenu size={28} />
            </SheetTrigger>
            <SheetContent className='w-full bg-white'>
              <SheetHeader>
                <Logo />
                <SheetDescription className='py-8'>
                  <span className='flex flex-col items-start gap-4'>
                    {PUBLIC_LINKS.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className='text-base font-medium text-brand-ink hover:text-brand-green'
                      >
                        {l.label}
                      </Link>
                    ))}
                    <Button variant='default' className='mt-2 flex-shrink-0 rounded-full' asChild>
                      <Link href='/login'>Sign in</Link>
                    </Button>
                    <Button variant='sun' className='flex-shrink-0' asChild>
                      <Link href='/signup'>Get started for free</Link>
                    </Button>
                  </span>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
