/**
 *   npx --yes tsx lib/options-lab/structureClassifier.test.ts
 */
import assert from "node:assert/strict";
import type { LegInput } from "./positionTypes";
import { classify } from "./structureClassifier";
import { posAndRatio } from "./positionQty";
import {
  buildListedStructure,
  roundTripListedLegs,
  sameStructureLegs,
} from "./listedStructure";
import { detectFamily } from "./positionLabels";
import { positionNetPremium } from "./positionToTrade";
import {
  BOOK_BACKUP_KEY,
  backupAnalyzerBookOnce,
  loadPositions,
  positionFromInput,
  restoreAnalyzerBookFromBackup,
  scaleCardPos,
  type AnalyzerPosition,
} from "./analyzerBook";

const listed = Array.from({ length: 41 }, (_, i) => 750 + i);

function leg(
  strike: number,
  qty: number,
  side: "long" | "short",
  type: "call" | "put" = "call",
  expiration = "2026-09-11",
): LegInput {
  return { strike, type, quantity: qty, side, entry_price: 1, expiration };
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

test("AT-PC-41 1-2-1 equal wings → Butterfly; unequal → BWB; 1-2-2 → CUSTOM", () => {
  const fly = [leg(760, 1, "long"), leg(770, 2, "short"), leg(780, 1, "long")];
  assert.equal(classify(fly, { listed }).name, "Butterfly");
  const bwb = [leg(760, 1, "long"), leg(770, 2, "short"), leg(790, 1, "long")];
  assert.equal(classify(bwb, { listed }).name, "BWB");
  const c = [leg(760, 1, "long"), leg(770, 2, "short"), leg(780, 2, "long")];
  assert.equal(classify(c, { listed }).name, "CUSTOM");
});

test("AT-PC-53 all-same-side 1-2-1 is CUSTOM; all-long 1-1-1-1 both rights is CUSTOM", () => {
  const allLong = [
    leg(760, 1, "long"),
    leg(770, 2, "long"),
    leg(780, 1, "long"),
  ];
  assert.equal(classify(allLong, { listed }).name, "CUSTOM");
  const four = [
    leg(760, 1, "long", "put"),
    leg(770, 1, "long", "put"),
    leg(770, 1, "long", "call"),
    leg(780, 1, "long", "call"),
  ];
  assert.equal(classify(four, { listed }).name, "CUSTOM");
});

test("AT-PC-35 actual contracts; POS = GCD; 3/7/3 → POS 1 CUSTOM", () => {
  const legs = [leg(760, 3, "long"), leg(770, 7, "short"), leg(780, 3, "long")];
  const { pos } = posAndRatio(legs);
  assert.equal(pos, 1);
  assert.equal(classify(legs, { listed }).name, "CUSTOM");
  const fly3 = [leg(760, 3, "long"), leg(770, 6, "short"), leg(780, 3, "long")];
  assert.equal(posAndRatio(fly3).pos, 3);
  assert.equal(classify(fly3, { listed }).name, "Butterfly");
});

test("AT-PC-36 name re-derives fly ⇄ BWB ⇄ CUSTOM", () => {
  let legs = [leg(760, 1, "long"), leg(770, 2, "short"), leg(780, 1, "long")];
  assert.equal(detectFamily(legs), "Butterfly");
  legs = [leg(760, 1, "long"), leg(770, 2, "short"), leg(790, 1, "long")];
  assert.equal(detectFamily(legs), "BWB");
  legs = [leg(760, 1, "long"), leg(770, 2, "short"), leg(780, 3, "long")];
  assert.equal(detectFamily(legs), "CUSTOM");
  legs = [leg(760, 1, "long"), leg(770, 2, "short"), leg(780, 1, "long")];
  assert.equal(detectFamily(legs), "Butterfly");
});

test("AT-PC-39 BASIS one-package: +1/−2/+1 equals +3/−6/+3", () => {
  const unit = {
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy" as const,
    legs: [
      leg(760, 1, "long"),
      leg(770, 2, "short"),
      leg(780, 1, "long"),
    ],
  };
  const lots = {
    ...unit,
    legs: [
      leg(760, 3, "long"),
      leg(770, 6, "short"),
      leg(780, 3, "long"),
    ],
  };
  assert.equal(positionNetPremium(unit), positionNetPremium(lots));
});

test("AT-PC-40 POS stepper writes ratio × POS; lock stands", () => {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: [leg(760, 3, "long"), leg(770, 6, "short"), leg(780, 3, "long")],
  });
  pos.lock = {
    mode: "locked",
    lockedAt: "2026-09-11T00:00:00Z",
    packageDebitPerShare: 0.67,
    lockSource: "user_limit",
    freezeIv: false,
    freezeMarks: false,
  };
  const next = scaleCardPos(pos, 4);
  assert.deepEqual(
    next.position.legs.map((l) => l.quantity),
    [4, 8, 4],
  );
  assert.equal(next.lock.mode, "locked");
  if (next.lock.mode === "locked") {
    assert.equal(next.lock.packageDebitPerShare, 0.67);
  }
  assert.equal(detectFamily(next.position.legs), "Butterfly");
});

test("AT-PC-26 POS scale leaves the lock field standing", () => {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    legs: [leg(760, 1, "long"), leg(770, 2, "short"), leg(780, 1, "long")],
  });
  pos.lock = {
    mode: "locked",
    lockedAt: "t",
    packageDebitPerShare: 1.2,
    lockSource: "natural_mid",
    freezeIv: false,
    freezeMarks: false,
  };
  const scaled = scaleCardPos(pos, 3);
  assert.equal(scaled.lock.mode, "locked");
  if (scaled.lock.mode === "locked") {
    assert.equal(scaled.lock.packageDebitPerShare, 1.2);
  }
});

test("AT-PC-32 seed-rebuild half: template change rebuilds legs", () => {
  const fly = buildListedStructure({
    template: "butterfly",
    listed,
    preferCenter: 770,
    preferWidth: 10,
    optionSide: "call",
  });
  const vert = buildListedStructure({
    template: "vertical",
    listed,
    preferCenter: 770,
    preferWidth: 10,
    optionSide: "call",
  });
  assert.ok(fly && vert);
  assert.notEqual(fly.legs.length, vert.legs.length);
  assert.ok(!sameStructureLegs(fly.legs, vert.legs));
});

test("AT-PC-43 parametric chrome round-trips", () => {
  const built = buildListedStructure({
    template: "butterfly",
    listed,
    preferCenter: 770,
    preferWidth: 10,
    optionSide: "call",
  });
  assert.ok(built);
  const back = roundTripListedLegs(built.legs, listed);
  assert.ok(back);
  assert.ok(sameStructureLegs(built.legs, back));
});

test("AT-PC-57 no order state on AnalyzerPosition", () => {
  const pos = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    legs: [leg(770, 1, "long")],
  });
  const keys = Object.keys(pos);
  assert.ok(!keys.includes("order_status"));
  assert.ok(!keys.includes("orderId"));
  assert.ok(!keys.includes("broker_state"));
  assert.equal(pos.status, "ANALYSIS");
});

test("3-lot +3/−6/+3 normalizes to Butterfly", () => {
  const legs = [leg(760, 3, "long"), leg(770, 6, "short"), leg(780, 3, "long")];
  assert.equal(classify(legs, { listed }).name, "Butterfly");
  assert.deepEqual(classify(legs, { listed }).signed, [1, -2, 1]);
});

console.log(`structureClassifier.test.ts ${n} ok`);
