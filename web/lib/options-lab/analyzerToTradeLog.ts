/**
 * Analyzer book → Trade Log open fill (simulation).
 * Mapper rewrite (PC9b / PC-LIFE-10): order_type from lockSource;
 * no fill from stored entry_price; actual leg quantities, not contracts × ratio.
 */

import type { AnalyzerPosition, CardLockState } from "./analyzerBook";
import { tosScriptPrice } from "./tosGenerator";
import { detectFamily } from "./positionLabels";

export type TradeLogOrderType = "LMT" | "MKT";

export type TradeLogOpenDraft = {
  strategy: string;
  asset_class: "equity_option";
  order_type: TradeLogOrderType;
  /** Survives promotion (AT-PC-07). Not a Trade Log column — mapper output. */
  lock_source: "natural_mid" | "user_limit" | "tos_limit" | "unlocked";
  net_side: "DEBIT" | "CREDIT" | null;
  net_price: number | null;
  entry_source: "manual";
  exec_at: string;
  setup_md: string;
  legs: Array<{
    side: "BUY" | "SELL";
    quantity: number;
    pos_effect: "TO_OPEN";
    asset_class: "equity_option";
    underlier: string;
    expiry: string;
    strike: number;
    right: "CALL" | "PUT";
    fill_price: number;
  }>;
};

const FAMILY_TO_STRATEGY: Record<string, string> = {
  Single: "SINGLE",
  Vertical: "VERTICAL",
  Butterfly: "BUTTERFLY",
  BWB: "BROKEN_WING_FLY",
  "Broken Wing": "BROKEN_WING_FLY",
  Condor: "CONDOR",
  Straddle: "STRADDLE",
  Strangle: "STRANGLE",
  "Iron Fly": "IRON_FLY",
  "Iron Condor": "IRON_CONDOR",
  Calendar: "CALENDAR",
  Diagonal: "DIAGONAL",
};

export function strategyCodeFromPosition(pos: AnalyzerPosition): string {
  const family = detectFamily(pos.position.legs || []);
  return FAMILY_TO_STRATEGY[family] || "CUSTOM";
}

/** PC-TOS-5: a member limit records a limit; a natural mid records none. */
export function orderTypeFromLock(lock: CardLockState): TradeLogOrderType {
  if (
    lock.mode === "locked" &&
    (lock.lockSource === "user_limit" || lock.lockSource === "tos_limit")
  ) {
    return "LMT";
  }
  return "MKT";
}

export function lockSourceFromPosition(
  pos: AnalyzerPosition,
): TradeLogOpenDraft["lock_source"] {
  if (pos.lock.mode === "locked") return pos.lock.lockSource;
  return "unlocked";
}

/**
 * Both gates, AND-ed (PC-TM-1 · 2). Residual does not block (PC-LIFE-9).
 */
export function canPromoteToTradeLog(
  pos: AnalyzerPosition,
  tmActive: boolean,
): boolean {
  return !tmActive && pos.rehearsal !== true;
}

export function analyzerPositionToOpenTrade(
  pos: AnalyzerPosition,
  now = new Date(),
): TradeLogOpenDraft {
  const und = (pos.position.underlying || "").toUpperCase();
  const signed = tosScriptPrice(pos);
  const net_side =
    !Number.isFinite(signed) || signed === 0
      ? null
      : signed > 0
        ? "DEBIT"
        : "CREDIT";
  const net_price = Number.isFinite(signed) ? Math.abs(signed) : null;
  const legs = (pos.position.legs || []).map((leg) => ({
    side: (leg.side === "short" ? "SELL" : "BUY") as "BUY" | "SELL",
    quantity: Math.max(1, Math.round(Math.abs(leg.quantity))),
    pos_effect: "TO_OPEN" as const,
    asset_class: "equity_option" as const,
    underlier: und,
    expiry: String(leg.expiration || pos.position.expiration || "").slice(0, 10),
    strike: Number(leg.strike),
    right: (leg.type === "put" ? "PUT" : "CALL") as "CALL" | "PUT",
    fill_price: 0,
  }));
  return {
    strategy: strategyCodeFromPosition(pos),
    asset_class: "equity_option",
    order_type: orderTypeFromLock(pos.lock),
    lock_source: lockSourceFromPosition(pos),
    net_side,
    net_price,
    entry_source: "manual",
    exec_at: now.toISOString(),
    setup_md:
      `Sent from Options Lab Analyzer as an open trade (simulation). ` +
      `${pos.label || ""} ${pos.notation || ""}`.trim(),
    legs,
  };
}
