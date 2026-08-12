/**
 * Strategy template leg generators — Labs port of MSC Risk Graph templates.
 * Pure functions; no MSC imports.
 */

import type { LegInput, OptionRight } from "@/lib/options-lab/positionTypes";

export function butterflyLegs(
  center: number,
  width: number,
  type: OptionRight = "call",
): LegInput[] {
  return [
    { strike: center - width, type, quantity: 1, side: "long", entry_price: 0 },
    { strike: center, type, quantity: 2, side: "short", entry_price: 0 },
    { strike: center + width, type, quantity: 1, side: "long", entry_price: 0 },
  ];
}

export function verticalLegs(
  low: number,
  high: number,
  type: OptionRight = "call",
  direction: "debit" | "credit" = "debit",
): LegInput[] {
  if (direction === "debit") {
    return [
      { strike: low, type, quantity: 1, side: "long", entry_price: 0 },
      { strike: high, type, quantity: 1, side: "short", entry_price: 0 },
    ];
  }
  return [
    { strike: low, type, quantity: 1, side: "short", entry_price: 0 },
    { strike: high, type, quantity: 1, side: "long", entry_price: 0 },
  ];
}

/**
 * Long iron condor (debit-native): buy inners, sell wings.
 * Call legs first (ToS). flipLegs → short iron condor (credit tent).
 */
export function ironCondorLegs(
  putLow: number,
  putHigh: number,
  callLow: number,
  callHigh: number,
): LegInput[] {
  return [
    { strike: callLow, type: "call", quantity: 1, side: "long", entry_price: 0 },
    { strike: callHigh, type: "call", quantity: 1, side: "short", entry_price: 0 },
    { strike: putHigh, type: "put", quantity: 1, side: "long", entry_price: 0 },
    { strike: putLow, type: "put", quantity: 1, side: "short", entry_price: 0 },
  ];
}

export function straddleLegs(strike: number): LegInput[] {
  return [
    { strike, type: "call", quantity: 1, side: "long", entry_price: 0 },
    { strike, type: "put", quantity: 1, side: "long", entry_price: 0 },
  ];
}

export function singleLeg(
  strike: number,
  type: OptionRight = "call",
  side: "long" | "short" = "long",
): LegInput[] {
  return [{ strike, type, quantity: 1, side, entry_price: 0 }];
}

export function bwbLegs(
  center: number,
  width: number,
  type: OptionRight = "call",
): LegInput[] {
  return [
    { strike: center - width, type, quantity: 1, side: "long", entry_price: 0 },
    { strike: center, type, quantity: 2, side: "short", entry_price: 0 },
    { strike: center + width * 2, type, quantity: 1, side: "long", entry_price: 0 },
  ];
}

export function condorLegs(
  center: number,
  width: number,
  type: OptionRight = "call",
): LegInput[] {
  return [
    { strike: center - width * 2, type, quantity: 1, side: "long", entry_price: 0 },
    { strike: center - width, type, quantity: 1, side: "short", entry_price: 0 },
    { strike: center + width, type, quantity: 1, side: "short", entry_price: 0 },
    { strike: center + width * 2, type, quantity: 1, side: "long", entry_price: 0 },
  ];
}

export function strangleLegs(center: number, width: number): LegInput[] {
  return [
    { strike: center - width, type: "put", quantity: 1, side: "long", entry_price: 0 },
    { strike: center + width, type: "call", quantity: 1, side: "long", entry_price: 0 },
  ];
}

/**
 * Long iron fly (debit-native): buy body, sell wings.
 * Call legs first (ToS). flipLegs → short iron fly (credit tent).
 */
export function ironFlyLegs(center: number, width: number): LegInput[] {
  return [
    { strike: center, type: "call", quantity: 1, side: "long", entry_price: 0 },
    { strike: center + width, type: "call", quantity: 1, side: "short", entry_price: 0 },
    { strike: center, type: "put", quantity: 1, side: "long", entry_price: 0 },
    { strike: center - width, type: "put", quantity: 1, side: "short", entry_price: 0 },
  ];
}

export function calendarLegs(
  strike: number,
  type: OptionRight = "call",
): LegInput[] {
  return [
    { strike, type, quantity: 1, side: "short", entry_price: 0 },
    { strike, type, quantity: 1, side: "long", entry_price: 0 },
  ];
}

export function diagonalLegs(
  center: number,
  width: number,
  type: OptionRight = "call",
): LegInput[] {
  return [
    { strike: center, type, quantity: 1, side: "short", entry_price: 0 },
    { strike: center + width, type, quantity: 1, side: "long", entry_price: 0 },
  ];
}

export function diagonalWidthFromLadder(
  center: number,
  ladder: readonly number[],
  strikesBetween = 2,
): number | null {
  if (ladder.length < 2 || strikesBetween < 0) return null;
  let idx = 0;
  let best = Infinity;
  for (let i = 0; i < ladder.length; i++) {
    const d = Math.abs(ladder[i] - center);
    if (d < best) {
      best = d;
      idx = i;
    }
  }
  const steps = strikesBetween + 1;
  let j = idx + steps;
  if (j >= ladder.length) j = idx - steps;
  if (j < 0 || j >= ladder.length) {
    j = idx < ladder.length - 1 ? idx + 1 : idx - 1;
  }
  if (j < 0 || j >= ladder.length || j === idx) return null;
  return Math.abs(ladder[j] - ladder[idx]);
}

export function flipLegs(legs: LegInput[]): LegInput[] {
  return legs.map((leg) => ({
    ...leg,
    side: leg.side === "long" ? ("short" as const) : ("long" as const),
  }));
}

/** @deprecated Prefer snapToListed from listedStrikes (null when empty). */
export function snapToNearestStrike(target: number, strikes: number[]): number {
  if (!strikes.length) return target;
  let best = strikes[0];
  let bestD = Math.abs(best - target);
  for (const s of strikes) {
    const d = Math.abs(s - target);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}
