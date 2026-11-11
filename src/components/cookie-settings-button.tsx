'use client';

import { CONSENT_COOKIE } from '@/libs/meta/consent';

/** Clears the stored cookie consent so the banner shows again. */
export function CookieSettingsButton() {
  return (
    <button
      type='button'
      className='w-fit text-left hover:text-brand-green'
      onClick={() => {
        localStorage.removeItem('gb_consent');
        // Clear the server-readable mirror too, so server events stop as well.
        document.cookie = `${CONSENT_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
        location.reload();
      }}
    >
      Cookie settings
    </button>
  );
}
