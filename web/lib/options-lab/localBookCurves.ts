/**
 * Live Analyzer book curves — local sheet on the OPF-held generation.
 *
 * Working 2.5s and Away 5s share this path. The client already holds
 * listed strikes, mids, and IVs from the ladder poll. Repricing 161
 * spots is a browser job. `/api/me/pricing/resolve` is not on this clock
 * (lock / pack / RECON stay server when those packets run).
 *
 * Law: finite listed IV on the held row, or a named hole. Never invent.
 * Engine: client BSM European (`local.bsm_european`). SPY CRR is labeled
 * deferred — same formula, honest engine id.
 */

import {
  MIN_TAU,
  evaluateExpiryPnlAtSpot,
  evaluatePnlAtSpot,
  type SurfaceLeg,
} from "@/lib/risk-graph/surfaceModel";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import type {
  OpfGenerationIn,
  OpfResolveResult,
} from "@/lib/options-lab/opfPricingApi";
import {
  tauYearsWhatIf,
  tauYearsWhatIfAfterElapsed,
} from "@/lib/options-lab/whatIfClocks";

export const LOCAL_CURVE_STEPS = 161;
export const LOCAL_ENGINE_ID = "local.bsm_european";

export type LocalSheetHole = "IV NO" | "NOT TRADED" | "CHECK LEGS";

export type LocalBookCurvesOk = {
  ok: true;
  result: OpfResolveResult;
  ivSources: string[];
};

export type LocalBookCurvesFail = {
  ok: false;
  hole: LocalSheetHole;
  detail: string;
};

export type LocalBookCurvesResult = LocalBookCurvesOk | LocalBookCurvesFail;

/** Massive sometimes sends percent. Same rule as server `_iv_from_row`. */
export function listedIvFromRow(raw: unknown): number | null {
  if (raw == null) return null;
  const v = Number(raw);
  if (!Number.isFinite(v) || v <= 0) return null;
  return v > 3 ? v / 100 : v;
}

function sideOf(row: Record<string, unknown>): "call" | "put" | null {
  const s = String(row.side ?? row.right ?? "")
    .trim()
    .toLowerCase();
  if (s === "call" || s === "c") return "call";
  if (s === "put" || s === "p") return "put";
  return null;
}

function findHeldRow(
  gens: OpfGenerationIn[],
  strike: number,
  right: "call" | "put",
  expiration: string,
): { row: Record<string, unknown>; gen: OpfGenerationIn } | null {
  const exp = expiration.slice(0, 10);
  for (const gen of gens) {
    if (gen.expiration && String(gen.expiration).slice(0, 10) !== exp) {
      continue;
    }
    for (const row of gen.rows) {
      const side = sideOf(row);
      const k = Number(row.strike);
      if (side !== right || !Number.isFinite(k)) continue;
      if (Math.abs(k - strike) > 1e-6) continue;
      return { row, gen };
    }
  }
  return null;
}

export function bindGenerationLegs(
  trade: ParsedTosTrade,
  gens: OpfGenerationIn[],
  nowMs: number = Date.now(),
):
  | { ok: true; legs: SurfaceLeg[]; marks: Array<Record<string, unknown>> }
  | { ok: false; hole: LocalSheetHole; detail: string } {
  if (!trade.legs.length) {
    return { ok: false, hole: "CHECK LEGS", detail: "No listed legs on the pointer." };
  }
  if (!gens.length) {
    return {
      ok: false,
      hole: "IV NO",
      detail: "No OPF-held generation yet — waiting for the ladder.",
    };
  }

  const legs: SurfaceLeg[] = [];
  const marks: Array<Record<string, unknown>> = [];

  for (const l of trade.legs) {
    const hit = findHeldRow(gens, l.strike, l.right, l.expiration);
    if (!hit) {
      return {
        ok: false,
        hole: "NOT TRADED",
        detail: `${l.right} ${l.strike} ${l.expiration} is not on the held generation.`,
      };
    }
    const iv = listedIvFromRow(hit.row.iv);
    if (iv == null) {
      return {
        ok: false,
        hole: "IV NO",
        detail: `No listed IV for ${l.right} ${l.strike} ${l.expiration}.`,
      };
    }
    const tau = Math.max(tauYearsWhatIf(l.expiration, nowMs), MIN_TAU);
    const midRaw = hit.row.mid != null ? Number(hit.row.mid) : NaN;
    const premium = Number.isFinite(midRaw) ? midRaw : null;
    if (premium == null) {
      return {
        ok: false,
        hole: "NOT TRADED",
        detail: `No listed mid for ${l.right} ${l.strike} ${l.expiration}.`,
      };
    }
    legs.push({
      strike: l.strike,
      right: l.right,
      qty: l.quantity,
      premium,
      iv,
      tauYears0: tau,
    });
    marks.push({
      leg_id: `${l.right}_${l.strike}_${l.expiration}`,
      strike: l.strike,
      side: l.right,
      right: l.right,
      qty: l.quantity,
      expiration: l.expiration,
      mid: premium,
      iv,
      iv_source: "generation",
      tau,
    });
  }
  return { ok: true, legs, marks };
}

