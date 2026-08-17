/**
 * Per-position debit; total = Qty × debit.
 *
 *   npx --yes tsx lib/options-lab/packageEconomics.test.ts
 */

import {
  packageEconomics,
  packageUnitScale,
  positionQty,
  tradeTotalDebit,
} from "./packageEconomics";
import { expirationPnLDollars } from "./riskPayoff";
import type { PositionInput } from "./positionTypes";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

function quote(mids: Record<string, number>) {
  return (_e: string, strike: number, type: "call" | "put") => {
    const mid = mids[`${type}:${strike}`];
    if (mid == null) return undefined;
    return { mid, bid: mid - 0.05, ask: mid + 0.05 };
  };
}

function single(qty: number, contracts = 1): PositionInput {
  return {
    underlying: "SPX",
    expiration: "2026-09-18",
    contracts,
    direction: "buy",
    legs: [
      {
        strike: 100,
        type: "call",
        quantity: qty,
        side: "long",
        entry_price: 0,
      },
    ],
  };
}

function fly(scale: number, contracts = 1): PositionInput {
  return {
    underlying: "SPX",
    expiration: "2026-09-18",
    contracts,
    direction: "buy",
    legs: [
      { strike: 90, type: "call", quantity: 1 * scale, side: "long", entry_price: 0 },
      { strike: 100, type: "call", quantity: 2 * scale, side: "short", entry_price: 0 },
      { strike: 110, type: "call", quantity: 1 * scale, side: "long", entry_price: 0 },
    ],
  };
}

const flyMids = quote({
  "call:90": 12,
  "call:100": 5,
  "call:110": 1,
});
// unit long fly: −12 + 10 − 1 = −3 → DEBIT 3

console.log("packageEconomics Qty × debit");

test("unit scale: fly 1/2/1 is 1; 5/10/5 is 5", () => {
  assert(packageUnitScale(fly(1).legs) === 1, "unit fly");
  assert(packageUnitScale(fly(5).legs) === 5, "5-lot fly");
  assert(packageUnitScale(single(7).legs) === 7, "single 7");
});

test("single: debit is the mid, not Qty × mid", () => {
  const one = packageEconomics(single(1), quote({ "call:100": 2.5 }));
  const five = packageEconomics(single(5), quote({ "call:100": 2.5 }));
  assert(one.absMid === 2.5, `unit debit ${one.absMid}`);
  assert(five.absMid === 2.5, `qty 5 still per-position ${five.absMid}`);
  assert(five.packages === 5, `packages ${five.packages}`);
  assert(five.totalAbs === 12.5, `total 5 × 2.50 = ${five.totalAbs}`);
  assert(one.packages === 1 && one.totalAbs === 2.5, "qty 1 total = debit");
});

test("positionQty: contracts × common leg scale", () => {
  assert(positionQty(single(1, 4)) === 4, "packages field");
  assert(positionQty(single(4, 1)) === 4, "leg scale");
  assert(positionQty(fly(2, 3)) === 6, "both");
});

test("packages field: total = contracts × per-position debit", () => {
  const eco = packageEconomics(single(1, 4), quote({ "call:100": 2.5 }));
  assert(eco.absMid === 2.5, "debit per position");
  assert(eco.packages === 4, "qty from packages field");
  assert(eco.totalAbs === 10, "4 × 2.50");
});

test("fly structure 1/2/1 stays per-position when Qty scales", () => {
  const unit = packageEconomics(fly(1), flyMids);
  const scaled = packageEconomics(fly(3), flyMids);
  assert(unit.side === "DEBIT" && unit.absMid === 3, `unit ${unit.absMid}`);
  assert(scaled.absMid === 3, `scaled qty still debit 3, got ${scaled.absMid}`);
  assert(scaled.packages === 3, "gcd scale is qty");
  assert(scaled.totalAbs === 9, "3 × 3");
});

test("fly + packages field both scale total, not debit", () => {
  const eco = packageEconomics(fly(2, 3), flyMids);
  assert(eco.absMid === 3, "still one-position debit");
  assert(eco.packages === 6, "2 × 3 packages");
  assert(eco.totalAbs === 18, "6 × 3");
});

test("20-wide vertical: max profit = Qty × (width − debit)", () => {
  const legs = [
    { strike: 100, quantity: 4, right: "call" as const },
    { strike: 120, quantity: -4, right: "call" as const },
  ];
  const per = 1.65;
  const total = tradeTotalDebit({
    debit: per,
    legs,
  });
  assert(total === 6.6, `total debit ${total}`);
  const atHi = expirationPnLDollars(120, legs, total);
  const expect = 4 * (20 - 1.65) * 100;
  assert(Math.abs(atHi - expect) < 1e-6, `max ${atHi} want ${expect}`);
  const unscaled = expirationPnLDollars(120, legs, per);
  assert(unscaled > atHi + 400, "forgetting Qty on debit overstates profit");
});

console.log(`${n} tests passed`);
