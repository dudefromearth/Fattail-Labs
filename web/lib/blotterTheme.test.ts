/**
 * Package side restamp — stored priceSide must not outrank a new structure.
 *
 *   npx --yes tsx lib/blotterTheme.test.ts
 */
import assert from "node:assert/strict";
import {
  blotterKindFromPackageSide,
  packageSideFromStructure,
  resolvePackageSide,
} from "./blotterTheme";
import {
  applyEditPatch,
  flipCardDirection,
  positionFromInput,
  setCardDirection,
} from "./options-lab/analyzerBook";
import type { LegInput } from "./options-lab/positionTypes";

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

const legs: LegInput[] = [
  { strike: 760, type: "call", quantity: 1, side: "long", expiration: "2026-09-11" },
  { strike: 770, type: "call", quantity: 2, side: "short", expiration: "2026-09-11" },
  { strike: 780, type: "call", quantity: 1, side: "long", expiration: "2026-09-11" },
];

test("sticky priceSide outranks direction — that is the trap", () => {
  const side = resolvePackageSide({
    priceSide: "debit",
    lastNatSigned: 0.67,
    position: { direction: "sell" },
  });
  assert.equal(side, "debit");
  assert.equal(blotterKindFromPackageSide(side), "open");
});

test("packageSideFromStructure ignores stored debit after a sell", () => {
  const side = packageSideFromStructure({
    position: { direction: "sell" },
  });
  assert.equal(side, "credit");
  assert.equal(blotterKindFromPackageSide(side), "close");
});

test("setCardDirection restamps priceSide from the new structure", () => {
  const buy = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs,
  });
  buy.priceSide = "debit";
  buy.lastNatSigned = 0.67;
  const sell = setCardDirection(buy, "sell");
  assert.equal(sell.position.direction, "sell");
  assert.equal(sell.priceSide, "credit");
  assert.equal(sell.lastNatSigned, -0.67);
  assert.equal(blotterKindFromPackageSide(sell.priceSide), "close");
});

test("applyEditPatch does not copy existing.priceSide onto a sell input", () => {
  const buy = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs,
  });
  buy.priceSide = "debit";
  const flipped = legs.map((l) => ({
    ...l,
    side: (l.side === "long" ? "short" : "long") as "long" | "short",
  }));
  const patched = applyEditPatch(
    buy,
    { ...buy.position, direction: "sell", legs: flipped },
    buy.label,
    buy.notation,
  );
  assert.equal(patched.priceSide, "credit");
});

test("flipCardDirection does not keep the old priceSide", () => {
  const buy = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs,
  });
  buy.priceSide = "debit";
  const sell = flipCardDirection(buy);
  assert.equal(sell.priceSide, "credit");
});

console.log(`blotterTheme.test.ts ${n} ok`);
