/**
 * Labs design-studio strike-drag geometry (long / debit only).
 *
 * Classic long butterfly: +1 / −2 / +1 all calls or all puts.
 *   - Body = middle short (−2); wing = outer longs (+1)
 *   - Body drag or Shift → slide entire structure
 *   - Wing drag → symmetric wing resize (body fixed)
 *
 * Long condor / debit vertical: body/inners long, outer wings short.
 */
import type { PositionLeg } from "../ms-transplant/types/riskGraph";

const EPS = 1e-6;

function nearly(a: number, b: number): boolean {
  return Math.abs(a - b) < EPS;
}

function roundStrike(k: number, inc = 1): number {
  if (!(inc > 0)) return Math.round(k * 100) / 100;
  return Math.round(k / inc) * inc;
}

function inferIncrement(legs: PositionLeg[]): number {
  const ks = [...new Set(legs.map((l) => l.strike))].sort((a, b) => a - b);
  if (ks.length < 2) return 1;
  const gaps: number[] = [];
  for (let i = 1; i < ks.length; i++) {
    const g = Math.round((ks[i] - ks[i - 1]) * 100) / 100;
    if (g > EPS) gaps.push(g);
  }
  if (!gaps.length) return 1;
  let g = Math.round(gaps[0]);
  for (const x of gaps) {
    let a = g;
    let b = Math.round(x);
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    g = a;
  }
  if (!(g > 0)) return 1;
  if (g > 5) return g % 5 === 0 ? 5 : 1;
  return g;
}

/** Classic +1/−2/+1 butterfly (same right, 3 strikes). */
function isClassicButterfly(legs: PositionLeg[]): boolean {
  if (legs.length < 3) return false;
  const byK = new Map<number, number>();
  for (const l of legs) {
    byK.set(l.strike, (byK.get(l.strike) || 0) + l.quantity);
  }
  if (byK.size !== 3) return false;
  const qtys = [...byK.values()].sort((a, b) => a - b);
  // Expect −2n, +n, +n
  const mid = qtys[0];
  if (!(mid < 0)) return false;
  const wings = qtys.slice(1);
  return wings.length === 2 && wings[0] === wings[1] && wings[0] === -mid / 2;
}

function bodyFromLegs(legs: PositionLeg[], fallback: number): number {
  if (isClassicButterfly(legs)) {
    // Middle short strike
    const shorts = legs.filter((l) => l.quantity < 0);
    if (shorts.length) {
      return shorts.reduce((a, l) => a + l.strike, 0) / shorts.length;
    }
  }
  // Long condor / vertical: average of longs (body/inners)
  const longs = legs.filter((l) => l.quantity > 0);
  if (!longs.length) return fallback;
  const k0 = longs[0].strike;
  if (longs.every((l) => nearly(l.strike, k0))) return k0;
  return longs.reduce((a, l) => a + l.strike, 0) / longs.length;
}

/**
 * Butterfly: short middle = body, long outers = wing.
 * Condor/vertical: long body/inner = body, short outer = wing.
 */
export function classifyLabsGrab(
  legs: PositionLeg[],
  grabbedStrike: number,
): "body" | "wing" {
  const at = legs.filter((l) => nearly(l.strike, grabbedStrike));
  if (!at.length) return "body";
  const hasShort = at.some((l) => l.quantity < 0);
  const hasLong = at.some((l) => l.quantity > 0);
  if (isClassicButterfly(legs)) {
    if (hasShort && !hasLong) return "body";
    if (hasLong && !hasShort) return "wing";
    return "body";
  }
  // Long condor / debit vertical
  if (hasLong && !hasShort) return "body";
  if (hasShort && !hasLong) return "wing";
  return "body";
}

