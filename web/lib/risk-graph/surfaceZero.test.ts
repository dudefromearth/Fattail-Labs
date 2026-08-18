import assert from "node:assert/strict";
import {
  computeSurfaceSheet,
  legsFromRelative,
} from "./surfaceModel";
import {
  chaikinXYZ,
  zeroCrossingsOnSlice,
  zeroPnlBoxPolylines,
  zeroPnlBranches,
} from "./surfaceZero";

const iv = 0.2;
const tau = 3 / 365.25;

{
  const xs = [90, 95, 100, 105, 110];
  const row = [-10, -4, 2, 6, -1];
  const z = zeroCrossingsOnSlice(xs, row);
  assert.equal(z.length, 2, "two crossings on a fly-like slice");
  assert.ok(z[0] > 95 && z[0] < 100);
  assert.ok(z[1] > 105 && z[1] < 110);
}

{
  const legs = legsFromRelative(
    [
      { strike: 100, quantity: 1, right: "call" },
      { strike: 105, quantity: -2, right: "call" },
      { strike: 110, quantity: 1, right: "call" },
    ],
    105,
    tau,
    iv,
  );
  const sheet = computeSurfaceSheet(legs, {
    spot: 105,
    sMin: 90,
    sMax: 120,
    nx: 61,
    nt: 12,
    listedStrikes: [100, 105, 110],
  });
  const exp = sheet.pnlGrid[sheet.pnlGrid.length - 1];
  const be = zeroCrossingsOnSlice(sheet.spotAxis, exp);
  assert.ok(be.length >= 2, "expiry fly has two $0 crossings");
  const branches = zeroPnlBranches(sheet);
  assert.ok(branches.length >= 1, "traced at least one $0 branch");
  assert.ok(branches.every((b) => b.length >= 2));
  const lines = zeroPnlBoxPolylines(sheet);
  assert.ok(lines.length >= 1, "box polylines for the $0 cut");
  for (const pts of lines) {
    assert.ok(pts.length >= 6);
    for (let i = 1; i < pts.length; i += 3) {
      assert.ok(Math.abs(pts[i]) < 1e-9, "$0 curve sits on y = 0 by default");
    }
  }
  const lifted = zeroPnlBoxPolylines(sheet, 0.25);
  for (const pts of lifted) {
    for (let i = 1; i < pts.length; i += 3) {
      assert.ok(Math.abs(pts[i] - 0.25) < 1e-9, "$0 curve rides the remapped zero");
    }
  }
}

{
  const raw = [0, 0, 0, 1, 0, 0, 1, 0, 1];
  const s = chaikinXYZ(raw, 2);
  assert.ok(s.length > raw.length, "Chaikin densifies the polyline");
  assert.equal(s[0], 0);
  assert.equal(s[s.length - 1], 1);
}

console.log("surfaceZero.test.ts ok");
