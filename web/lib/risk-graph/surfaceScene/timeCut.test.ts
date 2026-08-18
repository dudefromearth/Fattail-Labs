import assert from "node:assert/strict";
import { computeSurfaceSheet, legsFromRelative } from "../surfaceModel";
import { surfaceValueWindow } from "../surfaceAutofit";
import { surfaceBoxY, tauToBoxZ, timeCutPoints, valueWindowForSheet } from "./timeCut";

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
  const fitted = valueWindowForSheet(sheet, 0.15);
  const now = timeCutPoints(sheet, sheet.timeAxis[0], fitted);
  const midTau =
    (sheet.timeAxis[0] + sheet.timeAxis[sheet.timeAxis.length - 1]) / 2;
  const mid = timeCutPoints(sheet, midTau, fitted);
  assert.equal(now.length, sheet.spotAxis.length * 3);
  const z0 = now[2];
  const zMid = mid[2];
  assert.ok(Math.abs(z0 - 1) < 1e-12, "now cut sits on the front wall");
  assert.ok(zMid < z0, "later tn sits deeper in the box");
  for (let i = 2; i < mid.length; i += 3) {
    assert.ok(Math.abs(mid[i] - zMid) < 1e-12, "cut is coplanar with the time plane");
  }
}

{
  const win = surfaceValueWindow(-200, 800, 0.15);
  assert.ok(win.yMin < -200 && win.yMax > 800, "equal pad beyond peak and floor");
  assert.ok(Math.abs(win.yMax - 800 - ( -200 - win.yMin)) < 1e-9, "top pad = bottom pad");
  const lo = surfaceBoxY(win.yMin, win.yMin, win.yMax);
  const hi = surfaceBoxY(win.yMax, win.yMin, win.yMax);
  const peak = surfaceBoxY(800, win.yMin, win.yMax);
  const floor = surfaceBoxY(-200, win.yMin, win.yMax);
  assert.ok(Math.abs(lo + 1) < 1e-12, "window floor is box floor");
  assert.ok(Math.abs(hi - 1) < 1e-12, "window lid is box lid");
  assert.ok(peak < 1 && floor > -1, "content sits inside the pad");
  assert.ok(Math.abs(1 - peak - (floor + 1)) < 1e-9, "remaining air matches");
  assert.throws(() => surfaceBoxY(1, 100, 0), /value window/);
  const fitted = valueWindowForSheet(sheet, 0.15);
  const now = timeCutPoints(sheet, sheet.timeAxis[0], fitted);
  const tight = timeCutPoints(sheet, sheet.timeAxis[0], valueWindowForSheet(sheet, 0));
  for (let i = 1; i < now.length; i += 3) {
    assert.ok(Math.abs(now[i]) <= 1 + 1e-12, "cut stays in the box");
    if (Math.abs(tight[i]) > 1e-9 && Math.abs(tight[i]) < 0.95) {
      assert.ok(
        Math.abs(now[i]) + 1e-12 < Math.abs(tight[i]),
        "more height pad shrinks the tent",
      );
    }
  }
  assert.ok(now.length > 3, "now cut has samples");
}

console.log("timeCut.test.ts ok");
