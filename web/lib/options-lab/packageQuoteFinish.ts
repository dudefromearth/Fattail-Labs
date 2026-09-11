/**
 * Quote-merge leaf (PC-REC-4). Payload onto `cur`. Structure identity guard.
 * Session fields on `cur` always win. Drop if structure moved in flight.
 * Volatility is a mark — written from the chain, never a structure field.
 */

import type { AnalyzerPosition } from "@/lib/options-lab/analyzerBook";
import { applyPackageQuote } from "@/lib/options-lab/analyzerBook";
import { structureKey } from "@/lib/options-lab/structureSignal";
import type { LegInput, OptionRight } from "@/lib/options-lab/positionTypes";

export type PackageQuotePayload = {
  complete?: boolean;
  package_debit_per_share?: number | null;
  max_skew_ms?: number | null;
  epoch_quality?: string | null;
  generations_used?: Record<string, { content_hash?: string; as_of?: string }>;
  as_of?: string | null;
  error?: string | null;
  skew_fail?: boolean;
  mark_mode?: string | null;
  mark_disclaimer?: string | null;
  basis_source?: string | null;
};

export type QuoteContractLookup = (
  expiration: string,
  strike: number,
  type: OptionRight,
) => { iv?: number | null } | undefined;

/** Stamp chain IV onto legs. Strikes / expiry / qty / side / right stay put. */
export function applyLegVolatilityFromChain(
  legs: readonly LegInput[],
  getContract: QuoteContractLookup,
  packageExpiration: string,
): LegInput[] {
  let changed = false;
  const next = legs.map((leg) => {
    const exp = (leg.expiration || packageExpiration).slice(0, 10);
    const iv = getContract(exp, leg.strike, leg.type)?.iv;
    if (iv == null || !Number.isFinite(iv) || iv <= 0) return leg;
    if (leg.volatility === iv) return leg;
    changed = true;
    return { ...leg, volatility: iv };
  });
  return changed ? next : (legs as LegInput[]);
}

export function finishPackageQuote(
  cur: AnalyzerPosition,
  quote: PackageQuotePayload,
  opts?: {
    sessionHeld?: boolean;
    interestOk?: boolean;
    /** When the resolve started. Mismatch → drop (AT-PC-03). */
    expectedStructureKey?: string;
    getContract?: QuoteContractLookup;
  },
): AnalyzerPosition {
  if (
    opts?.expectedStructureKey != null &&
    structureKey(cur) !== opts.expectedStructureKey
  ) {
    return cur;
  }
  const next = applyPackageQuote(cur, quote, {
    sessionHeld: opts?.sessionHeld,
    interestOk: opts?.interestOk,
  });
  let position = cur.position;
  if (opts?.getContract) {
    const legs = applyLegVolatilityFromChain(
      cur.position.legs,
      opts.getContract,
      cur.position.expiration,
    );
    if (legs !== cur.position.legs) {
      position = { ...cur.position, legs };
    }
  }
  if (next === cur && position === cur.position) return cur;
  return {
    ...next,
    id: cur.id,
    position,
    lock: cur.lock,
    visible: cur.visible,
    rehearsal: cur.rehearsal,
    createdAt: cur.createdAt,
    entryAt: cur.entryAt,
    closedAt: cur.closedAt,
    closedPnl: cur.closedPnl,
    tradeLogTradeId: cur.tradeLogTradeId,
    label: cur.label,
    notation: cur.notation,
    updatedAt: position !== cur.position ? Date.now() : next.updatedAt,
  };
}
