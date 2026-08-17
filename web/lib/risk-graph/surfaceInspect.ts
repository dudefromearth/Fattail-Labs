/**
 * Inspect state — does not reprice. W3-3 playhead is sample-only.
 */

import { sampleSheet, type SurfaceSheet } from "./surfaceModel";

export type TimeWindow = {
  tauLo: number;
  tauHi: number;
  playheadTau: number;
};

export function hashPnlGrid(sheet: SurfaceSheet): string {
  return JSON.stringify(sheet.pnlGrid);
}

export function samplePlayhead(
  sheet: SurfaceSheet,
  spot: number,
  playheadTau: number,
): number | null {
  return sampleSheet(sheet, spot, playheadTau);
}

/**
 * Slider: left = now (current reality), right = later (toward expiry).
 * Internal τ is still remaining life (high at now, 0 at settlement).
 */
export function tauToSlider(
  tau: number,
  tauNow: number,
  tauExpiry: number,
): number {
  const span = tauNow - tauExpiry;
  if (!Number.isFinite(span) || Math.abs(span) < 1e-12) return 0;
  return Math.min(1, Math.max(0, (tauNow - tau) / span));
}

export function sliderToTau(
  t: number,
  tauNow: number,
  tauExpiry: number,
): number {
  const u = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
  return tauNow - u * (tauNow - tauExpiry);
}

export function isTimeAltered(
  tau: number,
  tauNow: number,
  tauExpiry: number,
): boolean {
  if (!Number.isFinite(tau) || !Number.isFinite(tauNow)) return false;
  const span = Math.abs(tauNow - tauExpiry);
  const eps = Math.max(span * 1e-4, 1e-12);
  return Math.abs(tau - tauNow) > eps;
}

/** Time, vol, or spot left live — the box is no longer current reality. */
export function isRealityAltered(opts: {
  tau: number;
  tauNow: number;
  tauExpiry: number;
  volOffsetPts: number;
  spotPct: number;
}): boolean {
  if (isTimeAltered(opts.tau, opts.tauNow, opts.tauExpiry)) return true;
  if (Math.abs(opts.volOffsetPts) > 1e-9) return true;
  if (Math.abs(opts.spotPct) > 1e-9) return true;
  return false;
}

/** T-LM-5: Friday 5-min (or any 5-min archive) must not wear last-minute gold. */
export function cadenceClaim(kind: "live" | "probe" | "5-min" | "3-5s"): {
  label: string;
  lastMinuteGold: boolean;
} {
  if (kind === "5-min") return { label: "5-min", lastMinuteGold: false };
  if (kind === "3-5s") return { label: "Last-minute", lastMinuteGold: true };
  if (kind === "probe") return { label: "probe", lastMinuteGold: false };
  return { label: "live", lastMinuteGold: false };
}
