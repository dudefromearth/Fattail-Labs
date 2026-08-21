/**
 * Width Fit — pure Advanced Fly value mode (Spec WF v0.1.1 · DL-525).
 *
 * computeCell: raw components + quality gates only (L8).
 * assignColors: per-width normalize → criteria weights → stability penalty
 * (OD-W6: penalty outside the weight vector, config floor).
 */

import { contractKey } from "@/lib/chainLadderApi";
import { updateStickyScale } from "./color";
import {
  isPositiveListedDebit,
  rowAt,
  symFlyCpAsym,
  symFlyDebit,
} from "./pricing";
import type {
  ChainContext,
  ColDef,
  GridCell,
  RowDef,
  TemplateParams,
  WidthFitComponents,
  WidthFitQuality,
  WidthFitWeights,
} from "./types";

export const WIDTH_FIT_CRITERIA = [
  "debit_efficiency",
  "payoff_efficiency",
  "gamma_efficiency",
  "curvature_efficiency",
  "theta_efficiency",
  "surface_responsiveness",
  "call_put_asymmetry",
] as const;

export type WidthFitCriterion = (typeof WIDTH_FIT_CRITERIA)[number];

/** JR1: equal 1/7 on the seven criteria. */
export const DEFAULT_WIDTH_FIT_WEIGHTS: WidthFitWeights = {
  debit_efficiency: 1 / 7,
  payoff_efficiency: 1 / 7,
  gamma_efficiency: 1 / 7,
  curvature_efficiency: 1 / 7,
  theta_efficiency: 1 / 7,
  surface_responsiveness: 1 / 7,
  call_put_asymmetry: 1 / 7,
};

export const DEFAULT_MIN_VALID_N = 5;
/** Default penalty strength. Floor stops a zeroed L6 (OD-W6). */
export const DEFAULT_STABILITY_PENALTY = 1;
export const STABILITY_PENALTY_FLOOR = 0.25;
export const DEFAULT_SPREAD_FRAC = 0.5;

export const FORBIDDEN_WIDTH_FIT_COPY = [
  "Optimizer",
  "BOS",
  "Butterfly Opportunity Score",
  "Preferred Width",
  "Recommendation",
  "Opportunity",
  "Strong Preference",
  "No Clear Preference",
];

export const WIDTH_FIT_LEGEND =
  "Scores reflect relative fit of defined-risk structures to the member’s stated criteria on the current surface. High-fit coherent regions indicate favorable geometry and economics relative to other available structures right now. They are not directional signals or trade recommendations.";

export type WidthFitSurfaceState =
  | "strong_fit"
  | "moderate_fit"
  | "no_clear_fit"
  | "no_reliable_fit"
  | "unstable_surface";

export const WIDTH_FIT_STATE_LABEL: Record<WidthFitSurfaceState, string> = {
  strong_fit: "Strong Fit",
  moderate_fit: "Moderate Fit",
  no_clear_fit: "No Clear Fit",
  no_reliable_fit: "No reliable fit yet",
  unstable_surface: "Unstable Surface",
};

export type WidthFitFooterCol = {
  widthPts: number;
  median: number | null;
  n: number;
  lowConfidence: boolean;
  stability: number | null;
  quality: "good" | "poor" | "low_n" | "unstable";
};

export function clampStabilityPenalty(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_STABILITY_PENALTY;
  return Math.max(STABILITY_PENALTY_FLOOR, n);
}

export function resolveWidthFitWeights(
  raw?: Partial<WidthFitWeights> | null,
): WidthFitWeights {
  const out = { ...DEFAULT_WIDTH_FIT_WEIGHTS };
  if (!raw) return out;
  let sum = 0;
  for (const k of WIDTH_FIT_CRITERIA) {
    const v = Number(raw[k]);
    out[k] = Number.isFinite(v) && v >= 0 ? v : DEFAULT_WIDTH_FIT_WEIGHTS[k];
    sum += out[k];
  }
  if (sum <= 0) return { ...DEFAULT_WIDTH_FIT_WEIGHTS };
  for (const k of WIDTH_FIT_CRITERIA) out[k] = out[k] / sum;
  return out;
}

