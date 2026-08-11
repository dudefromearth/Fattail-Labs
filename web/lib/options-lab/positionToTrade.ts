/**
 * Convert Position Builder position → ParsedTosTrade for OPF Analyzer.
 */

import { generateTosScript } from "@/lib/options-lab/tosGenerator";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import type { PositionInput } from "@/lib/options-lab/positionTypes";
import { buildLabel, buildNotation } from "@/lib/options-lab/positionLabels";

export function positionNetPremium(pos: PositionInput): number {
  let total = 0;
  for (const leg of pos.legs) {
    const sign = leg.side === "long" ? -1 : 1;
    total += sign * leg.quantity * (leg.entry_price || 0);
  }
  // total: credit > 0, debit < 0 (MSC convention on entry_price * side)
  return total;
}

export function positionToParsedTrade(pos: PositionInput): ParsedTosTrade {
  const contracts = Math.max(1, pos.contracts || 1);
  const legs = pos.legs.map((l) => ({
    strike: l.strike,
    quantity:
      (l.side === "long" ? 1 : -1) * Math.abs(l.quantity) * contracts,
    right: l.type,
    expiration: (l.expiration || pos.expiration).slice(0, 10),
  }));

  const net = positionNetPremium(pos);
  const override = pos.net_debit_override;
  const costAbs =
    override != null && Number.isFinite(override)
      ? Math.abs(override)
      : Math.abs(net);
  // debit when we pay (net < 0) or buy direction with debit override
  const isCredit =
    override != null
      ? pos.direction === "sell" || net > 0
      : net > 0;
  const limit = costAbs > 0 ? costAbs : null;
  const debit = limit != null ? (isCredit ? -limit : limit) : null;

  const types = new Set(pos.legs.map((l) => l.type));
  const strikes = [...new Set(pos.legs.map((l) => l.strike))].sort(
    (a, b) => a - b,
  );
  let structure: ParsedTosTrade["structure"] = "custom";
  if (pos.legs.length === 1) structure = "single";
  else if (pos.legs.length === 2 && types.size === 1) {
    const sameStrike = pos.legs[0].strike === pos.legs[1].strike;
    structure = sameStrike ? "custom" : "vertical"; // calendar stays custom for parser
  } else if (pos.legs.length === 3 && types.size === 1) structure = "butterfly";

  const front = pos.expiration.slice(0, 10);
  const right = pos.legs[0]?.type ?? "call";
  const action = isCredit || pos.direction === "sell" ? "SELL" : "BUY";

  const tosLegs = legs.map((l) => ({
    strike: l.strike,
    expiration: l.expiration,
    right: l.right,
    quantity: l.quantity,
  }));
  const raw = generateTosScript({
    symbol: pos.underlying,
    legs: tosLegs,
    costBasis: limit,
  });

  let width: number | null = null;
  let body: number | null = null;
  if (structure === "butterfly" && strikes.length >= 3) {
    body = strikes[Math.floor(strikes.length / 2)];
    width = body - strikes[0];
  } else if (strikes.length >= 2) {
    width = strikes[strikes.length - 1] - strikes[0];
    body = strikes[Math.floor(strikes.length / 2)];
  } else {
    body = strikes[0] ?? null;
  }

  return {
    action,
    structure,
    symbol: pos.underlying.toUpperCase(),
    expiration: front,
    right,
    limit,
    debit,
    isCredit,
    strikes,
    width,
    body,
    legs,
    raw: raw || `${buildLabel(pos.underlying, pos.legs, front)} · ${buildNotation(pos.legs)}`,
  };
}
