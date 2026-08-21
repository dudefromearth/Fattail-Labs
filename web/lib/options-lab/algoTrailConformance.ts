/**
 * Shared AZ-ALGO §7 conformance: member knobs are inputs, not baked law.
 * FTI sim and `algoTrailMath` tests consume the same shape (v1.0.2 · DL-488).
 */

import {
  ALGO_ENTRY_PCT_DEFAULT,
  ALGO_F0_DEFAULT,
  ALGO_FMIN_DEFAULT,
  type AlgoTrailInput,
} from "./algoTrailMath";

/** Fraction 0–1. UI knobs are these × 100. */
export type AlgoKnobInputs = {
  entry_pct: number;
  trail_start_pct: number;
  trail_floor_pct: number;
};

/**
 * Placeholder defaults (DL-482). Not law — fixtures pass knobs as inputs.
 * Changing these constants must not force a recut of expected values.
 */
export const ALGO_CONFORMANCE_KNOBS: AlgoKnobInputs = {
  entry_pct: ALGO_ENTRY_PCT_DEFAULT,
  trail_start_pct: ALGO_F0_DEFAULT,
  trail_floor_pct: ALGO_FMIN_DEFAULT,
};

export function trailMathFromKnobs(
  knobs: AlgoKnobInputs,
): Pick<AlgoTrailInput, "entryPct" | "f0" | "fMin"> {
  return {
    entryPct: knobs.entry_pct,
    f0: knobs.trail_start_pct,
    fMin: knobs.trail_floor_pct,
  };
}

export type AlgoRecordedMode = "live" | "demo_whatif" | "demo_timemachine";

export type AlgoRecordedPayload = {
  armed_at: string;
  recorded_at: string;
  high_water_pnl: number;
  high_water_spot: number | null;
  trail_pnl: number;
  trail_fraction: number;
  trail_spot: number | null;
  exit_spot: number;
  exit_side: "near" | "far";
  debit: number;
  entry_pct: number;
  mode: AlgoRecordedMode;
};

export function algoRecordedPayload(
  fields: AlgoRecordedPayload,
): AlgoRecordedPayload {
  return { ...fields };
}

/** Demo exits are labeled. Live keeps the time/print stamp. */
export function algoRecordedHolderSubtitle(
  mode: AlgoRecordedMode,
  timeEt?: string,
  print?: string,
): string {
  if (mode === "demo_whatif" || mode === "demo_timemachine") {
    return "Recorded · demo";
  }
  if (timeEt && print != null) return `Recorded ${timeEt} at ${print}`;
  return "Recorded";
}
