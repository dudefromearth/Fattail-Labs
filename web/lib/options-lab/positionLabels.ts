/**
 * Position label + notation — Labs port for Position Builder live preview.
 */

import type { LegInput } from "@/lib/options-lab/positionTypes";

export function buildLabel(
  underlying: string,
  legs: LegInput[],
  expiration: string,
): string {
  const family = detectFamily(legs);
  const direction = detectDirection(legs);
  const optType = detectOptionType(legs);

  const parts = [underlying.toUpperCase()];
  if (direction) parts.push(direction);
  if (optType) parts.push(optType);
  parts.push(family);

  const expirations = new Set(
    legs.map((l) => l.expiration).filter(Boolean) as string[],
  );
  if (expirations.size >= 2) {
    const sorted = [...expirations].sort();
    parts.push(`${daysUntil(sorted[0])}d/${daysUntil(sorted[1])}d`);
  } else {
    parts.push(`${daysUntil(expiration)}d`);
  }

  return parts.join(" ");
}

export function buildNotation(legs: LegInput[]): string {
  return legs
    .map((leg) => {
      const sign = leg.side === "long" ? "+" : "-";
      const typeChar = leg.type === "call" ? "C" : "P";
      return `${sign}${leg.quantity} ${leg.strike}${typeChar}`;
    })
    .join(" / ");
}

function daysUntil(expiration: string): number {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const exp = expiration.slice(0, 10);
  if (today > exp) return 0;
  const a = Date.parse(`${today}T00:00:00Z`);
  const b = Date.parse(`${exp}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/** Spread family label for ToS-style book rows (e.g. Butterfly, Vertical). */
export function detectFamily(legs: LegInput[]): string {
  if (legs.length === 1) return "Single";
  if (legs.length === 2) {
    const sameStrike = legs[0].strike === legs[1].strike;
    const types = new Set(legs.map((l) => l.type));
    const sides = new Set(legs.map((l) => l.side));
    if (types.size === 2 && sameStrike) return "Straddle";
    if (types.size === 2 && !sameStrike) return "Strangle";
    if (types.size === 1 && sides.size === 2 && sameStrike) return "Calendar";
    if (types.size === 1 && sides.size === 2 && !sameStrike) {
      if (legs.some((l) => l.expiration)) return "Diagonal";
    }
    if (types.size === 1) return "Vertical";
    return "Spread";
  }
  if (legs.length === 3) {
    const types = new Set(legs.map((l) => l.type));
    if (types.size === 1) {
      const sorted = [...legs].sort((a, b) => a.strike - b.strike);
      const gap1 = sorted[1].strike - sorted[0].strike;
      const gap2 = sorted[2].strike - sorted[1].strike;
      if (Math.abs(gap1 - gap2) < 0.01) return "Butterfly";
      return "BWB";
    }
    return "Custom";
  }
  if (legs.length === 4) {
    const types = new Set(legs.map((l) => l.type));
    if (types.size === 2) {
      const shorts = legs.filter((l) => l.side === "short");
      if (shorts.length === 2 && shorts[0].strike === shorts[1].strike)
        return "Iron Fly";
      return "Iron Condor";
    }
    if (types.size === 1) return "Condor";
    return "Custom";
  }
  return "Custom";
}

function detectDirection(legs: LegInput[]): string {
  let netCost = 0;
  for (const leg of legs) {
    const sign = leg.side === "long" ? -1 : 1;
    netCost += sign * leg.quantity * leg.entry_price;
  }
  if (netCost > 0) return "Short";
  if (netCost < 0) return "Long";
  return legs[0]?.side === "long" ? "Long" : "Short";
}

function detectOptionType(legs: LegInput[]): string {
  const types = new Set(legs.map((l) => l.type));
  if (types.size === 1) return legs[0].type === "call" ? "Call" : "Put";
  return "";
}
