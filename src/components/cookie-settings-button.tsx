'use client';

/** Clears the stored cookie consent so the banner shows again. */
export function CookieSettingsButton() {
  return (
    <button
      type='button'
      className='w-fit text-left hover:text-brand-green'
      onClick={() => {
        localStorage.removeItem('gb_consent');
        location.reload();
      }}
    >
      Cookie settings
    </button>
  );
}
