// GET /events — public events list. Only published events.
// Data comes only from the cms_events table via the anon client (RLS allows
// SELECT on published rows). Upcoming events first; past events below.
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { BRAND } from '@/config/brand';
import { supabasePublicClient } from '@/libs/supabase/supabase-public';

const db = supabasePublicClient as any;

export const metadata = {
  title: `Events — ${BRAND.name}`,
  description:
    'Webinars, info sessions and launch days from GrantBridge Africa — learn how to find and win grants for your organisation.',
};

function displayDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function displayTime(value: string): string {
  return new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function EventCard({ e }: { e: any }) {
  return (
    <article className='overflow-hidden rounded-2xl border border-brand-line bg-white shadow-sm transition-shadow hover:shadow-md'>
      <div className='h-1.5 bg-brand-green' />
      <div className='p-5 sm:p-6'>
        <p className='text-xs font-semibold uppercase tracking-widest text-brand-green'>
          {displayDate(e.starts_at)} · {displayTime(e.starts_at)}
        </p>
        <h2 className='mt-2 text-xl lg:text-2xl'>{e.title}</h2>
        {e.location && <p className='mt-1 text-sm font-semibold text-brand-ink'>{e.location}</p>}
        {e.description && <p className='mt-2 text-sm leading-relaxed text-brand-muted'>{e.description}</p>}
      </div>
    </article>
  );
}

export default async function EventsPage() {
  const { data: events, error } = await db
    .from('cms_events')
    .select('id, title, starts_at, location, description, status')
    .eq('status', 'published')
    .order('starts_at', { ascending: true });

  const list = (events ?? []) as any[];
  const now = new Date();
  const upcoming = list.filter((e) => new Date(e.starts_at) >= now);
  const past = list.filter((e) => new Date(e.starts_at) < now).reverse();

  return (
    <div className='mx-auto max-w-3xl py-10'>
      <h1>Events</h1>
      <p className='mt-4 text-lg text-brand-muted'>
        Webinars, info sessions and launch days — learn how to find and win grants for your
        organisation.
      </p>

      {error ? (
        <div className='mt-8 rounded-2xl border border-brand-line bg-white p-6 text-sm text-brand-muted'>
          The events page could not load right now — please check back shortly.
        </div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <div className='mt-8 rounded-2xl border border-dashed border-brand-line bg-white p-8 text-center'>
          <p className='font-semibold text-brand-ink'>No events scheduled yet</p>
          <p className='mx-auto mt-1 max-w-md text-sm text-brand-muted'>
            We will announce webinars and info sessions here as soon as they are scheduled. In the
            meantime, take the quiz to see the grants you qualify for.
          </p>
          <div className='mt-5 flex justify-center'>
            <Button variant='brand' asChild>
              <Link href='/quiz'>Find my grants — free →</Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className='mt-8 flex flex-col gap-5'>
              {upcoming.map((e) => (
                <EventCard key={e.id} e={e} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <>
              <h2 className='mt-12'>Past events</h2>
              <div className='mt-5 flex flex-col gap-5'>
                {past.map((e) => (
                  <EventCard key={e.id} e={e} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className='mt-10 rounded-2xl bg-brand-green p-6 text-center text-white sm:p-8'>
        <h2 className='text-white'>Get notified about the next event</h2>
        <p className='mx-auto mt-2 max-w-xl text-sm text-white/85'>
          Take the quiz and join the weekly email — new events and new grants, once a week.
        </p>
        <div className='mt-5 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button variant='sun' asChild>
            <Link href='/quiz'>Find my grants</Link>
          </Button>
          <Button
            variant='outline'
            className='border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white'
            asChild
          >
            <Link href='/grants'>Browse open grants →</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
