/**
 * Spread Tax Map — Knowledge template (TR-P2).
 * Per-strike (ask − bid) / mid on the subscribed chain.
 */

import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import {
  register,
  type ControlValues,
  type HeatmapTiles,
  type RunnerStreams,
} from "../registry";

export const SPREAD_TAX_ID = "spread-tax";
export const SPREAD_TAX_VERSION = "0.1";

function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function taxOf(row: LadderRow): number | null {
  const bid = num(row.bid);
  const ask = num(row.ask);
  const mid = num(row.mid);
  if (bid == null || ask == null || mid == null || mid <= 0) return null;
  return (ask - bid) / mid;
}

function rowsFromChain(chain: unknown): LadderRow[] {
  if (!chain || typeof chain !== "object") return [];
  const o = chain as {
    contracts?: Map<string, LadderRow>;
    rows?: LadderRow[];
  };
  if (o.contracts instanceof Map) return [...o.contracts.values()];
  if (Array.isArray(o.rows)) return o.rows;
  return [];
}

function contentHashOf(streams: RunnerStreams): string | null {
  if (streams.content_hash) return streams.content_hash;
  const c = streams.chain as { contentHash?: string | null } | undefined;
  return c?.contentHash ?? null;
}

export function spreadTaxCompute(
  streams: RunnerStreams,
  controls: ControlValues,
): HeatmapTiles {
  const side = String(controls.side ?? "both");
  const minOi = Number(controls.min_oi ?? 0);
  const all = rowsFromChain(streams.chain);
  const wantSides: Array<"call" | "put"> =
    side === "call" ? ["call"] : side === "put" ? ["put"] : ["call", "put"];

  const strikes = [
    ...new Set(
      all
        .map((r) => Number(r.strike))
        .filter((k) => Number.isFinite(k)),
    ),
  ].sort((a, b) => b - a);

  const byKey = new Map<string, LadderRow>();
  for (const r of all) {
    const s = ((r.side || "call") as string).toLowerCase();
    byKey.set(contractKey(s, Number(r.strike)), r);
  }

  const cols = wantSides.map((s) => ({
    id: s,
    label: s === "call" ? "Call" : "Put",
    widthPts: 0,
  }));
  const rows = strikes.map((k) => ({ strike: k, label: String(k) }));
  const cells = rows.map((row) =>
    cols.map((col) => {
      const rec = byKey.get(contractKey(col.id, row.strike));
      if (!rec) {
        return {
          display: null,
          value: null,
          valid: false,
          colorT: null,
        };
      }
      const oi = num(rec.open_interest);
      if (minOi > 0 && (oi == null || oi < minOi)) {
        return {
          display: null,
          value: null,
          valid: false,
          colorT: null,
        };
      }
      const t = taxOf(rec);
      if (t == null) {
        return {
          display: null,
          value: null,
          valid: false,
          colorT: null,
        };
      }
      return {
        display: t.toFixed(4),
        value: t,
        valid: true,
        colorT: null,
      };
    }),
  );

  return {
    rows,
    cols,
    cells,
    contentHash: contentHashOf(streams),
  };
}

register({
  id: SPREAD_TAX_ID,
  version: SPREAD_TAX_VERSION,
  inputs: ["chain"],
  controls: [
    {
      id: "side",
      kind: "select",
      default: "both",
      options: ["call", "put", "both"],
    },
    {
      id: "min_oi",
      kind: "number",
      default: 0,
      bounds: [0, Number.POSITIVE_INFINITY],
    },
  ],
  live: true,
  outputKind: "visual/heatmap",
  cadence: "live",
  sinks: ["render"],
  honesty:
    "Missing bid/ask or mid ≤ 0 → cell is null (no fill, no zero). Stale passed through.",
  framing: "trader",
  nonClaim: "execution cost at the quoted market; not a forecast.",
  compute: spreadTaxCompute,
});
