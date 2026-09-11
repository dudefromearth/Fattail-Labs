/**
 * POS / ratio / actual-contract counts (PC-QTY-1…6).
 */

export function gcd2(a: number, b: number): number {
  let x = Math.abs(Math.round(a));
  let y = Math.abs(Math.round(b));
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

export function gcdAll(ns: readonly number[]): number {
  const qs = ns.map((n) => Math.max(0, Math.abs(Math.round(n))));
  if (!qs.length) return 1;
  return qs.reduce((g, q) => gcd2(g, q), qs[0] || 1) || 1;
}

export type PosRatio = {
  /** GCD of absolute leg contract counts (PC-QTY-2). */
  pos: number;
  /** Normalized absolute ratio, same order as input legs. */
  ratio: number[];
};

export function posAndRatio(
  legs: readonly { quantity: number }[],
): PosRatio {
  const abs = legs.map((l) => Math.max(0, Math.abs(Math.round(l.quantity))));
  const pos = gcdAll(abs);
  return {
    pos,
    ratio: abs.map((q) => (pos ? Math.round(q / pos) : 0)),
  };
}

/** Signed actual contracts for display (PC-QTY-1). */
export function signedActualQty(leg: {
  quantity: number;
  side: "long" | "short";
}): string {
  const n = Math.round(Math.abs(leg.quantity));
  return (leg.side === "long" ? "+" : "−") + String(n);
}

/**
 * Old books stored ratio on legs and lots in `contracts`.
 * Idempotent: packs === 1 leaves quantities alone.
 */
export function migrateLegContracts<T extends {
  contracts?: number;
  legs: Array<{ quantity: number } & Record<string, unknown>>;
}>(position: T): T {
  const packs = Math.max(1, Math.floor(Number(position.contracts) || 1));
  if (packs === 1) {
    return { ...position, contracts: 1 };
  }
  return {
    ...position,
    contracts: 1,
    legs: position.legs.map((l) => ({
      ...l,
      quantity: Math.round(Math.abs(Number(l.quantity)) || 0) * packs,
    })),
  };
}

/** POS stepper: write `ratio × newPos` on every leg. Lock is the caller's. */
export function scaleLegPos<T extends { quantity: number }>(
  legs: readonly T[],
  newPos: number,
): T[] {
  const n = Math.max(1, Math.round(newPos));
  const { ratio } = posAndRatio(legs);
  return legs.map((l, i) => ({
    ...l,
    quantity: (ratio[i] || 0) * n,
  }));
}
