/**
 * LIM3 / LIM7 AT-LIM10 · 18 · 21 · 22 · 24 · 27 · 32
 *   npx --yes tsx lib/options-lab/templates/limQuadrant.test.ts
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import HeatmapLimQuadrant from "@/components/options-lab/HeatmapLimQuadrant";
import { HEATMAP_TEMPLATES } from "./registry";
import { computeLimFromNets, type StrikeNet } from "./lim";
import type { LimConfig } from "./limConfig";
import {
  LIM_CHROME_1,
  LIM_CHROME_2,
  LIM_CHROME_4,
  LIM_DISC_R_FLOOR_PT,
  LIM_DISC_R_PT,
  LIM_DISC_SPHERE,
  LIM_GHOST_OPACITY_CAP,
  LIM_LABEL_COMPRESSION,
  LIM_LABEL_EXPANSION,
  LIM_LABEL_WEIGHT_ABOVE,
  LIM_LABEL_WEIGHT_BELOW,
  limDiscRadiusPx,
  limGhostOpacity,
  LIM_DOT_OPACITY,
  LIM_MODE_LABEL,
  LIM_NARROW_PX,
  LIM_PICKER_LABEL,
  limChromeInfoLines,
  limChromeLine3,
  limDotXY,
  limMagFDisplay,
  limNumericHeader,
  limPlanePoint,
  limNoScaleMessage,
  limProximityDisplay,
  limRefusalMessage,
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

const here = dirname(fileURLToPath(import.meta.url));
const quad = readFileSync(
  join(here, "../../../components/options-lab/HeatmapLimQuadrant.tsx"),
  "utf8",
);
const panel = readFileSync(
  join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
  "utf8",
);

// AT-LIM10
{
  const empty = run([]);
  assert(empty.x === 0 && empty.y === 50, "empty centre");
  const neverH = limPlanePoint(null);
  assert(neverH.x === 0 && neverH.y === 50, "AT-LIM10 never-hydrated centre");
  const pos = limDotXY(0, 50, 200, 200);
  assert(pos.left === 100 && pos.top === 100, "AT-LIM10 dead centre pixels");
  assert(LIM_DOT_OPACITY === 1, "AT-LIM10 full opacity constant");
}

// AT-LIM33 — valid:false is a named refusal, not a live centre reading (D1b)
{
  const off = run(F2, "I:NDX");
  assert(off.valid === false, "AT-LIM19/33 valid false");
  assert(off.invalidReason === "no-scale", "AT-LIM33 no-scale reason");
  const msg = limRefusalMessage(off);
  assert(
    msg === "No centre scale configured for I:NDX.",
    "AT-LIM33 names the symbol",
  );
  assert(msg === limNoScaleMessage("I:NDX"), "AT-LIM33 C2-shaped named hole");
  const html = renderToStaticMarkup(
    createElement(HeatmapLimQuadrant, {
      result: off,
      errorMessage: null,
      ghosts: [{ t: 1, xUnclamped: 0, y: 50, opacity: 0.4 }],
    }),
  );
  assert(!html.includes("data-testid=\"lim-dot\""), "AT-LIM33 no live disc");
  assert(!html.includes("data-testid=\"lim-chip-proximity\""), "AT-LIM33 no live chip");
  assert(!html.includes("data-testid=\"lim-ghost\""), "AT-LIM33 no trail");
  assert(html.includes("lim-scale-refusal"), "AT-LIM33 refusal on the plane");
  assert(html.includes("No centre scale configured for I:NDX."), "AT-LIM33 copy");
  assert(!html.includes("Lean "), "AT-LIM33 no live Lean on the plane");
  assert(panel.includes("limPack.result?.valid"), "AT-LIM33 header gated on valid");
  assert(panel.includes("lim-header-refusal"), "AT-LIM33 header names refusal");
  const liveHtml = renderToStaticMarkup(
    createElement(HeatmapLimQuadrant, {
      result: run(F2),
      errorMessage: null,
      ghosts: [],
    }),
  );
  assert(liveHtml.includes("data-testid=\"lim-dot\""), "AT-LIM33 live still paints a disc");
  assert(!liveHtml.includes("lim-scale-refusal"), "AT-LIM33 live has no refusal");
}

// AT-LIM21 — proximity never the dot; no ring
{
  assert(LIM_DOT_OPACITY === 1, "AT-LIM21 dot opacity constant");
  const a = limDotXY(10, 75, 200, 200);
  const b = limDotXY(10, 75, 200, 200);
  assert(a.left === b.left && a.top === b.top, "AT-LIM21 proximity does not move the dot");
  assert(!quad.includes("lim-ring"), "AT-LIM21 no ring element");
  assert(!quad.includes("limRingRadius"), "AT-LIM21 no limRingRadius");
  assert(
    !/opacity\s*[*=].*proximity|proximity.*opacity/i.test(quad),
    "AT-LIM21 no proximity×opacity",
  );
}

// AT-LIM24 — render at a width, not a mode
{
  const narrow = limSurfaceFlags(LIM_NARROW_PX - 1);
  assert(narrow.chip === true, "AT-LIM24 narrow chip survives");
  assert(narrow.trail === false, "AT-LIM24 narrow trail drops");
  const wide = limSurfaceFlags(1280);
  assert(wide.chip === true, "AT-LIM24 wide chip");
  assert(wide.trail === true, "AT-LIM24 wide trail");
  assert(!quad.includes("SegmentedControl"), "AT-LIM24 no density control");
  assert(!quad.includes("userSet"), "AT-LIM24 no userSet");
  assert(!/\bcompact\b/.test(quad.toLowerCase()), "AT-LIM24 no compact mode in renderer");
  const html = renderToStaticMarkup(
    createElement(HeatmapLimQuadrant, {
      result: run(F2),
      errorMessage: null,
      ghosts: [{ t: 1, xUnclamped: 10, y: 60, opacity: 0.4 }],
    }),
  );
  assert(!html.includes("lim-chip-proximity"), "LIM9 S1 no in-plane chip");
  assert(!html.includes("lim-ring"), "AT-LIM24 no ring in render");
  assert(html.includes(LIM_LABEL_EXPANSION), "LIM9 S2 EXPANSION");
  assert(html.includes(LIM_LABEL_COMPRESSION), "LIM9 S2 COMPRESSION");
  assert(html.includes("WEIGHT BELOW"), "LIM9 S2 WEIGHT BELOW");
  assert(html.includes("WEIGHT ABOVE"), "LIM9 S2 WEIGHT ABOVE");
  assert(!html.includes("Weight below · packed"), "LIM9 S1 no cell names");
  assert(limNumericHeader(run(F2)).includes("prox "), "AT-LIM24 prox lives in header");
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
    const s = limStateLine(r);
    assert(s.includes(`crossings ${r.crossingCount}`), "count in state line");
    assert(!s.includes("4970") && !s.includes("mid"), "AT-LIM18 no crossing price");
  }
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
  const info = limChromeInfoLines(null);
  assert(info[0] === LIM_CHROME_1, "AT-LIM22 line 1 verbatim");
  assert(info[1] === LIM_CHROME_2, "AT-LIM22 line 2 verbatim");
  assert(info[2] === limChromeLine3(null), "AT-LIM22 line 3 in info");
  assert(info[3] === LIM_CHROME_4, "AT-LIM22 line 4 verbatim");
  const html = renderToStaticMarkup(
    createElement(HeatmapLimQuadrant, {
      result: run(F2),
      errorMessage: null,
      ghosts: [],
    }),
  );
  assert(
    !html.includes("Open interest as-of date unavailable"),
    "AT-LIM22 line 3 not on the plane",
  );
  assert(!html.includes("lim-chrome-line-3"), "AT-LIM22 no plane footer");
  assert(panel.includes("lim-chrome-info"), "AT-LIM22 info affordance beside title");
  assert(panel.includes("limChromeInfoLines"), "AT-LIM22 four lines reachable via info");
  const mid = String((4990 + 5010) / 2);
  const chrome = [
    limStateLine(r1),
    ...limChromeInfoLines(),
    limChromeLine3(null),
    limChromeLine3("2026-09-01"),
  ].join("\n");
  assert(!chrome.includes(mid), "AT-LIM20 chrome has no (lo+hi)/2 of F7 interval");
}

// AT-LIM32 / OD-LIM10
{
  const a = run(F2);
  const b = run(F4);
  assert(a.y === 40 && b.y === 40, "F2 and F4 same y");
  assert(a.magF === 80 && b.magF === 0, "magF 80 vs 0");
  const ra = limNumericHeader(a);
  const rb = limNumericHeader(b);
  assert(ra.includes("magF 80"), "AT-LIM32 F2 magF visible");
  assert(rb.includes("magF 0"), "AT-LIM32 F4 magF visible");
  assert(ra !== rb, "equal mix, different magF readout");
}

assert(LIM_PICKER_LABEL === "GEX lean (window)", "placeholder");
assert(LIM_MODE_LABEL === "Lean / near-spot mix", "mode label");
assert(limProximityDisplay(0.5) === "0.50", "chip 0-1 two decimals");
assert(LIM_DISC_R_PT === 20, "E25 disc radius at 1440 ref");
assert(limDiscRadiusPx(480, 480) === 20, "E25 20px at 480 plot min");
{
  const at1440 = limDiscRadiusPx(520, 500);
  assert(at1440 >= 18 && at1440 <= 22, "E25 ~18–22 at 1440-class plot");
}
assert(limDiscRadiusPx(200, 200) === LIM_DISC_R_FLOOR_PT, "E25 floor on narrow");
assert(limGhostOpacity(1) === LIM_GHOST_OPACITY_CAP, "newest ghost 30%");
assert(limGhostOpacity(0.2) === 0.06, "opacity scales from 30%");
assert(limGhostOpacity(0) === 0, "oldest near-zero");
assert(quad.includes("limDiscRadiusPx"), "D3 disc scales with plot");
assert(quad.includes("limGhostOpacity"), "S5 ghost opacity in renderer");
assert(quad.includes("LIM_DISC_SPHERE"), "S4 live disc has depth");
assert(!quad.includes("Weight below · packed"), "S1 no packed cell copy");
assert(!/width:\s*6/.test(quad), "D4 no 6px ghost squares");
assert(quad.includes("rounded-full"), "D4 ghosts are circles");
assert(quad.includes("LIM_DOT_OPACITY"), "dot uses constant");
assert(!quad.includes("animate-spin"), "AT-LIM10 no spinner");
assert(!quad.includes("minHeight: minWH"), "E20 no minHeight minWH");
assert(panel.includes("overflow-hidden"), "E20 quadrant overflow hidden");
{
  const gexSrc = readFileSync(join(here, "gex.ts"), "utf8");
  assert(!gexSrc.includes("#34c759"), "S6 no green in shared gex.ts");
  assert(!gexSrc.includes("#ff3b30"), "S6 no red in shared gex.ts");
  assert(quad.includes("data-lim-bar-side"), "S6 companion colours bars");
  assert(quad.includes("lim-gex-view"), "companion GEX view menu");
}

console.log("limQuadrant.test.ts ok");
