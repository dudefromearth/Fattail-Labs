/**
 *   npx --yes tsx lib/options-lab/whatIfSpotPts.test.ts
 */

import {
  WHATIF_SPOT_PTS_FALLBACK,
  clampSpotPts,
  spotPctFromPts,
  spotPtsRangeFromCanvas,
} from "./whatIfSpotPts";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

console.log("whatIfSpotPts");

{
  const r = spotPtsRangeFromCanvas({
    xMin: 6350,
    xMax: 6450,
    spot: 6400,
  });
  assert(r.min === -50 && r.max === 50, `canvas ±50: ${r.min} ${r.max}`);
}

{
  const r = spotPtsRangeFromCanvas({
    xMin: 6300,
    xMax: 6500,
    spot: 6400,
  });
  assert(r.min === -100 && r.max === 100, "full canvas width in points");
}

{
  const r = spotPtsRangeFromCanvas({ xMin: 1, xMax: 2, spot: 0 });
  assert(
    r.min === -WHATIF_SPOT_PTS_FALLBACK && r.max === WHATIF_SPOT_PTS_FALLBACK,
    "fallback ±50 when no spot",
  );
}

assert(clampSpotPts(80, { min: -50, max: 50 }) === 50, "clamp hi");
assert(clampSpotPts(-80, { min: -50, max: 50 }) === -50, "clamp lo");
assert(Math.abs(spotPctFromPts(64, 6400) - 1) < 1e-9, "64pts of 6400 is 1%");

console.log("  ok");
