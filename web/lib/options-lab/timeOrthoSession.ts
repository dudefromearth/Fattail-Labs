/**
 * T Ortho live chart window — RTH open is the session start.
 * Premarket / overnight: show the prior regular session so the tape looks alive.
 */

import type { OhlcBar } from "@/lib/marketOhlcApi";

export const NY_TZ = "America/New_York";
export const RTH_OPEN_HM = { hour: 9, minute: 30 };
export const RTH_CLOSE_HM = { hour: 16, minute: 0 };
/** Massive extended window — pre/post padding around cash. */
export const EXT_OPEN_HM = { hour: 4, minute: 0 };
export const EXT_CLOSE_HM = { hour: 20, minute: 0 };
/** 5-minute slots — one candle width for the whole framed day. */
export const BAR_MS = 5 * 60 * 1000;

export type NyWall = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0=Sun … 6=Sat
};

const NY_FMT = new Intl.DateTimeFormat("en-US", {
  timeZone: NY_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23",
});

const WD: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function nyWall(ms: number): NyWall {
  const parts = NY_FMT.formatToParts(new Date(ms));
  const grab = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const weekday = WD[grab("weekday")] ?? 0;
  return {
    year: Number(grab("year")),
    month: Number(grab("month")),
    day: Number(grab("day")),
    hour: Number(grab("hour")),
    minute: Number(grab("minute")),
    weekday,
  };
}

export function nyWallToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const shown = nyWall(utc);
  const shownUtc = Date.UTC(
    shown.year,
    shown.month - 1,
    shown.day,
    shown.hour,
    shown.minute,
  );
  const wanted = Date.UTC(year, month - 1, day, hour, minute, 0);
  return utc + (wanted - shownUtc);
}

function addCalendarDays(wall: NyWall, days: number): NyWall {
  const utc = Date.UTC(wall.year, wall.month - 1, wall.day + days, 12, 0);
  const n = nyWall(utc);
  return { ...n, hour: wall.hour, minute: wall.minute };
}

export function priorWeekday(wall: NyWall): NyWall {
  let d = addCalendarDays(wall, -1);
  while (d.weekday === 0 || d.weekday === 6) {
    d = addCalendarDays(d, -1);
  }
  return d;
}

export function rthOpenMs(wall: NyWall): number {
  return nyWallToUtcMs(
    wall.year,
    wall.month,
    wall.day,
    RTH_OPEN_HM.hour,
    RTH_OPEN_HM.minute,
  );
}

export function rthCloseMs(wall: NyWall): number {
  return nyWallToUtcMs(
    wall.year,
    wall.month,
    wall.day,
    RTH_CLOSE_HM.hour,
    RTH_CLOSE_HM.minute,
  );
}

export function extOpenMs(wall: NyWall): number {
  return nyWallToUtcMs(
    wall.year,
    wall.month,
    wall.day,
    EXT_OPEN_HM.hour,
    EXT_OPEN_HM.minute,
  );
}

export function extCloseMs(wall: NyWall): number {
  return nyWallToUtcMs(
    wall.year,
    wall.month,
    wall.day,
    EXT_CLOSE_HM.hour,
    EXT_CLOSE_HM.minute,
  );
}

/**
 * Visible window is the extended day (4:00 AM–8:00 PM ET):
 * pre-market padding · Morning · Afternoon · Closing · post-market padding.
 * Early prints do not stretch — remaining slots stay empty grid.
 * Overnight / weekend: prior weekday’s extended day.
 */
export function chartWindow(nowMs: number): {
  fromMs: number;
  toMs: number;
  prefillsPriorDay: boolean;
  sessionOpenMs: number;
} {
  const wall = nyWall(nowMs);
  const todayOpen = rthOpenMs(wall);
  const todayExtOpen = extOpenMs(wall);
  const todayExtClose = extCloseMs(wall);
  const weekend = wall.weekday === 0 || wall.weekday === 6;
  if (weekend || nowMs < todayExtOpen) {
    const prior = priorWeekday(wall);
    return {
      fromMs: extOpenMs(prior),
      toMs: extCloseMs(prior),
      prefillsPriorDay: true,
      sessionOpenMs: todayOpen,
    };
  }
  return {
    fromMs: todayExtOpen,
    toMs: todayExtClose,
    prefillsPriorDay: false,
    sessionOpenMs: todayOpen,
  };
}

/** 5-minute slot starts from open through close (close is the right-edge tick). */
export function sessionSlotTimes(
  fromMs: number,
  toMs: number,
  barMs = BAR_MS,
): number[] {
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
    return [];
  }
  const step = Math.max(1, barMs);
  const times: number[] = [];
  for (let t = fromMs; t <= toMs; t += step) {
    times.push(t);
  }
  return times;
}

export function snapSlotMs(tMs: number, fromMs: number, barMs = BAR_MS): number {
  return fromMs + Math.round((tMs - fromMs) / barMs) * barMs;
}

export type SessionCandle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

/** Slot map used by tests — printed bars plus empty remainder of the session. */
export function padSessionPoints(
  candles: SessionCandle[],
  fromMs: number,
  toMs: number,
  barMs = BAR_MS,
): Array<SessionCandle | { time: number }> {
  const bySlot = new Map<number, SessionCandle>();
  for (const c of candles) {
    const ms = Number(c.time) * 1000;
    if (!Number.isFinite(ms)) continue;
    const slot = snapSlotMs(ms, fromMs, barMs);
    if (slot < fromMs || slot > toMs) continue;
    bySlot.set(slot, { ...c, time: Math.floor(slot / 1000) });
  }
  return sessionSlotTimes(fromMs, toMs, barMs).map((ms) => {
    const hit = bySlot.get(ms);
    if (hit) return hit;
    return { time: Math.floor(ms / 1000) };
  });
}

export function isSessionWhitespace(
  point: SessionCandle | { time: number },
): point is { time: number } {
  return !("open" in point);
}

/** Bars that belong on the framed session (not the stretched “so far today” range). */
export function filterSessionBars(bars: OhlcBar[], nowMs: number): OhlcBar[] {
  const { fromMs, toMs } = chartWindow(nowMs);
  return (bars || []).filter(
    (b) => Number.isFinite(b.t) && b.t >= fromMs && b.t <= toMs + BAR_MS,
  );
}

/**
 * Every 5m slot from first print through the framed session close.
 * Missing prints and the remainder of the day carry the last close so the
 * day's record is complete (no hole at the right edge). Does not invent
 * bars before the first print.
 */
export function completeSessionBars(
  bars: OhlcBar[],
  fromMs: number,
  toMs: number,
  _nowMs?: number,
): OhlcBar[] {
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs < fromMs) {
    return [];
  }
  const lastSlot = toMs;
  if (lastSlot < fromMs) return [];
  const bySlot = new Map<number, OhlcBar>();
  for (const b of bars || []) {
    if (!Number.isFinite(b.t) || !Number.isFinite(b.c)) continue;
    const slot = fromMs + Math.floor((b.t - fromMs) / BAR_MS) * BAR_MS;
    if (slot < fromMs || slot > lastSlot) continue;
    bySlot.set(slot, { ...b, t: slot });
  }
  const out: OhlcBar[] = [];
  let prev: number | null = null;
  for (let t = fromMs; t <= lastSlot; t += BAR_MS) {
    const hit = bySlot.get(t);
    if (hit) {
      out.push(hit);
      prev = hit.c;
      continue;
    }
    if (prev == null) continue;
    out.push({ t, o: prev, h: prev, l: prev, c: prev });
  }
  return out;
}
