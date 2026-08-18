/**
 * Underlier OHLC → box coordinates for Time Ortho (Strike × Time).
 * Time matches the surface: Now (+Z) → Expiry (−Z). Bars before now
 * sit left of the Now wall. No invented future prints.
 */

import type { OhlcBar } from "@/lib/marketOhlcApi";
import type { SurfaceSheet } from "./surfaceModel";
import { MIN_TAU } from "./surfaceModel";

export type CandleBox = {
  xMid: number;
  xOpen: number;
  xClose: number;
  xHigh: number;
  xLow: number;
  zMid: number;
  zHalf: number;
  up: boolean;
};

export function remainingLifeMs(sheet: SurfaceSheet, nowMs: number): {
  tNow: number;
  tExp: number;
} {
  const tau = sheet.timeAxis[0] ?? sheet.maxTau ?? MIN_TAU;
  const rem = Math.max(tau, MIN_TAU) * 365.25 * 24 * 3600 * 1000;
  const tNow = Number.isFinite(nowMs) ? nowMs : Date.now();
  return { tNow, tExp: tNow + rem };
}

export function priceToBoxX(price: number, sheet: SurfaceSheet): number {
  const span = Math.max(sheet.sMax - sheet.sMin, 1e-9);
  return ((price - sheet.sMin) / span) * 2 - 1;
}

/** tNow → +1 (Now), tExp → −1 (Expiry). t < tNow is left of the Now wall. */
export function timeToBoxZ(tMs: number, tNow: number, tExp: number): number {
  const span = tExp - tNow;
  if (!(span > 0) || !Number.isFinite(tMs)) return 1;
  return 1 - (2 * (tMs - tNow)) / span;
}

export function candleTfForTau(tauYears: number): "5m" | "1h" | "1d" {
  if (tauYears < 3 / 365.25) return "5m";
  if (tauYears < 21 / 365.25) return "1h";
  return "1d";
}

export function barPeriodMs(tf: "5m" | "1h" | "1d"): number {
  if (tf === "5m") return 5 * 60 * 1000;
  if (tf === "1h") return 60 * 60 * 1000;
  return 24 * 60 * 60 * 1000;
}

export function candlesToBoxes(
  bars: OhlcBar[],
  sheet: SurfaceSheet,
  tNow: number,
  tExp: number,
  tf: "5m" | "1h" | "1d",
  cap = 160,
): CandleBox[] {
  if (!bars.length || !(tExp > tNow)) return [];
  const period = barPeriodMs(tf);
  const zHalf = Math.min(0.045, Math.max(0.004, ((period / (tExp - tNow)) * 2) * 0.38));
  const zMin = -1.05;
  const zMax = 1.45;
  const out: CandleBox[] = [];
  const start = Math.max(0, bars.length - cap);
  for (let i = start; i < bars.length; i++) {
    const b = bars[i];
    const o = Number(b.o);
    const h = Number(b.h);
    const l = Number(b.l);
    const c = Number(b.c);
    if (![o, h, l, c, b.t].every((n) => Number.isFinite(n))) continue;
    const zMid = timeToBoxZ(b.t + period / 2, tNow, tExp);
    if (zMid > zMax || zMid < zMin) continue;
    const xOpen = priceToBoxX(o, sheet);
    const xClose = priceToBoxX(c, sheet);
    const xHigh = priceToBoxX(h, sheet);
    const xLow = priceToBoxX(l, sheet);
    out.push({
      xMid: (xOpen + xClose) / 2,
      xOpen,
      xClose,
      xHigh,
      xLow,
      zMid,
      zHalf,
      up: c >= o,
    });
  }
  return out;
}
