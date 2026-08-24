/**
 * Ranking sink over Width Fit per-width aggregates — no second formula (L21).
 * Display scores stretch the top-N medians so close fits are readable.
 * Rank order and Confidence stay on the raw median.
 */

export type RankedWidth = {
  rank: number;
  widthPts: number;
  /** Raw Width Fit median ∈ [0, 1]. Rank / Confidence use this. */
  median: number | null;
  /** Display 0–100, stretched among the top N. */
  score: number | null;
  n: number;
  stability: number | null;
};

export type ConfidenceLabel = "High" | "Moderate" | "Low";

/** Top of the ranked list used to set the display span. */
export const DISPLAY_TOP_N = 10;
/** Weakest of that set still has a bar. */
export const DISPLAY_FLOOR = 20;

export function score100(median: number | null): number | null {
  if (median == null || !Number.isFinite(median)) return null;
  return Math.max(0, Math.min(100, Math.round(median * 100)));
}

/**
 * Min–max the top `topN` finite medians onto [floor, 100].
 * Rank order is unchanged. True ties stay tied. Below the set can fall under floor.
 */
export function stretchDisplayScores(
  medians: Array<number | null>,
  topN: number = DISPLAY_TOP_N,
  floor: number = DISPLAY_FLOOR,
): Array<number | null> {
  const indexed: { i: number; m: number }[] = [];
  for (let i = 0; i < medians.length; i++) {
    const m = medians[i];
    if (m != null && Number.isFinite(m)) indexed.push({ i, m });
  }
  indexed.sort((a, b) => b.m - a.m);
  const top = indexed.slice(0, Math.max(1, topN));
  const out: Array<number | null> = medians.map(() => null);
  if (!top.length) return out;
  const hi = top[0].m;
  const lo = top[top.length - 1].m;
  const span = hi - lo;
  for (const { i, m } of indexed) {
    if (span <= 1e-12) {
      out[i] = 100;
      continue;
    }
    const t = (m - lo) / span;
    out[i] = Math.max(0, Math.min(100, Math.round(floor + (100 - floor) * t)));
  }
  return out;
}

export function rankWidths(input: {
  widthPts: number[];
  median: Array<number | null>;
  n: number[];
  stability: Array<number | null>;
}): RankedWidth[] {
  const display = stretchDisplayScores(input.median);
  const rows: RankedWidth[] = [];
  for (let i = 0; i < input.widthPts.length; i++) {
    const median = input.median[i] ?? null;
    const finite = median != null && Number.isFinite(median);
    rows.push({
      rank: 0,
      widthPts: input.widthPts[i],
      median: finite ? median : null,
      score: finite ? display[i] : null,
      n: input.n[i] ?? 0,
      stability: input.stability[i] ?? null,
    });
  }
  rows.sort((a, b) => {
    const am = a.median ?? -1;
    const bm = b.median ?? -1;
    return bm - am;
  });
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });
  return rows;
}

/** L24 A — n, #1−#2 **median** gap, min stability. Not the stretched display. */
export function confidenceLabel(
  ranked: RankedWidth[],
  minValidN: number,
): ConfidenceLabel {
  const a = ranked[0];
  const b = ranked[1];
  if (!a || a.median == null) return "Low";
  const nOk = a.n >= minValidN && (!b || b.n >= minValidN);
  const gap =
    a.median != null && b?.median != null ? a.median - b.median : 0;
  const stab = a.stability;
  if (nOk && gap >= 0.08 && stab != null && stab >= 0.55) return "High";
  if (nOk && gap >= 0.03) return "Moderate";
  return "Low";
}
