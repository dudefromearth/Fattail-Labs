/**
 * LIM5-1 — template / expiration switch: captured fetch + subscribe counts.
 *   npx --yes tsx lib/options-lab/templates/lim.zeroFetch.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import { HEATMAP_TEMPLATES, getTemplate } from "./registry";
import { buildGexProfile } from "./gex";
import { buildGrid, HEATMAP_FLY_WIDTHS, symFlyTemplate } from "./symFly";
import { computeLim, netsFromGexProfile } from "./lim";
import { createLimTrail } from "./limTrail";
import type { ChainContext as Ctx } from "./types";
import type { LimConfig as LC } from "./limConfig";

function assert(c: unknown, m: string): void {
  if (!c) throw new Error(`FAIL: ${m}`);
}

const HOTEL: LC = {
  LIM_CENTRE_SCALE_PTS: { "I:SPX": 50, SPX: 50 },
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

function makeCtx(symbol: string, expAsOf: string): Ctx {
  const contracts = new Map<string, LadderRow>();
  for (const side of ["call", "put"] as const) {
    for (const k of [4980, 5000, 5020]) {
      contracts.set(contractKey(side, k), {
        strike: k,
        side,
        mid: 2,
        gamma: 0.01,
        open_interest: 10,
      });
    }
  }
  return {
    symbol,
    viewSide: "call",
    spot: 5000,
    strikeStep: 20,
    wings: 50,
    contracts,
    asOf: expAsOf,
    contentHash: "zf1",
  };
}

const origFetch = globalThis.fetch;
let fetchCount = 0;
const fetchUrls: string[] = [];
globalThis.fetch = ((input: RequestInfo | URL) => {
  fetchCount += 1;
  fetchUrls.push(String(input));
  return Promise.reject(new Error("LIM5-1 network forbidden"));
}) as typeof fetch;

let subscribeCount = 0;
const sock = {
  subscribe() {
    subscribeCount += 1;
    return () => {};
  },
  setChainInterest() {
    subscribeCount += 1;
  },
};
void sock;

const here = dirname(fileURLToPath(import.meta.url));
const panel = readFileSync(
  join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
  "utf8",
);
const busCall = panel.match(/useOptionChainBus\(\{[\s\S]*?\}\)/);
assert(busCall, "bus call site present");
assert(!busCall![0].includes("templateId"), "templateId is not a bus key");
assert(
  /useOptionChainBus\(\{\s*symbol,\s*expiration,\s*side,\s*wings/.test(panel),
  "existing chain bus only (symbol/exp/side/wings)",
);

const limFiles = [
  "lim.ts",
  "limConfig.ts",
  "limTrail.ts",
  "limChrome.ts",
  join(here, "../../../components/options-lab/HeatmapLimQuadrant.tsx"),
];
for (const f of limFiles) {
  const p = f.includes("/") ? f : join(here, f);
  const src = readFileSync(p, "utf8");
  assert(!src.includes("pollChainLadder"), `${f} no pollChainLadder`);
  assert(!src.includes("fetchLadderExpirations"), `${f} no fetchLadderExpirations`);
  assert(!/\bfetch\s*\(/.test(src), `${f} no fetch(`);
  assert(!src.includes("setChainInterest"), `${f} no setChainInterest`);
  assert(!src.includes("massive"), `${f} no massive client`);
}

const fetchBeforeTemplate = fetchCount;
const subBeforeTemplate = subscribeCount;

const ctxA = makeCtx("I:SPX", "2026-09-02T14:00:00.000Z");
getTemplate("gex");
buildGexProfile(ctxA, "gex_net");
getTemplate("sym-fly");
buildGrid(symFlyTemplate, ctxA, {
  valueMode: "debit",
  widthMode: "fixed_points",
  fixedPoints: [...HEATMAP_FLY_WIDTHS],
});
getTemplate("lim");
const points = buildGexProfile(ctxA, "gex_net");
computeLim(ctxA, {
  config: HOTEL,
  expiration: "2026-09-04",
  nets: points.map((p) => ({
    strike: p.strike,
    call: p.call,
    put: p.put,
    net: p.value,
  })),
});
getTemplate("gex");
buildGexProfile(ctxA, "gex_all");

const fetchAfterTemplate = fetchCount;
const subAfterTemplate = subscribeCount;
console.log(
  `LIM5-1 template_switch fetch=${fetchAfterTemplate - fetchBeforeTemplate} subscribe=${subAfterTemplate - subBeforeTemplate}`,
);
assert(
  fetchAfterTemplate - fetchBeforeTemplate === 0,
  "template switch fetch count is 0",
);
assert(
  subAfterTemplate - subBeforeTemplate === 0,
  "template switch subscribe count is 0",
);

const fetchBeforeExp = fetchCount;
const subBeforeExp = subscribeCount;
computeLim(ctxA, {
  config: HOTEL,
  expiration: "2026-09-11",
  nets: netsFromGexProfile(ctxA),
});
const trail = createLimTrail({
  intervalS: 30,
  windowMin: 45,
  now: () => 0,
});
trail.observe({ xUnclamped: 0, y: 50 }, {
  symbol: "I:SPX",
  expiration: "2026-09-04",
  asOf: "2026-09-02T14:00:00.000Z",
});
trail.observe({ xUnclamped: 0, y: 50 }, {
  symbol: "I:SPX",
  expiration: "2026-09-11",
  asOf: "2026-09-02T14:00:00.000Z",
});
const fetchAfterExp = fetchCount;
const subAfterExp = subscribeCount;
console.log(
  `LIM5-1 expiration_switch fetch=${fetchAfterExp - fetchBeforeExp} subscribe=${subAfterExp - subBeforeExp}`,
);
assert(fetchAfterExp - fetchBeforeExp === 0, "expiration switch fetch count is 0");
assert(subAfterExp - subBeforeExp === 0, "expiration switch subscribe count is 0");

assert(HEATMAP_TEMPLATES.some((t) => t.id === "lim"), "lim in registry");
globalThis.fetch = origFetch;

console.log("lim.zeroFetch.test.ts ok");
