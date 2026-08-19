/**
 * What-if implied vol — AZ-TM V1–V5 (OD-1 B, OPF31 additive).
 */

import { listedIvFromRow } from "@/lib/options-lab/localBookCurves";
import type { OpfGenerationIn } from "@/lib/options-lab/opfPricingApi";

export type OptionRight = "call" | "put";

function rowStrike(row: Record<string, unknown>): number {
  return Number(row.strike);
}

function rowSide(row: Record<string, unknown>): OptionRight | null {
  const s = String(row.side ?? row.right ?? "")
    .trim()
    .toLowerCase();
  if (s === "call" || s === "c") return "call";
  if (s === "put" || s === "p") return "put";
  return null;
}

/** Decimal IV of nearest listed strike to spot, same right, soonest gen. */
export function measuredAtmIvDecimal(
  generations: readonly OpfGenerationIn[],
  spot: number,
  expiration: string,
  right: OptionRight,
): number | null {
  if (!(spot > 0)) return null;
  const ymd = expiration.slice(0, 10);
  const gen =
    generations.find((g) => (g.expiration || "").slice(0, 10) === ymd) ??
    generations[0];
  if (!gen?.rows?.length) return null;
  let best: { dist: number; iv: number } | null = null;
  for (const row of gen.rows) {
    if (rowSide(row) !== right) continue;
    const k = rowStrike(row);
    if (!(k > 0)) continue;
    const iv = listedIvFromRow(row.iv);
    if (iv == null) continue;
    const dist = Math.abs(k - spot);
    if (!best || dist < best.dist) best = { dist, iv };
  }
  return best?.iv ?? null;
}

/** Member % (16.2) from decimal (0.162). */
export function ivDecimalToPct(iv: number): number {
  return Math.round(iv * 1000) / 10;
}

export function measuredAtmIvPct(
  generations: readonly OpfGenerationIn[],
  spot: number,
  expiration: string,
  right: OptionRight,
): number | null {
  const d = measuredAtmIvDecimal(generations, spot, expiration, right);
  if (d == null) return null;
  return ivDecimalToPct(d);
}

/** V4: [0.5 σ_m, 2.0 σ_m] clamp 1–200. */
export function impliedVolSliderRange(measuredPct: number): {
  min: number;
  max: number;
} {
  const lo = Math.max(1, measuredPct * 0.5);
  const hi = Math.min(200, measuredPct * 2);
  if (!(hi > lo)) return { min: 1, max: Math.max(2, measuredPct) };
  return { min: lo, max: hi };
}

/** OPF31: vol_offset_pts = scenario% − measured% (e.g. 19.4 − 16.2 = +3.2). */
export function volOffsetPtsFromScenario(
  scenarioPct: number,
  measuredPct: number,
): number {
  return (
    Math.round((Number(scenarioPct) - Number(measuredPct)) * 10) / 10
  );
}

export const WHATIF_SESSION_KEY = "ft_options_lab_whatif_v1";

export type WhatIfSession = {
  elapsedHours: number;
  volOffsetPts: number;
  enabled: boolean;
};

export function loadWhatIfSession(): WhatIfSession | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(WHATIF_SESSION_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<WhatIfSession>;
    const elapsedHours = Number(j.elapsedHours);
    const volOffsetPts = Number(j.volOffsetPts);
    if (!Number.isFinite(elapsedHours) || !Number.isFinite(volOffsetPts)) {
      return null;
    }
    return {
      elapsedHours: Math.max(0, elapsedHours),
      volOffsetPts,
      enabled: j.enabled === true,
    };
  } catch {
    return null;
  }
}

export function saveWhatIfSession(s: WhatIfSession): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(WHATIF_SESSION_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
