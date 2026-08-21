/**
 * Heatmap hover-tip model — bigger type, labeled rows, colored values.
 * Native `title` is too small and too slow; this is the SoR for tile copy.
 */

import type {
  ChainContext,
  ValueModeId,
  WidthFitComponents,
  WidthFitQuality,
} from "./templates/types";
import { widthFitPanelCopy } from "./templates/widthFit";
import { expirationPnLDollars } from "./riskPayoff";
import {
  listedPackageGreeks,
  type ListedPackageGreeks,
} from "./templates/pricing";

export type HeatmapPayoffPoint = { x: number; y: number };

export type HeatmapPositionInspect = {
  greeks: ListedPackageGreeks;
  payoff: HeatmapPayoffPoint[];
  maxProfit: number;
  maxLoss: number;
  spot: number | null;
};

export type TipTone =
  | "debit"
  | "credit"
  | "pos"
  | "neg"
  | "call"
  | "put"
  | "neutral"
  | "muted";

export type HeatmapTipRow = {
  label: string;
  value: string;
  tone: TipTone;
};

export type HeatmapTipModel = {
  title: string;
  kicker: string;
  structure?: string;
  rows: HeatmapTipRow[];
  note?: string;
  hint?: string;
  /** Convexity vs same-width peers on the held generation. */
  convexityScore?: number | null;
};

export function toneForSigned(n: number | null | undefined): TipTone {
  if (n == null || !Number.isFinite(n) || n === 0) return "neutral";
  return n > 0 ? "pos" : "neg";
}

export function toneForMode(
  mode: ValueModeId,
  value: number | null | undefined,
): TipTone {
  if (value == null || !Number.isFinite(value)) return "muted";
  if (mode === "credit") return value >= 0 ? "credit" : "debit";
  if (mode === "debit") return value > 0 ? "debit" : "credit";
  if (mode === "r2r") return value >= 1 ? "pos" : "muted";
  if (mode === "gex_call") return "call";
  if (mode === "gex_put") return "put";
  return toneForSigned(value);
}

export function formatTipStrike(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (Math.abs(n - Math.round(n)) < 1e-6) return String(Math.round(n));
  return n.toFixed(2);
}

/**
 * Rank `value` among `peers` on a 1–10 scale (10 = most convex / highest).
 * Same-width heatmap tiles are the peer set. Ties share the lower rank.
 */
export function peerScore10(
  value: number,
  peers: readonly number[],
): number | null {
  const xs = peers.filter((n) => Number.isFinite(n));
  if (xs.length < 2 || !Number.isFinite(value)) return null;
  const lo = Math.min(...xs);
  const hi = Math.max(...xs);
  if (hi - lo < 1e-12) return 5;
  let below = 0;
  for (const p of xs) {
    if (p < value - 1e-12) below += 1;
  }
  const t = below / (xs.length - 1);
  return Math.max(1, Math.min(10, Math.round(1 + 9 * t)));
}

/**
 * Long-structure gamma for each body vs the same-width column (held chain).
 * Returns strike → 1–10. No extra fetch.
 */
export function flyColumnConvexityScores(
  ctx: ChainContext,
  side: "call" | "put",
  bodies: readonly number[],
  legsAt: (
    body: number,
  ) => readonly { strike: number; quantity: number }[] | null,
): Map<number, number> {
  const raw: { body: number; g: number }[] = [];
  for (const body of bodies) {
    const legs = legsAt(body);
    if (!legs?.length) continue;
    const g = listedPackageGreeks(ctx, side, legs).gamma;
    if (g == null || !Number.isFinite(g)) continue;
    raw.push({ body, g });
  }
  const peers = raw.map((r) => r.g);
  const out = new Map<number, number>();
  for (const r of raw) {
    const s = peerScore10(r.g, peers);
    if (s != null) out.set(r.body, s);
  }
  return out;
}

export function flyStructure(body: number, widthPts: number): string {
  return `${formatTipStrike(body - widthPts)} / ${formatTipStrike(body)} / ${formatTipStrike(body + widthPts)}`;
}

