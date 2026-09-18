/**
 *   npx --yes tsx lib/saScale.test.ts
 */
import assert from "node:assert/strict";
import {
  alignmentDelta,
  assertAligned,
  autoFitY,
  canvasSpace,
  fromCanvasPrice,
  mappingBadge,
  toCanvasPrice,
  yFor,
} from "./saScale";

assert.equal(canvasSpace("FAILED"), "source");
assert.equal(canvasSpace("STALE"), "source");
assert.equal(canvasSpace(undefined), "source");
assert.equal(canvasSpace("OK"), "target");
assert.equal(mappingBadge("FAILED"), "source space · map FAILED");
assert.equal(mappingBadge("OK"), "target space · map OK");

const src = 7700;
assert.equal(toCanvasPrice(src, { ratio: 1, offset_published: -100 }, "source"), 7700);
assert.equal(toCanvasPrice(src, { ratio: 1, offset_published: -100 }, "target"), 7600);
assert.equal(toCanvasPrice(src, { ratio: 0.1, offset_published: 0 }, "target"), 770);
assert.equal(
  fromCanvasPrice(7600, { ratio: 1, offset_published: -100 }, "target"),
  7700,
);

const H = 900;
const PAD = 36;
const lo = 7600;
const hi = 7740;
const P = 7700;
const yProfile = yFor(P, lo, hi, H, PAD);
const yCandle = yFor(P, lo, hi, H, PAD);
const yLine = yFor(P, lo, hi, H, PAD);
assert.equal(yProfile, yCandle);
assert.equal(yCandle, yLine);
assert.equal(assertAligned(yProfile, yCandle, yLine, 1), true);
assert.equal(alignmentDelta(yProfile, yCandle, yLine), 0);

const mixed = yFor(7600, lo, hi, H, PAD);
assert.equal(assertAligned(yProfile, mixed, yLine, 1), false);

const fit = autoFitY([7629.25, 7739.25], 0);
assert.ok(fit);
assert.equal(fit!.lo, 7629.25);
assert.equal(fit!.hi, 7739.25);

console.log("saScale.test.ts ok");
