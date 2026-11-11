import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { getRole,ROLES } from '../roles';

// Role-detail template. With no open roles (ROLES is empty), every slug
// renders the honest "no such role" state below — never a fake role.
// When a real Role is added to roles.ts, this same page renders it:
// summary, Team/Location pills, About the role, What you'll do,
// What we're looking for, Nice to have, and the right-hand summary card
// with Apply now, plus Other openings and a back link.
export default async function RolePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const role = getRole(slug);
  const otherOpenings = ROLES.filter((r) => r.slug !== slug);

  if (!role) {
    return (
      <div className='mx-auto max-w-3xl py-16 text-center'>
        <h1>That role isn’t open</h1>
        <p className='mx-auto mt-3 max-w-md text-brand-muted'>
          There is no open role at that address — and GrantBridge Africa is not hiring right
          now. When a role opens, it will be listed on the careers page.
        </p>
        <div className='mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row'>
          <Button variant='brand' asChild>
            <Link href='/careers'>See all openings</Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href='/about-us'>About us</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl py-10'>
      <Link href='/careers' className='text-sm font-medium text-brand-green hover:underline'>
        ← All openings
      </Link>

      <div className='mt-6 grid gap-8 lg:grid-cols-3'>
        <div className='lg:col-span-2'>
          <h1>{role.title}</h1>
          <div className='mt-3 flex flex-wrap gap-2'>
            <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-medium text-brand-green'>
              {role.team}
            </span>
            <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-medium text-brand-green'>
              {role.location}
            </span>
            <span className='rounded-full bg-brand-greenSoft px-3 py-1 text-xs font-medium text-brand-green'>
              {role.type}
            </span>
          </div>
          <p className='mt-4 text-lg text-brand-muted'>{role.summary}</p>

          <section className='mt-8'>
            <h2>About the role</h2>
            <p className='mt-2 text-brand-muted'>{role.aboutTheRole}</p>
          </section>

          <section className='mt-8'>
            <h2>What you’ll do</h2>
            <ul className='mt-2 flex list-disc flex-col gap-1 pl-5 text-brand-muted'>
              {role.whatYoullDo.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className='mt-8'>
            <h2>What we’re looking for</h2>
            <ul className='mt-2 flex list-disc flex-col gap-1 pl-5 text-brand-muted'>
              {role.whatWereLookingFor.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          {role.niceToHave.length > 0 && (
            <section className='mt-8'>
              <h2>Nice to have</h2>
              <ul className='mt-2 flex list-disc flex-col gap-1 pl-5 text-brand-muted'>
                {role.niceToHave.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className='lg:sticky lg:top-6 lg:h-fit'>
          <div className='rounded-2xl border border-brand-line bg-white p-6'>
            <h2 className='text-lg'>{role.title}</h2>
            <dl className='mt-3 flex flex-col gap-2 text-sm'>
              <div className='flex justify-between gap-4'>
                <dt className='text-brand-muted'>Team</dt>
                <dd className='font-medium text-brand-ink'>{role.team}</dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-brand-muted'>Location</dt>
                <dd className='font-medium text-brand-ink'>{role.location}</dd>
              </div>
              <div className='flex justify-between gap-4'>
                <dt className='text-brand-muted'>Type</dt>
                <dd className='font-medium text-brand-ink'>{role.type}</dd>
              </div>
            </dl>
            <div className='mt-5'>
              <Button variant='brand' className='w-full' asChild>
                <Link href='/contact'>Apply now</Link>
              </Button>
              <p className='mt-2 text-center text-xs text-brand-muted'>
                Applying opens the contact form — tell us about yourself and the role.
              </p>
            </div>
          </div>

          {otherOpenings.length > 0 && (
            <div className='mt-4 rounded-2xl border border-brand-line bg-white p-6'>
              <h2 className='text-lg'>Other openings</h2>
              <div className='mt-3 flex flex-col gap-3'>
                {otherOpenings.map((other) => (
                  <Link
                    key={other.slug}
                    href={`/careers/${other.slug}`}
                    className='text-sm font-medium text-brand-green hover:underline'
                  >
                    {other.title} — {other.location}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
