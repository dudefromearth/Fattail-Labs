/**
 * T Ortho session tape — full cash day, fixed 5-minute slots.
 * Not a general chart. No zoom, no stretch, no Lightweight Charts.
 */

import type { OhlcBar } from "@/lib/marketOhlcApi";
import {
  BAR_MS,
  nyWall,
  nyWallToUtcMs,
  sessionSlotTimes,
  snapSlotMs,
} from "./timeOrthoSession";
import {
  DEFAULT_TAPE_PREFS,
  minToHm,
  type TapePrefs,
} from "./timeOrthoTapePrefs";

export const TAPE_PAD = { left: 18, right: 60, top: 28, bottom: 30 };

export type CashPhase = "morning" | "afternoon" | "closing";

/** Cash RTH map — morning / afternoon / last-hour close. Times are America/New_York. */
export const CASH_PHASES: Array<{
  id: CashPhase;
  label: string;
  start: { hour: number; minute: number };
  end: { hour: number; minute: number };
}> = [
  {
    id: "morning",
    label: "Morning",
    start: { hour: 9, minute: 30 },
    end: { hour: 12, minute: 0 },
  },
  {
    id: "afternoon",
    label: "Afternoon",
    start: { hour: 12, minute: 0 },
    end: { hour: 14, minute: 30 },
  },
  {
    id: "closing",
    label: "Closing",
    start: { hour: 14, minute: 30 },
    end: { hour: 16, minute: 0 },
  },
];

export type TapeCandle = {
  slot: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type TapeLayout = {
  width: number;
  height: number;
  plotX: number;
  plotY: number;
  plotW: number;
  plotH: number;
  slotCount: number;
  slotWidth: number;
  priceLo: number;
  priceHi: number;
};

export function barsToTapeCandles(
  bars: OhlcBar[],
  fromMs: number,
  toMs: number,
  barMs = BAR_MS,
): TapeCandle[] {
  const slots = sessionSlotTimes(fromMs, toMs, barMs);
  const lastCandleSlot = Math.max(0, slots.length - 2); // close tick has no body
  const bySlot = new Map<number, TapeCandle>();
  for (const b of bars || []) {
    if (!Number.isFinite(b.t) || b.c == null || !Number.isFinite(b.c)) continue;
    const slotMs = snapSlotMs(b.t, fromMs, barMs);
    const slot = Math.round((slotMs - fromMs) / barMs);
    if (slot < 0 || slot > lastCandleSlot) continue;
    const open = b.o ?? b.c;
    const high = b.h ?? Math.max(open, b.c);
    const low = b.l ?? Math.min(open, b.c);
    bySlot.set(slot, { slot, open, high, low, close: b.c });
  }
  return [...bySlot.values()].sort((a, b) => a.slot - b.slot);
}

export type PriceView = { lo: number; hi: number };

export function priceWindow(candles: TapeCandle[]): PriceView | null {
  if (!candles.length) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of candles) {
    const o = Number(c.open);
    const h = Number(c.high);
    const l = Number(c.low);
    const cl = Number(c.close);
    if (Number.isFinite(l)) lo = Math.min(lo, l);
    if (Number.isFinite(o)) lo = Math.min(lo, o);
    if (Number.isFinite(cl)) lo = Math.min(lo, cl);
    if (Number.isFinite(h)) hi = Math.max(hi, h);
    if (Number.isFinite(o)) hi = Math.max(hi, o);
    if (Number.isFinite(cl)) hi = Math.max(hi, cl);
  }
  if (!(hi >= lo) || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  const span = Math.max(hi - lo, Math.abs(hi) * 0.001, 0.25);
  const pad = Math.max(span * 0.12, Math.abs(hi) * 0.0008, 0.25);
  return { lo: lo - pad, hi: hi + pad };
}

/** Strike window of the Analyzer position — this is the tape's Y scale. */
export function positionPriceView(
  sMin: number | null | undefined,
  sMax: number | null | undefined,
): PriceView | null {
  const lo = Number(sMin);
  const hi = Number(sMax);
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || !(hi > lo)) return null;
  return { lo, hi };
}

