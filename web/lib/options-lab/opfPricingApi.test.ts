/**
 * Additive book curves — independent OPF series summed on one grid.
 *
 *   npx --yes tsx lib/options-lab/opfPricingApi.test.ts
 */

import { interpolatePnl, sumAlignedPnL } from "./opfPricingApi";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

console.log("opfPricingApi book sum");

test("interpolate at knots and midpoint", () => {
  const s = [
    { price: 100, pnl: 0 },
    { price: 200, pnl: 10 },
  ];
  assert(interpolatePnl(s, 100) === 0, "left");
  assert(interpolatePnl(s, 200) === 10, "right");
  assert(interpolatePnl(s, 150) === 5, "mid");
});

test("sum of two series is continuous and additive", () => {
  const a = [
    { price: 100, pnl: 1 },
    { price: 200, pnl: 3 },
  ];
  const b = [
    { price: 100, pnl: 2 },
    { price: 200, pnl: 4 },
  ];
  const s = sumAlignedPnL([a, b]);
  assert(s.length === 2, "knots");
  assert(s[0].pnl === 3, "100: 1+2");
  assert(s[1].pnl === 7, "200: 3+4");
});

test("one series is identity", () => {
  const a = [{ price: 1, pnl: 9 }];
  const s = sumAlignedPnL([a]);
  assert(s === a, "same");
});

console.log(`${n} tests passed`);
