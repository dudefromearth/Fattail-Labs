/**
 *   npx --yes tsx lib/options-lab/listedStrikeDrag.test.ts
 */

import { positionFromInput } from "./analyzerBook";
import {
  applyListedStrikeDrag,
  applyStrikeDragToPosition,
  classifyGrab,
} from "./listedStrikeDrag";
import type { PositionInput } from "./positionTypes";

const LISTED = [
  5950, 5960, 5970, 5980, 5990, 6000, 6010, 6020, 6030, 6040, 6050,
];

function fly(center = 6000, width = 20): PositionInput {
  return {
    underlying: "SPX",
    expiration: "2026-12-18",
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: center - width, type: "call", quantity: 1, side: "long", entry_price: 1 },
      { strike: center, type: "call", quantity: 2, side: "short", entry_price: 5 },
      { strike: center + width, type: "call", quantity: 1, side: "long", entry_price: 1 },
    ],
  };
}

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

const getListed = () => LISTED;

console.log("listedStrikeDrag");

test("body grab is body; wing grab is wing", () => {
  const legs = fly().legs;
  assert(classifyGrab(legs, 6000) === "body", "body");
  assert(classifyGrab(legs, 6020) === "wing", "wing");
});

test("single handle moves only that strike", () => {
  const next = applyListedStrikeDrag({
    legs: fly().legs,
    grabbedStrike: 6000,
    targetStrike: 6010,
    shiftAll: false,
    frontExpiration: "2026-12-18",
    getListed,
  });
  assert(next != null, "moved");
  const ks = next!.map((l) => l.strike).sort((a, b) => a - b);
  assert(ks.join(",") === "5980,6010,6020", ks.join(","));
});

test("single wing handle moves only that wing", () => {
  const next = applyListedStrikeDrag({
    legs: fly().legs,
    grabbedStrike: 6020,
    targetStrike: 6030,
    shiftAll: false,
    frontExpiration: "2026-12-18",
    getListed,
  });
  assert(next != null, "moved");
  const ks = next!.map((l) => l.strike).sort((a, b) => a - b);
  assert(ks.join(",") === "5980,6000,6030", ks.join(","));
});

test("Shift slides even when grabbing a wing", () => {
  const next = applyListedStrikeDrag({
    legs: fly().legs,
    grabbedStrike: 6020,
    targetStrike: 6030,
    shiftAll: true,
    frontExpiration: "2026-12-18",
    getListed,
  });
  assert(next != null, "moved");
  const ks = next!.map((l) => l.strike).sort((a, b) => a - b);
  assert(ks.join(",") === "5990,6010,6030", ks.join(","));
});

test("refuses unlisted invent — empty ladder", () => {
  const next = applyListedStrikeDrag({
    legs: fly().legs,
    grabbedStrike: 6000,
    targetStrike: 6010,
    shiftAll: true,
    frontExpiration: "2026-12-18",
    getListed: () => [],
  });
  assert(next == null, "no-op");
});

test("position helper unlocks and clears package", () => {
  const pos = positionFromInput(fly());
  const next = applyStrikeDragToPosition(pos, 6000, 6010, false, getListed);
  assert(next.lock.mode === "unlocked", "unlock");
  assert(next.livePackagePerShare == null, "clear mark");
  assert(next !== pos, "new card");
});

console.log(`\n${n} tests passed`);
