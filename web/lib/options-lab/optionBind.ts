/**
 * Option bind assessment for Analyzer position cards.
 *
 * Card = pointer. Before OPF package can bind, **every leg** must pass:
 *   1. Expiration — not past settlement; optionally in the listed calendar
 *   2. Price — contract present on the chain generation with a finite mid
 *
 * A valid expiration does not imply a price (missing strike / cold ladder).
 */

import {
  isOptionPointerExpired,
  type AnalyzerPosition,
} from "@/lib/options-lab/analyzerBook";
import { normalizeStrike } from "@/lib/options-lab/listedStrikes";
import type {
  OptionRight,
  PositionInput,
} from "@/lib/options-lab/positionTypes";

export type LegBindReason =
  | "ok"
  | "expired"
  | "exp_not_listed"
  | "no_contract"
  /** Strike is past the edge of the listed chain window (no further options). */
  | "chain_edge"
  | "no_mid";

export type LegBindResult = {
  index: number;
  expiration: string;
  strike: number;
  type: OptionRight;
  /** Step 1: expiration is still a live option date */
  expOk: boolean;
  /** Step 2: listed contract has a usable mid (or bid/ask fallback) */
  priceOk: boolean;
  reason: LegBindReason;
  mid: number | null;
};

export type PositionBindResult = {
  /** True only when every leg passes exp + price */
  bindable: boolean;
  legs: LegBindResult[];
  failedCount: number;
  /** Human summary for UI */
  summary: string;
  assessedAt: number;
};

export type ContractQuote = {
  mid: number | null;
  bid?: number | null;
  ask?: number | null;
};

export type LadderStrikeBand = {
  /** Min listed strike on the hydrated generation (this exp) */
  lo: number;
  /** Max listed strike on the hydrated generation */
  hi: number;
  /** Distinct listed strikes present (any side) */
  strikes: readonly number[];
};

/**
 * Assess whether the structure the card points at can bind to OPF.
 * Pure — no I/O. Caller supplies listed exps + contract lookup from ladders.
 *
 * Chain-edge use case: as the user walks strikes with ▲/▼ toward the edge of
 * the option chain, strikes often have no listing / no mark. That fails the
 * price gate → position cannot be priced → NOT TRADED.
 */
export function assessPositionBind(
  position: PositionInput,
  opts: {
    now?: Date;
    /** When set, exp must appear in this listed calendar (OPF active set). */
    listedExpirations?: readonly string[] | null;
    getContract: (
      expiration: string,
      strike: number,
      type: OptionRight,
    ) => ContractQuote | undefined;
    /**
     * Optional band of listed strikes on the hydrated ladder for this exp.
     * Used to distinguish a hole in the chain vs past the edge of available
     * listings (both are NOT TRADED for pricing).
     */
    getStrikeBand?: (expiration: string) => LadderStrikeBand | undefined;
  },
): PositionBindResult {
  const now = opts.now ?? new Date();
  const listed = opts.listedExpirations
    ? new Set(
        opts.listedExpirations
          .map((e) => e.slice(0, 10))
          .filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e)),
      )
    : null;
  const front = (position.expiration || "").slice(0, 10);
  const legs = position.legs || [];

  const results: LegBindResult[] = legs.map((leg, index) => {
    const expiration = (leg.expiration || front).slice(0, 10);
    const strike = normalizeStrike(leg.strike);
    const type: OptionRight = leg.type === "put" ? "put" : "call";

    // --- 1. Expiration ---
    if (!expiration || isOptionPointerExpired(expiration, now)) {
      return {
        index,
        expiration,
        strike,
        type,
        expOk: false,
        priceOk: false,
        reason: "expired" as const,
        mid: null,
      };
    }
    if (listed && listed.size > 0 && !listed.has(expiration)) {
      return {
        index,
        expiration,
        strike,
        type,
        expOk: false,
        priceOk: false,
        reason: "exp_not_listed" as const,
        mid: null,
      };
    }

    // --- 2. Price (only if exp OK) ---
    const q = opts.getContract(expiration, strike, type);
    if (!q) {
      const band = opts.getStrikeBand?.(expiration);
      // Past the edge of listed strikes on this generation → chain edge
      let reason: LegBindReason = "no_contract";
      if (band && band.strikes.length > 0) {
        if (strike < band.lo - 1e-9 || strike > band.hi + 1e-9) {
          reason = "chain_edge";
        } else if (
          // Inside the lo..hi span but strike not present on either side
          !band.strikes.some((s) => Math.abs(s - strike) < 1e-9)
        ) {
          reason = "chain_edge"; // missing rung at the edge / sparse chain
        }
      }
      return {
        index,
        expiration,
        strike,
        type,
        expOk: true,
        priceOk: false,
        reason,
        mid: null,
      };
    }
    const mid =
      q.mid != null && Number.isFinite(q.mid)
        ? Number(q.mid)
        : q.bid != null &&
            q.ask != null &&
            Number.isFinite(q.bid) &&
            Number.isFinite(q.ask)
          ? (Number(q.bid) + Number(q.ask)) / 2
          : null;
    // mid can be 0 for deep OTM — still a valid mark
    if (mid == null || !Number.isFinite(mid) || mid < 0) {
      return {
        index,
        expiration,
        strike,
        type,
        expOk: true,
        priceOk: false,
        reason: "no_mid" as const,
        mid: null,
      };
    }

    return {
      index,
      expiration,
      strike,
      type,
      expOk: true,
      priceOk: true,
      reason: "ok" as const,
      mid,
    };
  });

  const failed = results.filter((r) => !(r.expOk && r.priceOk));
  const bindable = legs.length > 0 && failed.length === 0;
  const notTraded = results.filter((r) => isNotTradedReason(r.reason));
  const expFailed = failed.filter((f) => !f.expOk);
  const edgeCount = results.filter((r) => r.reason === "chain_edge").length;

  let summary: string;
  if (legs.length === 0) {
    summary = "no legs";
  } else if (bindable) {
    summary = "bound";
  } else if (notTraded.length > 0 && expFailed.length === 0) {
    // Missing market at chain edge / hole — cannot price the package
    const strikes = notTraded.map((l) => l.strike).join(", ");
    if (edgeCount > 0 && edgeCount === notTraded.length) {
      summary =
        notTraded.length === 1
          ? `NOT TRADED · ${notTraded[0].strike} ${notTraded[0].type} · chain edge`
          : `NOT TRADED · chain edge · ${notTraded.length} legs (${strikes})`;
    } else {
      summary =
        notTraded.length === 1
          ? `NOT TRADED · ${notTraded[0].strike} ${notTraded[0].type}`
          : `NOT TRADED · ${notTraded.length} legs (${strikes})`;
    }
  } else if (expFailed.length > 0 && notTraded.length === 0) {
    summary =
      expFailed[0].reason === "expired"
        ? "EXPIRED"
        : `exp invalid · ${expFailed.length} leg${expFailed.length === 1 ? "" : "s"}`;
  } else {
    summary = `unbound · ${expFailed.length} exp · ${notTraded.length} not traded`;
  }

  return {
    bindable,
    legs: results,
    failedCount: failed.length,
    summary,
    assessedAt: Date.now(),
  };
}

