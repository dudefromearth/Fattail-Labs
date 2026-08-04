/**
 * TradingSessionResolver — frontend two-layer session classifier.
 *
 * Maps timestamps to a two-layer output:
 *   Layer 1 — Globex (continuous futures regime): isGlobex boolean
 *   Layer 2 — RTH Structure (discrete daily phases): rthSession string or null
 *
 * All time comparisons use Intl.DateTimeFormat with timeZone to avoid
 * raw getHours()/getMinutes() timezone bugs (Fix 2).
 *
 * Holiday labels force "Holiday" — never display holiday_name (Fix 3).
 */

export interface TradingSession {
  /** Backward-compatible session ID for dividers and context snapshots */
  id: string;
  label: string;
  isTradingDay: boolean;
  isHoliday: boolean;
  holidayName?: string;
  /** Layer 1: Is Globex open? */
  isGlobex: boolean;
  /** Layer 2: RTH session or null if outside RTH */
  rthSession: string | null;
}

export interface RthSessionConfig {
  start: string;
  end: string;
  label: string;
  short_label: string;
}

export interface GlobexConfig {
  weekly_start: string;
  weekly_end: string;
  daily_halt_start: string;
  daily_halt_end: string;
  daily_halt_days: string[];
}

export interface SessionConfig {
  timezone: string;
  globex: GlobexConfig;
  rthSessions: Record<string, RthSessionConfig>;
}

export interface HolidayEntry {
  date: string;
  name: string;
}

const DAY_NAME_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function parseDayTime(value: string): { day: number; hour: number; minute: number } {
  const parts = value.trim().toLowerCase().split(/\s+/);
  const day = DAY_NAME_MAP[parts[0]] ?? 0;
  const [h, m] = (parts[1] ?? '0:0').split(':').map(Number);
  return { day, hour: h, minute: m };
}

function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(':').map(Number);
  return { hour: h, minute: m };
}

// Default config matching truth/components/market.json (two-layer)
export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  timezone: 'America/New_York',
  globex: {
    weekly_start: 'sunday 18:00',
    weekly_end: 'friday 17:00',
    daily_halt_start: '17:00',
    daily_halt_end: '18:00',
    daily_halt_days: ['monday', 'tuesday', 'wednesday', 'thursday'],
  },
  rthSessions: {
    morning: { start: '09:30', end: '12:30', label: 'Morning', short_label: 'AM' },
    afternoon: { start: '12:30', end: '14:20', label: 'Afternoon', short_label: 'PM' },
    closing: { start: '14:30', end: '16:00', label: 'Closing', short_label: 'CL' },
  },
};

// 2026 holidays matching truth/components/market.json
export const DEFAULT_HOLIDAYS: HolidayEntry[] = [
  { date: '2026-01-01', name: "New Year's Day" },
  { date: '2026-01-19', name: 'MLK Day' },
  { date: '2026-02-16', name: "Presidents' Day" },
  { date: '2026-04-03', name: 'Good Friday' },
  { date: '2026-05-25', name: 'Memorial Day' },
  { date: '2026-06-19', name: 'Juneteenth' },
  { date: '2026-07-03', name: 'Independence Day (observed)' },
  { date: '2026-09-07', name: 'Labor Day' },
  { date: '2026-11-26', name: 'Thanksgiving' },
  { date: '2026-12-25', name: 'Christmas' },
];

/**
 * Get Eastern Time components from a Date using Intl.DateTimeFormat.
 * Never uses raw getHours()/getMinutes() (Fix 2).
 */
function getEasternParts(ts: Date, timezone: string): {
  hour: number;
  minute: number;
  second: number;
  weekday: number;
  year: number;
  month: number;
  day: number;
} {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  });

  const parts = fmt.formatToParts(ts);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '0';

  const weekdayStr = get('weekday');
  const weekdayMap: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };

  // Intl hour12:false returns '24' for midnight in some engines
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0;

  return {
    hour,
    minute: parseInt(get('minute'), 10),
    second: parseInt(get('second'), 10),
    weekday: weekdayMap[weekdayStr] ?? 0,
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10),
    day: parseInt(get('day'), 10),
  };
}

/**
 * Convert time to minutes since midnight for comparison.
 */
function toMinutes(hour: number, minute: number): number {
  return hour * 60 + minute;
}

/**
 * Format Eastern date as ISO date string (YYYY-MM-DD).
 */
