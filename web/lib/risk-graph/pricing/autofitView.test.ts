/**
 *   npx --yes tsx lib/risk-graph/pricing/autofitView.test.ts
 */

import {
  AUTOFIT_PAD_FRAC,
  AUTOFIT_MIN_HALF_PTS,
  strikeCenteredXRange,
} from "./autofitView";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

console.log("autofitView strike-span");

const fly = strikeCenteredXRange({ strikes: [7675, 7690, 7705] });
assert(Math.abs(fly.center - 7690) < 1e-9, "fly centered on strike mid");
assert(fly.xMin < 7675 && fly.xMax > 7705, "outers stay inside");
const flySpan = 7705 - 7675;
const flyPad = flySpan * AUTOFIT_PAD_FRAC;
assert(
  Math.abs(fly.xMax - fly.xMin - (flySpan + 2 * flyPad)) < 1e-6,
  "width is strike span + pad each side, not ATM wings",
);

const two = strikeCenteredXRange({ strikes: [100, 200, 150] });
assert(Math.abs(two.center - 150) < 1e-9, "union of positions is centered");

const pin = strikeCenteredXRange({ strikes: [5000] });
assert(Math.abs(pin.center - 5000) < 1e-9, "pin centered on the strike");
assert(
  pin.xMax - pin.xMin >= AUTOFIT_MIN_HALF_PTS * 2,
  "pin has a minimum width",
);

const empty = strikeCenteredXRange({ strikes: [] });
assert(empty.xMax > empty.xMin, "empty book still has a window");

const dense = strikeCenteredXRange({
  strikes: [7675, 7690, 7705],
  plotWidthPx: 960,
  ptsPerInch: 80,
});
assert(Math.abs(dense.center - 7690) < 1e-9, "density still centered");
assert(
  Math.abs(dense.xMax - dense.xMin - 800) < 1e-6,
  "960px at 80 pts/in is 10in × 80 = 800 pts, not fill-the-pane",
);
assert(dense.xMax - dense.xMin > flySpan, "tent is a fraction of the view");

const tight = strikeCenteredXRange({
  strikes: [7675, 7690, 7705],
  plotWidthPx: 960,
  ptsPerInch: 2,
});
assert(
  tight.xMax - tight.xMin >= flySpan - 1e-6,
  "low pts/in still never clips the strikes",
);

console.log("  7 tests passed");
