/**
 * LIM3 AT-LIM10 · 18 · 21 · 22 · 24 · 27 · 32
 *   npx --yes tsx lib/options-lab/templates/limQuadrant.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HEATMAP_TEMPLATES } from "./registry";
import { computeLimFromNets, type StrikeNet } from "./lim";
import type { LimConfig } from "./limConfig";
import {
  LIM_DOT_OPACITY,
  LIM_MODE_LABEL,
  LIM_PICKER_LABEL,
  limChromeLine3,
  limChromeLines,
  limDotXY,
  limMagFDisplay,
  limPlanePoint,
  limProximityDisplay,
  limRingRadius,
  limStateLine,
  limSurfaceFlags,
} from "./limChrome";

function assert(c: unknown, m: string): void {
  if (!c) throw new Error(`FAIL: ${m}`);
}

const HOTEL: LimConfig = {
  LIM_CENTRE_SCALE_PTS: { "I:SPX": 50 },
  LIM_BAND_CLOSE_PCT: 1,
  LIM_BAND_MEDIUM_PCT: 2,
  LIM_W_NET: 0.5,
  LIM_W_CONC: 0.3,
  LIM_W_MAG: 0.2,
  LIM_CONC_FLOOR: 0,
  LIM_CONC_SPAN: 100,
  LIM_MAG_FLOOR: 0,
  LIM_MAG_SPAN: 100,
  LIM_XPROX_FLOOR_PCT: 0.5,
  LIM_XPROX_CEIL_PCT: 1.5,
  LIM_TRAIL_INTERVAL_S: 30,
  LIM_TRAIL_WINDOW_MIN: 45,
  LIM_DRIFT_MIN_RATE: 1,
  LIM_SHOW_TRANSITION: false,
  LIM_SHOW_ANNOTATIONS: false,
};

function net(strike: number, call: number, put: number, n: number): StrikeNet {
  return { strike, call, put, net: n };
}

function run(nets: StrikeNet[], symbol = "I:SPX") {
  return computeLimFromNets(
    {
      symbol,
      spot: 5000,
      wings: 50,
      expiration: "2026-09-04",
      oiAsOf: null,
      nets,
    },
    HOTEL,
  );
}

const F2 = [
  net(4980, 0, -10, -10),
  net(4990, 0, -10, -10),
  net(5010, 0, -20, -20),
  net(5020, 0, -40, -40),
  net(5120, 0, -20, -20),
];
const F4 = [
  net(4800, 25, 0, 25),
  net(4920, 25, 0, 25),
  net(5080, 25, 0, 25),
  net(5200, 25, 0, 25),
];

// AT-LIM10
{
  const empty = run([]);
  assert(empty.x === 0 && empty.y === 50, "empty centre");
  const neverH = limPlanePoint(null);
  assert(neverH.x === 0 && neverH.y === 50, "AT-LIM10 never-hydrated centre");
  const off = run(F2, "I:NDX");
  assert(off.valid === false, "valid:false");
  const offPt = limPlanePoint(off);
  assert(offPt.x === 0 && offPt.y === 50, "AT-LIM10 valid:false renders centre");
  const pos = limDotXY(0, 50, 200, 200);
  assert(pos.left === 100 && pos.top === 100, "AT-LIM10 dead centre pixels");
  assert(LIM_DOT_OPACITY === 1, "AT-LIM10 full opacity constant");
}

// AT-LIM21 — proximity never the dot
{
  assert(LIM_DOT_OPACITY === 1, "AT-LIM21 dot opacity constant");
  const far = limRingRadius(1, 200);
  const near = limRingRadius(0, 200);
  assert(near > far, "AT-LIM21 ring grows as proximity → 0");
  const a = limDotXY(10, 75, 200, 200);
  const b = limDotXY(10, 75, 200, 200);
  assert(a.left === b.left && a.top === b.top, "AT-LIM21 proximity does not move the dot");
}

// AT-LIM24 Compact
{
  const c = limSurfaceFlags("compact");
  assert(c.ring === true, "AT-LIM24 Compact keeps ring");
  assert(c.chip === false && c.trail === false && c.magF === false, "AT-LIM24 drops chip/trail/readout");
  const comfort = limSurfaceFlags("comfort");
  assert(comfort.chip && comfort.trail && comfort.magF && comfort.ring, "Comfort has chip trail magF ring");
  const compactLines = limChromeLines(null, "compact");
  assert(compactLines.length === 2, "Compact chrome 1 and 3");
  assert(limChromeLines(null, "comfort").length === 4, "Comfort four lines");
}

// AT-LIM27
{
  const lims = HEATMAP_TEMPLATES.filter((t) => t.id === "lim");
  assert(lims.length === 1, "AT-LIM27 one lim template");
  assert(lims[0].layout === "quadrant", "layout quadrant");
  assert(lims[0].label === LIM_PICKER_LABEL, "LIM35 picker");
  assert(lims[0].valueModes.length === 1, "one value mode");
  assert(lims[0].valueModes[0].id === "lim", "ValueModeId lim");
  assert(lims[0].defaultValueMode === "lim", "default lim");
  assert(
    !HEATMAP_TEMPLATES.some((t) => t.id === "session-volume"),
    "AT-LIM27 no session-volume",
  );
  const modeIds = HEATMAP_TEMPLATES.flatMap((t) => t.valueModes.map((m) => m.id));
  assert(modeIds.filter((id) => id === "lim").length === 1, "exactly one lim mode");
}

// AT-LIM18 / 22
{
  const r0 = { expiration: "2026-09-04", wings: 25, crossingCount: 0 };
  const r1 = { expiration: "2026-09-04", wings: 25, crossingCount: 1 };
  const r3 = { expiration: "2026-09-04", wings: 25, crossingCount: 3 };
  for (const r of [r0, r1, r3]) {
    const s = limStateLine(r, "comfort");
    assert(s.includes(`crossings ${r.crossingCount}`), "count in state line");
    assert(!s.includes("4970") && !s.includes("mid"), "AT-LIM18 no crossing price");
  }
  assert(!limStateLine(r3, "compact").includes("crossings"), "Compact drops count");
  assert(
    limChromeLine3(null) ===
      "Open interest as-of date unavailable. Today's trading is not in it.",
    "AT-LIM22 hole",
  );
  assert(
    limChromeLine3("2026-09-01") ===
      "Open interest as of 2026-09-01. Today's trading is not in it.",
    "AT-LIM22 dated line 3",
  );
  const mid = String((4990 + 5010) / 2);
  const chrome = [
    limStateLine(r1, "comfort"),
    ...limChromeLines(null, "comfort"),
    ...limChromeLines("2026-09-01", "compact"),
  ].join("\n");
  assert(!chrome.includes(mid), "AT-LIM20 chrome has no (lo+hi)/2 of F7 interval");
}

// AT-LIM32 / OD-LIM10
{
  const a = run(F2);
  const b = run(F4);
  assert(a.y === 40 && b.y === 40, "F2 and F4 same y");
  assert(a.magF === 80 && b.magF === 0, "magF 80 vs 0");
  const ra = `magF ${limMagFDisplay(a.magF)}`;
  const rb = `magF ${limMagFDisplay(b.magF)}`;
  assert(ra === "magF 80", "AT-LIM32 F2 magF visible");
  assert(rb === "magF 0", "AT-LIM32 F4 magF visible");
  assert(ra !== rb, "equal mix, different magF readout");
}

assert(LIM_PICKER_LABEL === "GEX lean (window)", "placeholder");
assert(LIM_MODE_LABEL === "Lean / near-spot mix", "mode label");
assert(limProximityDisplay(0.5) === "0.50", "chip 0-1 two decimals");

const here = dirname(fileURLToPath(import.meta.url));
const quad = readFileSync(
  join(here, "../../../components/options-lab/HeatmapLimQuadrant.tsx"),
  "utf8",
);
assert(quad.includes("data-testid=\"lim-ring\""), "ring in renderer");
assert(quad.includes("LIM_DOT_OPACITY"), "dot uses constant");
assert(
  !/opacity\s*[*=].*proximity|proximity.*opacity/i.test(quad),
  "AT-LIM21 no proximity×opacity",
);
assert(!quad.includes("animate-spin"), "AT-LIM10 no spinner");
assert(quad.includes("min-h-[var(--hit-min)]") || quad.includes("SegmentedControl"), "44pt density control");

console.log("limQuadrant.test.ts ok");
