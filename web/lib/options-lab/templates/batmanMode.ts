/**
 * Batman mode — Advanced Fly + Broken Wing only.
 *
 * Call graph above, put graph below, setup strip with one tent per side.
 * Stage one call fly and one put fly; Send to Analyzer as TWO cards.
 * Never a single six-leg blob (Coach: two position cards).
 *
 * Considered / rejected:
 * - One six-leg Batman card — rejected (Coach: two cards; each side independent).
 * - Overlay call+put on one grid — rejected (stacked graphs requested).
 * - Auto-navigate on first click — rejected (stage until Send).
 * - Include Vertical — rejected (Coach: AF + BWB only).
 */

import type {
  HeatmapPayoffPoint,
  HeatmapPositionInspect,
} from "@/lib/options-lab/heatmapTip";
import type { GridCell, RowDef } from "@/lib/options-lab/templates/types";

export const BATMAN_TEMPLATE_IDS = ["sym-fly", "bw-fly"] as const;

export type BatmanTemplateId = (typeof BATMAN_TEMPLATE_IDS)[number];

export function supportsBatman(templateId: string): boolean {
  return (BATMAN_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

const EMPTY_CELL: GridCell = {
  display: "—",
  value: null,
  colorT: null,
  valid: false,
  bgCss: "#0a0a0e",
};

/** Union of listed bodies, spot-centered (equal count left/right). */
export function sharedBatmanRows(
  callRows: readonly RowDef[],
  putRows: readonly RowDef[],
  spot: number | null,
): RowDef[] {
  const byK = new Map<number, RowDef>();
  for (const r of [...callRows, ...putRows]) {
    const prev = byK.get(r.strike);
    byK.set(r.strike, {
      strike: r.strike,
      label: r.label || String(r.strike),
      isSpot: Boolean(prev?.isSpot || r.isSpot),
    });
  }
  const all = [...byK.keys()].sort((a, b) => a - b);
  if (!all.length) return [];
  const atm =
    spot != null && Number.isFinite(spot)
      ? all.reduce(
          (best, k) =>
            Math.abs(k - spot) < Math.abs(best - spot) ? k : best,
          all[0],
        )
      : all[Math.floor(all.length / 2)];
  return all.map((k) => ({
    strike: k,
    label: byK.get(k)?.label ?? String(k),
    isSpot: k === atm,
  }));
}

export function remapMatrixToRows<
  T extends { rows: RowDef[]; cols: { id: string }[]; cells: GridCell[][] },
>(matrix: T, rows: RowDef[]): T {
  const orig = new Map(matrix.rows.map((r, i) => [r.strike, i]));
  const cells = rows.map((row) => {
    const ri = orig.get(row.strike);
    if (ri == null) {
      return matrix.cols.map(() => ({ ...EMPTY_CELL }));
    }
    const src = matrix.cells[ri] ?? [];
    return matrix.cols.map((_, ci) => src[ci] ?? { ...EMPTY_CELL });
  });
  return { ...matrix, rows, cells };
}

function interpY(points: HeatmapPayoffPoint[], x: number): number {
  if (!points.length) return 0;
  if (x <= points[0].x) return points[0].y;
  const last = points[points.length - 1];
  if (x >= last.x) return last.y;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (x <= b.x) {
      const t = (x - a.x) / (b.x - a.x || 1);
      return a.y + t * (b.y - a.y);
    }
  }
  return last.y;
}

/** Shared strike axis, spot-centered; y_sum = y_put + y_call. */
export function additivePayoffCanvas(
  call: HeatmapPayoffPoint[] | null,
  put: HeatmapPayoffPoint[] | null,
  spot: number | null,
  steps = 64,
): {
  xMin: number;
  xMax: number;
  call: HeatmapPayoffPoint[];
  put: HeatmapPayoffPoint[];
  sum: HeatmapPayoffPoint[];
} {
  const src = [...(call ?? []), ...(put ?? [])];
  if (!src.length) {
    return { xMin: 0, xMax: 1, call: [], put: [], sum: [] };
  }
  let xMin = Math.min(...src.map((p) => p.x));
  let xMax = Math.max(...src.map((p) => p.x));
  if (spot != null && Number.isFinite(spot)) {
    const reach = Math.max(spot - xMin, xMax - spot, 1);
    xMin = spot - reach;
    xMax = spot + reach;
  }
  const callPts: HeatmapPayoffPoint[] = [];
  const putPts: HeatmapPayoffPoint[] = [];
  const sumPts: HeatmapPayoffPoint[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = xMin + ((xMax - xMin) * i) / steps;
    const cy = call?.length ? interpY(call, x) : 0;
    const py = put?.length ? interpY(put, x) : 0;
    if (call?.length) callPts.push({ x, y: cy });
    if (put?.length) putPts.push({ x, y: py });
    if (call?.length && put?.length) sumPts.push({ x, y: cy + py });
  }
  return { xMin, xMax, call: callPts, put: putPts, sum: sumPts };
}

export type StagedFly = {
  side: "call" | "put";
  body: number;
  widthPts: number;
  script: string;
  debit: number | null;
  structure: string;
  inspect: HeatmapPositionInspect | null;
};

export function stagedFlyLabel(fly: StagedFly): string {
  const side = fly.side === "call" ? "Call" : "Put";
  const debit =
    fly.debit != null && Number.isFinite(fly.debit)
      ? `  ${fly.debit.toFixed(2)}`
      : "";
  return `${side} ${fly.structure}${debit}`;
}

export function batmanReady(call: StagedFly | null, put: StagedFly | null): boolean {
  return !!(call && put && call.script.trim() && put.script.trim());
}