export function heatmapMatrixTip(opts: {
  templateId: string;
  templateLabel: string;
  mode: ValueModeId;
  modeLabel: string;
  strike: number;
  strikeLabel: string;
  widthPts: number;
  widthLabel: string;
  tileFace: string;
  tileAlt: string;
  cellValid: boolean;
  cellValue: number | null;
  cellTooltip?: string;
  isSpot?: boolean;
  convexityScore?: number | null;
  /** Width Fit: color is the score; hover/click must name it. */
  widthFit?: {
    colorT: number | null;
    outline?: boolean;
    qualityFlag?: WidthFitQuality | null;
    stability?: number | null;
    components?: WidthFitComponents | null;
    widthMedian?: number | null;
    detail?: boolean;
  };
}): HeatmapTipModel {
  const kicker = [
    opts.templateLabel,
    `${opts.widthLabel}-wide`,
    opts.strikeLabel,
    opts.isSpot ? "spot" : null,
  ]
    .filter(Boolean)
    .join("  ·  ");

  const fly =
    (opts.templateId === "sym-fly" || opts.templateId === "width-fit") &&
    opts.widthPts > 0
      ? flyStructure(opts.strike, opts.widthPts)
      : undefined;

  const widthFitOn =
    opts.templateId === "width-fit" || opts.mode === "width_fit";

  const rows: HeatmapTipRow[] = [];
  let note: string | undefined;
  if (widthFitOn) {
    const copy = widthFitPanelCopy({
      valid: opts.cellValid,
      colorT: opts.widthFit?.colorT ?? null,
      outline: opts.widthFit?.outline,
      qualityFlag: opts.widthFit?.qualityFlag,
      stability: opts.widthFit?.stability,
      score: opts.cellValue,
      gate: opts.cellTooltip,
      widthMedian: opts.widthFit?.widthMedian,
      components: opts.widthFit?.components,
      detail: opts.widthFit?.detail === true,
    });
    for (const r of copy.rows) {
      rows.push({
        label: r.label,
        value: r.value,
        tone:
          r.label === "Color" && r.value === "Amber"
            ? "debit"
            : r.label === "Color" && r.value === "Teal"
              ? "muted"
              : r.label === "Meaning"
                ? "neutral"
                : "neutral",
      });
    }
    note = copy.note;
  } else if (opts.cellValid) {
    const shown = opts.tileAlt || opts.tileFace;
    rows.push({
      label: "Value",
      value: shown,
      tone: toneForMode(opts.mode, opts.cellValue),
    });
    if (opts.tileFace !== opts.tileAlt && opts.tileFace !== "—") {
      rows.push({
        label: "Tile",
        value: opts.tileFace,
        tone: "muted",
      });
    }
  }

  return {
    title: widthFitOn ? "Width Fit" : opts.modeLabel,
    kicker,
    structure: fly,
    rows,
    note: widthFitOn
      ? note
      : opts.cellValid
        ? undefined
        : opts.cellTooltip || "Not listed",
    hint: opts.cellValid
      ? widthFitOn
        ? "Click for components and ToS"
        : "Click copies ToS"
      : undefined,
    convexityScore:
      opts.convexityScore != null && Number.isFinite(opts.convexityScore)
        ? Math.max(1, Math.min(10, Math.round(opts.convexityScore)))
        : null,
  };
}

export function heatmapGexTip(opts: {
  strikeLabel: string;
  isSpot?: boolean;
  combined: boolean;
  call: number | null;
  put: number | null;
  net: number | null;
  callLabel: string;
  putLabel: string;
  netLabel: string;
}): HeatmapTipModel {
  const rows: HeatmapTipRow[] = opts.combined
    ? [
        {
          label: "Call",
          value: opts.call != null ? opts.callLabel : "—",
          tone: opts.call != null ? "call" : "muted",
        },
        {
          label: "Put",
          value: opts.put != null ? opts.putLabel : "—",
          tone: opts.put != null ? "put" : "muted",
        },
        {
          label: "Net",
          value: opts.net != null ? opts.netLabel : "—",
          tone: toneForSigned(opts.net),
        },
      ]
    : [
        {
          label: "GEX",
          value: opts.net != null ? opts.netLabel : "—",
          tone: toneForSigned(opts.net),
        },
      ];
  return {
    title: "GEX",
    kicker: `Strike ${opts.strikeLabel}${opts.isSpot ? "  ·  spot" : ""}`,
    rows,
    note:
      opts.net == null && opts.call == null && opts.put == null
        ? "Missing γ / OI"
        : undefined,
  };
}

export function fmtGreek(n: number | null | undefined, digits: number): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toFixed(digits);
}

export function fmtIvPct(iv: number | null | undefined): string {
  if (iv == null || !Number.isFinite(iv) || iv <= 0) return "—";
  const pct = iv > 3 ? iv : iv * 100;
  return `${pct.toFixed(1)}%`;
}

/**
 * Tiny expiration tent for the pinned tile card. OPF debit is per share.
 */
export function miniExpirationPayoff(opts: {
  legs: readonly {
    strike: number;
    quantity: number;
    right: "call" | "put";
  }[];
  debit: number;
  spot?: number | null;
  steps?: number;
}): { points: HeatmapPayoffPoint[]; maxProfit: number; maxLoss: number } {
  const legs = opts.legs;
  if (!legs.length) {
    return { points: [], maxProfit: 0, maxLoss: 0 };
  }
  const ks = legs.map((l) => l.strike);
  const lo = Math.min(...ks);
  const hi = Math.max(...ks);
  const pad = Math.max(hi - lo, 10) * 0.45;
  const spot =
    opts.spot != null && Number.isFinite(opts.spot) ? Number(opts.spot) : null;
  const xMin = Math.min(lo, spot ?? lo) - pad;
  const xMax = Math.max(hi, spot ?? hi) + pad;
  const steps = Math.max(24, opts.steps ?? 48);
  const points: HeatmapPayoffPoint[] = [];
  let maxProfit = -Infinity;
  let maxLoss = Infinity;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const y = expirationPnLDollars(
      x,
      legs.map((l) => ({
        strike: l.strike,
        quantity: l.quantity,
        right: l.right,
        expiration: "",
      })),
      opts.debit,
    );
    points.push({ x, y });
    if (y > maxProfit) maxProfit = y;
    if (y < maxLoss) maxLoss = y;
  }
  for (const k of ks) {
    const y = expirationPnLDollars(
      k,
      legs.map((l) => ({
        strike: l.strike,
        quantity: l.quantity,
        right: l.right,
        expiration: "",
      })),
      opts.debit,
    );
    points.push({ x: k, y });
    if (y > maxProfit) maxProfit = y;
    if (y < maxLoss) maxLoss = y;
  }
  points.sort((a, b) => a.x - b.x);
  return {
    points,
    maxProfit: Number.isFinite(maxProfit) ? maxProfit : 0,
    maxLoss: Number.isFinite(maxLoss) ? maxLoss : 0,
  };
}
