/** Session open/close in exchange time; chart labels in exchange or local TZ. */

export const EXCHANGE_TZ = "America/New_York";

export type ChartTimeZonePref = "exchange" | "local";
export type SessionLineWidth = "thin" | "medium" | "thick";
export type SessionLineStyle = "solid" | "dashed";

export function resolveChartTimeZone(
  pref: ChartTimeZonePref | undefined,
): string {
  if (pref === "local") {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || EXCHANGE_TZ;
  }
  return EXCHANGE_TZ;
}

export function sessionHoursForSource(source: string): {
  openHm: [number, number];
  closeHm: [number, number];
} {
  const s = (source || "").toUpperCase();
  if (s === "ES" || s === "MES" || s === "NQ" || s === "YM" || s === "RTY") {
    return { openHm: [18, 0], closeHm: [17, 0] };
  }
  return { openHm: [9, 30], closeHm: [16, 0] };
}

export function zonedHmToUnix(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timeZone: string,
): number {
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(new Date(utcGuess));
  const get = (type: string) => {
    const v = parts.find((p) => p.type === type)?.value;
    return Number(v);
  };
  let hh = get("hour");
  if (hh === 24) hh = 0;
  const asIfUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    hh,
    get("minute"),
    get("second"),
  );
  return Math.floor((utcGuess - (asIfUtc - utcGuess)) / 1000);
}

function ymdInZone(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

function weekdayInZone(
  year: number,
  month: number,
  day: number,
  timeZone: string,
): number {
  const noon = zonedHmToUnix(year, month, day, 12, 0, timeZone);
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(new Date(noon * 1000));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}

/**
 * ES: close 17:00 ET (Mon–Fri), open 18:00 ET (Sun–Thu).
 * Equity: 09:30 / 16:00 ET weekdays.
 */
export function sessionBoundaryUnix(opts: {
  fromSec: number;
  toSec: number;
  openHm: [number, number];
  closeHm: [number, number];
  timeZone?: string;
}): number[] {
  const tz = opts.timeZone || EXCHANGE_TZ;
  const from = opts.fromSec - 36 * 3600;
  const to = opts.toSec + 36 * 3600;
  const out: number[] = [];
  const seen = new Set<string>();
  let cursor = from * 1000;
  const end = to * 1000;
  const isFutures = opts.openHm[0] === 18;
  while (cursor <= end) {
    const ymd = ymdInZone(cursor, tz);
    if (!seen.has(ymd)) {
      seen.add(ymd);
      const [y, m, d] = ymd.split("-").map(Number);
      const dow = weekdayInZone(y, m, d, tz);
      if (dow !== 6) {
        const close = zonedHmToUnix(
          y,
          m,
          d,
          opts.closeHm[0],
          opts.closeHm[1],
          tz,
        );
        const open = zonedHmToUnix(
          y,
          m,
          d,
          opts.openHm[0],
          opts.openHm[1],
          tz,
        );
        if (isFutures) {
          if (dow >= 1 && dow <= 5) out.push(close);
          if (dow >= 0 && dow <= 4) out.push(open);
        } else if (dow >= 1 && dow <= 5) {
          out.push(open, close);
        }
      }
    }
    cursor += 12 * 3600 * 1000;
  }
  return [...new Set(out)]
    .filter((t) => t >= opts.fromSec - 3600 && t <= opts.toSec + 3600)
    .sort((a, b) => a - b);
}

export function formatUnixInZone(
  unixSec: number,
  timeZone: string,
  withTime: boolean,
): string {
  const d = new Date(unixSec * 1000);
  if (!withTime) {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      month: "short",
      day: "numeric",
    }).format(d);
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export const SESSION_WIDTH_PX: Record<SessionLineWidth, number> = {
  thin: 1,
  medium: 2,
  thick: 3,
};
