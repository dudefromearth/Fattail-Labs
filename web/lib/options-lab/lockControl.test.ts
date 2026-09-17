/**
 * Locked cards: live quotes do not rewrite the definition.
 * Debit/credit and BUY/SELL are independent once locked.
 *
 *   npx --yes tsx lib/options-lab/lockControl.test.ts
 */
import assert from "node:assert/strict";
import {
  applyPackageQuote,
  flipCardDirection,
  lockLimit,
  lockNatural,
  parseSignedPackagePrice,
  positionFromInput,
  setPackagePriceSide,
  type AnalyzerPosition,
} from "./analyzerBook";
import type { LegInput } from "./positionTypes";

function legs(): LegInput[] {
  return [
    { strike: 760, type: "call", quantity: 1, side: "long", entry_price: 1, expiration: "2026-09-11" },
    { strike: 770, type: "call", quantity: 2, side: "short", entry_price: 1, expiration: "2026-09-11" },
    { strike: 780, type: "call", quantity: 1, side: "long", entry_price: 1, expiration: "2026-09-11" },
  ];
}

function buyFly(): AnalyzerPosition {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: legs(),
  });
  pos.lastNatSigned = -0.8;
  pos.livePackagePerShare = 0.8;
  pos.priceSide = "credit";
  return pos;
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

test("lockNatural freezes the live print at that instant", () => {
  const locked = lockNatural(buyFly());
  assert.equal(locked.lock.mode, "locked");
  if (locked.lock.mode === "locked") {
    assert.equal(locked.lock.packageDebitPerShare, -0.8);
  }
  assert.equal(locked.priceSide, "credit");
  assert.equal(locked.position.direction, "buy");
});

test("lockLimit debit does not replace BUY with SELL", () => {
  const locked = lockLimit(buyFly(), 1.25, false);
  assert.equal(locked.position.direction, "buy");
  assert.equal(locked.priceSide, "debit");
  if (locked.lock.mode === "locked") {
    assert.equal(locked.lock.packageDebitPerShare, 1.25);
  }
  const longs = locked.position.legs.filter((l) => l.side === "long").length;
  assert.equal(longs, 2);
});

test("setPackagePriceSide credit keeps BUY legs", () => {
  const debit = lockLimit(buyFly(), 1.25, false);
  const credit = setPackagePriceSide(debit, "credit");
  assert.equal(credit.position.direction, "buy");
  assert.equal(credit.priceSide, "credit");
  if (credit.lock.mode === "locked") {
    assert.equal(credit.lock.packageDebitPerShare, -1.25);
  }
  assert.equal(credit.position.legs[0]?.side, "long");
});

test("BUY/SELL flip while locked does not rewrite debit/credit", () => {
  const locked = lockLimit(buyFly(), 1.25, false);
  const sold = flipCardDirection(locked);
  assert.equal(sold.position.direction, "sell");
  assert.equal(sold.priceSide, "debit");
  if (sold.lock.mode === "locked") {
    assert.equal(sold.lock.packageDebitPerShare, 1.25);
  }
});

test("live quote cannot flip a locked debit to credit", () => {
  const locked = lockLimit(buyFly(), 1.25, false);
  const quoted = applyPackageQuote(
    locked,
    {
      complete: true,
      package_debit_per_share: -3.4,
      mark_mode: "live",
      as_of: "2026-09-17T13:35:00Z",
    },
    { sessionHeld: false, interestOk: true },
  );
  assert.equal(quoted.lock.mode, "locked");
  assert.equal(quoted.priceSide, "debit");
  assert.equal(quoted.livePackagePerShare, 1.25);
  assert.equal(quoted.lastNatSigned, -0.8);
  assert.equal(quoted.position.direction, "buy");
});

test("typing 1.00 is debit; typing -1.00 is credit", () => {
  const pos = parseSignedPackagePrice("1.00");
  const neg = parseSignedPackagePrice("−1.00");
  const ascii = parseSignedPackagePrice("-1.00");
  assert.deepEqual(pos, { mag: 1, isCredit: false });
  assert.deepEqual(neg, { mag: 1, isCredit: true });
  assert.deepEqual(ascii, { mag: 1, isCredit: true });
  const locked = lockLimit(buyFly(), 1, true);
  const flipped = lockLimit(locked, 1, false);
  assert.equal(flipped.priceSide, "debit");
  assert.equal(flipped.position.direction, "buy");
  if (flipped.lock.mode === "locked") {
    assert.equal(flipped.lock.packageDebitPerShare, 1);
  }
});

test("budget refuse does not clear a locked side", () => {
  const locked = lockLimit(buyFly(), 1.25, false);
  const refused = applyPackageQuote(
    locked,
    { complete: true, package_debit_per_share: 1.1 },
    { sessionHeld: false, interestOk: false },
  );
  assert.equal(refused.priceSide, "debit");
  assert.equal(refused.livePackagePerShare, 1.25);
});

console.log(`lockControl.test.ts ${n} ok`);