/** Keep the position window and the printed candles on screen together. */
export function unionPriceView(
  ...views: Array<PriceView | null | undefined>
): PriceView | null {
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of views) {
    if (!v || isVacantPriceView(v)) continue;
    lo = Math.min(lo, v.lo);
    hi = Math.max(hi, v.hi);
  }
  if (!(hi > lo) || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;
  const pad = Math.max((hi - lo) * 0.04, Math.abs(hi) * 0.0004, 0.15);
  return { lo: lo - pad, hi: hi + pad };
}

export function isVacantPriceView(view: PriceView | null): boolean {
  if (!view) return true;
  if (!(view.hi > view.lo)) return true;
  // Empty first paint used to seed 0–1; that must never lock a live tape.
  if (view.lo === 0 && view.hi === 1) return true;
  return false;
}

/** X is locked for the day. Y follows printed H/L — never a dummy 0–1 axis. */
export function followPriceView(
  printed: PriceView | null,
  last: number | null,
  current: PriceView | null,
): PriceView | null {
  if (!printed) return isVacantPriceView(current) ? null : current;
  if (isVacantPriceView(current)) return printed;
  const cur = current as PriceView;
  // Printed tape and the old window don't overlap (stale dummy scale).
  if (printed.hi < cur.lo || printed.lo > cur.hi) return printed;
  let lo = Math.min(cur.lo, printed.lo);
  let hi = Math.max(cur.hi, printed.hi);
  if (last != null && Number.isFinite(last)) {
    const span = hi - lo || 1;
    const pad = span * 0.08;
    if (last < lo + pad) {
      const shift = lo + pad - last;
      lo -= shift;
      hi -= shift;
    } else if (last > hi - pad) {
      const shift = last - (hi - pad);
      lo += shift;
      hi += shift;
    }
  }
  if (!(hi > lo)) return printed;
  return { lo, hi };
}

export function scrollPriceView(
  view: PriceView,
  deltaPx: number,
  plotH: number,
): PriceView {
  const span = view.hi - view.lo || 1;
  const h = Math.max(1, plotH);
  const shift = (deltaPx / h) * span;
  return { lo: view.lo + shift, hi: view.hi + shift };
}

export function zoomPriceView(
  view: PriceView,
  factor: number,
  anchor: number,
): PriceView {
  const f = Math.min(4, Math.max(0.25, factor));
  const span = (view.hi - view.lo || 1) * f;
  const t = (anchor - view.lo) / (view.hi - view.lo || 1);
  return { lo: anchor - span * t, hi: anchor + span * (1 - t) };
}

export function layoutTape(
  width: number,
  height: number,
  fromMs: number,
  toMs: number,
  candles: TapeCandle[],
): TapeLayout {
  const slotCount = Math.max(2, sessionSlotTimes(fromMs, toMs).length);
  const plotX = TAPE_PAD.left;
  const plotY = TAPE_PAD.top;
  const plotW = Math.max(1, width - TAPE_PAD.left - TAPE_PAD.right);
  const plotH = Math.max(1, height - TAPE_PAD.top - TAPE_PAD.bottom);
  const { lo, hi } = priceWindow(candles);
  return {
    width,
    height,
    plotX,
    plotY,
    plotW,
    plotH,
    slotCount,
    slotWidth: plotW / slotCount,
    priceLo: lo,
    priceHi: hi,
  };
}

export function slotLeft(layout: TapeLayout, slot: number): number {
  return layout.plotX + slot * layout.slotWidth;
}

export function priceToY(layout: TapeLayout, price: number): number {
  const span = layout.priceHi - layout.priceLo || 1;
  const t = (price - layout.priceLo) / span;
  return layout.plotY + layout.plotH * (1 - t);
}

