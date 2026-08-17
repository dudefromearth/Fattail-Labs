/**
 * Convert Position Builder position ↔ ParsedTosTrade for OPF Analyzer.
 * Book cards are the definition SoR — ToS paste is handoff only (→ card).
 */

import { generateTosScript } from "@/lib/options-lab/tosGenerator";
import type { ParsedTosTrade } from "@/lib/options-lab/tosParser";
import type { PositionInput } from "@/lib/options-lab/positionTypes";
import { buildLabel, buildNotation } from "@/lib/options-lab/positionLabels";
import {
  packageUnitScale,
  unitLegQuantity,
} from "@/lib/options-lab/packageEconomics";

export function positionNetPremium(pos: PositionInput): number {
  const scale = packageUnitScale(pos.legs);
  let total = 0;
  for (const leg of pos.legs) {
    const sign = leg.side === "long" ? -1 : 1;
    const unitQ = unitLegQuantity(leg.quantity, scale);
    total += sign * unitQ * (leg.entry_price || 0);
  }
  // Per-position: credit > 0, debit < 0 (MSC convention on entry_price * side)
  return total;
}

/** One lot of the structure — for card package quote (debit stays per position). */
export function positionToUnitInput(pos: PositionInput): PositionInput {
  const scale = packageUnitScale(pos.legs);
  return {
    ...pos,
    contracts: 1,
    legs: pos.legs.map((l) => ({
      ...l,
      quantity: unitLegQuantity(l.quantity, scale),
    })),
  };
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

/** Heatmap / handoff → book card definition (no paste viewport path). */
export function parsedTradeToPositionInput(t: ParsedTosTrade): PositionInput {
  const contracts = 1;
  const legs = t.legs.map((l) => {
    const qty = Math.abs(l.quantity) || 1;
    return {
      strike: l.strike,
      type: l.right,
      quantity: qty,
      side: (l.quantity >= 0 ? "long" : "short") as "long" | "short",
      entry_price: 0,
      expiration: l.expiration.slice(0, 10),
    };
  });
  // Normalize package qty: legs often carry package scale (e.g. +10/-20/+10)
  const g = legs.reduce((a, l) => Math.min(a, l.quantity), Infinity);
  const unit = Number.isFinite(g) && g > 0 ? g : 1;
  const scaled =
    unit > 1
      ? legs.map((l) => ({
          ...l,
          quantity: Math.max(1, Math.round(l.quantity / unit)),
        }))
      : legs;

  return {
    underlying: t.symbol,
    expiration: t.expiration.slice(0, 10),
    contracts: unit > 1 ? unit : contracts,
    legs: scaled,
    direction: t.action === "SELL" ? "sell" : "buy",
    net_debit_override:
      t.limit != null && Number.isFinite(t.limit) ? Math.abs(t.limit) : null,
  };
}

function legKey(l: { expiration: string; right: string; strike: number }): string {
  return `${l.expiration.slice(0, 10)}|${l.right}|${l.strike}`;
}

/**
 * Merge independently shown trades into one book definition.
 * Same contract (exp + right + strike) sums quantity; zeros drop.
 * One trade is returned unchanged (identity).
 */
export function combineParsedTrades(
  trades: ParsedTosTrade[],
): ParsedTosTrade | null {
  const live = trades.filter((t) => t.legs.length > 0);
  if (live.length === 0) return null;
  if (live.length === 1) return live[0];

  const symbol = live[0].symbol.toUpperCase();
  const same = live.filter((t) => t.symbol.toUpperCase() === symbol);
  const qty = new Map<string, ParsedTosTrade["legs"][number]>();
  for (const t of same) {
    for (const l of t.legs) {
      const k = legKey(l);
      const prev = qty.get(k);
      if (prev) {
        qty.set(k, { ...prev, quantity: prev.quantity + l.quantity });
      } else {
        qty.set(k, { ...l, expiration: l.expiration.slice(0, 10) });
      }
    }
  }
  const legs = [...qty.values()].filter((l) => l.quantity !== 0);
  if (legs.length === 0) return null;

  const strikes = [...new Set(legs.map((l) => l.strike))].sort((a, b) => a - b);
  const exps = [...new Set(legs.map((l) => l.expiration))].sort();
  const types = new Set(legs.map((l) => l.right));
  const raw = generateTosScript({ symbol, legs });
  const netQty = legs.reduce((s, l) => s + l.quantity, 0);
  const action: ParsedTosTrade["action"] = netQty >= 0 ? "BUY" : "SELL";

  return {
    action,
    structure: "custom",
    symbol,
    expiration: exps[0] ?? "",
    right: types.size === 1 ? (legs[0].right as ParsedTosTrade["right"]) : "call",
    limit: null,
    debit: null,
    isCredit: action === "SELL",
    strikes,
    width:
      strikes.length >= 2 ? strikes[strikes.length - 1] - strikes[0] : null,
    body: strikes[Math.floor(strikes.length / 2)] ?? null,
    legs,
    raw: raw || same.map((t) => t.raw).join("\n"),
  };
}
