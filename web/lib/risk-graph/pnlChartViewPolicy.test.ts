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
  const bind = readFileSync(join(here, "chartHostBind.ts"), "utf8");
  const host = readFileSync(
    join(here, "../../components/options-lab/risk-graph/HostPnLChart.tsx"),
    "utf8",
  );
  const az = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert(bind.includes("setPointerCapture"), "pointer capture on pan");
  assert(bind.includes("passive: false"), "native wheel");
  assert(bind.includes('addEventListener("pointerdown"'), "native pan");
  assert(bind.includes("safeDraw"), "draw errors must not kill pan");
  assert(host.includes('ref={attach}'), "bind is host node life");
  assert(host.includes("ensureBound"), "rebind if listeners dropped");
  assert(host.includes('wheelBound !== "1"'), "heal on missing wheel bind");
  assert(
    !/visibilitychange[\s\S]{0,400}unbindRef\.current\?\.\(\)/.test(host),
    "pageshow/visibility effect must not unbind the host",
  );
  assert(az.includes("<HostPnLChart"), "live pane is host-contract chart");
  assert(!az.includes("SurfaceViewport"), "Analyzer is 2D only; Surface is suite page");
  assert(!az.includes("analyzer-viewport-surface"), "no in-viewport Surface tab");
  assert(az.includes("onStrikeCommit="), "listed strike handles wired");
  assert(host.includes("bindStrikeHandles"), "yellow ticks bind on host");
  assert(host.includes("strikeHandleHot"), "handle size follows proximity");
});

console.log(`\n${n} tests passed`);
