/**
 * Viewport-box time axis: hourly ticks + Midnight / Noon / Open labels.
 * Z mapping matches the sheet window (Now wall → Expiry face).
 */

import type { SurfaceSheet } from "./surfaceModel";
import { timeToBoxZ } from "./surfaceCandles";

const YEAR_MS = 365.25 * 24 * 3600 * 1000;
const MAX_HOUR_TICKS = 2400;

export type TimeAxisKind = "hour" | "midnight" | "noon" | "open";

export type TimeAxisMark = {
  tMs: number;
  kind: TimeAxisKind;
  /** Set only for Midnight, Noon, Open. */
  label: string | null;
};

export type TimeAxisWindow = {
  tNow: number;
  tExp: number;
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function nyParts(ms: number): {
  ymd: string;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const bag: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date(ms))) {
    if (p.type !== "literal") bag[p.type] = p.value;
  }
  return {
    ymd: `${bag.year}-${bag.month}-${bag.day}`,
    hour: Number(bag.hour),
    minute: Number(bag.minute),
  };
}

/** Wall time in America/New_York → UTC ms. Probes EST/EDT so DST stays honest. */
export function nyDateTimeToUtcMs(
  ymd: string,
  hour: number,
  minute: number,
): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    throw new Error(`nyDateTimeToUtcMs: bad date ${ymd}`);
  }
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    throw new Error(`nyDateTimeToUtcMs: bad clock ${hour}:${minute}`);
  }
  const hh = pad2(hour);
  const mm = pad2(minute);
  for (const off of ["-04:00", "-05:00"] as const) {
    const ms = Date.parse(`${ymd}T${hh}:${mm}:00${off}`);
    if (!Number.isFinite(ms)) continue;
    const got = nyParts(ms);
    if (got.ymd === ymd && got.hour === hour && got.minute === minute) return ms;
  }
  throw new Error(`nyDateTimeToUtcMs: no ET instant ${ymd} ${hh}:${mm}`);
}

function addEtDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d + days);
  const dt = new Date(utc);
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

function etWeekday(ymd: string): number {
  const ms = nyDateTimeToUtcMs(ymd, 12, 0);
  const w = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(new Date(ms));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(w);
}

/** Now wall → Expiry face, matching the sheet’s remaining-τ span. */
export function sheetTimeWindow(
  sheet: SurfaceSheet,
  nowMs: number,
): TimeAxisWindow {
  const t0 = sheet.timeAxis[0] ?? sheet.maxTau;
  const t1 =
    sheet.timeAxis[sheet.timeAxis.length - 1] ?? sheet.expiryTau ?? 0;
  const remYears = Math.max(0, Number(t0) - Number(t1));
  const tNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  return { tNow, tExp: tNow + remYears * YEAR_MS };
}

export function formatExpiryClock(tMs: number): string {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h12",
  });
  return `${fmt.format(new Date(tMs))} ET`;
}

/**
 * Hourly ticks inside (tNow, tExp). Midnight / Noon / Open (Mon–Fri 9:30 ET)
 * get labels. Endpoints stay the Now / Expiry corners.
 */
export function listTimeAxisMarks(win: TimeAxisWindow): TimeAxisMark[] {
  const { tNow, tExp } = win;
  if (!(tExp > tNow + 1000)) return [];
  const start = nyParts(tNow + 1000);
  const end = nyParts(tExp - 1000);
  const out: TimeAxisMark[] = [];
  const seen = new Set<number>();
  const push = (tMs: number, kind: TimeAxisKind, label: string | null) => {
    if (!(tMs > tNow && tMs < tExp)) return;
    const key = Math.round(tMs / 1000);
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ tMs, kind, label });
  };

  let ymd = start.ymd;
  for (let guard = 0; guard < 800; guard += 1) {
    for (let h = 0; h < 24; h += 1) {
      let tMs: number;
      try {
        tMs = nyDateTimeToUtcMs(ymd, h, 0);
      } catch {
        continue;
      }
      const kind: TimeAxisKind =
        h === 0 ? "midnight" : h === 12 ? "noon" : "hour";
      const label =
        h === 0 ? "Midnight" : h === 12 ? "Noon" : null;
      push(tMs, kind, label);
      if (out.length >= MAX_HOUR_TICKS) {
        out.sort((a, b) => a.tMs - b.tMs);
        return out;
      }
    }
    const dow = etWeekday(ymd);
    if (dow >= 1 && dow <= 5) {
      try {
        push(nyDateTimeToUtcMs(ymd, 9, 30), "open", "Open");
      } catch {
        /* DST hole */
      }
    }
    if (ymd >= end.ymd) break;
    ymd = addEtDays(ymd, 1);
  }
  out.sort((a, b) => a.tMs - b.tMs);
  return out;
}

export function markBoxZ(mark: TimeAxisMark, win: TimeAxisWindow): number {
  return timeToBoxZ(mark.tMs, win.tNow, win.tExp);
}

/** Mon–Fri 9:30–16:00 America/New_York. Close is the Expiry face, not a tick. */
export function isRthEt(tMs: number): boolean {
  const p = nyParts(tMs);
  if (etWeekday(p.ymd) < 1 || etWeekday(p.ymd) > 5) return false;
  const minutes = p.hour * 60 + p.minute;
  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

/**
 * Open → Expiry session on the box. Uses the last Open still in the window
 * (expiry-day 9:30 when that day is on the axis). If that Open is already
 * behind Now on a weekday, the remaining edge is Now → Expiry.
 */
export function openToExpirySpan(
  win: TimeAxisWindow,
  marks: TimeAxisMark[],
): TimeAxisWindow | null {
  const { tNow, tExp } = win;
  if (!(tExp > tNow + 1000)) return null;
  const opens = marks.filter((m) => m.kind === "open");
  const lastOpen = opens.length ? opens[opens.length - 1].tMs : null;
  if (lastOpen != null && lastOpen < tExp) {
    return { tNow: lastOpen, tExp };
  }
  const day = nyParts(tNow);
  if (etWeekday(day.ymd) >= 1 && etWeekday(day.ymd) <= 5) {
    let openMs: number;
    try {
      openMs = nyDateTimeToUtcMs(day.ymd, 9, 30);
    } catch {
      return null;
    }
    if (tNow >= openMs && tNow < tExp) return { tNow, tExp };
  }
  return null;
}
