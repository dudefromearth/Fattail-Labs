/**
 * Cross-app "still using Labs" signal for IdleSessionGuard.
 *
 * Trading surfaces (Options Lab, live marks) update without mouse movement.
 * Without this, a 30-minute idle timer can clear ft_session while the member
 * is actively watching a live chart — and after a tab freeze/crash recovery
 * a deferred setTimeout can fire immediately and log them out.
 *
 * last activity is also mirrored to localStorage so a hard reload after a
 * browser crash still knows the session was recently warm (cookie Max-Age
 * already survives; this only prevents false idle logout on restore).
 */

const STORAGE_KEY = "ft_session_last_activity";
const THROTTLE_MS = 8_000;

let lastMs = 0;
const listeners = new Set<() => void>();

function readStored(): number {
  if (typeof window === "undefined") return 0;
  try {
    const n = Number(window.localStorage.getItem(STORAGE_KEY) || 0);
    return Number.isFinite(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

function writeStored(ms: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(ms));
  } catch {
    /* private mode / quota */
  }
}

/** Wall-clock ms of last activity (memory or storage). */
export function getLastSessionActivityMs(): number {
  return Math.max(lastMs, readStored());
}

/**
 * Record member activity. Throttled so high-frequency market pushes do not
 * thrash localStorage or idle-guard listeners.
 */
export function touchSessionActivity(_reason?: string): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  if (now - lastMs < THROTTLE_MS) return;
  lastMs = now;
  writeStored(now);
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore */
    }
  }
}

/** Subscribe to activity touches (IdleSessionGuard). */
export function subscribeSessionActivity(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Clear on explicit logout so a later visitor does not inherit activity. */
export function clearSessionActivity(): void {
  lastMs = 0;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
