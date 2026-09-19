/**
 *   npx --yes tsx lib/saVpSeries.test.ts
 */
import assert from "node:assert/strict";
import {
  asVpBins,
  emptyPaint,
  VpHistogramPrimitive,
} from "./saVpSeries";

const paint = emptyPaint();
paint.bins = [
  { price: 100, volume: 4 },
  { price: 110, volume: 8 },
];
const prim = new VpHistogramPrimitive(paint);
assert.equal(typeof prim.updateAllViews, "function");
assert.equal(typeof prim.requestUpdate, "function");
assert.equal("autoscaleInfo" in prim, false);
assert.equal(prim.paneViews()[0]?.zOrder?.(), "top");

prim.updateAllViews();
prim.requestUpdate();

let updates = 0;
const series = {
  priceToCoordinate: (p: number) => p,
  coordinateToPrice: (y: number) => {
    if (y === 0) return 200;
    if (y === 400) return 100;
    return null;
  },
};
const chart = { paneSize: () => ({ width: 800, height: 400 }) };
prim.attached({
  series,
  chart,
  requestUpdate: () => {
    updates += 1;
  },
} as never);
prim.updateAllViews();
assert.equal(paint.visibleLo, 100);
assert.equal(paint.visibleHi, 200);
prim.requestUpdate();
assert.equal(updates, 1);
assert.ok(prim.paneViews()[0]?.renderer());
paint.hitRects = [{ x0: 0, y0: 10, x1: 40, y1: 20 }];
assert.ok(prim.hitTest(10, 15));
assert.equal(prim.hitTest(50, 15), null);

prim.clearBins();
assert.equal(paint.bins.length, 0);
assert.equal(paint.hitRects.length, 0);
assert.equal(prim.paneViews()[0]?.renderer(), null);
assert.equal(updates, 2);

prim.detached();
prim.requestUpdate();
assert.equal(updates, 2);

const ohlc = { time: 1, open: 10, high: 12, low: 9, close: 11 };
paint.bins = asVpBins([{ price: 10, volume: 3 }]);
assert.deepEqual(ohlc, { time: 1, open: 10, high: 12, low: 9, close: 11 });
assert.equal(paint.bins[0]?.price, 10);

console.log("saVpSeries.test.ts ok");
