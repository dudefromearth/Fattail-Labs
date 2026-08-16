/**
 * Book combine — shown positions add; they do not replace.
 *
 *   npx --yes tsx lib/options-lab/positionToTrade.test.ts
 */

import { positionToParsedTrade, combineParsedTrades } from "./positionToTrade";
import type { PositionInput } from "./positionTypes";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function fly(exp: string, body: number, width: number): PositionInput {
  return {
    underlying: "SPX",
    expiration: exp,
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: body - width, type: "call", quantity: 1, side: "long", entry_price: 1 },
      { strike: body, type: "call", quantity: 2, side: "short", entry_price: 5 },
      { strike: body + width, type: "call", quantity: 1, side: "long", entry_price: 1 },
    ],
  };
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

console.log("positionToTrade book combine");

test("one trade is identity", () => {
  const t = positionToParsedTrade(fly("2026-08-14", 6000, 20));
  const c = combineParsedTrades([t]);
  assert(c === t, "same object");
});

test("two distinct flies concatenate legs", () => {
  const a = positionToParsedTrade(fly("2026-08-14", 6000, 20));
  const b = positionToParsedTrade(fly("2026-08-21", 6100, 20));
  const c = combineParsedTrades([a, b]);
  assert(c != null, "combined");
  assert(c!.legs.length === 6, "6 legs");
  assert(c!.structure === "custom", "book is custom");
  const strikes = new Set(c!.legs.map((l) => l.strike));
  assert(strikes.has(5980) && strikes.has(6120), "both structures present");
});

test("same contract sums quantity (additive, not replace)", () => {
  const a = positionToParsedTrade(fly("2026-08-14", 6000, 20));
  const b = positionToParsedTrade(fly("2026-08-14", 6000, 20));
  const c = combineParsedTrades([a, b]);
  assert(c != null, "combined");
  const body = c!.legs.find((l) => l.strike === 6000);
  assert(body != null && body.quantity === -4, "short body 2+2");
  const wing = c!.legs.find((l) => l.strike === 5980);
  assert(wing != null && wing.quantity === 2, "long wing 1+1");
});

test("empty list is null", () => {
  assert(combineParsedTrades([]) == null, "empty");
});

console.log(`${n} tests passed`);