export function hourTicks(fromMs: number, toMs: number): Array<{
  slot: number;
  label: string;
}> {
  const slots = sessionSlotTimes(fromMs, toMs);
  const out: Array<{ slot: number; label: string }> = [];
  slots.forEach((ms, slot) => {
    const w = nyWall(ms);
    const open = w.hour === 9 && w.minute === 30;
    const close = w.hour === 16 && w.minute === 0;
    const hour = w.minute === 0;
    if (!open && !close && !hour) return;
    const h12 = w.hour % 12 || 12;
    const ampm = w.hour >= 12 ? "PM" : "AM";
    const label = open
      ? "9:30"
      : close
        ? "4:00"
        : `${h12}${ampm}`;
    out.push({ slot, label });
  });
  return out;
}

export function nowSlotIndex(
  nowMs: number,
  fromMs: number,
  toMs: number,
): number | null {
  if (nowMs < fromMs || nowMs > toMs) return null;
  const slots = sessionSlotTimes(fromMs, toMs);
  const snapped = snapSlotMs(nowMs, fromMs);
  const i = Math.round((snapped - fromMs) / BAR_MS);
  if (i < 0 || i >= slots.length) return null;
  return i;
}

export function formatPrice(price: number): string {
  if (!Number.isFinite(price)) return "";
  const abs = Math.abs(price);
  if (abs >= 1000) return price.toFixed(0);
  if (abs >= 100) return price.toFixed(1);
  return price.toFixed(2);
}

export function priceTicks(lo: number, hi: number, count = 5): number[] {
  if (!(hi > lo)) return [lo];
  const ticks: number[] = [];
  for (let i = 0; i < count; i++) {
    ticks.push(lo + ((hi - lo) * i) / (count - 1));
  }
  return ticks;
}

/** Evenly spaced *listed* strikes in view — never invent a K. */
export function listedStrikeTicks(
  listed: readonly number[],
  lo: number,
  hi: number,
  plotH: number,
  minPx = 26,
): number[] {
  const inView = (listed || []).filter(
    (s) => Number.isFinite(s) && s >= lo && s <= hi,
  );
  if (!inView.length) return [];
  const maxTicks = Math.max(3, Math.floor(Math.max(1, plotH) / minPx));
  if (inView.length <= maxTicks) return inView;
  const out: number[] = [];
  const last = inView.length - 1;
  for (let i = 0; i < maxTicks; i++) {
    const idx = Math.round((i * last) / (maxTicks - 1));
    const s = inView[idx];
    if (out[out.length - 1] !== s) out.push(s);
  }
  return out;
}

