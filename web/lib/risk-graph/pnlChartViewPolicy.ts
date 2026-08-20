/**
 * Analyzer 2D risk-graph autofit policy — same law as Surface AT-AF-7.
 * Live tick / What-if / BE jitter must not steal a member-owned view.
 */

import { AUTOFIT_MIN_HALF_PTS } from "./pricing/autofitView";

export type PnlAutofitTrigger =
  | "first-paint"
  | "autofit-button"
  | "book-change"
  | "live-spot"
  | "what-if"
  | "exp-be"
  | "series-len"
  | "gex"
  | "vp";

export function autofitShouldRun2d(
  trigger: PnlAutofitTrigger,
  opts: {
    userAdjusted: boolean;
    dragging?: boolean;
    strikeDragging?: boolean;
  },
): boolean {
  if (opts.dragging || opts.strikeDragging) return false;
  if (trigger === "autofit-button") return true;
  if (opts.userAdjusted) return false;
  if (trigger === "first-paint") return true;
  if (trigger === "book-change" || trigger === "series-len") return true;
  return false;
}

/** Juliet VP-A1 default: Show/Hide is not a lock-clear. Structure / Auto-fit are. */
export function shouldClearUserViewLock(
  reason: "autofit-button" | "structure" | "show-hide" | "live-tick",
): boolean {
  return reason === "autofit-button" || reason === "structure";
}

export function expBeHashOf(bes: readonly number[]): string {
  return bes
    .filter(Number.isFinite)
    .map((b) => b.toFixed(2))
    .join(",");
}

export function clampAxisRange(
  min: number,
  max: number,
  minSpan: number = AUTOFIT_MIN_HALF_PTS * 2,
): { min: number; max: number } {
  const lo = Number(min);
  const hi = Number(max);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    return { min: 0, max: minSpan };
  }
  const span = hi - lo;
  if (span >= minSpan) return { min: lo, max: hi };
  const mid = (lo + hi) / 2;
  return { min: mid - minSpan / 2, max: mid + minSpan / 2 };
}
