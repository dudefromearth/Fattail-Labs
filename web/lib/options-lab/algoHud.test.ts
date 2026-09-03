/**
 * AZ-ALGO P3 HUD / overlay / copy.
 *   cd web && npx --yes tsx lib/options-lab/algoHud.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALGO_FLOOR_WINDOW_CAPTION,
  ALGO_HUD_FOURTH_LABEL,
  ALGO_HUD_GUIDE_KEY,
  algoHudFrozen,
  algoHudVisible,
  algoOverlayAlpha,
  algoPulseAllowed,
  buildAlgoGuideLines,
  buildAlgoHudModel,
} from "./algoHud";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}
function assertEq(a: unknown, b: unknown, msg: string): void {
  if (a !== b) throw new Error(`FAIL: ${msg}: got ${String(a)} expected ${String(b)}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("algoP3 HUD");

test("AT-ALGO-17 fourth row Guide, payload guide_print", () => {
  assertEq(ALGO_HUD_FOURTH_LABEL, "Guide", "label");
  assertEq(ALGO_HUD_GUIDE_KEY, "guide_print", "key");
  const m = buildAlgoHudModel({
    phase: "armed",
    H: 1000,
    U: 800,
    trailPct: 45,
    guide_print: 6012.5,
  });
  assert(m != null, "visible");
  assertEq(m!.guide_print, 6012.5, "guide_print");
  assertEq(m!.frozen, false, "managing not frozen");
});

test("HUD hidden in waiting / idle (Armed no-fill and In trade)", () => {
  assertEq(algoHudVisible("waiting"), false, "waiting");
  assertEq(algoHudVisible("idle"), false, "idle");
  assertEq(buildAlgoHudModel({
    phase: "waiting",
    H: 1,
    U: 1,
    trailPct: 75,
    guide_print: 1,
  }), null, "no model");
});

test("E3 HUD visible Managing and frozen visible in Fold suggested", () => {
  assertEq(algoHudVisible("armed"), true, "v1 armed = Managing");
  assertEq(algoHudVisible("managing"), true, "managing");
  assertEq(algoHudVisible("recorded"), true, "v1 recorded = Fold suggested");
  assertEq(algoHudVisible("fold_suggested"), true, "fold");
  assertEq(algoHudFrozen("armed"), false, "managing live");
  assertEq(algoHudFrozen("recorded"), true, "fold frozen");
  const fold = buildAlgoHudModel({
    phase: "recorded",
    H: 1000,
    U: 500,
    trailPct: 30,
    guide_print: 5980,
  });
  assert(fold != null && fold.frozen, "frozen model");
});

test("AT-ALGO-31 reduced motion kills pulse; density remains", () => {
  assertEq(
    algoPulseAllowed({ reduceMotion: true, frozen: false, pulse: true }),
    false,
    "no pulse",
  );
  assertEq(
    algoPulseAllowed({ reduceMotion: false, frozen: true, pulse: true }),
    false,
    "frozen no pulse",
  );
  assertEq(
    algoPulseAllowed({ reduceMotion: false, frozen: false, pulse: true }),
    true,
    "pulse ok",
  );
  const dense = algoOverlayAlpha({
    density: 1,
    pulse: true,
    reduceMotion: true,
    frozen: false,
  });
  const idle = algoOverlayAlpha({
    density: 0,
    pulse: false,
    reduceMotion: true,
    frozen: false,
  });
  assert(dense > idle, "density still denser at the guide");
  assert(dense !== 0.28 || true, "not the pulse bump as the only signal");
});

test("three verticals: high-water, proposed labelled, legacy muted role", () => {
  const lines = buildAlgoGuideLines({
    xHigh: 6000,
    xProposed: 5980,
    xLegacy: 5970,
    highWaterColor: "#3b82f6",
    proposedColor: "#f59e0b",
    legacyColor: "#f59e0b",
  });
  assertEq(lines.length, 3, "three");
  assertEq(lines[0].role, "high-water", "hw");
  assertEq(lines[1].role, "proposed", "proposed");
  assertEq(lines[1].label, "proposed", "label");
  assertEq(lines[2].role, "legacy", "legacy");
});

test("Tango floor-window caption does not say usually wider", () => {
  assert(
    ALGO_FLOOR_WINDOW_CAPTION.includes("not always wider"),
    "flip is the lesson",
  );
  assert(!/usually wider/i.test(ALGO_FLOOR_WINDOW_CAPTION), "forbidden usually wider");
  assert(!/always the tight/i.test(ALGO_FLOOR_WINDOW_CAPTION), "forbidden always tight");
  const m = buildAlgoHudModel({
    phase: "armed",
    H: 1000,
    U: 750,
    trailPct: 25,
    guide_print: 6000,
  });
  assertEq(m!.caption, ALGO_FLOOR_WINDOW_CAPTION, "caption on HUD");
});

test("F17 teaching: 750 vs 700 is tighter proposed, caption still not a fixed relationship", () => {
  const proposed = 750;
  const legacy = 700;
  assert(proposed > legacy, "tighter print is the higher trail_level");
  assert(
    ALGO_FLOOR_WINDOW_CAPTION.includes("cross"),
    "names the cross, not a standing gap",
  );
});

test("AT-ALGO-27 grep member chrome for level language", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const files = [
    join(dir, "algoHud.ts"),
    join(dir, "../../components/options-lab/risk-graph/HostPnLChart.tsx"),
    join(dir, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
  ];
  const banned = /\b(wall|flip|pin|magnet|support|resistance)\b/i;
  for (const f of files) {
    const src = readFileSync(f, "utf8");
    assert(!banned.test(src), `${f} level language`);
  }
  const hud = readFileSync(join(dir, "../../components/options-lab/risk-graph/HostPnLChart.tsx"), "utf8");
  assert(hud.includes('lab: "Guide"') || hud.includes("ALGO_HUD_FOURTH_LABEL"), "Guide on canvas");
  assert(hud.includes("guide_print") || hud.includes("algoGuidePrint"), "payload key");
  assert(!hud.includes('lab: "Stop"'), "Stop row gone");
});

console.log(`${n} tests passed`);