/** Nice ticker prices for the right axis (round steps, not strikes). */
export function tickerPriceTicks(
  lo: number,
  hi: number,
  plotH: number,
  minPx = 32,
): number[] {
  if (!(hi > lo) || !Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  const maxTicks = Math.max(4, Math.min(9, Math.floor(Math.max(1, plotH) / minPx)));
  const span = hi - lo;
  const raw = span / (maxTicks - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const nice = [1, 2, 2.5, 5, 10].map((n) => n * mag);
  const step = nice.find((n) => n >= raw) ?? mag * 10;
  const start = Math.ceil(lo / step) * step;
  const ticks: number[] = [];
  for (let p = start; p <= hi + step * 1e-9; p += step) {
    const v = Math.round(p / (step / 100)) * (step / 100);
    if (v >= lo && v <= hi) ticks.push(v);
  }
  return ticks.length ? ticks : priceTicks(lo, hi, maxTicks);
}

export type CashBand = {
  id: CashPhase;
  label: string;
  startSlot: number;
  endSlot: number;
};

export function cashPhaseBands(fromMs: number, toMs: number): CashBand[] {
  const slots = sessionSlotTimes(fromMs, toMs);
  if (!slots.length) return [];
  const day = nyWall(fromMs);
  return CASH_PHASES.map((p) => {
    const startMs = nyWallToUtcMs(
      day.year,
      day.month,
      day.day,
      p.start.hour,
      p.start.minute,
    );
    const endMs = nyWallToUtcMs(
      day.year,
      day.month,
      day.day,
      p.end.hour,
      p.end.minute,
    );
    const startSlot = Math.max(
      0,
      Math.round((startMs - fromMs) / BAR_MS),
    );
    const endSlot = Math.min(
      slots.length - 1,
      Math.round((endMs - fromMs) / BAR_MS),
    );
    return { id: p.id, label: p.label, startSlot, endSlot };
  });
}

export type MarketWhere = {
  phase: CashPhase | "pre" | "closed";
  label: string;
  tapeDay: "today" | "prior";
  clock: string;
};

export function formatEtClock(ms: number): string {
  const w = nyWall(ms);
  const h12 = w.hour % 12 || 12;
  const ampm = w.hour >= 12 ? "PM" : "AM";
  return `${h12}:${String(w.minute).padStart(2, "0")} ${ampm} ET`;
}

/** Where the live clock sits relative to the framed cash session. */
export function marketWhereWhen(
  nowMs: number,
  fromMs: number,
  toMs: number,
  prefillsPriorDay: boolean,
  prefs: Pick<TapePrefs, "noonMin" | "closeSplitMin"> = DEFAULT_TAPE_PREFS,
): MarketWhere {
  const clock = formatEtClock(nowMs);
  if (prefillsPriorDay) {
    return { phase: "pre", label: "Premarket", tapeDay: "prior", clock };
  }
  if (nowMs < fromMs) {
    return { phase: "pre", label: "Premarket", tapeDay: "today", clock };
  }
  if (nowMs >= toMs) {
    return { phase: "closed", label: "Closed", tapeDay: "today", clock };
  }
  const wall = nyWall(nowMs);
  const hm = wall.hour * 60 + wall.minute;
  if (hm < 9 * 60 + 30) {
    return { phase: "pre", label: "Premarket", tapeDay: "today", clock };
  }
  if (hm < prefs.noonMin) {
    return { phase: "morning", label: "Morning", tapeDay: "today", clock };
  }
  if (hm < prefs.closeSplitMin) {
    return { phase: "afternoon", label: "Afternoon", tapeDay: "today", clock };
  }
  if (hm < 16 * 60) {
    return { phase: "closing", label: "Closing", tapeDay: "today", clock };
  }
  return { phase: "pre", label: "Post-market", tapeDay: "today", clock };
}

/**
 * Surface Time Ortho: Now (+Z, left) → Expiry (−Z, right).
 * Same map as surfaceCandles.timeToBoxZ, in screen X.
 */
export function clockToX(
  tMs: number,
  tNow: number,
  tExp: number,
  nowX: number,
  expiryX: number,
): number {
  const span = tExp - tNow;
  if (!(span > 0) || !Number.isFinite(tMs)) return nowX;
  return nowX + ((tMs - tNow) / span) * (expiryX - nowX);
}

export function xToClock(
  x: number,
  tNow: number,
  tExp: number,
  nowX: number,
  expiryX: number,
): number {
  const dx = expiryX - nowX;
  if (Math.abs(dx) < 1e-6) return tNow;
  return tNow + ((x - nowX) / dx) * (tExp - tNow);
}

/** Views HUD: left-3 + min(20rem, width − 6rem). */
export function viewsHudRightPx(viewWidth: number): number {
  const hud = Math.min(320, Math.max(160, viewWidth - 96));
  return 12 + hud;
}

/** Wider left stack (Planes HUD 22rem) — 9:30 sits just to its right. */
export function leftChromeRightPx(viewWidth: number): number {
  const planes = Math.min(352, Math.max(180, viewWidth - 96));
  return 12 + planes;
}

export type DayAxis = {
  width: number;
  height: number;
  plotY: number;
  plotH: number;
  plotRight: number;
  xOpen: number;
  xClose: number;
  tPre: number;
  tOpen: number;
  tClose: number;
  tPost: number;
  priceLo: number;
  priceHi: number;
  rthBarPx: number;
};

/**
 * Trading-day frame (general rule: we trade the day).
 * Pre-market fills the left window (under the controls).
 * Cash open sits just right of the controls.
 * Cash close sits left of the right edge; post-market takes the remaining gutter.
 */
export function layoutDayAxis(
  width: number,
  height: number,
  dayMs: number,
  candles: Array<{ high: number; low: number; open?: number; close?: number }>,
  controlsRight = leftChromeRightPx(width),
  price?: PriceView,
): DayAxis {
  const pricePad = 64;
  const plotRight = Math.max(controlsRight + 120, width - pricePad);
  // 9:30 AM — just right of the left control column (Views + Planes).
  const xOpen = Math.min(
    plotRight * 0.28,
    Math.max(controlsRight + 24, plotRight * 0.18),
  );
  // 4:00 PM — room on the right for extended hours.
  const postW = Math.max(100, plotRight * 0.16);
  const xClose = Math.max(xOpen + 120, plotRight - postW);
  const day = nyWall(dayMs);
  const tPre = nyWallToUtcMs(day.year, day.month, day.day, 4, 0);
  const tOpen = nyWallToUtcMs(day.year, day.month, day.day, 9, 30);
  const tClose = nyWallToUtcMs(day.year, day.month, day.day, 16, 0);
  const tPost = nyWallToUtcMs(day.year, day.month, day.day, 20, 0);
  const asCandles: TapeCandle[] = candles.map((c, i) => ({
    slot: i,
    open: c.open ?? c.low,
    high: c.high,
    low: c.low,
    close: c.close ?? c.high,
  }));
  const { lo, hi } = price ??
    priceWindow(asCandles) ?? { lo: 0, hi: 1 };
  const rthBars = Math.max(1, (tClose - tOpen) / BAR_MS);
  return {
    width,
    height,
    plotY: TAPE_PAD.top,
    plotH: Math.max(1, height - TAPE_PAD.top - TAPE_PAD.bottom),
    plotRight,
    xOpen,
    xClose,
    tPre,
    tOpen,
    tClose,
    tPost,
    priceLo: lo,
    priceHi: hi,
    rthBarPx: (xClose - xOpen) / rthBars,
  };
}

function clamp01(u: number): number {
  if (u < 0) return 0;
  if (u > 1) return 1;
  return u;
}

/** Piecewise: pre pad · uniform RTH · post pad. */
export function dayClockToX(tMs: number, axis: DayAxis): number {
  if (!Number.isFinite(tMs)) return axis.xOpen;
  if (tMs <= axis.tOpen) {
    const span = axis.tOpen - axis.tPre || 1;
    return 0 + clamp01((tMs - axis.tPre) / span) * axis.xOpen;
  }
  if (tMs <= axis.tClose) {
    const span = axis.tClose - axis.tOpen || 1;
    return axis.xOpen + clamp01((tMs - axis.tOpen) / span) * (axis.xClose - axis.xOpen);
  }
  const span = axis.tPost - axis.tClose || 1;
  return (
    axis.xClose +
    clamp01((tMs - axis.tClose) / span) * (axis.plotRight - axis.xClose)
  );
}

export type ClockBand = {
  id: string;
  label: string;
  kind: "pad" | "session";
  t0: number;
  t1: number;
};

/** 0DTE day map — Pre · Morning · Afternoon · Closing · Extended. */
export function sessionClockBands(
  dayMs: number,
  prefs: Pick<TapePrefs, "noonMin" | "closeSplitMin"> = DEFAULT_TAPE_PREFS,
): ClockBand[] {
  const day = nyWall(dayMs);
  const at = (h: number, m: number) =>
    nyWallToUtcMs(day.year, day.month, day.day, h, m);
  const noon = minToHm(prefs.noonMin);
  const split = minToHm(prefs.closeSplitMin);
  return [
    { id: "pre", label: "Pre-Market", kind: "pad", t0: at(4, 0), t1: at(9, 30) },
    {
      id: "morning",
      label: "Morning Session",
      kind: "session",
      t0: at(9, 30),
      t1: at(noon.hour, noon.minute),
    },
    {
      id: "afternoon",
      label: "Afternoon Session",
      kind: "session",
      t0: at(noon.hour, noon.minute),
      t1: at(split.hour, split.minute),
    },
    {
      id: "closing",
      label: "Closing Session",
      kind: "session",
      t0: at(split.hour, split.minute),
      t1: at(16, 0),
    },
    { id: "post", label: "Extended-Market", kind: "pad", t0: at(16, 0), t1: at(20, 0) },
  ];
}
