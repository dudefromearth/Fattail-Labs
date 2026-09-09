/**
 * NYSE/Nasdaq/Cboe calendar from rules. No year lookup table.
 * Spec: FatTail-Labs-Sessions (Global Session Clock) §7.
 * Zero view-layer imports.
 */

export type DayStatus =
  | { kind: "open" }
  | { kind: "weekend"; name: "Saturday" | "Sunday" }
  | { kind: "closed"; name: string }
  | { kind: "early"; name: string };

/** Unscheduled closures only (L4). Ships empty. */
export type Override = {
  date: string;
  kind: "closed" | "early";
  reason: string;
};

export const OVERRIDES: readonly Override[] = [];

type NamedDate = { date: string; name: string };

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function iso(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}

function parseIso(isoDate: string): { y: number; m: number; d: number; wd: number } {
  const [ys, ms, ds] = isoDate.split("-");
  const y = Number(ys);
  const m = Number(ms);
  const d = Number(ds);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const wd = dt.getUTCDay(); // 0 Sun … 6 Sat
  return { y, m, d, wd };
}

function weekdayUtc(y: number, m: number, d: number): number {
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Gregorian computus → Easter Sunday UTC date parts. */
export function easterSunday(year: number): { y: number; m: number; d: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { y: year, m: month, d: day };
}

function addDays(
  y: number,
  m: number,
  d: number,
  delta: number,
): { y: number; m: number; d: number } {
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return {
    y: dt.getUTCFullYear(),
    m: dt.getUTCMonth() + 1,
    d: dt.getUTCDate(),
  };
}

/** nth weekday in month: n=1 first, weekday 0=Sun … 6=Sat. */
function nthWeekday(
  year: number,
  month: number,
  weekday: number,
  n: number,
): { y: number; m: number; d: number } {
  const firstWd = weekdayUtc(year, month, 1);
  const offset = (weekday - firstWd + 7) % 7;
  const day = 1 + offset + 7 * (n - 1);
  return { y: year, m: month, d: day };
}

function lastWeekday(
  year: number,
  month: number,
  weekday: number,
): { y: number; m: number; d: number } {
  const last = new Date(Date.UTC(year, month, 0)); // last day of month
  const lastD = last.getUTCDate();
  const lastWd = last.getUTCDay();
  const back = (lastWd - weekday + 7) % 7;
  return { y: year, m: month, d: lastD - back };
}

/**
 * Weekend observation. New Year's Saturday does **not** shift to Friday.
 * Returns null if the observed day is not a weekday holiday in `year`
 * (New Year's Saturday → NYSE open Dec 31 prior year).
 */
function observe(
  y: number,
  m: number,
  d: number,
  opts: { newYear?: boolean } = {},
): { y: number; m: number; d: number } | null {
  const wd = weekdayUtc(y, m, d);
  if (wd === 0) return addDays(y, m, d, 1); // Sunday → Monday
  if (wd === 6) {
    if (opts.newYear) return null;
    return addDays(y, m, d, -1); // Saturday → Friday
  }
  return { y, m, d };
}

function named(
  p: { y: number; m: number; d: number } | null,
  name: string,
): NamedDate | null {
  if (!p) return null;
  return { date: iso(p.y, p.m, p.d), name };
}

export function nyseHolidays(year: number): NamedDate[] {
  const e = easterSunday(year);
  const gf = addDays(e.y, e.m, e.d, -2);
  const rows: NamedDate[] = [];
  const ny = named(observe(year, 1, 1, { newYear: true }), "New Year's Day");
  if (ny) rows.push(ny);
  rows.push(named(nthWeekday(year, 1, 1, 3), "Martin Luther King Jr. Day")!);
  rows.push(named(nthWeekday(year, 2, 1, 3), "Presidents' Day")!);
  rows.push(named(gf, "Good Friday")!);
  rows.push(named(lastWeekday(year, 5, 1), "Memorial Day")!);
  if (year >= 2022) {
    const jn = named(observe(year, 6, 19), "Juneteenth");
    if (jn) rows.push(jn);
  }
  rows.push(named(observe(year, 7, 4), "Independence Day")!);
  rows.push(named(nthWeekday(year, 9, 1, 1), "Labor Day")!);
  rows.push(named(nthWeekday(year, 11, 4, 4), "Thanksgiving")!);
  rows.push(named(observe(year, 12, 25), "Christmas")!);
  rows.sort((a, b) => a.date.localeCompare(b.date));
  return rows;
}

export function earlyCloses(year: number): NamedDate[] {
  const hol = new Set(nyseHolidays(year).map((h) => h.date));
  const out: NamedDate[] = [];
  const jul3 = iso(year, 7, 3);
  const jul3wd = weekdayUtc(year, 7, 3);
  if (jul3wd !== 0 && jul3wd !== 6 && !hol.has(jul3)) {
    out.push({ date: jul3, name: "Independence Day eve" });
  }
  const tg = nthWeekday(year, 11, 4, 4);
  const fri = addDays(tg.y, tg.m, tg.d, 1);
  out.push({
    date: iso(fri.y, fri.m, fri.d),
    name: "Day after Thanksgiving",
  });
  const eve = iso(year, 12, 24);
  const eveWd = weekdayUtc(year, 12, 24);
  if (eveWd !== 0 && eveWd !== 6 && !hol.has(eve)) {
    out.push({ date: eve, name: "Christmas Eve" });
  }
  out.sort((a, b) => a.date.localeCompare(b.date));
  return out;
}

export function statusFor(isoDate: string): DayStatus {
  const ov = OVERRIDES.find((o) => o.date === isoDate);
  if (ov) {
    return ov.kind === "closed"
      ? { kind: "closed", name: ov.reason }
      : { kind: "early", name: ov.reason };
  }
  const { y, wd } = parseIso(isoDate);
  if (wd === 0) return { kind: "weekend", name: "Sunday" };
  if (wd === 6) return { kind: "weekend", name: "Saturday" };
  const hol = nyseHolidays(y).find((h) => h.date === isoDate);
  if (hol) return { kind: "closed", name: hol.name };
  const early = earlyCloses(y).find((h) => h.date === isoDate);
  if (early) return { kind: "early", name: early.name };
  return { kind: "open" };
}

export function upcomingClosures(
  fromIso: string,
  limit: number,
): Array<{ date: string; kind: "closed" | "early"; name: string }> {
  const out: Array<{ date: string; kind: "closed" | "early"; name: string }> =
    [];
  let { y, m, d } = parseIso(fromIso);
  let guard = 0;
  while (out.length < limit && guard < 800) {
    const date = iso(y, m, d);
    const st = statusFor(date);
    if (st.kind === "closed" || st.kind === "early") {
      out.push({ date, kind: st.kind, name: st.name });
    }
    const n = addDays(y, m, d, 1);
    y = n.y;
    m = n.m;
    d = n.d;
    guard += 1;
  }
  return out;
}
