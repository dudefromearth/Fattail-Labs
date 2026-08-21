/**
 *   npx --yes tsx lib/risk-graph/pnlChartViewPolicy.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  autofitShouldRun2d,
  bookAppearedOnCanvas,
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
  assert(
    autofitShouldRun2d("strike-drop", {
      userAdjusted: true,
      strikeDragging: true,
    }) === false,
    "still dragging",
  );
  assert(
    autofitShouldRun2d("strike-drop", { userAdjusted: true }) === true,
    "drop Autofits even after pan",
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

test("empty canvas → positions appear Autofits even after pan", () => {
  assert(bookAppearedOnCanvas(false, true) === true, "appear");
  assert(bookAppearedOnCanvas(true, true) === false, "already showing");
  assert(bookAppearedOnCanvas(true, false) === false, "hide last");
  assert(bookAppearedOnCanvas(false, false) === false, "still empty");
  assert(
    autofitShouldRun2d("book-appear", { userAdjusted: true }) === true,
    "pan on empty GEX must not block Autofit when a book appears",
  );
  assert(shouldClearUserViewLock("empty-to-book") === true, "clear lock");
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
  assert(
    !az.includes("AlgoNarrativePanel"),
    "Algo narrative window is not on the viewport (ALGO-N1)",
  );
  assert(!az.includes("SurfaceViewport"), "Analyzer is 2D only; Surface is suite page");
  assert(!az.includes("analyzer-viewport-surface"), "no in-viewport Surface tab");
  assert(az.includes("onStrikeCommit="), "listed strike handles wired");
  assert(az.includes('"strike-drop"'), "leg / group drop Autofits");
  assert(host.includes("bindStrikeHandles"), "yellow ticks bind on host");
  assert(host.includes("SPOT_LABEL_FG"), "spot chip on the strike scale");
  assert(host.includes("#facc15"), "spot scale text is yellow-400");
  assert(host.includes("#3f3f46"), "spot scale field is dark grey");
  assert(
    host.includes("(Math.round(spotMark * 100) / 100).toFixed(2)"),
    "spot chip keeps hundredths so the scale doesn't jump",
  );
  assert(host.includes("dataset.spotLabel"), "spot chip is observable");
  assert(
    host.includes("ctx.font = AXIS_FONT"),
    "spot chip font matches strike ticks",
  );
  assert(host.includes("strikeHandleHot"), "handle size follows proximity");
  assert(
    !az.includes('data-notice-kind="empty_book"'),
    "no center empty-book instruction on the canvas",
  );
  assert(az.includes('book-appear'), "empty canvas → book Autofits");
  assert(az.includes("bookAppearedOnCanvas"), "appear helper wired");
  assert(az.includes('data-testid="analyzer-symbol-select"'), "symbol pulldown on viewport");
  assert(!az.includes("opf-model-select"), "OPF model is not member chrome");
  assert(!az.includes("OPF risk graph"), "no chatty upper-left title");
  assert(az.includes('data-testid="analyzer-autofit"'), "Auto-fit on viewport strip");
  assert(az.includes("function formatFixed2"), "Spot and VIX share hundredths format");
  assert(
    /return \(Math\.round\(n \* 100\) \/ 100\)\.toFixed\(2\)/.test(az),
    "Spot and VIX keep hundredths including .00",
  );
  assert(az.includes("setSpotStr(formatFixed2(opfSpot))"), "Spot live fill is fixed-2");
  assert(az.includes("setVixStr(formatFixed2(opfVix))"), "VIX live fill is fixed-2");
  assert(
    host.includes("strikeCenteredXRange"),
    "Autofit X is strike-span, not ATM wings",
  );
  assert(az.includes("sessionOpenSpot"), "TM session open helper");
  assert(az.includes("setSpotStr(formatFixed2(tmOpenSpot))"), "Spot fills from session open");
  assert(az.includes("autofitCenterPrice={tmOpenSpot}"), "Autofit X centers on session open");
  assert(host.includes("openCenteredXRange"), "TM Autofit recenters on open");
  assert(host.includes('lab: "High"'), "Algo HUD High (not Highest)");
  assert(host.includes('lab: "Profit"'), "Algo HUD Profit between High and Trail");
  assert(host.includes('lab: "Trail"'), "Algo HUD Trail");
  assert(host.includes('lab: "Stop"'), "Algo HUD Stop");
  assert(host.includes("algoProfit"), "Profit dataset");
  assert(host.includes("fmtAlgoPrint"), "Stop is ticker print, not $");
  assert(az.includes("algoHud={algoHud}"), "Algo HUD wired");
  assert(az.includes("resetSim()"), "Demo Exit also ends What-if");
  assert(az.includes('liveAlgo.runState !== "live"'), "HUD hidden unless Live");
  assert(az.includes('st.phase !== "armed"'), "HUD hidden unless Armed");
  assert(az.includes("sessionSpotNow"), "TM entry/eligibility uses playhead");
  assert(az.includes("demo: tmActive"), "Create Alert during TM defaults Demo");
  assert(
    az.includes("if (ag.demo && !tmDay)"),
    "Demo does not force What-if when TM owns the clock",
  );
  const tmStrip = readFileSync(
    join(here, "../../components/options-lab/AnalyzerTimeMachineStrip.tsx"),
    "utf8",
  );
  assert(tmStrip.includes('aria-label="Reset"'), "TM exit is Reset, matching What-if");
  assert(tmStrip.includes("analyzer-tm-reset"), "Reset test id");
  assert(tmStrip.includes('variant="plain"'), "TM Reset uses What-if plain chrome");
  assert(tmStrip.includes("!min-h-11 !px-3"), "TM Reset shares What-if Reset padding");
  assert(!tmStrip.includes("Leave Time Machine"), "Leave Time Machine label gone");
  assert(!/\bClear\b/.test(tmStrip), "no Clear label on TM strip");
  const controls = readFileSync(
    join(here, "../../components/options-lab/AnalyzerControlsColumn.tsx"),
    "utf8",
  );
  assert(
    controls.includes(">Reset<") || /Reset\s*<\/Button>/.test(controls),
    "What-if Reset stays",
  );
  assert(!controls.includes('title="Graph"'), "Graph panel removed from inspector");
  assert(controls.includes('title="Alerts"'), "Alerts inspector in left column");
  {
    const alertsAt = controls.indexOf('title="Alerts"');
    const whatIfAt = controls.indexOf('title="What-if"');
    const gexAt = controls.indexOf('title="GEX"');
    assert(
      alertsAt >= 0 && whatIfAt > alertsAt && gexAt > whatIfAt,
      "What-if sits after Alerts, before GEX",
    );
  }
  assert(controls.includes("analyzer-demo-link"), "Demo links Alerts + What-if");
  assert(controls.includes("data-demo-link"), "Demo wrap is data-driven");
  assert(controls.includes("Demo Mode"), "Demo wrap title");
  assert(controls.includes("analyzer-demo-exit"), "Demo wrap Exit");
  assert(controls.includes('label="Spot"'), "What-if Spot is points, not %");
  assert(controls.includes("analyzer-whatif-spot"), "What-if Spot test id");
  assert(!controls.includes('label="Spot %"'), "Spot % control removed");
  assert(!controls.includes("min={-5}"), "no fixed ±5% Spot slider");
  assert(host.includes("contextmenu"), "right-click alert menu on host");
  assert(
    host.includes("nearestPositionOnExpiration"),
    "position alerts hit per-card at-exp, not a picker",
  );
  assert(host.includes("hoverPosition"), "hover highlights the hit card");
  assert(host.includes("bezierCurveTo"), "T+0 is stroked smooth; expiry stays polyline");
});

console.log(`\n${n} tests passed`);
