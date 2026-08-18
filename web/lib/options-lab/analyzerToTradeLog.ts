/**
 * Analyzer book → Trade Log open fill (simulation).
 * Options Lab and Trade Log do not care whether a broker filled.
 */

import type { AnalyzerPosition } from "./analyzerBook";
import { definedDebitSigned } from "./analyzerBook";
import { detectFamily } from "./positionLabels";
import { packageUnitScale, unitLegQuantity } from "./packageEconomics";

export type TradeLogOpenDraft = {
  strategy: string;
  asset_class: "equity_option";
  order_type: "LMT";
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

export function analyzerPositionToOpenTrade(
  pos: AnalyzerPosition,
  now = new Date(),
): TradeLogOpenDraft {
  const und = (pos.position.underlying || "").toUpperCase();
  const packs = Math.max(1, Math.floor(Number(pos.position.contracts) || 1));
  const scale = packageUnitScale(pos.position.legs);
  const debit = definedDebitSigned(pos);
  const net_side =
    debit == null ? null : debit >= 0 ? "DEBIT" : "CREDIT";
  const net_price = debit == null ? null : Math.abs(debit);
  const legs = (pos.position.legs || []).map((leg) => {
    const unit = unitLegQuantity(leg.quantity, scale);
    const fill = Number(leg.entry_price);
    return {
      side: (leg.side === "short" ? "SELL" : "BUY") as "BUY" | "SELL",
      quantity: Math.max(1, Math.round(unit * packs)),
      pos_effect: "TO_OPEN" as const,
      asset_class: "equity_option" as const,
      underlier: und,
      expiry: String(leg.expiration || pos.position.expiration || "").slice(0, 10),
      strike: Number(leg.strike),
      right: (leg.type === "put" ? "PUT" : "CALL") as "CALL" | "PUT",
      fill_price: Number.isFinite(fill) ? fill : 0,
    };
  });
  return {
    strategy: strategyCodeFromPosition(pos),
    asset_class: "equity_option",
    order_type: "LMT",
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
