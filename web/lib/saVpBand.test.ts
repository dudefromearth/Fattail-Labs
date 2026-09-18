/**
 *   npx --yes tsx lib/saVpBand.test.ts
 */
import assert from "node:assert/strict";
import {
  bandContains,
  displayRow,
  expandBand,
  hitProfile,
  rangeUrl,
  sliceVisible,
} from "./saVpBand";

assert.equal(displayRow(40, 400, 0.25), 0.25);
assert.ok(displayRow(800, 400, 0.25) >= 2);
assert.equal(displayRow(2, 400, 0.25), 0.25);

const band = expandBand(100, 110);
assert.equal(band.lo, 90);
assert.equal(band.hi, 120);
assert.equal(bandContains(band, 100, 110), true);
assert.equal(bandContains(band, 89, 110), false);

const { rows, max } = sliceVisible(
  [
    { price: 99, volume: 9 },
    { price: 105, volume: 20 },
    { price: 108, volume: 4 },
    { price: 121, volume: 99 },
  ],
  100,
  110,
);
assert.equal(rows.length, 2);
assert.equal(max, 20);

const url = rangeUrl({
  target: "SPX",
  source: "ES",
  from: "2026-01-01",
  to: "2026-09-18",
  lo: 6400,
  hi: 6800,
  row: 0.25,
});
assert.match(url, /\/range\/SPX\?/);
assert.match(url, /price_lo=6400/);
assert.match(url, /row=0.25/);
assert.match(url, /source=ES/);

assert.equal(
  hitProfile([{ x0: 0, y0: 10, x1: 40, y1: 20 }], 10, 15),
  true,
);
assert.equal(
  hitProfile([{ x0: 0, y0: 10, x1: 40, y1: 20 }], 50, 15),
  false,
);

console.log("saVpBand.test.ts ok");
