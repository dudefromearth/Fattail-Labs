/**
 *   npx --yes tsx lib/saChartStyle.test.ts
 */
import assert from "node:assert/strict";
import { LineStyle } from "lightweight-charts";
import { defaultPrefs } from "./saLayerStore";
import {
  candleOptions,
  canvasOptions,
  colorBars,
  lineStyleOf,
  visibleHiLo,
} from "./saChartStyle";

assert.equal(lineStyleOf("dotted"), LineStyle.Dotted);
assert.equal(lineStyleOf("largeDashed"), LineStyle.LargeDashed);

const p = defaultPrefs();
const canvas = canvasOptions(p);
assert.equal(canvas.layout.fontSize, 12);
assert.equal(canvas.leftPriceScale.visible, true);
assert.equal(canvas.rightPriceScale.visible, false);
assert.equal(canvas.grid.vertLines.visible, true);

const both = canvasOptions({ ...p, axis: "both" });
assert.equal(both.leftPriceScale.visible, true);
assert.equal(both.rightPriceScale.visible, true);

const hollow = candleOptions({ ...p, candleBodyOn: false });
assert.equal(hollow.upColor, "rgba(0,0,0,0)");
assert.equal(hollow.borderVisible, true);

const bars = [
  { time: 1 as const, open: 10, high: 12, low: 9, close: 11 },
  { time: 2 as const, open: 11, high: 13, low: 10, close: 10 },
];
const painted = colorBars(bars, { ...p, colorByPrevClose: true });
assert.equal(painted[1].color, p.candleDown);

const hl = visibleHiLo(bars, 1, 2);
assert.equal(hl?.hi, 13);
assert.equal(hl?.lo, 9);
assert.equal(visibleHiLo(bars, 50, 60), null);

console.log("saChartStyle.test.ts ok");
