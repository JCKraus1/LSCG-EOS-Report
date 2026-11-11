/**
 * Utility to enforce maximum session age (6 hours) and guarantee
 * all field users are running the latest version of the EOS web app.
 */

export const CURRENT_APP_VERSION = '2.4.0';
export const SESSION_START_KEY = 'eos_session_started_at';
export const SIX_HOURS_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

let isReloading = false;

/**
 * Retrieves or initializes the session start timestamp.
 */
export function getSessionStartTime(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    const stored = localStorage.getItem(SESSION_START_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= Date.now()) {
        return parsed;
      }
    }
    const now = Date.now();
    localStorage.setItem(SESSION_START_KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
}

/**
 * Calculates remaining time until the 6-hour refresh threshold.
 */
export function getSessionAgeInfo(): {
  sessionStart: number;
  ageMs: number;
  remainingMs: number;
  isExpired: boolean;
  hoursRemaining: number;
  minutesRemaining: number;
} {
  const sessionStart = getSessionStartTime();
  const now = Date.now();
  const ageMs = Math.max(0, now - sessionStart);
  const remainingMs = Math.max(0, SIX_HOURS_MS - ageMs);
  const isExpired = ageMs >= SIX_HOURS_MS;

  const totalMinutesRemaining = Math.floor(remainingMs / (60 * 1000));
  const hoursRemaining = Math.floor(totalMinutesRemaining / 60);
  const minutesRemaining = totalMinutesRemaining % 60;

  return {
    sessionStart,
    ageMs,
    remainingMs,
    isExpired,
    hoursRemaining,
    minutesRemaining
  };
}

/**
 * Triggers a hard cache-busting reload to ensure the client receives the newest bundle.
 */
export async function forceAppReload(
  reason: string,
  onBeforeReload?: () => Promise<void> | void
): Promise<void> {
  if (isReloading) return;
  isReloading = true;

  console.info(`[EOS Version Guard] Force reloading app: ${reason}`);

  try {
    if (onBeforeReload) {
      await onBeforeReload();
    }
  } catch (err) {
    console.warn('[EOS Version Guard] Error running onBeforeReload hook:', err);
  }

  // Clear session start time so the refreshed page starts a brand new 6-hour clock
  try {
    localStorage.setItem(SESSION_START_KEY, String(Date.now()));
  } catch (e) {
    console.warn(e);
  }

  // Clear service worker caches if present
  try {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (err) {
    console.warn('[EOS Version Guard] Cache clear failed:', err);
  }

  // Force cache-busting navigation reload
  if (typeof window !== 'undefined') {
    const url = new URL(window.location.href);
    url.searchParams.set('_v', String(Date.now()));
    window.location.replace(url.toString());
  }
}

/**
 * Checks public/version.json to see if a newer version has been deployed.
 */
export async function checkForNewDeployedVersion(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.version && data.version !== CURRENT_APP_VERSION) {
      console.info(`[EOS Version Guard] New version detected: ${data.version} (current: ${CURRENT_APP_VERSION})`);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Initializes the 6-Hour Guard Engine:
 * 1. Automatically checks age on interval (every 60s)
 * 2. Checks immediately when mobile tab is resumed or focused (visibilitychange / focus)
 * 3. Periodically checks version.json when online
 */
export function initSessionRefreshGuard(
  onBeforeReload?: () => Promise<void> | void
): () => void {
  // Ensure start time is recorded
  getSessionStartTime();

  const verifyAgeAndVersion = async () => {
    if (isReloading) return;

    const info = getSessionAgeInfo();
    if (info.isExpired) {
      await forceAppReload('6-hour session limit reached', onBeforeReload);
      return;
    }

    // Check if new version was deployed on server
    const hasNewVersion = await checkForNewDeployedVersion();
    if (hasNewVersion) {
      await forceAppReload('New application build deployed', onBeforeReload);
    }
  };

  // Run immediate verification on startup
  verifyAgeAndVersion();

  // 1. Regular timer check every 60 seconds
  const intervalId = setInterval(() => {
    verifyAgeAndVersion();
  }, 60000);

  // 2. Mobile tab wakeup / browser focus listener
  const handleVisibilityOrFocus = () => {
    if (document.visibilityState === 'visible') {
      verifyAgeAndVersion();
    }
  };

  window.addEventListener('visibilitychange', handleVisibilityOrFocus);
  window.addEventListener('focus', handleVisibilityOrFocus);
  window.addEventListener('online', handleVisibilityOrFocus);

  return () => {
    clearInterval(intervalId);
    window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    window.removeEventListener('focus', handleVisibilityOrFocus);
    window.removeEventListener('online', handleVisibilityOrFocus);
  };
}