/** Null listed greek is missing — Number(null)===0 must not pass as a greek. */
function listedFlyGreek(
  ctx: ChainContext,
  body: number,
  widthPts: number,
  greek: "delta" | "gamma" | "theta",
): number | null {
  const side = ctx.viewSide;
  const lo = rowAt(ctx, side, body - widthPts);
  const mid = rowAt(ctx, side, body);
  const hi = rowAt(ctx, side, body + widthPts);
  if (!lo || !mid || !hi) return null;
  const raw = [lo[greek], mid[greek], hi[greek]];
  if (raw.some((v) => v == null)) return null;
  const a = Number(raw[0]);
  const b = Number(raw[1]);
  const c = Number(raw[2]);
  if (![a, b, c].every((n) => Number.isFinite(n))) return null;
  return a - 2 * b + c;
}

function flyCurvature(
  ctx: ChainContext,
  centers: readonly number[],
  idx: number,
  w: number,
): number | null {
  if (idx < 0 || idx >= centers.length - 2) return null;
  const Ki = centers[idx];
  const Kj = centers[idx + 1];
  const Kk = centers[idx + 2];
  const Di = symFlyDebit(ctx, Ki, w);
  const Dj = symFlyDebit(ctx, Kj, w);
  const Dk = symFlyDebit(ctx, Kk, w);
  if (Di == null || Dj == null || Dk == null) return null;
  const gap = Ki - Kj;
  const gap2 = Kj - Kk;
  if (!(gap > 0) || !(gap2 > 0) || Math.abs(gap - gap2) > 1e-9) return null;
  return (Di - Dj) / gap - (Dj - Dk) / gap2;
}

function flySlope(
  ctx: ChainContext,
  centers: readonly number[],
  idx: number,
  w: number,
): number | null {
  if (idx < 0 || idx >= centers.length - 1) return null;
  const Ki = centers[idx];
  const Kj = centers[idx + 1];
  const Di = symFlyDebit(ctx, Ki, w);
  const Dj = symFlyDebit(ctx, Kj, w);
  if (Di == null || Dj == null) return null;
  const gap = Ki - Kj;
  if (!(gap > 0)) return null;
  return (Di - Dj) / gap;
}

function legQuality(
  ctx: ChainContext,
  side: "call" | "put",
  k: number,
  spreadFrac: number,
): { ok: boolean; poor: boolean; reason?: string } {
  const row = rowAt(ctx, side, k);
  if (!row) return { ok: false, poor: true, reason: "Missing listed strike" };
  const mid = Number(row.mid);
  if (!Number.isFinite(mid)) {
    return { ok: false, poor: true, reason: "Null mid" };
  }
  const bid = row.bid != null ? Number(row.bid) : NaN;
  const ask = row.ask != null ? Number(row.ask) : NaN;
  if (Number.isFinite(bid) && Number.isFinite(ask) && bid > ask) {
    return { ok: false, poor: true, reason: "Crossed market" };
  }
  if (
    Number.isFinite(bid) &&
    Number.isFinite(ask) &&
    Number.isFinite(mid) &&
    Math.abs(mid) > 1e-9
  ) {
    const spr = (ask - bid) / Math.abs(mid);
    if (spr > spreadFrac) {
      return { ok: true, poor: true, reason: "Wide spread" };
    }
  }
  return { ok: true, poor: false };
}

