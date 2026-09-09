/**
 * CME trading-day list axis. Spec §6 (GSC7). Zero view-layer imports.
 * One occupying day = 18:00→17:00 ET = 1380 minutes.
 * Window SPAN = dayCount × 1380. toAxis_window = dayIndex × 1380 + intra-day.
 */

export const DAY_MINUTES = 1380;
/** Intra-day span. Kept as SPAN so one-day tests stay literal. */
export const SPAN = DAY_MINUTES;
export const ORIGIN = 1080; // 18:00 in minutes from midnight
export const WINDOW_DAYS_DEFAULT = 7;
export const ANCHOR_INDEX_DEFAULT = 2;

export function windowSpan(dayCount: number): number {
  return dayCount * DAY_MINUTES;
}

export function toWindowAxis(
  dayIndex: number,
  localMin: number,
  localOffH: number,
  etOffH: number,
): number {
  return dayIndex * DAY_MINUTES + toAxis(localMin, localOffH, etOffH);
}

/** Hours east of UTC. Sample `when` at 12:00 UTC on the selected date. */
export function zoneOffset(tz: string, when: Date): number {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "longOffset",
  }).format(when);
  const m = s.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0; // bare "GMT" → UTC+0 — London in winter
  return (m[1] === "-" ? -1 : 1) * (+m[2] + (+(m[3] || 0)) / 60);
}

export function noonUtc(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00Z`);
}

export function toAxis(
  localMin: number,
  localOffH: number,
  etOffH: number,
): number {
  const etMin = localMin - localOffH * 60 + etOffH * 60;
  return ((etMin - ORIGIN) % 1440 + 1440) % 1440;
}

export function etMinutes(
  localMin: number,
  localOffH: number,
  etOffH: number,
): number {
  return ((localMin - localOffH * 60 + etOffH * 60) % 1440 + 1440) % 1440;
}

export function formatEtClock(etMin: number): string {
  const m = ((etMin % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const min = m % 60;
  const am = h24 < 12;
  let h = h24 % 12;
  if (h === 0) h = 12;
  const mm = String(min).padStart(2, "0");
  return `${h}:${mm} ${am ? "AM" : "PM"}`;
}

/** Spec §9.1 style: `9:30 AM – 4:00 PM` from local start/end on a date. */
export function etRangeLabel(
  isoDate: string,
  tz: string,
  startLocalMin: number,
  endLocalMin: number,
): string {
  const when = noonUtc(isoDate);
  const localOff = zoneOffset(tz, when);
  const etOff = zoneOffset("America/New_York", when);
  const a = etMinutes(startLocalMin, localOff, etOff);
  const b = etMinutes(endLocalMin, localOff, etOff);
  return `${formatEtClock(a)} – ${formatEtClock(b)}`;
}

export function segmentOnAxis(
  isoDate: string,
  tz: string,
  startLocalMin: number,
  endLocalMin: number,
): { a: number; b: number } {
  const when = noonUtc(isoDate);
  const localOff = zoneOffset(tz, when);
  const etOff = zoneOffset("America/New_York", when);
  let a = toAxis(startLocalMin, localOff, etOff);
  let b = toAxis(endLocalMin, localOff, etOff);
  if (b <= a) b = SPAN;
  return { a, b };
}

/** Per-day 12:00 UTC sample (L3 amended). */
export function segmentOnWindowAxis(
  dayIndex: number,
  isoDate: string,
  tz: string,
  startLocalMin: number,
  endLocalMin: number,
): { a: number; b: number } {
  const { a, b } = segmentOnAxis(isoDate, tz, startLocalMin, endLocalMin);
  return { a: dayIndex * DAY_MINUTES + a, b: dayIndex * DAY_MINUTES + b };
}
