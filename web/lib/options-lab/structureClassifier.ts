/**
 * Structure classifier — Spec v1.2 §4.4 / Hotel W0-4.
 * Signed pattern in strike order on the normalized ratio. Anything else is CUSTOM.
 */

import { normalizeStrike } from "@/lib/options-lab/listedStrikes";
import { posAndRatio } from "@/lib/options-lab/positionQty";
import type { LegInput } from "@/lib/options-lab/positionTypes";

export type CatalogName =
  | "Single"
  | "Vertical"
  | "Straddle"
  | "Strangle"
  | "Calendar"
  | "Diagonal"
  | "Butterfly"
  | "BWB"
  | "Condor"
  | "Iron Fly"
  | "Iron Condor"
  | "CUSTOM";

export type Classified = {
  name: CatalogName;
  pos: number;
  ratio: number[];
  signed: number[];
};

function expOf(leg: LegInput, front?: string): string {
  return String(leg.expiration || front || "").slice(0, 10);
}

function sortStrikeOrder(legs: readonly LegInput[], front?: string): LegInput[] {
  return [...legs].sort((a, b) => {
    const sa = normalizeStrike(a.strike);
    const sb = normalizeStrike(b.strike);
    if (sa !== sb) return sa - sb;
    const ea = expOf(a, front);
    const eb = expOf(b, front);
    if (ea !== eb) return ea < eb ? -1 : 1;
    if (a.type !== b.type) return a.type === "call" ? -1 : 1;
    return 0;
  });
}

function samePattern(got: number[], want: number[]): boolean {
  return got.length === want.length && got.every((v, i) => v === want[i]);
}

function eitherPattern(got: number[], longF: number[], shortF: number[]): boolean {
  return samePattern(got, longF) || samePattern(got, shortF);
}

function distinctExps(legs: readonly LegInput[], front?: string): number {
  return new Set(legs.map((l) => expOf(l, front)).filter(Boolean)).size || 1;
}

function rights(legs: readonly LegInput[]): "one" | "both" {
  return new Set(legs.map((l) => l.type)).size > 1 ? "both" : "one";
}

function uniqueStrikes(legs: readonly LegInput[]): number {
  return new Set(legs.map((l) => normalizeStrike(l.strike))).size;
}

/**
 * Wing equality: strike distance in points on the listed grid, with
 * normalizeStrike tolerance — not raw float, not percent.
 */
export function wingsEqual(
  low: number,
  body: number,
  high: number,
  listed?: readonly number[],
): boolean {
  const a = normalizeStrike(low);
  const b = normalizeStrike(body);
  const c = normalizeStrike(high);
  if (listed && listed.length >= 3) {
    const grid = [...listed].map(normalizeStrike).sort((x, y) => x - y);
    const i = (s: number) => grid.findIndex((g) => g === s);
    const il = i(a);
    const ib = i(b);
    const ih = i(c);
    if (il >= 0 && ib >= 0 && ih >= 0) {
      return ib - il === ih - ib;
    }
  }
  return normalizeStrike(b - a) === normalizeStrike(c - b);
}

export function classify(
  legs: readonly LegInput[],
  opts?: { front?: string; listed?: readonly number[] },
): Classified {
  const front = opts?.front;
  const { pos, ratio } = posAndRatio(legs);
  if (!legs.length) {
    return { name: "CUSTOM", pos, ratio, signed: [] };
  }
  const ordered = sortStrikeOrder(legs, front);
  const orderedAbs = posAndRatio(ordered);
  const signed = ordered.map((l, i) => {
    const mag = orderedAbs.ratio[i] || 0;
    return l.side === "long" ? mag : -mag;
  });
  const n = ordered.length;
  const dates = distinctExps(ordered, front);
  const r = rights(ordered);
  const strikes = uniqueStrikes(ordered);

  let name: CatalogName = "CUSTOM";

  if (n === 1 && dates === 1 && r === "one" && eitherPattern(signed, [1], [-1])) {
    name = "Single";
  } else if (
    n === 2 &&
    dates === 1 &&
    r === "one" &&
    eitherPattern(signed, [1, -1], [-1, 1]) &&
    strikes === 2
  ) {
    name = "Vertical";
  } else if (
    n === 2 &&
    dates === 1 &&
    r === "both" &&
    eitherPattern(signed, [1, 1], [-1, -1]) &&
    strikes === 1
  ) {
    name = "Straddle";
  } else if (
    n === 2 &&
    dates === 1 &&
    r === "both" &&
    eitherPattern(signed, [1, 1], [-1, -1]) &&
    strikes === 2
  ) {
    name = "Strangle";
  } else if (
    n === 2 &&
    dates === 2 &&
    r === "one" &&
    eitherPattern(signed, [1, -1], [-1, 1]) &&
    strikes === 1
  ) {
    name = "Calendar";
  } else if (
    n === 2 &&
    dates === 2 &&
    r === "one" &&
    eitherPattern(signed, [1, -1], [-1, 1]) &&
    strikes === 2
  ) {
    name = "Diagonal";
  } else if (
    n === 3 &&
    dates === 1 &&
    r === "one" &&
    eitherPattern(signed, [1, -2, 1], [-1, 2, -1])
  ) {
    const s = ordered.map((l) => normalizeStrike(l.strike));
    name = wingsEqual(s[0], s[1], s[2], opts?.listed) ? "Butterfly" : "BWB";
  } else if (
    n === 4 &&
    dates === 1 &&
    r === "one" &&
    eitherPattern(signed, [1, -1, -1, 1], [-1, 1, 1, -1])
  ) {
    name = "Condor";
  } else if (
    n === 4 &&
    dates === 1 &&
    r === "both" &&
    eitherPattern(signed, [1, -1, -1, 1], [-1, 1, 1, -1])
  ) {
    name = strikes === 3 ? "Iron Fly" : strikes >= 4 ? "Iron Condor" : "CUSTOM";
  }

  return { name, pos, ratio, signed };
}

export function catalogName(legs: readonly LegInput[], front?: string): CatalogName {
  return classify(legs, { front }).name;
}