export function widthFitComputeCell(
  ctx: ChainContext,
  row: RowDef,
  col: ColDef,
  params: TemplateParams,
): Omit<GridCell, "colorT" | "bgCss"> {
  const w = col.widthPts;
  const k = row.strike;
  const side = ctx.viewSide;
  const spreadFrac = DEFAULT_SPREAD_FRAC;
  const centers = params.flyRowStrikes ?? [];
  const idx = params.flyRowIndex ?? -1;

  const d = symFlyDebit(ctx, k, w);
  if (d == null) {
    return {
      display: "—",
      value: null,
      valid: false,
      qualityFlag: "invalid",
      tooltip: "Missing listed wing or null mid",
    };
  }
  if (!isPositiveListedDebit(d)) {
    return {
      display: "—",
      value: null,
      valid: false,
      qualityFlag: "invalid",
      tooltip: "Width Fit needs a positive listed debit",
    };
  }

  const strikes = [k - w, k, k + w];
  let poor = false;
  for (const s of strikes) {
    const q = legQuality(ctx, side, s, spreadFrac);
    if (!q.ok) {
      return {
        display: "—",
        value: null,
        valid: false,
        qualityFlag: "invalid",
        tooltip: q.reason || "Quality gate",
      };
    }
    if (q.poor) poor = true;
  }

  const gamma = listedFlyGreek(ctx, k, w, "gamma");
  const theta = listedFlyGreek(ctx, k, w, "theta");
  const delta = listedFlyGreek(ctx, k, w, "delta");
  const slope = flySlope(ctx, centers, idx, w);
  const curv = flyCurvature(ctx, centers, idx, w);
  const cp = symFlyCpAsym(ctx, k, w);

  const components: WidthFitComponents = {
    debit_efficiency: 1 - d / w,
    payoff_efficiency: w - d > 0 ? (w - d) / d : null,
    gamma_efficiency:
      gamma != null && Number.isFinite(gamma) ? Math.abs(gamma) / d : null,
    curvature_efficiency:
      curv != null && Number.isFinite(curv) ? Math.abs(curv) / d : null,
    theta_efficiency:
      gamma != null &&
      theta != null &&
      Number.isFinite(gamma) &&
      Number.isFinite(theta) &&
      Math.abs(theta) > 1e-12
        ? Math.abs(gamma) / Math.abs(theta)
        : null,
    surface_responsiveness: responsivenessRaw(delta, gamma, slope, curv),
    call_put_asymmetry:
      cp != null && Number.isFinite(cp) ? Math.abs(cp) : null,
  };

  const qualityFlag: WidthFitQuality = poor ? "poor" : "good";
  return {
    display: null,
    value: null,
    valid: true,
    components,
    qualityFlag,
    tooltip: "Width Fit — relative fit to stated criteria",
  };
}

