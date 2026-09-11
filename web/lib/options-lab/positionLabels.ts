/**
 * Position label + notation — Labs port for Position Builder live preview.
 */

import type { LegInput } from "@/lib/options-lab/positionTypes";
import { catalogName } from "@/lib/options-lab/structureClassifier";

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

/** Spread family label — computed from legs, never stored (PC-STRAT-7). */
export function detectFamily(legs: LegInput[]): string {
  return catalogName(legs);
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
