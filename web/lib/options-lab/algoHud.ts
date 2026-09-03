/**
 * AZ-ALGO P3 — HUD visibility, freeze, Guide row, overlay pulse, floor-window copy.
 * Fourth row is Guide. Payload key guide_print (OD-ALGO-1).
 */

export const ALGO_HUD_FOURTH_LABEL = "Guide";
export const ALGO_HUD_GUIDE_KEY = "guide_print";

/** Honest caption. Do not say proposed is usually wider — F17 flips near the close. */
export const ALGO_FLOOR_WINDOW_CAPTION =
  "Near the close the lines can cross — proposed is not always wider.";

export type AlgoHudPhase =
  | "waiting"
  | "armed"
  | "recorded"
  | "managing"
  | "fold_suggested"
  | "idle"
  | string;

/** Managing (v1 armed) and Fold suggested (v1 recorded). Hidden in Armed / In trade / Idle. */
export function algoHudVisible(phase: AlgoHudPhase | null | undefined): boolean {
  return (
    phase === "armed" ||
    phase === "managing" ||
    phase === "recorded" ||
    phase === "fold_suggested"
  );
}

export function algoHudFrozen(phase: AlgoHudPhase | null | undefined): boolean {
  return phase === "recorded" || phase === "fold_suggested";
}

/** prefers-reduced-motion: reduce → no pulse at all. Fold freezes pulse too. */
export function algoPulseAllowed(opts: {
  reduceMotion: boolean;
  frozen: boolean;
  pulse: boolean;
}): boolean {
  if (opts.reduceMotion || opts.frozen) return false;
  return opts.pulse === true;
}

/**
 * Overlay alpha. Density (0–1) is closeness to the guide.
 * Reduced motion / freeze: density only, never a pulse bump.
 */
export function algoOverlayAlpha(opts: {
  density: number;
  pulse: boolean;
  reduceMotion: boolean;
  frozen: boolean;
}): number {
  const d = Math.min(1, Math.max(0, opts.density));
  const base = 0.12 + 0.16 * d;
  if (opts.reduceMotion || opts.frozen) return base;
  return opts.pulse ? Math.max(base, 0.28) : base;
}

export type AlgoGuideRole = "high-water" | "proposed" | "legacy";

export type AlgoGuideLine = {
  role: AlgoGuideRole;
  price: number;
  color: string;
  label?: string;
};

export function buildAlgoGuideLines(opts: {
  xHigh: number | null | undefined;
  xProposed: number | null | undefined;
  xLegacy: number | null | undefined;
  highWaterColor: string;
  proposedColor: string;
  legacyColor: string;
}): AlgoGuideLine[] {
  const out: AlgoGuideLine[] = [];
  if (opts.xHigh != null && Number.isFinite(opts.xHigh)) {
    out.push({ role: "high-water", price: opts.xHigh, color: opts.highWaterColor });
  }
  if (opts.xProposed != null && Number.isFinite(opts.xProposed)) {
    out.push({
      role: "proposed",
      price: opts.xProposed,
      color: opts.proposedColor,
      label: "proposed",
    });
  }
  if (opts.xLegacy != null && Number.isFinite(opts.xLegacy)) {
    out.push({ role: "legacy", price: opts.xLegacy, color: opts.legacyColor });
  }
  return out;
}

export type AlgoHudModel = {
  highest: number | null;
  profit: number | null;
  trailPct: number;
  guide_print: number | null;
  frozen: boolean;
  caption: string;
};

export function buildAlgoHudModel(opts: {
  phase: AlgoHudPhase | null | undefined;
  H: number | null | undefined;
  U: number | null | undefined;
  trailPct: number;
  guide_print: number | null | undefined;
}): AlgoHudModel | null {
  if (!algoHudVisible(opts.phase)) return null;
  return {
    highest: opts.H ?? null,
    profit: opts.U ?? null,
    trailPct: opts.trailPct,
    guide_print: opts.guide_print ?? null,
    frozen: algoHudFrozen(opts.phase),
    caption: ALGO_FLOOR_WINDOW_CAPTION,
  };
}