export function applyLabsStrikeDrag(args: {
  legs: PositionLeg[];
  bodyStrike: number;
  width: number;
  grabbedStrike: number;
  offset: number;
  shiftAll: boolean;
  positionType?: string | null;
}): { legs: PositionLeg[]; strike: number; width: number } {
  const { legs, grabbedStrike, offset, shiftAll } = args;
  if (!legs.length || !offset) {
    return {
      legs,
      strike: args.bodyStrike,
      width: Math.max(1, Number(args.width) || 5),
    };
  }

  const inc = inferIncrement(legs);
  const role = shiftAll ? "body" : classifyLabsGrab(legs, grabbedStrike);
  const isFly =
    args.positionType === "butterfly" ||
    args.positionType === "long_butterfly" ||
    args.positionType === "iron_fly" ||
    isClassicButterfly(legs);

  // ── Whole-structure slide ───────────────────────────────────────────────
  if (shiftAll || role === "body") {
    const next = legs.map((l) => ({
      ...l,
      strike: roundStrike(l.strike + offset, inc),
    }));
    const body = bodyFromLegs(next, args.bodyStrike + offset);
    const wingLegs = isFly
      ? next.filter((l) => l.quantity > 0)
      : next.filter((l) => l.quantity < 0);
    const width = Math.max(
      inc,
      ...wingLegs.map((l) => Math.abs(l.strike - body)),
      1,
    );
    return {
      legs: next,
      strike: roundStrike(body, inc),
      width: roundStrike(width, inc) || inc,
    };
  }

  // ── Wing resize ─────────────────────────────────────────────────────────
  const body = bodyFromLegs(legs, args.bodyStrike);
  const newWingStrike = grabbedStrike + offset;
  let wing = Math.abs(newWingStrike - body);
  wing = Math.max(inc, roundStrike(wing, inc));

  if (isFly) {
    // Symmetric +1/−2/+1: body short fixed, wing longs move
    const next = legs.map((l) => {
      if (l.quantity < 0) {
        return { ...l, strike: roundStrike(body, inc) };
      }
      // Outer longs: put side below body, call side above (or both same right)
      if (l.strike <= body + EPS || nearly(l.strike, grabbedStrike) && grabbedStrike < body) {
        // lower wing
        if (nearly(l.strike, grabbedStrike) || l.strike < body - EPS) {
          return { ...l, strike: roundStrike(body - wing, inc) };
        }
      }
      if (l.strike >= body - EPS) {
        return { ...l, strike: roundStrike(body + wing, inc) };
      }
      return { ...l, strike: roundStrike(body - wing, inc) };
    });
    // Cleaner: sort longs into low/high by current position
    const shorts = next.filter((l) => l.quantity < 0).map((l) => ({
      ...l,
      strike: roundStrike(body, inc),
    }));
    const longs = legs
      .filter((l) => l.quantity > 0)
      .sort((a, b) => a.strike - b.strike);
    const rebuilt: PositionLeg[] = [
      ...shorts,
      ...longs.map((l, i) => ({
        ...l,
        strike: roundStrike(i === 0 ? body - wing : body + wing, inc),
      })),
    ];
    return {
      legs: rebuilt,
      strike: roundStrike(body, inc),
      width: wing,
    };
  }

  // Vertical / condor: move shorts (wings) at grabbed strike
  const next = legs.map((l) =>
    nearly(l.strike, grabbedStrike)
      ? { ...l, strike: roundStrike(l.strike + offset, inc) }
      : l,
  );
  const clamped = next.map((l) => {
    if (l.quantity >= 0) return l;
    if (l.right === "put" && l.strike >= body - EPS) {
      return { ...l, strike: roundStrike(body - wing, inc) };
    }
    if (l.right === "call" && l.strike <= body + EPS) {
      return { ...l, strike: roundStrike(body + wing, inc) };
    }
    return l;
  });
  const width = Math.max(
    inc,
    ...clamped
      .filter((l) => l.quantity < 0)
      .map((l) => Math.abs(l.strike - body)),
    1,
  );
  return {
    legs: clamped,
    strike: roundStrike(body, inc),
    width: roundStrike(width, inc) || inc,
  };
}
