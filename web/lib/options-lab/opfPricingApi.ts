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
    mid_source: r.mid_source ?? null,
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
  scenario?: {
    vol_offset_pts?: number;
    time_offset_hours?: number;
    spot_pct?: number;
  };
  spot?: number | null;
  vix?: number | null;
  vix1d?: number | null;
};

/** Registry packs exposed by L4 */
export type OpfPackInfo = {
  pack_id: string;
  use_case: string;
  role: string;
};

export async function listOpfPacks(): Promise<OpfPackInfo[]> {
  const r = await getJSON<{ packs?: OpfPackInfo[] }>("/api/me/pricing/packs");
  return r?.packs ?? [];
}

export async function resolveOpfPricing(
  body: OpfResolveRequest,
): Promise<OpfResolveResult> {
  const r = await postJSON("/api/me/pricing/resolve", {
    use_case: body.use_case || "day_trade",
    pack_id: body.pack_id ?? null,
    strategy: body.strategy,
    generations: body.generations,
    what_if: body.what_if ?? {},
    scenario: body.scenario ?? null,
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

/** PB17 SoR — card live package from OPF PackagePricer (no model curves). */
export type OpfPackageQuoteResult = {
  complete?: boolean;
  package_debit_per_share?: number | null;
  basis_debit_per_share?: number | null;
  basis_source?: string;
  /** live | pre_open_held | pre_open_theo | pre_open_mixed | mixed | incomplete */
  mark_mode?: string | null;
  /** Member disclaimer when marks are not live NBBO */
  mark_disclaimer?: string | null;
  max_skew_ms?: number | null;
  epoch_quality?: string | null;
  generations_used?: Record<
    string,
    { content_hash?: string; as_of?: string }
  >;
  as_of?: string | null;
  error?: string | null;
  skew_fail?: boolean;
  leg_marks?: Array<Record<string, unknown>>;
};

export async function quoteOpfPackage(body: {
  strategy: ReturnType<typeof tradeToOpfStrategy>;
  generations: OpfGenerationIn[];
  require_epoch_ok?: boolean;
  vix?: number | null;
  vix1d?: number | null;
}): Promise<OpfPackageQuoteResult> {
  const r = await postJSON("/api/me/pricing/package-quote", {
    strategy: body.strategy,
    generations: body.generations,
    require_epoch_ok: body.require_epoch_ok !== false,
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
      /* */
    }
    throw new Error(`OPF package-quote ${r.status}: ${detail}`);
  }
  return (await r.json()) as OpfPackageQuoteResult;
}

export async function touchOpfInterest(body: {
  chain_underlier: string;
  expiration: string;
  wings?: number;
  action?: "touch" | "release";
}): Promise<{ held?: number; cap?: number }> {
  const r = await postJSON("/api/me/pricing/interest", {
    chain_underlier: body.chain_underlier,
    expiration: body.expiration,
    wings: body.wings ?? 50,
    action: body.action ?? "touch",
  });
  if (r.status === 429) {
    const err = new Error("interest_budget") as Error & {
      budget: boolean;
    };
    err.budget = true;
    throw err;
  }
  if (!r.ok) return {};
  return (await r.json()) as { held?: number; cap?: number };
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

/** Linear interpolate P&L on a sorted price series. */
export function interpolatePnl(
  points: { price: number; pnl: number }[],
  x: number,
): number {
  if (!points.length) return 0;
  if (points.length === 1) return points[0].pnl;
  if (x <= points[0].price) return points[0].pnl;
  const last = points[points.length - 1];
  if (x >= last.price) return last.pnl;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (x <= b.price) {
      const span = b.price - a.price;
      if (Math.abs(span) < 1e-12) return a.pnl;
      return a.pnl + ((x - a.price) / span) * (b.pnl - a.pnl);
    }
  }
  return last.pnl;
}

/**
 * Sum independent position curves onto one continuous price grid.
 * Used when several cards are shown — each is OPF-resolved on its own
 * (held last-print when closed); the viewport adds them.
 */
export function sumAlignedPnL(
  series: { price: number; pnl: number }[][],
): { price: number; pnl: number }[] {
  const live = series.filter((s) => s.length > 0);
  if (live.length === 0) return [];
  if (live.length === 1) return live[0];
  const xs = new Set<number>();
  for (const s of live) {
    for (const p of s) xs.add(p.price);
  }
  return [...xs]
    .sort((a, b) => a - b)
    .map((price) => ({
      price,
      pnl: live.reduce((sum, s) => sum + interpolatePnl(s, price), 0),
    }));
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
