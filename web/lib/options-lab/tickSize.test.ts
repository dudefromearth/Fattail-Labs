/**
 *   npx --yes tsx lib/options-lab/tickSize.test.ts
 */
import assert from "node:assert/strict";
import { tickSize } from "./tickSize";

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

test("AT-PC-59 unknown product fails loud; no default returned", () => {
  assert.throws(() => tickSize("NOT_A_PRODUCT", 1.5), /PC-CHAIN-7/);
  assert.throws(() => tickSize("AAPL", 1.5), /PC-CHAIN-7/);
  assert.throws(() => tickSize("", 1.5), /PC-CHAIN-7/);
});

test("SPX below 3.00 is 0.05; at or above 3.00 is 0.10", () => {
  assert.equal(tickSize("SPX", 2.99), 0.05);
  assert.equal(tickSize("SPX", 3), 0.1);
  assert.equal(tickSize("spxw", 4), 0.1);
});

test("XSP is 0.01 at every premium", () => {
  assert.equal(tickSize("XSP", 0.5), 0.01);
  assert.equal(tickSize("XSP", 9), 0.01);
});

test("SPY QQQ IWM are 0.01 at every premium", () => {
  assert.equal(tickSize("SPY", 0.5), 0.01);
  assert.equal(tickSize("QQQ", 4), 0.01);
  assert.equal(tickSize("IWM", 3), 0.01);
});

test("unusable premium fails loud", () => {
  assert.throws(() => tickSize("SPX", Number.NaN), /PC-CHAIN-7/);
  assert.throws(() => tickSize("SPX", -1), /PC-CHAIN-7/);
});

console.log(`tickSize.test.ts ${n} ok`);
