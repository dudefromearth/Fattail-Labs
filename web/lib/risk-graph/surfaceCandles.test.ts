import assert from "node:assert/strict";
import {
  candleTfForTau,
  candlesToBoxes,
  priceToBoxX,
  remainingLifeMs,
  timeToBoxZ,
} from "./surfaceCandles";
import type { SurfaceSheet } from "./surfaceModel";

const sheet = {
  sMin: 5600,
  sMax: 6000,
  spot: 5800,
  timeAxis: [10 / 365.25],
  maxTau: 10 / 365.25,
} as SurfaceSheet;

{
  assert.equal(timeToBoxZ(100, 100, 200), 1, "now is the Now wall");
  assert.equal(timeToBoxZ(200, 100, 200), -1, "expiry is the back wall");
  assert.ok(timeToBoxZ(50, 100, 200) > 1, "history sits left of Now");
}

{
  const x = priceToBoxX(5800, sheet);
  assert.ok(Math.abs(x) < 1e-12, "mid spot is box center X");
}

{
  assert.equal(candleTfForTau(1 / 365.25), "5m");
  assert.equal(candleTfForTau(10 / 365.25), "1h");
  assert.equal(candleTfForTau(40 / 365.25), "1d");
}

{
  const tNow = 1_700_000_000_000;
  const { tExp } = remainingLifeMs(sheet, tNow);
  const bars = [
    { t: tNow - 3600_000, o: 5790, h: 5810, l: 5780, c: 5805 },
    { t: tNow, o: 5805, h: 5820, l: 5800, c: 5810 },
  ];
  const boxes = candlesToBoxes(bars, sheet, tNow, tExp, "1h");
  assert.ok(boxes.length >= 1, "current bar is on the map");
  assert.ok(boxes.some((b) => b.up), "up bar flagged");
}

console.log("surfaceCandles.test.ts ok");