function toDateISO(parts: { year: number; month: number; day: number }): string {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

/**
 * Check if Globex is open at the given weekday + time.
 */
function isGlobexOpen(
  weekday: number,
  hour: number,
  minute: number,
  config: SessionConfig,
): boolean {
  const currentMin = toMinutes(hour, minute);
  const start = parseDayTime(config.globex.weekly_start);
  const end = parseDayTime(config.globex.weekly_end);
  const haltStart = parseTime(config.globex.daily_halt_start);
  const haltEnd = parseTime(config.globex.daily_halt_end);
  const haltDays = new Set(config.globex.daily_halt_days.map((d) => DAY_NAME_MAP[d.toLowerCase()]));

  // Check daily halt
  if (haltDays.has(weekday)) {
    const haltStartMin = toMinutes(haltStart.hour, haltStart.minute);
    const haltEndMin = toMinutes(haltEnd.hour, haltEnd.minute);
    if (currentMin >= haltStartMin && currentMin < haltEndMin) {
      return false;
    }
  }

  // Saturday: always closed
  if (weekday === 6) return false;

  // Sunday: only open after weekly start time
  if (weekday === start.day) {
    return currentMin >= toMinutes(start.hour, start.minute);
  }

  // Friday: only open before weekly end time
  if (weekday === end.day) {
    return currentMin < toMinutes(end.hour, end.minute);
  }

  // Mon-Thu: open (halt already checked above)
  if (weekday >= 1 && weekday <= 4) return true;

  return false;
}

/**
 * Equity-index options mark clock for Risk Graph pricing.
 *
 * When RTH is open: as-of = now (live quotes).
 * When closed (weekend / holiday / after 4pm ET / before open): as-of = most
 * recent 4:00 PM ET on a trading day — the last cash print vintage.
 *
 * Why: heatmap mids/IVs freeze at Friday close. Pricing T with Saturday wall
 * clock shrinks time-to-expiry while marks stay fixed → magenta curve drifts
 * off the card debit even though nothing "traded". Align T with the print.
 */
export function pricingAsOfMs(
  now: Date = new Date(),
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
  holidays: HolidayEntry[] = DEFAULT_HOLIDAYS,
): number {
  const session = resolveSession(now, config, holidays);
  // In an RTH bucket (morning / afternoon / closing) → live clock
  if (session.rthSession != null) return now.getTime();

  // Otherwise pin to last 4:00 PM ET trading-day close
  return lastOptionsMarkCloseMs(now, config, holidays);
}

/**
 * Most recent 4:00 PM America/New_York on a non-weekend, non-holiday day
 * that is strictly before `now` (or equal if now is exactly at close).
 */
export function lastOptionsMarkCloseMs(
  now: Date = new Date(),
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
  holidays: HolidayEntry[] = DEFAULT_HOLIDAYS,
): number {
  const tz = config.timezone;
  // Walk back up to 10 calendar days to skip long weekends / holidays
  for (let back = 0; back < 10; back++) {
    const probe = new Date(now.getTime() - back * 86_400_000);
    const parts = getEasternParts(probe, tz);
    const dateISO = toDateISO(parts);
    if (parts.weekday === 0 || parts.weekday === 6) continue;
    if (holidays.some(h => h.date === dateISO)) continue;

    // 16:00 ET that day. Use fixed offset form; DST: Jul = -04:00, Jan = -05:00.
    // Prefer constructing via noon UTC and formatting is brittle; use explicit
    // ISO with offset from a known ET hour using the same date's DST rule:
    const closeLocal = `${dateISO}T16:00:00`;
    // Determine EDT vs EST for this calendar date via noon UTC→ET hour
    const noonUtc = new Date(`${dateISO}T12:00:00Z`);
    const etAtNoon = getEasternParts(noonUtc, tz);
    // If ET is 7 or 8 at noon UTC → offset -05 or -04
    const offsetHours = etAtNoon.hour - 12; // e.g. 8-12=-4 (EDT), 7-12=-5 (EST)
    const offset = offsetHours === -4 ? '-04:00' : offsetHours === -5 ? '-05:00' : '-04:00';
    const closeMs = new Date(closeLocal + offset).getTime();
    if (Number.isFinite(closeMs) && closeMs <= now.getTime() + 1000) {
      return closeMs;
    }
  }
  // Fallback: 24h ago
  return now.getTime() - 86_400_000;
}

/**
 * True when equity RTH is open (options marks are live).
 */
export function isEquityRthOpen(
  now: Date = new Date(),
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
  holidays: HolidayEntry[] = DEFAULT_HOLIDAYS,
): boolean {
  return resolveSession(now, config, holidays).rthSession != null;
}

/**
 * Check if time falls within any RTH session boundary.
 */
function resolveRth(
  hour: number,
  minute: number,
  config: SessionConfig,
): string | null {
  const currentMin = toMinutes(hour, minute);
  for (const [sid, sess] of Object.entries(config.rthSessions)) {
    const s = parseTime(sess.start);
    const e = parseTime(sess.end);
    const startMin = toMinutes(s.hour, s.minute);
    const endMin = toMinutes(e.hour, e.minute);
    if (currentMin >= startMin && currentMin < endMin) {
      return sid;
    }
  }
  return null;
}

/**
 * Resolve a timestamp to a TradingSession (two-layer output).
 */
export function resolveSession(
  ts: Date,
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
  holidays: HolidayEntry[] = DEFAULT_HOLIDAYS,
): TradingSession {
  const parts = getEasternParts(ts, config.timezone);
  const dateISO = toDateISO(parts);

  // Weekend check (0 = Sun, 6 = Sat)
  if (parts.weekday === 0 || parts.weekday === 6) {
    const globex = isGlobexOpen(parts.weekday, parts.hour, parts.minute, config);
    return {
      id: globex ? 'globex' : 'weekend_holiday',
      label: globex ? 'Globex' : 'Weekend',
      isTradingDay: false,
      isHoliday: false,
      isGlobex: globex,
      rthSession: null,
    };
  }

  // Holiday check
  const holiday = holidays.find((h) => h.date === dateISO);
  if (holiday) {
    return {
      id: 'weekend_holiday',
      label: 'Holiday', // Fix 3: always "Holiday", never holiday name
      isTradingDay: false,
      isHoliday: true,
      holidayName: holiday.name,
      isGlobex: false,
      rthSession: null,
    };
  }

  // Two-layer resolution
  const globex = isGlobexOpen(parts.weekday, parts.hour, parts.minute, config);
  const rthSession = resolveRth(parts.hour, parts.minute, config);

  // Determine ID and label for backward compatibility
  let id: string;
  let label: string;
  if (rthSession) {
    id = rthSession;
    label = config.rthSessions[rthSession]?.label ?? rthSession;
  } else if (globex) {
    id = 'globex';
    label = 'Globex';
  } else {
    id = 'closed';
    label = 'Closed';
  }

  return {
    id,
    label,
    isTradingDay: true,
    isHoliday: false,
    isGlobex: globex,
    rthSession,
  };
}

/**
 * Format a session divider label per spec §4.4.
 *
 * - Today: "Morning · 9:42 AM"
 * - This week: "Power Hour · Tue 3:15 PM"
 * - Older: "Globex · Mon Feb 17, 6:30 PM"
 * - Different year: "Morning · Dec 12, 2025, 10:05 AM"
 * - Weekend today: "Weekend · Today, 11:30 AM"
 * - Holiday: "Holiday · Mon Jan 20, 10:00 AM" (never holiday name — Fix 3)
 */
export function formatSessionDivider(
  session: TradingSession,
  ts: Date,
  now: Date = new Date(),
): string {
  // Force "Holiday" label when isHoliday (Fix 3) — never display holidayName
  const name = session.isHoliday ? 'Holiday' : session.label;

  const timezone = DEFAULT_SESSION_CONFIG.timezone;
  const tsParts = getEasternParts(ts, timezone);
  const nowParts = getEasternParts(now, timezone);

  const tsDate = toDateISO(tsParts);
  const nowDate = toDateISO(nowParts);

  // Format the time portion
  const timeFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const timeStr = timeFmt.format(ts);

  // Same day
  if (tsDate === nowDate) {
    return `${name} · ${timeStr}`;
  }

  // Different year
  if (tsParts.year !== nowParts.year) {
    const dateFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${name} · ${dateFmt.format(ts)}, ${timeStr}`;
  }

  // This week (within 7 days)
  const msPerDay = 86400000;
  const dayDiff = Math.floor((now.getTime() - ts.getTime()) / msPerDay);
  if (dayDiff < 7 && dayDiff >= 0) {
    const dayFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
    });
    return `${name} · ${dayFmt.format(ts)} ${timeStr}`;
  }

  // Older (same year)
  const dateFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return `${name} · ${dateFmt.format(ts)}, ${timeStr}`;
}

/**
 * Determine whether a session divider should be shown between two messages.
 *
 * First message always gets a divider (§5.1 — prev === null).
 * Subsequent messages get a divider when the session changes.
 */
export function shouldShowDivider(
  currentMsg: { ts: number },
  prevMsg: { ts: number } | null,
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
  holidays: HolidayEntry[] = DEFAULT_HOLIDAYS,
): { show: boolean; label: string } {
  const currentDate = new Date(currentMsg.ts);
  const currentSession = resolveSession(currentDate, config, holidays);

  // First message always gets a divider
  if (!prevMsg) {
    return {
      show: true,
      label: formatSessionDivider(currentSession, currentDate),
    };
  }

  const prevDate = new Date(prevMsg.ts);
  const prevSession = resolveSession(prevDate, config, holidays);

  // Show divider when session changes
  if (currentSession.id !== prevSession.id) {
    return {
      show: true,
      label: formatSessionDivider(currentSession, currentDate),
    };
  }

  // Also show divider when date changes even if same session
  // (e.g., two globex messages on different days)
  const currentParts = getEasternParts(currentDate, config.timezone);
  const prevParts = getEasternParts(prevDate, config.timezone);
  if (toDateISO(currentParts) !== toDateISO(prevParts)) {
    return {
      show: true,
      label: formatSessionDivider(currentSession, currentDate),
    };
  }

  return { show: false, label: '' };
}

/**
 * Classify a timestamp into a session bucket key for the weekly grid.
 * Returns the grid row bucket: 'globex_only' | 'morning' | 'afternoon' | 'closing'
 */
export function resolveSessionBucket(
  ts: Date,
  config: SessionConfig = DEFAULT_SESSION_CONFIG,
  holidays: HolidayEntry[] = DEFAULT_HOLIDAYS,
): 'globex_only' | 'morning' | 'afternoon' | 'closing' {
  const session = resolveSession(ts, config, holidays);
  if (session.rthSession) {
    return session.rthSession as 'morning' | 'afternoon' | 'closing';
  }
  return 'globex_only';
}
