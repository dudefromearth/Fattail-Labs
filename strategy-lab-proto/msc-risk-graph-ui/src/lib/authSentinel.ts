/**
 * authSentinel — global 401 circuit breaker.
 *
 * When any fetch receives a 401, markExpired() is called once.
 * All polling hooks check isExpired() before firing and skip if true.
 * AuthWrapper listens via onSessionExpired() to show the login page.
 *
 * On re-authentication, clearExpired() resets the flag.
 */

let expired = false;
const listeners: Set<() => void> = new Set();

/** True when any hook has received a 401 since last clearExpired(). */
export function isExpired(): boolean {
  return expired;
}

/** Called by any hook on a 401 response. Fires listeners exactly once. */
export function markExpired(): void {
  if (expired) return;
  expired = true;
  listeners.forEach(fn => fn());
}

/** Called on successful re-authentication to resume polling. */
export function clearExpired(): void {
  expired = false;
}

/** Subscribe to session expiry. Returns unsubscribe function. */
export function onSessionExpired(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
