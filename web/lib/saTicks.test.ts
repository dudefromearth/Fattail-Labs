/**
 *   npx --yes tsx lib/saTicks.test.ts
 */
import assert from "node:assert/strict";
import {
  formatTick,
  majorStep,
  priceGrid,
  resolveTick,
  snapTick,
  tickFromPrices,
} from "./saTicks";

const esTick = resolveTick({ vpRow: 0.25 });
assert.equal(esTick, 0.25);
assert.equal(snapTick(7687.11, 0.25), 7687);
assert.equal(formatTick(7687, 0.25), "7687.00");
assert.equal(formatTick(7700, 0.25), "7700.00");

const span = 40;
const step = majorStep(0.25, span, 8);
assert.equal(step % 0.25, 0);
const grid = priceGrid(7680, 7720, 0.25, 8);
assert.ok(grid.majors.length >= 4);
assert.ok(grid.majors.every((p) => Math.abs(p / 0.25 - Math.round(p / 0.25)) < 1e-6));
assert.ok(!grid.majors.some((p) => String(p).includes(".11")));

const derived = tickFromPrices([100.0, 100.25, 100.5, 101.0]);
assert.equal(derived, 0.25);
assert.equal(resolveTick({ prices: [10, 10.1, 10.3] }), 0.1);

console.log("saTicks.test.ts ok");
