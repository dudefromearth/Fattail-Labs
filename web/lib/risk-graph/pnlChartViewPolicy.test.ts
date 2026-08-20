/**
 *   npx --yes tsx lib/risk-graph/pnlChartViewPolicy.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  autofitShouldRun2d,
  expBeHashOf,
  shouldClearUserViewLock,
} from "./pnlChartViewPolicy";
import { autofitShouldRun } from "./surfaceAutofit";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("pnlChartViewPolicy");

test("AT-2D-AF-1 user zoom + live BE must not Autofit", () => {
  assert(
    autofitShouldRun2d("exp-be", { userAdjusted: true }) === false,
    "T8 gated",
  );
});

test("AT-2D-AF-7 What-if / live-spot must not Autofit after user move", () => {
  assert(autofitShouldRun2d("what-if", { userAdjusted: true }) === false, "what-if");
  assert(autofitShouldRun2d("live-spot", { userAdjusted: true }) === false, "spot");
  assert(autofitShouldRun("what-if") === false, "same as Surface AT-AF-7");
  assert(autofitShouldRun("live-spot") === false, "same as Surface AT-AF-7");
});

test("AT-2D-AF-9 pan in progress must not Autofit", () => {
  assert(
    autofitShouldRun2d("exp-be", { userAdjusted: false, dragging: true }) ===
      false,
    "isDragging",
  );
});

test("AT-2D-AF-10 strike-drag must not Autofit", () => {
  assert(
    autofitShouldRun2d("exp-be", {
      userAdjusted: false,
      strikeDragging: true,
    }) === false,
    "isStrikeDragging",
  );
});

test("AT-2D-AF-3 cent BE jitter changes hash", () => {
  const a = expBeHashOf([5999.994]);
  const b = expBeHashOf([6000.005]);
  assert(a !== b, `${a} vs ${b}`);
});

test("button still fits; first-paint respects sticky view", () => {
  assert(autofitShouldRun2d("autofit-button", { userAdjusted: true }) === true, "button");
  assert(autofitShouldRun2d("first-paint", { userAdjusted: false }) === true, "cold");
  assert(
    autofitShouldRun2d("first-paint", { userAdjusted: true }) === false,
    "remount keeps member window",
  );
});

test("VP-A1 Show/Hide does not clear lock; structure does", () => {
  assert(shouldClearUserViewLock("show-hide") === false, "hide");
  assert(shouldClearUserViewLock("structure") === true, "legs");
  assert(shouldClearUserViewLock("autofit-button") === true, "button");
  assert(shouldClearUserViewLock("live-tick") === false, "tick");
});

test("AT-CLICK-1 / AT-WH-1 / AT-AZ-WIRE-1 source", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const chart = readFileSync(
    join(here, "../../components/options-lab/risk-graph/PnLChart.tsx"),
    "utf8",
  );
  const az = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert(!chart.includes("Don't start drag"), "left-click no longer steals pan");
  assert(chart.includes("passive: false"), "native wheel");
  assert(!az.includes("onStrikeDrag="), "AT-AZ-WIRE-1 Packet B not shipped");
});

console.log(`\n${n} tests passed`);