/** Stable compare for bind snapshots (ignore assessedAt). */
export function bindSnapshotEqual(
  a:
    | PositionBindResult
    | AnalyzerPosition["bind"]
    | null
    | undefined,
  b:
    | PositionBindResult
    | AnalyzerPosition["bind"]
    | null
    | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (
    a.bindable !== b.bindable ||
    a.failedCount !== b.failedCount ||
    a.summary !== b.summary ||
    a.legs.length !== b.legs.length
  ) {
    return false;
  }
  for (let i = 0; i < a.legs.length; i++) {
    const x = a.legs[i];
    const y = b.legs[i];
    if (
      x.strike !== y.strike ||
      x.type !== y.type ||
      x.expiration !== y.expiration ||
      x.expOk !== y.expOk ||
      x.priceOk !== y.priceOk ||
      x.reason !== y.reason ||
      x.mid !== y.mid
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Missing market on an otherwise valid expiration → not traded.
 * Includes chain-edge holes (sparse / end of listed strikes).
 */
export function isNotTradedReason(reason: string): boolean {
  return (
    reason === "no_contract" ||
    reason === "no_mid" ||
    reason === "chain_edge"
  );
}

/**
 * Package-level display when bind fails.
 * Prefer NOT TRADED when any leg has valid exp but no price (▲/▼ use case).
 */
export function bindPackageLabel(bind: {
  bindable: boolean;
  summary: string;
  legs: readonly { expOk: boolean; priceOk: boolean; reason: string }[];
}): string | null {
  if (bind.bindable) return null;
  const notTraded = bind.legs.filter(
    (l) => l.expOk && !l.priceOk && isNotTradedReason(l.reason),
  );
  if (notTraded.length > 0) return "NOT TRADED";
  if (bind.legs.some((l) => l.reason === "expired")) return "EXPIRED";
  return "UNBOUND";
}

/** Per-leg mid cell when that option cannot be bound for price. */
export function legNotTradedLabel(reason: string | undefined): string | null {
  if (!reason) return null;
  return isNotTradedReason(reason) ? "NOT TRADED" : null;
}

/** Apply bind failure onto the card (no package mark until all legs bind). */
export function applyBindAssessment(
  pos: AnalyzerPosition,
  bind: PositionBindResult,
): AnalyzerPosition {
  // No-op when bind state unchanged — prevents quote-loop re-renders / flashing
  if (bindSnapshotEqual(pos.bind, bind)) {
    if (bind.bindable) return pos;
    if (
      pos.liveState === "incomplete" &&
      pos.livePackagePerShare == null &&
      pos.lastNatSigned == null
    ) {
      return pos;
    }
  }

  if (bind.bindable) {
    // Keep existing mark fields; quote path will refresh. Only stamp bind.
    return {
      ...pos,
      bind,
      updatedAt: Date.now(),
    };
  }
  const expired = bind.legs.some((l) => l.reason === "expired");
  if (expired) {
    // Freeze the defined debit. Ghost residual must stay that position,
    // not an unfunded intrinsic after midnight.
    return {
      ...pos,
      bind,
      updatedAt: Date.now(),
    };
  }
  return {
    ...pos,
    bind,
    liveState: "incomplete",
    livePackagePerShare: null,
    lastNatSigned: null,
    priceSide: null,
    updatedAt: Date.now(),
  };
}