export function localSpotAxis(
  spot: number,
  strikes: number[],
  rangePct: number,
  steps: number = LOCAL_CURVE_STEPS,
): number[] {
  const n = Math.max(21, Math.min(401, Math.floor(steps)));
  const pct = Math.max(1, Math.min(40, rangePct));
  let xLo = spot * (1 - pct / 100);
  let xHi = spot * (1 + pct / 100);
  const ks = strikes.filter((k) => Number.isFinite(k) && k > 0);
  if (ks.length) {
    const lo = Math.min(...ks);
    const hi = Math.max(...ks);
    const pad = Math.max((hi - lo) * 0.35, spot * 0.02, 5);
    xLo = Math.min(xLo, lo - pad);
    xHi = Math.max(xHi, hi + pad);
  }
  if (!(xHi > xLo)) xHi = xLo + 1;
  return Array.from({ length: n }, (_, i) => xLo + (i / (n - 1)) * (xHi - xLo));
}

export function resolveLocalBookCurves(opts: {
  trade: ParsedTosTrade;
  generations: OpfGenerationIn[];
  spot: number;
  volOffsetPts?: number;
  timeOffsetHours?: number;
  spotPct?: number;
  curveSteps?: number;
  curveRangePct?: number;
  useCase?: string;
  packId?: string | null;
  /** Wall clock for What-if τ (1-minute floor). Do not use fractionalT. */
  nowMs?: number;
}): LocalBookCurvesResult {
  const spot = Number(opts.spot);
  if (!Number.isFinite(spot) || spot <= 0) {
    return { ok: false, hole: "CHECK LEGS", detail: "No spot from chain or override." };
  }
  const nowMs = Number.isFinite(opts.nowMs) ? Number(opts.nowMs) : Date.now();
  const bound = bindGenerationLegs(opts.trade, opts.generations, nowMs);
  if (!bound.ok) return bound;

  const volPts = Number(opts.volOffsetPts) || 0;
  const timeH = Number(opts.timeOffsetHours) || 0;
  const spotPct = Number(opts.spotPct) || 0;
  const priced = bound.legs.map((leg, i) => {
    const exp = String(bound.marks[i]?.expiration || opts.trade.expiration);
    return {
      ...leg,
      iv: Math.max(leg.iv + volPts / 100, 1e-8),
      tauYears0: tauYearsWhatIfAfterElapsed(exp, nowMs, timeH),
    };
  });
  const maxTau = Math.max(...priced.map((l) => l.tauYears0), 0);
  const rangePct = opts.curveRangePct ?? 8;
  const xs = localSpotAxis(
    spot,
    opts.trade.legs.map((l) => l.strike),
    rangePct,
    opts.curveSteps ?? LOCAL_CURVE_STEPS,
  );

  const theoPts = xs.map((x) => ({
    x,
    y: evaluatePnlAtSpot(priced, x, maxTau),
  }));
  const expPts = xs.map((x) => ({
    x,
    y: evaluateExpiryPnlAtSpot(priced, x),
  }));

  const pkg = bound.legs.reduce((sum, l) => sum + l.qty * l.premium, 0);
  const spotS = spot * (1 + spotPct / 100);
  const pnlAtSpot = evaluatePnlAtSpot(priced, spotS, maxTau);

  const result: OpfResolveResult = {
    use_case: opts.useCase || "day_trade",
    pack_id: opts.packId ?? LOCAL_ENGINE_ID,
    complete: true,
    marks: {
      label: "mark",
      package_debit_per_share: pkg,
      basis_debit_per_share: pkg,
      complete: true,
      leg_marks: bound.marks,
    },
    model_t0: {
      label: "model_t0",
      engine_id: LOCAL_ENGINE_ID,
      debit_per_share: pkg,
      pnl_dollars: pnlAtSpot,
      spot: spotS,
    },
    curves: {
      model_t0: {
        label: "model_t0",
        pnl_unit: "usd_per_package_set",
        points: theoPts,
      },
      expiration: {
        label: "expiration",
        pnl_unit: "usd_per_package_set",
        points: expPts,
      },
    },
    meta: {
      engine_id: LOCAL_ENGINE_ID,
      error: null,
      tau_by_leg: Object.fromEntries(
        bound.marks.map((m) => [String(m.leg_id), Number(m.tau)]),
      ),
    },
  };

  return { ok: true, result, ivSources: bound.marks.map(() => "generation") };
}
