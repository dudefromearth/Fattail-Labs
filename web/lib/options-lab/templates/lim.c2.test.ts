/**
 * LIM5 C2 — missing LIM key must not take down frozen GEX / AF / Width Fit.
 *   npx --yes tsx lib/options-lab/templates/lim.c2.test.ts
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import HeatmapLimQuadrant from "@/components/options-lab/HeatmapLimQuadrant";
import { HEATMAP_TEMPLATES, getTemplate } from "./registry";
import { buildGexProfile, fmtGexProfile, gexTemplate } from "./gex";
import { buildGrid, HEATMAP_FLY_WIDTHS, symFlyTemplate } from "./symFly";
import { widthFitComputeCell } from "./widthFit";
import { WIDTH_FIT_TEMPLATE_ID } from "./widthFitTemplate";
import {
  LABS_LIM_ENV_KEYS,
  LimConfigError,
  loadLimConfig,
  resetLimConfigCache,
  type LimEnv,
} from "./limConfig";
import { computeLim } from "./lim";
import type { ChainContext, TemplateParams } from "./types";

function assert(c: unknown, m: string): void {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function row(
  side: "call" | "put",
  strike: number,
  mid: number,
): LadderRow {
  return {
    strike,
    side,
    mid,
    bid: mid - 0.05,
    ask: mid + 0.05,
    delta: 0.5,
    gamma: 0.02,
    theta: -0.05,
    open_interest: 100,
  };
}

function ctx(): ChainContext {
  const contracts = new Map<string, LadderRow>();
  for (const side of ["call", "put"] as const) {
    for (let k = 90; k <= 110; k += 5) {
      contracts.set(contractKey(side, k), row(side, k, 2 + Math.abs(k - 100) * 0.2));
    }
  }
  return {
    symbol: "SPX",
    viewSide: "call",
    spot: 100,
    strikeStep: 5,
    wings: 50,
    contracts,
    asOf: "2026-09-02T15:00:00.000Z",
    contentHash: "c2",
  };
}

function hotelEnv(over: LimEnv = {}): LimEnv {
  const env: LimEnv = {
    LABS_LIM_CENTRE_SCALE_PTS: JSON.stringify({ "I:SPX": 50 }),
    LABS_LIM_BAND_CLOSE_PCT: "1.0",
    LABS_LIM_BAND_MEDIUM_PCT: "2.0",
    LABS_LIM_W_NET: "0.50",
    LABS_LIM_W_CONC: "0.30",
    LABS_LIM_W_MAG: "0.20",
    LABS_LIM_CONC_FLOOR: "0",
    LABS_LIM_CONC_SPAN: "100",
    LABS_LIM_MAG_FLOOR: "0",
    LABS_LIM_MAG_SPAN: "100",
    LABS_LIM_XPROX_FLOOR_PCT: "0.5",
    LABS_LIM_XPROX_CEIL_PCT: "1.5",
    LABS_LIM_TRAIL_INTERVAL_S: "30",
    LABS_LIM_TRAIL_WINDOW_MIN: "45",
    LABS_LIM_DRIFT_MIN_RATE: "1.0",
    LABS_LIM_SHOW_TRANSITION: "false",
    LABS_LIM_SHOW_ANNOTATIONS: "false",
  };
  return { ...env, ...over };
}

const missingKey = "LABS_LIM_BAND_CLOSE_PCT";
resetLimConfigCache();
let limErr: LimConfigError | null = null;
try {
  loadLimConfig(hotelEnv({ [missingKey]: undefined }));
} catch (e) {
  limErr = e instanceof LimConfigError ? e : null;
}
assert(limErr != null, "C2 LIM aborts on missing key");
assert(limErr!.key === missingKey, "C2 names Appendix A key field");
assert(limErr!.message.includes(missingKey), "C2 message names LABS_LIM_BAND_CLOSE_PCT");
assert(!limErr!.message.includes("process.env"), "C2 no process.env dump");
for (const k of LABS_LIM_ENV_KEYS) {
  if (k === missingKey) continue;
  const v = hotelEnv()[k];
  if (v && v.length > 8) {
    assert(!limErr!.message.includes(v), `C2 does not leak sibling ${k}`);
  }
}

const chain = ctx();
const gexPts = buildGexProfile(chain, "gex_net");
assert(gexPts.length > 0, "C2 frozen gex profile still computes");
assert(fmtGexProfile(1e9).length > 0, "C2 frozen gex still formats");
assert(gexTemplate.id === "gex", "C2 gex template object intact");
assert(getTemplate("gex").layout === "profile", "C2 getTemplate(gex) still resolves");

const flyParams: TemplateParams = {
  valueMode: "debit",
  widthMode: "fixed_points",
  fixedPoints: [...HEATMAP_FLY_WIDTHS],
};
const fly = buildGrid(symFlyTemplate, chain, flyParams);
assert(fly.rows.length > 0 && fly.cols.length > 0, "C2 Advanced Fly grid still builds");
assert(fly.cells.some((row) => row.some((c) => c.valid || c.display != null)), "C2 AF cells render");

const wf = widthFitComputeCell(
  chain,
  { strike: 100, label: "100" },
  { id: "w5", label: "5", widthPts: 5 },
  {
    valueMode: "width_fit",
    widthMode: "fixed_points",
    fixedPoints: [...HEATMAP_FLY_WIDTHS],
    flyRowStrikes: [110, 105, 100, 95, 90],
    flyRowIndex: 2,
  },
);
assert(wf.display !== undefined, "C2 Width Fit cell still computes");
assert(getTemplate(WIDTH_FIT_TEMPLATE_ID).id === WIDTH_FIT_TEMPLATE_ID, "C2 WF template resolves");

assert(HEATMAP_TEMPLATES.some((t) => t.id === "gex"), "C2 gex listed");
assert(HEATMAP_TEMPLATES.some((t) => t.id === "sym-fly"), "C2 AF listed");
assert(HEATMAP_TEMPLATES.some((t) => t.id === "width-fit" || t.id === WIDTH_FIT_TEMPLATE_ID), "C2 WF listed");

resetLimConfigCache();
const savedEnv: Record<string, string | undefined> = {};
for (const k of LABS_LIM_ENV_KEYS) {
  savedEnv[k] = process.env[k];
  savedEnv[`NEXT_PUBLIC_${k}`] = process.env[`NEXT_PUBLIC_${k}`];
  delete process.env[k];
  delete process.env[`NEXT_PUBLIC_${k}`];
}
let computeThrew = false;
try {
  computeLim(chain, { expiration: "2026-09-04" });
} catch (e) {
  computeThrew = true;
  assert(e instanceof LimConfigError, "C2 computeLim throws LimConfigError");
} finally {
  for (const [k, v] of Object.entries(savedEnv)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetLimConfigCache();
}
assert(computeThrew, "C2 computeLim aborts when LIM keys are absent from the process");

const html = renderToStaticMarkup(
  createElement(HeatmapLimQuadrant, {
    result: null,
    errorMessage: limErr!.message,
    ghosts: [],
  }),
);
assert(html.includes("heatmap-lim-unavailable"), "C2 LIM unavailable surface renders");
assert(html.includes("LIM unavailable"), "C2 LIM names the failure");
assert(html.includes(missingKey), "C2 rendered copy names the missing key");
assert(!html.includes("process.env"), "C2 rendered copy has no env dump");
assert(!html.includes("data-testid=\"lim-dot\""), "C2 does not paint a LIM reading");

console.log("lim.c2.test.ts ok");
console.log(`C2 missing_key=${missingKey}`);
console.log(`C2 gex_points=${gexPts.length} af_rows=${fly.rows.length} wf_display=${String(wf.display)}`);
console.log(`C2 lim_html_named_key=${html.includes(missingKey) ? "1" : "0"}`);
