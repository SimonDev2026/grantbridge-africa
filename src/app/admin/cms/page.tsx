import Link from 'next/link';
import { redirect } from 'next/navigation';

import { isAdmin } from '@/app/admin/actions';
import { AdminCard, AdminPageHeader, AdminSectionHeading, StatusPill } from '@/app/admin/admin-ui';
import { CmsDeleteButton, CmsPublishToggleButton } from '@/app/admin/cms/cms-actions';
import { Button } from '@/components/ui/button';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

const db = supabaseAdminClient as any;

function displayDate(value: string): string {
  return new Date(value).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function displayDateTime(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AdminCmsPage() {
  if (!(await isAdmin())) redirect('/dashboard');

  const [{ data: events, error: eventsError }, { data: stats, error: statsError }, { data: testimonials, error: testimonialsError }] =
    await Promise.all([
      db.from('cms_events').select('*').order('starts_at', { ascending: true }),
      db.from('cms_stats').select('*').order('sort_order', { ascending: true }),
      db.from('cms_testimonials').select('*').order('created_at', { ascending: false }),
    ]);

  const error = eventsError ?? statsError ?? testimonialsError;
  const eventList = events ?? [];
  const statList = stats ?? [];
  const testimonialList = testimonials ?? [];
  const now = new Date();
  const upcoming = eventList.filter((e: any) => new Date(e.starts_at) >= now).length;

  return (
    <div className='flex flex-col gap-6 py-8'>
      <AdminPageHeader
        title='Content'
        subtitle='Events, figures and testimonials shown on the public site. Nothing goes public until you publish it — and every figure or quote here must be real.'
        active='cms'
      />

      {error && (
        <AdminCard>
          <p className='text-sm text-red-700'>
            Could not load content: {error.message}. If the tables do not exist yet, apply
            migration <code>supabase/migrations/20261111000800_cms.sql</code> in the Supabase
            dashboard SQL Editor.
          </p>
        </AdminCard>
      )}

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Events'
          title='Upcoming events'
          right={
            <>
              <StatusPill tone={upcoming > 0 ? 'green' : 'muted'}>
                {upcoming > 0 ? `${upcoming} upcoming` : 'None scheduled'}
              </StatusPill>
              <Button variant='sun' size='sm' asChild>
                <Link href='/admin/cms/events/new'>+ New event</Link>
              </Button>
            </>
          }
        />
        {eventList.length === 0 ? (
          <p className='mt-4 text-sm text-brand-muted'>
            No events yet. Add a webinar, info session or launch day — it shows on the homepage
            and the events page only once you publish it.
          </p>
        ) : (
          <div className='mt-6 flex flex-col gap-4'>
            {eventList.map((e: any) => (
              <article key={e.id} className='rounded-2xl border border-brand-line bg-white p-5'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='font-semibold text-brand-ink'>{e.title}</p>
                    <p className='mt-1 text-sm text-brand-muted'>
                      {displayDateTime(e.starts_at)}
                      {e.location ? ` · ${e.location}` : ''}
                    </p>
                    {e.description && (
                      <p className='mt-2 line-clamp-2 text-sm text-brand-muted'>{e.description}</p>
                    )}
                  </div>
                  <StatusPill tone={e.status === 'published' ? 'green' : 'sun'}>
                    {e.status === 'published' ? 'Published' : 'Draft'}
                  </StatusPill>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/admin/cms/events/${e.id}/edit`}>Edit</Link>
                  </Button>
                  <CmsPublishToggleButton kind='event' id={e.id} published={e.status === 'published'} />
                  <CmsDeleteButton kind='event' id={e.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Figures'
          title='Homepage stats band'
          right={
            <Button variant='sun' size='sm' asChild>
              <Link href='/admin/cms/stats/new'>+ New figure</Link>
            </Button>
          }
        />
        <p className='mt-2 text-sm text-brand-muted'>
          Live figures are computed from the grants database every time the page loads — their
          values can never drift. Manual figures show exactly what you type, so only enter a real,
          verified number.
        </p>
        {statList.length === 0 ? (
          <p className='mt-4 text-sm text-brand-muted'>
            No figures configured. Apply migration 20261111000800_cms.sql to seed the four live
            figures (open grants, total funding, funders, countries).
          </p>
        ) : (
          <div className='mt-6 flex flex-col gap-4'>
            {statList.map((s: any) => (
              <article key={s.id} className='rounded-2xl border border-brand-line bg-white p-5'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='font-semibold text-brand-ink'>
                      {s.label}
                      <span className='ml-2 text-sm font-normal text-brand-muted'>({s.key})</span>
                    </p>
                    <p className='mt-1 text-sm text-brand-muted'>
                      {s.source === 'live'
                        ? 'Live — computed from the database'
                        : `Value: ${s.value || '— not set —'}`}
                      {s.sub ? ` · ${s.sub}` : ''}
                    </p>
                  </div>
                  <div className='flex shrink-0 items-center gap-2'>
                    <StatusPill tone={s.status === 'published' ? 'green' : 'sun'}>
                      {s.status === 'published' ? 'Published' : 'Draft'}
                    </StatusPill>
                    {s.source === 'live' && <StatusPill tone='blue'>Live</StatusPill>}
                  </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/admin/cms/stats/${s.id}/edit`}>Edit</Link>
                  </Button>
                  <CmsPublishToggleButton kind='stat' id={s.id} published={s.status === 'published'} />
                  {s.source !== 'live' && <CmsDeleteButton kind='stat' id={s.id} />}
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <AdminSectionHeading
          eyebrow='Testimonials'
          title='What organisations say'
          right={
            <Button variant='sun' size='sm' asChild>
              <Link href='/admin/cms/testimonials/new'>+ New testimonial</Link>
            </Button>
          }
        />
        <p className='mt-2 text-sm text-brand-muted'>
          Only real quotes from real people, with their real name and organisation. The homepage
          shows nothing here until you add one.
        </p>
        {testimonialList.length === 0 ? (
          <p className='mt-4 text-sm text-brand-muted'>
            No testimonials yet. Add one only when a real user has actually said it.
          </p>
        ) : (
          <div className='mt-6 flex flex-col gap-4'>
            {testimonialList.map((t: any) => (
              <article key={t.id} className='rounded-2xl border border-brand-line bg-white p-5'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='font-semibold text-brand-ink'>
                      {t.name}
                      {t.role ? <span className='ml-2 text-sm font-normal text-brand-muted'>{t.role}</span> : ''}
                    </p>
                    <p className='mt-2 text-sm italic text-brand-muted'>&ldquo;{t.quote}&rdquo;</p>
                    <p className='mt-1 text-xs text-brand-muted'>Added {displayDate(t.created_at)}</p>
                  </div>
                  <StatusPill tone={t.status === 'published' ? 'green' : 'sun'}>
                    {t.status === 'published' ? 'Published' : 'Draft'}
                  </StatusPill>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/admin/cms/testimonials/${t.id}/edit`}>Edit</Link>
                  </Button>
                  <CmsPublishToggleButton kind='testimonial' id={t.id} published={t.status === 'published'} />
                  <CmsDeleteButton kind='testimonial' id={t.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
