/**
 * OPF L4 client — headless resolve for Options Lab Analyzer.
 * Law: Spec v0.2.1 · consumes generations only (no private Massive path).
 */

import { postJSON, getJSON } from "@/lib/client";
import type { LadderFull, LadderRow } from "@/lib/chainLadderApi";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";

export type OpfLegIn = {
  leg_id: string;
  side: string;
  strike: number;
  expiration: string;
  qty: number;
  product: string;
};

export type OpfGenerationIn = {
  product: string;
  chain_underlier?: string;
  expiration: string;
  wings: number;
  spot?: number | null;
  as_of?: string | null;
  content_hash: string;
  rows: Array<Record<string, unknown>>;
};

export type OpfCurvePoint = { x: number; y: number };

export type OpfResolveResult = {
  use_case?: string;
  pack_id?: string;
  complete?: boolean;
  marks?: {
    label?: string;
    package_debit_per_share?: number | null;
    basis_debit_per_share?: number | null;
    mark_dollars?: number | null;
    complete?: boolean;
    leg_marks?: Array<Record<string, unknown>>;
  };
  model_t0?: {
    label?: string;
    engine_id?: string;
    debit_per_share?: number;
    pnl_dollars?: number | null;
    spot?: number;
  } | null;
  curves?: {
    model_t0?: { label?: string; points?: OpfCurvePoint[]; pnl_unit?: string };
    expiration?: { label?: string; points?: OpfCurvePoint[]; pnl_unit?: string };
  };
  meta?: {
    max_skew_ms?: number;
    epoch_quality?: string;
    engine_id?: string;
    rate_source?: string;
    recon?: {
      checked?: boolean;
      pass?: boolean | null;
      error_dollars?: number;
      tol_dollars?: number;
    };
    error?: string | null;
    tau_by_leg?: Record<string, number>;
  };
  lock?: { mode?: string };
};

export function ladderToOpfGeneration(
  ladder: LadderFull,
  product: string,
  wings: number,
): OpfGenerationIn {
  const rows = (ladder.rows || []).map((r: LadderRow) => ({
    strike: r.strike,
    side: (r.side || "call").toLowerCase(),
    mid: r.mid ?? null,
    bid: r.bid ?? null,
    ask: r.ask ?? null,
    iv: r.iv ?? null,
    delta: r.delta ?? null,
    expiration: ladder.expiration,
  }));
  return {
    product,
    chain_underlier: ladder.underlier,
    expiration: ladder.expiration,
    wings,
    spot: ladder.spot,
    as_of: ladder.as_of || null,
    content_hash: ladder.content_hash || "",
    rows,
  };
}

export function tradeToOpfStrategy(trade: ParsedTosTrade): {
  strategy_id: string;
  structure: string;
  packages: number;
  product: string;
  legs: OpfLegIn[];
} {
  return {
    strategy_id: "analyzer-tos",
    structure: trade.structure,
    packages: 1,
    product: trade.symbol,
    legs: trade.legs.map((l, i) => ({
      leg_id: `L${i}_${l.right}_${l.strike}`,
      side: l.right,
      strike: l.strike,
      expiration: l.expiration,
      qty: l.quantity,
      product: trade.symbol,
    })),
  };
}

export type OpfResolveRequest = {
  use_case?: string;
  pack_id?: string | null;
  strategy: ReturnType<typeof tradeToOpfStrategy>;
  generations: OpfGenerationIn[];
  what_if?: {
    spot_pct?: number;
    vol_offset_pts?: number;
    time_offset_hours?: number;
    curve_steps?: number;
    curve_range_pct?: number;
  };
  spot?: number | null;
  vix?: number | null;
  vix1d?: number | null;
};

export async function resolveOpfPricing(
  body: OpfResolveRequest,
): Promise<OpfResolveResult> {
  const r = await postJSON("/api/me/pricing/resolve", {
    use_case: body.use_case || "day_trade",
    pack_id: body.pack_id ?? null,
    strategy: body.strategy,
    generations: body.generations,
    what_if: body.what_if ?? {},
    spot: body.spot ?? null,
    vix: body.vix ?? null,
    vix1d: body.vix1d ?? null,
  });
  if (!r.ok) {
    let detail = r.statusText;
    try {
      const j = (await r.json()) as { detail?: unknown };
      detail =
        typeof j.detail === "string"
          ? j.detail
          : JSON.stringify(j.detail ?? j);
    } catch {
      /* keep statusText */
    }
    throw new Error(`OPF resolve ${r.status}: ${detail}`);
  }
  return (await r.json()) as OpfResolveResult;
}

export async function opfPricingHealth(): Promise<{
  ok?: boolean;
  foundation?: string;
  packs?: unknown[];
} | null> {
  return getJSON("/api/me/pricing/health");
}

/** Map OPF curve points → PnLChart {price,pnl} */
export function opfCurveToPnLPoints(
  points: OpfCurvePoint[] | undefined | null,
): { price: number; pnl: number }[] {
  if (!points?.length) return [];
  return points.map((p) => ({ price: p.x, pnl: p.y }));
}

/** Simple breakeven scan on sorted price axis */
export function findBreakevens(
  pts: { price: number; pnl: number }[],
): number[] {
  const out: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (a.pnl === 0) out.push(a.price);
    else if (a.pnl * b.pnl < 0) {
      const t = Math.abs(a.pnl) / (Math.abs(a.pnl) + Math.abs(b.pnl) || 1);
      out.push(a.price + t * (b.price - a.price));
    }
  }
  return out;
}
