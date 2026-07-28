/**
 * Pre-launch countdown for labs.fattail.ai home page.
 *
 * Set NEXT_PUBLIC_LABS_LAUNCH_AT to an ISO-8601 instant (with timezone).
 * Example: 2026-08-01T09:00:00-04:00  (Saturday 9am Eastern)
 *
 * When unset or already past, the normal course hub is the home page.
 */

export function getLaunchAt(): Date | null {
  const raw = process.env.NEXT_PUBLIC_LABS_LAUNCH_AT?.trim();
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error(
      `NEXT_PUBLIC_LABS_LAUNCH_AT must be a valid ISO date/time (got ${JSON.stringify(raw)})`,
    );
  }
  return d;
}

/** True while the public home should be the countdown landing. */
export function isPreLaunch(now: Date = new Date()): boolean {
  const at = getLaunchAt();
  if (!at) return false;
  return now.getTime() < at.getTime();
}

export function launchAtIso(): string | null {
  const at = getLaunchAt();
  return at ? at.toISOString() : null;
}
