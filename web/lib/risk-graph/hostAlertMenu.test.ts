/**
 *   npx --yes tsx lib/risk-graph/hostAlertMenu.test.ts
 */

import { resolveAlertMenuKind, findPnLAtPrice } from "./hostAlertMenu";

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

console.log("  4 tests passed");
