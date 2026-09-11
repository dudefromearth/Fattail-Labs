/**
 * PC3 — AT-PC-03 · 30 · 31 · 34 · 52 (unit halves).
 *
 *   npx --yes tsx lib/options-lab/structureSignal.test.ts
 */
import assert from "node:assert/strict";
import { positionFromInput, scaleCardPos } from "./analyzerBook";
import type { LegInput } from "./positionTypes";
import {
  makeStructureSignal,
  shouldRegisterInterest,
  structureChanged,
  structureKey,
} from "./structureSignal";
import { finishPackageQuote } from "./packageQuoteFinish";

function legs(qs: [number, number, number]): LegInput[] {
  const [a, b, c] = qs;
  return [
    {
      strike: 760,
      type: "call",
      quantity: a,
      side: "long",
      entry_price: 1,
      expiration: "2026-09-11",
    },
    {
      strike: 770,
      type: "call",
      quantity: b,
      side: "short",
      entry_price: 1,
      expiration: "2026-09-11",
    },
    {
      strike: 780,
      type: "call",
      quantity: c,
      side: "long",
      entry_price: 1,
      expiration: "2026-09-11",
    },
  ];
}

function fly(qty: [number, number, number]) {
  return positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: legs(qty),
  });
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

test("AT-PC-30 signal does not change on marks, reorder-irrelevant fields, or POS scale", () => {
  const a = fly([1, 2, 1]);
  const marked = { ...a, lastNatSigned: 0.67, livePackagePerShare: 0.67 };
  assert.equal(structureChanged(a, marked), false);
  const scaled = scaleCardPos(a, 3);
  assert.equal(structureKey(a), structureKey(scaled));
  assert.equal(makeStructureSignal(a, scaled), null);
  const vis = { ...a, visible: false };
  assert.equal(structureChanged(a, vis), false);
});

test("AT-PC-30 strike change does fire", () => {
  const a = fly([1, 2, 1]);
  const b = fly([1, 2, 1]);
  b.position = {
    ...b.position,
    legs: b.position.legs.map((l, i) =>
      i === 2 ? { ...l, strike: 790 } : l,
    ),
  };
  assert.equal(structureChanged(a, b), true);
});

test("AT-PC-03 quote after structural change is dropped", () => {
  const a = fly([1, 2, 1]);
  const key = structureKey(a);
  const moved = fly([1, 2, 1]);
  moved.position = {
    ...moved.position,
    legs: moved.position.legs.map((l, i) =>
      i === 2 ? { ...l, strike: 790 } : l,
    ),
  };
  const out = finishPackageQuote(
    moved,
    { complete: true, package_debit_per_share: 0.99 },
    { expectedStructureKey: key },
  );
  assert.equal(out, moved);
  assert.equal(out.lastNatSigned, moved.lastNatSigned);
});

test("AT-PC-31 quote merge never writes lock, structure, or name", () => {
  const a = fly([1, 2, 1]);
  a.lock = {
    mode: "locked",
    lockedAt: "t",
    packageDebitPerShare: 1.2,
    lockSource: "user_limit",
    freezeIv: false,
    freezeMarks: false,
  };
  a.label = "KEEP";
  a.notation = "KEEP-N";
  const next = finishPackageQuote(a, {
    complete: true,
    package_debit_per_share: 0.5,
  });
  assert.equal(next.lock.mode, "locked");
  if (next.lock.mode === "locked") {
    assert.equal(next.lock.packageDebitPerShare, 1.2);
  }
  assert.equal(next.label, "KEEP");
  assert.equal(next.notation, "KEEP-N");
  assert.deepEqual(
    next.position.legs.map((l) => l.strike),
    a.position.legs.map((l) => l.strike),
  );
});

test("AT-PC-34 hidden registers no interest; shown does", () => {
  const a = fly([1, 2, 1]);
  assert.equal(shouldRegisterInterest(a), true);
  assert.equal(shouldRegisterInterest({ ...a, visible: false }), false);
});

test("AT-PC-52 budget limit keeps definition; no live mid", () => {
  const a = fly([1, 2, 1]);
  a.lastNatSigned = 0.67;
  const next = finishPackageQuote(
    a,
    { complete: true, package_debit_per_share: 0.5 },
    { interestOk: false },
  );
  assert.equal(next.liveState, "budget_refused");
  assert.equal(next.livePackagePerShare, null);
  assert.deepEqual(
    next.position.legs.map((l) => l.quantity),
    a.position.legs.map((l) => l.quantity),
  );
});

test("PC8-E quote merge writes chain IV; missing leg stays —; structure unmoved", () => {
  const a = fly([1, 2, 1]);
  assert.equal(a.position.legs[0].volatility, undefined);
  const ivs: Record<string, number> = {
    "760:call": 0.1245,
    "770:call": 0.1118,
  };
  const next = finishPackageQuote(
    a,
    { complete: true, package_debit_per_share: 0.67 },
    {
      getContract: (expiration, strike, type) => {
        const iv = ivs[`${strike}:${type}`];
        return iv != null ? { iv } : undefined;
      },
    },
  );
  assert.equal(next.position.legs[0].volatility, 0.1245);
  assert.equal(next.position.legs[1].volatility, 0.1118);
  assert.equal(next.position.legs[2].volatility, undefined);
  assert.deepEqual(
    next.position.legs.map((l) => l.strike),
    a.position.legs.map((l) => l.strike),
  );
  assert.equal(next.lock.mode, a.lock.mode);
});

console.log(`structureSignal.test.ts ${n} ok`);
