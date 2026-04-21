import { useEffect } from 'react';

export function usePortraitOrientation() {
  useEffect(() => {
    let cancelled = false;

    async function lockPortrait() {
      if (cancelled || !screen.orientation?.lock) {
        return;
      }

      try {
        await screen.orientation.lock('portrait-primary');
      } catch {
        try {
          await screen.orientation.lock('portrait');
        } catch {
          // Some mobile browsers only honor the PWA manifest orientation.
        }
      }
    }

    lockPortrait();
    window.addEventListener('focus', lockPortrait);
    document.addEventListener('visibilitychange', lockPortrait);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', lockPortrait);
      document.removeEventListener('visibilitychange', lockPortrait);
    };
  }, []);
}
