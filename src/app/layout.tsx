import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';
import Link from 'next/link';

import { CookieSettingsButton } from '@/components/cookie-settings-button';
import { Logo } from '@/components/logo';
import { Toaster } from '@/components/ui/toaster';
import { BRAND } from '@/config/brand';
import { ConsentBanner, MetaPixel } from '@/libs/meta/pixel';
import { cn } from '@/utils/cn';
import { Analytics } from '@vercel/analytics/react';

import { Navigation } from './navigation';

import '@/styles/globals.css';

export const dynamic = 'force-dynamic';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: `${BRAND.name} — Find the grants your African organisation qualifies for`,
  description: BRAND.description,
  icons: { icon: '/favicon.ico', apple: '/apple-touch-icon.png' },
  openGraph: {
    title: BRAND.name,
    description: BRAND.description,
    images: ['/brand/logo.png'],
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en'>
      <body className={cn('font-sans antialiased', montserrat.variable, montserratAlternates.variable)}>
        <MetaPixel />
        <div className='m-auto flex h-full max-w-[1440px] flex-col px-4'>
          <AppBar />
          <main className='relative flex-1'>
            <div className='relative h-full'>{children}</div>
          </main>
          <Footer />
        </div>
        <ConsentBanner />
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}

async function AppBar() {
  return (
    <header className='flex items-center justify-between gap-4 py-5'>
      <Logo />
      <nav className='hidden items-center gap-6 text-sm font-medium text-brand-muted lg:flex'>
        <Link href='/#how-it-works' className='hover:text-brand-green'>
          How it works
        </Link>
        <Link href='/quiz' className='hover:text-brand-green'>
          Find my grants
        </Link>
        <Link href='/pricing' className='hover:text-brand-green'>
          Pricing
        </Link>
        <Link href='/about-us' className='hover:text-brand-green'>
          About
        </Link>
      </nav>
      <Navigation />
    </header>
  );
}

function Footer() {
  return (
    <footer className='mt-16 flex flex-col gap-8 border-t border-brand-line pt-10 text-sm text-brand-muted lg:mt-24'>
      <div className='flex flex-col justify-between gap-8 lg:flex-row'>
        <div className='max-w-sm'>
          <Logo />
          <p className='mt-3'>
            {BRAND.description} Grant decisions are made by funders — we never award grants, charge
            applicants on a funder’s behalf, or take a share of grants.
          </p>
        </div>
        <div className='grid grid-cols-2 gap-8 sm:grid-cols-4 lg:gap-16'>
          <div className='flex flex-col gap-2'>
            <div className='font-semibold text-brand-ink'>Product</div>
            <nav className='flex flex-col gap-2'>
              <Link href='/quiz'>Find my grants</Link>
              <Link href='/pricing'>Pricing</Link>
              <Link href='/dashboard'>Dashboard</Link>
            </nav>
          </div>
          <div className='flex flex-col gap-2'>
            <div className='font-semibold text-brand-ink'>Company</div>
            <nav className='flex flex-col gap-2'>
              <Link href='/about-us'>About Us</Link>
              <Link href='/privacy'>Privacy</Link>
              <Link href='/terms'>Terms</Link>
            </nav>
          </div>
          <div className='flex flex-col gap-2'>
            <div className='font-semibold text-brand-ink'>Support</div>
            <nav className='flex flex-col gap-2'>
              <Link href='/support'>Get Support</Link>
              <Link href={`mailto:${BRAND.contact.supportEmail}`}>Email us</Link>
              <Link href={BRAND.social.whatsappChannel} target='_blank' rel='noreferrer'>
                WhatsApp channel
              </Link>
            </nav>
          </div>
          <div className='flex flex-col gap-2'>
            <div className='font-semibold text-brand-ink'>Legal</div>
            <nav className='flex flex-col gap-2'>
              <Link href='/privacy'>Privacy policy</Link>
              <Link href='/terms'>Terms of service</Link>
              <CookieSettingsButton />
            </nav>
          </div>
        </div>
      </div>
      <div className='border-t border-brand-line py-6 text-center text-xs'>
        Copyright {new Date().getFullYear()} © {BRAND.name}. All grants are awarded by their funders,
        not by {BRAND.shortName}.
      </div>
    </footer>
  );
}
