import assert from "node:assert/strict";
import {
  computeSurfaceSheet,
  legsFromRelative,
} from "./surfaceModel";
import { zeroCrossingsOnSlice, zeroPnlBranches } from "./surfaceZero";

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
  assert.ok(branches.length >= 1, "traced at least one Real Time P&L branch");
  assert.ok(branches.every((b) => b.length >= 2));
}

console.log("surfaceZero.test.ts ok");
