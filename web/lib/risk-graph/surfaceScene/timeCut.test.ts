import assert from "node:assert/strict";
import { computeSurfaceSheet, legsFromRelative } from "../surfaceModel";
import { tauToBoxZ, timeCutPoints } from "./timeCut";

const legs = legsFromRelative(
  [{ strike: 100, quantity: 1, right: "call" }],
  100,
  3 / 365.25,
  0.2,
);
const sheet = computeSurfaceSheet(legs, {
  spot: 100,
  nx: 21,
  nt: 9,
  quality: "per_leg_iv",
  ivSource: "fixture",
});

{
  assert.ok(Math.abs(tauToBoxZ(sheet, sheet.timeAxis[0]) - 1) < 1e-12, "now = front");
  assert.ok(
    Math.abs(tauToBoxZ(sheet, sheet.timeAxis[sheet.timeAxis.length - 1]) + 1) <
      1e-12,
    "expiry = back",
  );
}

{
  const now = timeCutPoints(sheet, sheet.timeAxis[0]);
  const midTau =
    (sheet.timeAxis[0] + sheet.timeAxis[sheet.timeAxis.length - 1]) / 2;
  const mid = timeCutPoints(sheet, midTau);
  assert.equal(now.length, sheet.spotAxis.length * 3);
  const z0 = now[2];
  const zMid = mid[2];
  assert.ok(Math.abs(z0 - 1) < 1e-12, "now cut sits on the front wall");
  assert.ok(zMid < z0, "later tn sits deeper in the box");
  for (let i = 2; i < mid.length; i += 3) {
    assert.ok(Math.abs(mid[i] - zMid) < 1e-12, "cut is coplanar with the time plane");
  }
}

console.log("timeCut.test.ts ok");