function responsivenessRaw(
  delta: number | null,
  gamma: number | null,
  slope: number | null,
  curv: number | null,
): number | null {
  const parts = [delta, gamma, slope, curv]
    .map((n) => (n != null && Number.isFinite(n) ? Math.abs(n) : null))
    .filter((n): n is number => n != null);
  if (!parts.length) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

function colValues(
  grid: GridCell[][],
  ci: number,
  pick: (c: GridCell) => number | null,
): number[] {
  const out: number[] = [];
  for (const row of grid) {
    const cell = row[ci];
    if (!cell?.valid) continue;
    const v = pick(cell);
    if (v != null && Number.isFinite(v)) out.push(v);
  }
  return out;
}

function minMax01(v: number, lo: number, hi: number): number {
  if (!(hi > lo)) return 0.5;
  return Math.min(1, Math.max(0, (v - lo) / (hi - lo)));
}

function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const a = [...xs].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

function lerpRgb(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  const u = Math.min(1, Math.max(0, t));
  const r = Math.round(a[0] + (b[0] - a[0]) * u);
  const g = Math.round(a[1] + (b[1] - a[1]) * u);
  const bl = Math.round(a[2] + (b[2] - a[2]) * u);
  return `rgb(${r},${g},${bl})`;
}

/** Muted teal (low) → soft amber (high). Not debit RoC. */
export function widthFitFill(t: number, opacity = 1): string {
  const teal: [number, number, number] = [18, 72, 78];
  const amber: [number, number, number] = [196, 152, 78];
  const rgb = lerpRgb(teal, amber, t);
  if (opacity >= 0.99) return rgb;
  return rgb.replace("rgb", "rgba").replace(")", `, ${opacity})`);
}

export function assignWidthFitColors(
  grid: GridCell[][],
  params: TemplateParams,
): { stickyScale: number; footer: WidthFitFooterCol[] } {
  const weights = resolveWidthFitWeights(params.widthFitWeights);
  const strength = clampStabilityPenalty(params.stabilityPenaltyStrength);
  const minN = Number(params.minValidN);
  const minValidN =
    Number.isFinite(minN) && minN >= 0 ? minN : DEFAULT_MIN_VALID_N;
  const perWidth = (params.widthFitNormalization ?? "per_width") !== "grid";
  const cols = grid[0]?.length ?? 0;
  const rows = grid.length;

  const rawByCrit: Record<WidthFitCriterion, number[][]> = {
    debit_efficiency: [],
    payoff_efficiency: [],
    gamma_efficiency: [],
    curvature_efficiency: [],
    theta_efficiency: [],
    surface_responsiveness: [],
    call_put_asymmetry: [],
  };

  for (const crit of WIDTH_FIT_CRITERIA) {
    rawByCrit[crit] = [];
    for (let ci = 0; ci < cols; ci++) {
      rawByCrit[crit][ci] = colValues(
        grid,
        ci,
        (c) => c.components?.[crit] ?? null,
      );
    }
  }

  const gridAll: Record<WidthFitCriterion, number[]> = {
    debit_efficiency: [],
    payoff_efficiency: [],
    gamma_efficiency: [],
    curvature_efficiency: [],
    theta_efficiency: [],
    surface_responsiveness: [],
    call_put_asymmetry: [],
  };
  if (!perWidth) {
    for (const crit of WIDTH_FIT_CRITERIA) {
      gridAll[crit] = rawByCrit[crit].flat();
    }
  }

  const weighted: number[][] = [];
  for (let ri = 0; ri < rows; ri++) {
    weighted[ri] = [];
    for (let ci = 0; ci < cols; ci++) {
      const cell = grid[ri][ci];
      if (!cell?.valid || !cell.components) {
        weighted[ri][ci] = NaN;
        continue;
      }
      let acc = 0;
      let wSum = 0;
      for (const crit of WIDTH_FIT_CRITERIA) {
        const raw = cell.components[crit];
        if (raw == null || !Number.isFinite(raw)) continue;
        const pool = perWidth ? rawByCrit[crit][ci] : gridAll[crit];
        const lo = pool.length ? Math.min(...pool) : raw;
        const hi = pool.length ? Math.max(...pool) : raw;
        acc += weights[crit] * minMax01(raw, lo, hi);
        wSum += weights[crit];
      }
      weighted[ri][ci] = wSum > 0 ? acc / wSum : NaN;
    }
  }

  const scored: number[][] = [];
  const stab: number[][] = [];
  for (let ri = 0; ri < rows; ri++) {
    scored[ri] = [];
    stab[ri] = [];
    for (let ci = 0; ci < cols; ci++) {
      const v = weighted[ri][ci];
      if (!Number.isFinite(v)) {
        scored[ri][ci] = NaN;
        stab[ri][ci] = NaN;
        continue;
      }
      const neigh: number[] = [];
      for (const d of [-2, -1, 1, 2]) {
        const n = weighted[ri + d]?.[ci];
        if (Number.isFinite(n)) neigh.push(n as number);
      }
      let penalty: number;
      if (neigh.length < 2) {
        penalty = 0.7 * strength;
      } else {
        const med = median(neigh) ?? v;
        const mad =
          neigh.reduce((s, x) => s + Math.abs(x - med), 0) / neigh.length;
        const outlier = Math.abs(v - med);
        penalty = strength * (outlier / (outlier + mad + 1e-6));
      }
      const p = Math.min(0.9, Math.max(0, penalty));
      scored[ri][ci] = v * (1 - p);
      stab[ri][ci] = 1 - p / 0.9;
    }
  }

  const colScores: number[][] = [];
  for (let ci = 0; ci < cols; ci++) {
    colScores[ci] = [];
    for (let ri = 0; ri < rows; ri++) {
      if (Number.isFinite(scored[ri][ci])) colScores[ci].push(scored[ri][ci]);
    }
  }

  const allScores = colScores.flat();
  const rawP95 = (() => {
    if (!allScores.length) return 1;
    const a = [...allScores].sort((x, y) => x - y);
    return a[Math.min(a.length - 1, Math.floor(a.length * 0.95))] || 1;
  })();
  const sticky = updateStickyScale(params.stickyScale, rawP95, 0.25);

  const footer: WidthFitFooterCol[] = [];
  for (let ci = 0; ci < cols; ci++) {
    const vals = colScores[ci];
    const n = vals.length;
    const med = median(vals);
    const stabs: number[] = [];
    for (let ri = 0; ri < rows; ri++) {
      if (Number.isFinite(stab[ri][ci])) stabs.push(stab[ri][ci]);
    }
    const stMed = median(stabs);
    const lowConfidence = n < minValidN;
    let quality: WidthFitFooterCol["quality"] = "good";
    if (lowConfidence) quality = "low_n";
    else if (stMed != null && stMed < 0.4) quality = "unstable";
    else if (med != null && med < 0.35) quality = "poor";
    footer.push({
      widthPts: 0,
      median: med,
      n,
      lowConfidence,
      stability: stMed,
      quality,
    });
  }

  for (let ri = 0; ri < rows; ri++) {
    for (let ci = 0; ci < cols; ci++) {
      const cell = grid[ri][ci];
      if (!cell) continue;
      if (!cell.valid || !Number.isFinite(scored[ri][ci])) {
        cell.colorT = null;
        cell.bgCss = "#1a1a1a";
        cell.value = null;
        cell.widthFitOutline = false;
        continue;
      }
      const pool = perWidth ? colScores[ci] : allScores;
      const lo = pool.length ? Math.min(...pool) : 0;
      const hi = pool.length ? Math.max(...pool) : 1;
      const t = minMax01(scored[ri][ci], lo, hi);
      const st = stab[ri][ci];
      const poor = cell.qualityFlag === "poor";
      const opacity = poor ? 0.42 : st < 0.45 ? 0.55 : 0.92;
      cell.colorT = t;
      cell.value = scored[ri][ci];
      cell.widthFitStability = st;
      cell.bgCss = widthFitFill(t, opacity);
      cell.widthFitOutline =
        t >= 0.75 && st >= 0.6 && cell.qualityFlag === "good";
      cell.display = null;
    }
  }

  return { stickyScale: sticky, footer };
}

export function widthFitSurfaceState(
  footer: WidthFitFooterCol[],
): WidthFitSurfaceState {
  const usable = footer.filter((f) => f.n > 0);
  if (!usable.length) return "no_reliable_fit";
  const allLow = usable.every((f) => f.lowConfidence);
  if (allLow) return "no_reliable_fit";
  const unstable =
    usable.filter((f) => f.quality === "unstable").length >=
    Math.ceil(usable.length / 2);
  if (unstable) return "unstable_surface";
  const meds = usable
    .filter((f) => !f.lowConfidence && f.median != null)
    .map((f) => f.median as number);
  if (!meds.length) return "no_reliable_fit";
  const hi = Math.max(...meds);
  if (hi >= 0.65) return "strong_fit";
  if (hi >= 0.4) return "moderate_fit";
  return "no_clear_fit";
}

export function attachFooterWidths(
  footer: WidthFitFooterCol[],
  cols: ColDef[],
): WidthFitFooterCol[] {
  return footer.map((f, i) => ({
    ...f,
    widthPts: cols[i]?.widthPts ?? f.widthPts,
  }));
}

/** Inspector note when a cell is high-fit vs a moderate width aggregate. */
export function widthFitInspectorNote(
  cellScore: number | null,
  widthMedian: number | null,
): string | null {
  if (cellScore == null || widthMedian == null) return null;
  if (cellScore >= 0.65 && widthMedian < 0.5) {
    return "This cell scores well relative to other centers at the same width; the width as a whole shows only moderate coherence.";
  }
  return null;
}

export type WidthFitTipRow = { label: string; value: string };

/** Hover / click copy when tiles have color but no numbers. */
export function widthFitPanelCopy(input: {
  valid: boolean;
  colorT: number | null;
  outline?: boolean;
  qualityFlag?: WidthFitQuality | null;
  stability?: number | null;
  score?: number | null;
  gate?: string | null;
  widthMedian?: number | null;
  components?: WidthFitComponents | null;
  detail?: boolean;
}): { rows: WidthFitTipRow[]; note: string } {
  const rows: WidthFitTipRow[] = [];
  if (!input.valid) {
    rows.push({ label: "Color", value: "Dark" });
    rows.push({ label: "Meaning", value: "Not a valid listed fly" });
    return {
      rows,
      note:
        (input.gate && input.gate !== "Width Fit — relative fit to stated criteria"
          ? input.gate + ". "
          : "") +
        "Missing wing, null mid, or a quality gate. Not a fit score.",
    };
  }
  const t = input.colorT;
  let color = "Mid";
  let meaning = "Moderate fit to your weights, relative to other listed flies here.";
  if (t == null) {
    color = "Dark";
    meaning = "No fit color for this cell.";
  } else if (t < 0.35) {
    color = "Teal";
    meaning =
      "Weaker fit to your weights than other listed flies on this surface.";
  } else if (t >= 0.65) {
    color = "Amber";
    meaning =
      "Stronger fit to your weights than other listed flies on this surface.";
  }
  rows.push({ label: "Color", value: color });
  rows.push({ label: "Meaning", value: meaning });
  if (input.score != null && Number.isFinite(input.score)) {
    rows.push({ label: "Fit", value: input.score.toFixed(2) });
  }
  if (input.stability != null && Number.isFinite(input.stability)) {
    rows.push({
      label: "Neighbors",
      value:
        input.outline
          ? "Coherent cluster (high fit and stable neighbors)"
          : input.stability < 0.45
            ? "Isolated or unstable vs nearby centers"
            : "In line with nearby centers at this width",
    });
  }
  if (input.qualityFlag === "poor") {
    rows.push({ label: "Quality", value: "Wide quote — down-weighted" });
  }
  if (input.detail && input.components) {
    for (const k of WIDTH_FIT_CRITERIA) {
      const v = input.components[k];
      rows.push({
        label: k.replace(/_/g, " "),
        value: v != null && Number.isFinite(v) ? v.toFixed(3) : "—",
      });
    }
    const vs = widthFitInspectorNote(input.score ?? null, input.widthMedian ?? null);
    if (vs) {
      rows.push({ label: "Vs width", value: vs });
    }
  }
  return {
    rows,
    note:
      "Relative to other listed flies on this surface under your current weights. Not a directional signal or a recommendation.",
  };
}

export function widthFitObservation(cell: GridCell): string {
  const c = cell.components;
  if (!c) return "No component map.";
  const ranked = WIDTH_FIT_CRITERIA
    .map((k) => ({ k, v: c[k] }))
    .filter((x) => x.v != null && Number.isFinite(x.v))
    .sort((a, b) => (b.v as number) - (a.v as number));
  if (!ranked.length) return "Components unavailable.";
  const top = ranked[0];
  const label = top.k.replace(/_/g, " ");
  return `${label} leads this cell’s criteria map (comparative, this width).`;
}

/** Test helper: listed K±w missing → invalid. */
export function widthFitLegsListed(
  ctx: ChainContext,
  k: number,
  w: number,
): boolean {
  const side = ctx.viewSide;
  return (
    ctx.contracts.has(contractKey(side, k - w)) &&
    ctx.contracts.has(contractKey(side, k)) &&
    ctx.contracts.has(contractKey(side, k + w))
  );
}
