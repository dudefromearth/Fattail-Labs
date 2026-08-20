/**
 *   npx --yes tsx lib/risk-graph/hostAlertMenu.test.ts
 */

import {
  resolveAlertMenuKind,
  findPnLAtPrice,
  nearestPositionOnExpiration,
  toHostCanvasY,
  CURVE_HIT_DISTANCE,
} from "./hostAlertMenu";
import { CHART_HOST_PAD as PAD } from "./chartHostBind";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

console.log("hostAlertMenu");

assert(resolveAlertMenuKind(false, 3) === "canvas", "blank plot is canvas");
assert(resolveAlertMenuKind(true, 0) === "canvas", "tent with no Shown cards is canvas");
assert(resolveAlertMenuKind(true, 2) === "position", "tent + Shown cards is position");

const pts = [
  { price: 100, pnl: 0 },
  { price: 200, pnl: 100 },
];
assert(findPnLAtPrice(pts, 150) === 50, "interpolate P&L on tent");

const view = { xMin: 100, xMax: 200, yMin: -50, yMax: 50 };
const w = 400;
const h = 300;
const mx = PAD.left + (w - PAD.left - PAD.right) / 2;
const myAt = (pnl: number) => toHostCanvasY(pnl, h, view);
const flat = (id: string, pnl: number) => ({
  id,
  expiration: [
    { price: 100, pnl },
    { price: 200, pnl },
  ],
});

assert(
  nearestPositionOnExpiration(10, myAt(0), w, h, view, [flat("a", 0)]) ===
    null,
  "gutter is not a hit",
);
assert(
  nearestPositionOnExpiration(mx, myAt(0), w, h, view, []) === null,
  "no curves → no hit",
);

const onA = nearestPositionOnExpiration(mx, myAt(0), w, h, view, [
  flat("a", 0),
  flat("b", 20),
]);
assert(onA?.id === "a", "cursor on A's at-exp picks A");
assert((onA?.dist ?? 99) <= CURVE_HIT_DISTANCE, "A is inside 8px");

const onB = nearestPositionOnExpiration(mx, myAt(20), w, h, view, [
  flat("a", 0),
  flat("b", 20),
]);
assert(onB?.id === "b", "cursor on B's at-exp picks B — not a picker");

const miss = nearestPositionOnExpiration(
  mx,
  myAt(0) + CURVE_HIT_DISTANCE + 1,
  w,
  h,
  view,
  [flat("a", 0), flat("b", 20)],
);
assert(miss === null, "beyond 8px is canvas, not a position");

const overlap = nearestPositionOnExpiration(mx, myAt(0), w, h, view, [
  flat("near", 0),
  flat("far", 4),
]);
assert(overlap?.id === "near", "closest vertical distance wins when both in range");

console.log("  11 tests passed");
