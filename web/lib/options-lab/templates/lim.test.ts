/**
 * LIM AT-LIM1–13, 16, 17, 17b, 19, 20, 26, 28–31 · Hotel goldens F1–F9
 * Spec v0.4.3 (E15–E17). No yUnclamped.
 *   npx --yes tsx lib/options-lab/templates/lim.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import type { ChainContext } from "./types";
import { HEATMAP_TEMPLATES } from "./registry";
import {
  LABS_LIM_ENV_KEYS,
  LimConfigError,
  loadLimConfig,
  resetLimConfigCache,
  type LimConfig,
  type LimEnv,
} from "./limConfig";
import {
  computeLim,
  computeLimFromNets,
  nearestAtmStrike,
  type LimResult,
  type StrikeNet,
} from "./lim";
import {
  limRefusalMessage,
  limStraddleUnavailableMessage,
} from "./limChrome";

function assert(c: unknown, m: string): void {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function almost(a: number, b: number, eps = 1e-12): boolean {
  return Math.abs(a - b) <= eps;
}

const STRADDLE_K = 3.2712422351724415;
const DEFAULT_S = 20;

function xs(
  centrePts: number,
  S = DEFAULT_S,
): { x: number; xUnclamped: number } {
  const ratio = centrePts / (STRADDLE_K * S);
  return { x: 100 * Math.tanh(ratio), xUnclamped: 100 * ratio };
}

const HOTEL: LimConfig = {
  LIM_STRADDLE_K: STRADDLE_K,
  LIM_BAND_CLOSE_PCT: 1.0,
  LIM_BAND_MEDIUM_PCT: 2.0,
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
  LIM_DRIFT_MIN_RATE: 1.0,
  LIM_SHOW_TRANSITION: false,
  LIM_SHOW_ANNOTATIONS: false,
};

function net(
  strike: number,
  call: number,
  put: number,
  n: number,
): StrikeNet {
  return { strike, call, put, net: n };
}

function run(
  nets: StrikeNet[],
  symbol = "I:SPX",
  mids: { callMid: number | null; putMid: number | null } = {
    callMid: 10,
    putMid: 10,
  },
  spot: number | null = 5000,
): LimResult {
  return computeLimFromNets(
    {
      symbol,
      spot,
      wings: 50,
      expiration: "2026-09-02",
      oiAsOf: null,
      nets,
      callMid: mids.callMid,
      putMid: mids.putMid,
    },
    HOTEL,
  );
}

function recombine(r: LimResult): number {
  const netF = ((r.netRatio + 1) / 2) * 100;
  return netF * 0.5 + r.concF * 0.3 + r.magF * 0.2;
}

function expectCore(
  r: LimResult,
  exp: {
    x: number;
    y: number;
    netRatio: number;
    concF: number;
    magF: number;
    crossingCount: number;
  },
  label: string,
): void {
  assert(almost(r.x, exp.x, 1e-9), `${label} x ${r.x} !== ${exp.x}`);
  assert(r.y === exp.y, `${label} y ${r.y} !== ${exp.y}`);
  assert(r.lean === r.x, `${label} lean === x`);
  assert(r.nearSpotMix === r.y, `${label} nearSpotMix === y`);
  assert(r.netRatio === exp.netRatio, `${label} netRatio`);
  assert(r.concF === exp.concF, `${label} concF`);
  assert(r.magF === exp.magF, `${label} magF`);
  assert(r.crossingCount === exp.crossingCount, `${label} crossingCount`);
  assert(!("yUnclamped" in r), `${label} no yUnclamped`);
  assert(r.y >= 0 && r.y <= 100, `${label} AT-LIM26 y in [0,100]`);
}

// --- Hotel F1 — positive-gamma window (AT-LIM1, AT-LIM4) ---
const F1 = [
  net(4980, 20, 0, 20),
  net(4990, 10, 0, 10),
  net(5010, 10, 0, 10),
  net(5020, 40, 0, 40),
];
{
  const r = run(F1);
  const x1 = xs(5);
  expectCore(r, { x: x1.x, y: 100, netRatio: 1, concF: 100, magF: 100, crossingCount: 0 }, "F1");
  assert(r.x > 0, "AT-LIM1 mass above → x > 0");
  assert(r.x > -100 && r.x < 100, "AT-LIMS1 F1 inside");
  assert(r.y > 50, "AT-LIM4 all-positive near spot → y > 50");
  assert(almost(r.xUnclamped, x1.xUnclamped, 1e-9), "F1 xUnclamped = 100·r");
  assert(r.centrePts === 5, "F1 centrePts");
  assert(r.crossingProximity === 1, "F1 no nearest → proximity 1");
  assert(almost(r.y, recombine(r)), "AT-LIM16 F1 recombine");
  assert(r.valid === true, "F1 I:SPX valid");
}

// --- Hotel F2 — negative, mass above (AT-LIM5, AT-LIM6) ---
const F2 = [
  net(4980, 0, -10, -10),
  net(4990, 0, -10, -10),
  net(5010, 0, -20, -20),
  net(5020, 0, -40, -40),
  net(5120, 0, -20, -20),
];
{
  const r = run(F2);
  const x2 = xs(31);
  expectCore(r, { x: x2.x, y: 40, netRatio: -1, concF: 80, magF: 80, crossingCount: 0 }, "F2");
  assert(r.x > 0 && r.y < 50, "AT-LIM6 x > 0 and y < 50");
  assert(r.y < 50, "AT-LIM5 negative near spot (this geometry) → y < 50");
  assert(almost(r.xUnclamped, x2.xUnclamped, 1e-9), "F2 xUnclamped = 100·r");
  assert(almost(r.y, recombine(r)), "AT-LIM16 F2 recombine");
}

// --- Hotel F3 — symmetric (AT-LIM3) ---
const F3 = [
  net(4970, 30, 0, 30),
  net(4980, 20, 0, 20),
  net(5020, 20, 0, 20),
  net(5030, 30, 0, 30),
];
{
  const r = run(F3);
  expectCore(r, { x: 0, y: 100, netRatio: 1, concF: 100, magF: 100, crossingCount: 0 }, "F3");
  assert(almost(r.x, 0), "AT-LIM3 x ≈ 0");
  const flipped = run(F3.map((n) => net(n.strike, 0, -n.net!, -n.net!)));
  assert(flipped.x === 0, "AT-LIM3 sign-flip x stays 0");
  assert(flipped.y === 50, "AT-LIM3 sign-flip concentrated-negative y = 50");
}

// --- Hotel F4 — mass outside close ---
const F4 = [
  net(4800, 25, 0, 25),
  net(4920, 25, 0, 25),
  net(5080, 25, 0, 25),
  net(5200, 25, 0, 25),
];
{
  const r = run(F4);
  expectCore(r, { x: 0, y: 40, netRatio: 0, concF: 50, magF: 0, crossingCount: 0 }, "F4");
  assert(almost(r.y, recombine(r)), "AT-LIM16 F4 recombine");
}

// --- Hotel F5 — Σ|net| == 0 (AT-LIM9 · LIM8) ---
{
  const empty = run([]);
  expectCore(empty, { x: 0, y: 50, netRatio: 0, concF: 0, magF: 0, crossingCount: 0 }, "F5a");
  assert(empty.crossingProximity === 1, "F5a proximity 1");
  assert(empty.nearestCrossing === null, "F5a no nearest");
  assert(empty.valid === true, "F5a I:SPX still valid");
  const zeros = run([net(4980, 0, 0, 0), net(5000, 0, 0, 0), net(5020, 0, 0, 0)]);
  expectCore(zeros, { x: 0, y: 50, netRatio: 0, concF: 0, magF: 0, crossingCount: 0 }, "F5b");
  assert(zeros.y === 50, "AT-LIM9 LIM8 overrides blend (not 0)");
  assert(
    zeros.y !== recombine(zeros),
    "F5 AT-LIM16 waived: LIM8 y=50, not the blend",
  );
}

// --- Hotel F6 — three crossings (AT-LIM2, AT-LIM11, AT-LIM12, E15) ---
const F6 = [
  net(4920, 10, 0, 10),
  net(4940, 0, -10, -10),
  net(4960, 40, 0, 40),
  net(4980, 0, -20, -20),
  net(5020, 0, -20, -20),
];
{
  const r = run(F6);
  const x6 = xs(-30);
  expectCore(r, { x: x6.x, y: 71, netRatio: 0, concF: 100, magF: 80, crossingCount: 3 }, "F6");
  assert(r.x < 0, "AT-LIM2 mass below → x < 0");
  assert(r.crossings.length === 3, "AT-LIM11 count 3");
  assert(r.crossings[0].lo === 4920 && r.crossings[0].hi === 4940, "F6 c1 interval");
  assert(r.crossings[1].lo === 4940 && r.crossings[1].hi === 4960, "F6 c2 interval");
  assert(r.crossings[2].lo === 4960 && r.crossings[2].hi === 4980, "F6 c3 interval");
  assert(r.crossings[0].steepness === 1, "F6 steepness 1");
  assert(r.crossings[1].steepness === 2.5, "F6 steepness 2.5");
  assert(r.crossings[2].steepness === 3, "F6 steepness 3");
  const steep = r.crossings.map((c) => c.steepness);
  assert(new Set(steep).size === 3, "AT-LIM12 cliff vs smear steepness differs");
  assert(r.nearestCrossing?.lo === 4960 && r.nearestCrossing?.hi === 4980, "F6 nearest");
  assert(r.distanceToCrossing === 20, "F6 dist 20");
  assert(r.spotBelowNearestCrossing === false, "F6 E17 spot not below lo");
  assert(r.crossingProximity === 0, "F6 E15 dPct=0.40% → proximity 0");
  for (const c of r.crossings) {
    const mid = (c.lo + c.hi) / 2;
    assert(c.lo !== mid && c.hi !== mid, "AT-LIM20 no midpoint field");
  }
  assert(almost(r.y, recombine(r)), "AT-LIM16 F6 recombine");
}

// --- Hotel F7 — spot inside (AT-LIM7, AT-LIM30, AT-LIM31) ---
const F7 = [
  net(4970, 30, 0, 30),
  net(4990, 10, 0, 10),
  net(5000, 0, 0, 0),
  net(5010, 0, -10, -10),
  net(5030, 0, -30, -30),
];
{
  const r = run(F7);
  expectCore(r, { x: 0, y: 75, netRatio: 0, concF: 100, magF: 100, crossingCount: 1 }, "F7");
  assert(r.crossingProximity === 0, "AT-LIM7 proximity 0");
  assert(r.x === 0 && r.y === 75, "AT-LIM7 x,y unchanged by proximity");
  assert(r.crossings[0].lo === 4990 && r.crossings[0].hi === 5010, "F7 interval skips ATM 0");
  assert(r.crossings[0].steepness === 1, "AT-LIM30 steepness uses (hi−lo)=20, not step 10");
  assert(r.distanceToCrossing === 0, "AT-LIM31 dist 0");
  assert(r.spotBelowNearestCrossing === false, "AT-LIM31 inside is not below");
  assert(almost(r.y, recombine(r)), "AT-LIM16 F7 recombine");
}

// --- Hotel F8 — leanRaw > 100 (AT-LIM13) ---
const F8 = [net(5100, 50, 0, 50), net(5200, 50, 0, 50)];
{
  const r = run(F8);
  const x8 = xs(150);
  expectCore(r, { x: x8.x, y: 40, netRatio: 0, concF: 50, magF: 0, crossingCount: 0 }, "F8");
  assert(almost(r.xUnclamped, x8.xUnclamped, 1e-9), "AT-LIMS9 F8 xUnclamped = 100·r");
  assert(Math.abs(r.xUnclamped) > 100, "AT-LIMS9 trail value past the edge");
  assert(r.x > -100 && r.x < 100, "AT-LIMS1 F8 displayed x inside");
  assert(r.xUnclamped !== r.x, "AT-LIM13 xUnclamped ≠ x");
  assert(almost(r.y, recombine(r)), "AT-LIM16 F8 recombine");
}

// --- Hotel F9 — interior proximity (AT-LIM29) ---
const F9 = [
  net(4900, 10, 0, 10),
  net(5000, 10, 0, 10),
  net(5050, 10, 0, 10),
  net(5060, 0, -10, -10),
];
{
  const r = run(F9);
  const x9 = xs(2.5);
  expectCore(r, { x: x9.x, y: 90, netRatio: 1, concF: 100, magF: 50, crossingCount: 1 }, "F9");
  assert(r.crossingProximity === 0.5, "AT-LIM29 proximity 0.50");
  assert(r.crossingProximity > 0 && r.crossingProximity < 1, "AT-LIM29 strictly interior");
  assert(r.distanceToCrossing === 50, "F9 dist 50");
  assert(r.spotBelowNearestCrossing === true, "F9 spot < lo");
  assert(r.crossings[0].lo === 5050 && r.crossings[0].hi === 5060, "F9 interval");
  assert(r.crossings[0].steepness === 2, "F9 E16 steepness 2");
  assert(almost(r.y, recombine(r)), "AT-LIM16 F9 recombine");
}

// --- AT-LIM8 — beyond ceil ---
{
  const far = run([
    net(4900, 10, 0, 10),
    net(4920, 0, -10, -10),
    net(4980, 0, -10, -10),
    net(5020, 0, -10, -10),
  ]);
  assert(far.crossingCount === 1, "AT-LIM8 one far crossing");
  assert(far.nearestCrossing?.lo === 4900 && far.nearestCrossing?.hi === 4920, "AT-LIM8 interval");
  assert(far.distanceToCrossing === 80, "AT-LIM8 dist 80");
  assert((80 / 5000) * 100 === 1.6, "AT-LIM8 dPct 1.6% > 1.5 ceil");
  assert(far.crossingProximity === 1, "AT-LIM8 proximity 1");
}

// --- AT-LIM19 retired. One k. A symbol with a straddle is valid (AT-LIMS4 inverse). ---
{
  const r = run(F1, "I:NDX");
  const x1 = xs(5);
  assert(r.valid === true, "I:NDX with a straddle is valid");
  assert(r.invalidReason === null, "I:NDX no refusal");
  assert(almost(r.x, x1.x, 1e-9), "I:NDX uses the same k and S");
}

// --- AT-LIM17 / 17b — loadLimConfig ---
function hotelEnv(over: LimEnv = {}): LimEnv {
  const env: LimEnv = {
    LABS_LIM_STRADDLE_K: String(STRADDLE_K),
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

{
  resetLimConfigCache();
  const cfg = loadLimConfig(hotelEnv());
  assert(cfg.LIM_STRADDLE_K === STRADDLE_K, "parse straddle k");
  assert(cfg.LIM_W_NET + cfg.LIM_W_CONC + cfg.LIM_W_MAG === 1, "W sum 1.0");
  assert(cfg.LIM_SHOW_TRANSITION === false, "bool false");
}

{
  resetLimConfigCache();
  const prefixed = hotelEnv();
  for (const k of LABS_LIM_ENV_KEYS) {
    prefixed[`NEXT_PUBLIC_${k}`] = prefixed[k];
    delete prefixed[k];
  }
  const cfg = loadLimConfig(prefixed);
  assert(cfg.LIM_BAND_CLOSE_PCT === 1, "NEXT_PUBLIC_ seam");
}

{
  let threw = false;
  try {
    loadLimConfig(hotelEnv({ LABS_LIM_W_NET: undefined }));
  } catch (e) {
    threw = true;
    assert(e instanceof LimConfigError, "AT-LIM17 LimConfigError");
    assert(
      (e as LimConfigError).message.includes("LABS_LIM_W_NET"),
      "AT-LIM17 names Appendix A key",
    );
    assert(
      !(e as LimConfigError).message.includes("process.env"),
      "AT-LIM17 does not dump env",
    );
  }
  assert(threw, "AT-LIM17 missing key aborts");
}

{
  let threw = false;
  try {
    loadLimConfig(hotelEnv({ LABS_LIM_W_MAG: "0.10" }));
  } catch (e) {
    threw = true;
    assert(e instanceof LimConfigError, "AT-LIM17b type");
    assert(
      (e as LimConfigError).message.includes("1.0"),
      "AT-LIM17b names the sum rule",
    );
  }
  assert(threw, "AT-LIM17b W sum ≠ 1.0 aborts");
}

// --- computeLim wiring via empty ctx (buildGexProfile path) ---
{
  const ctx: ChainContext = {
    symbol: "I:SPX",
    viewSide: "call",
    spot: 5000,
    strikeStep: 10,
    wings: 50,
    contracts: new Map(),
    asOf: null,
    contentHash: null,
  };
  const r = computeLim(ctx, { config: HOTEL, expiration: "2026-09-02" });
  assert(r.x === 0 && r.y === 50, "computeLim empty profile → centre");
  assert(r.valid === false, "empty contracts have no ATM straddle");
  assert(r.invalidReason === "no-straddle", "empty contracts → no-straddle");
  assert(
    limRefusalMessage(r) ===
      limStraddleUnavailableMessage("I:SPX", "2026-09-02"),
    "empty contracts use the straddle sentence",
  );
  assert(r.expiration === "2026-09-02", "expiration stamped");
  assert(r.oiAsOf === null, "JR3 oiAsOf hole");
}

// --- C2: other templates still import; LIM not in registry yet ---
{
  assert(
    HEATMAP_TEMPLATES.some((t) => t.id === "gex"),
    "C2 frozen gex still registered",
  );
  assert(
    HEATMAP_TEMPLATES.some((t) => t.id === "sym-fly"),
    "C2 sym-fly still registered",
  );
  assert(
    HEATMAP_TEMPLATES.some((t) => t.id === "lim"),
    "LIM3 registry has lim",
  );
  assert(
    !HEATMAP_TEMPLATES.some((t) => t.id === "session-volume"),
    "AT-LIM27 no session-volume",
  );
}

// --- AT-LIM20 · AT-LIM26 · AT-LIM28 source greps ---
{
  const here = dirname(fileURLToPath(import.meta.url));
  const banned = ["LIM", "CONF_"].join("_");
  for (const f of ["lim.ts", "limConfig.ts"]) {
    const text = readFileSync(join(here, f), "utf8");
    assert(!text.includes(banned), `AT-LIM28 ${f} has retired prefix`);
  }
  const limSrc = readFileSync(join(here, "lim.ts"), "utf8");
  assert(
    !/\byUnclamped\b/.test(limSrc),
    "AT-LIM26 no yUnclamped identifier in lim.ts",
  );
  const mixAssign = limSrc.match(/const nearSpotMix =\s*[\s\S]*?;/);
  assert(mixAssign, "AT-LIM26 nearSpotMix assignment present");
  assert(
    !/clamp\s*\(/.test(mixAssign[0]),
    "AT-LIM26 nearSpotMix assignment contains no clamp(",
  );
  assert(
    !/\(\s*(lo|c\.lo)\s*\+\s*(hi|c\.hi)\s*\)\s*\/\s*2/.test(limSrc),
    "AT-LIM20 no (lo+hi)/2 in lim.ts",
  );
}

// --- D2 bundler seam: 17 literal process.env.NEXT_PUBLIC_LABS_LIM_* ---
{
  const here = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(here, "limConfig.ts"), "utf8");
  assert(LABS_LIM_ENV_KEYS.length === 17, "Appendix A is 17 keys");
  for (const k of LABS_LIM_ENV_KEYS) {
    const needle = `process.env.NEXT_PUBLIC_${k}`;
    const hits = src.split(needle).length - 1;
    assert(hits >= 1, `D2 literal ${needle} in limConfig.ts`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));

// --- AT-LIMS1 — displayed x is strictly inside the open interval ---
{
  const huge = run([net(9000, 50, 0, 50), net(9500, 50, 0, 50)]);
  assert(huge.centrePts > 0, "AT-LIMS1 huge centre");
  for (const r of [run(F1), run(F2), run(F6), run(F8), run([]), huge]) {
    assert(r.valid, "AT-LIMS1 sample valid");
    assert(r.x > -100 && r.x < 100, `AT-LIMS1 ${r.x} not strictly inside`);
    assert(r.x !== 100 && r.x !== -100, "AT-LIMS1 not on the edge");
  }
}

// --- AT-LIMS2 — order of r is the order of x ---
{
  const below = run(F6);
  const mid = run(F1);
  const above = run(F2);
  assert(below.centrePts < mid.centrePts && mid.centrePts < above.centrePts, "AT-LIMS2 centres ordered");
  assert(below.x < mid.x && mid.x < above.x, "AT-LIMS2 x order preserved");
}

// --- AT-LIMS3 — SPX calibration sample, type-7 median |x| ---
{
  const fixture = JSON.parse(
    readFileSync(join(here, "lim.straddle-spx.json"), "utf8"),
  ) as { n: number; rows: Array<[number, number]> };
  assert(fixture.n === 3268, "AT-LIMS3 SPX minute count");
  assert(fixture.rows.length === 3268, "AT-LIMS3 row count");
  const absX: number[] = [];
  for (const [centre, straddle] of fixture.rows) {
    assert(straddle > 0, "AT-LIMS3 straddle positive");
    const ratio = Math.abs(centre) / (STRADDLE_K * straddle);
    absX.push(100 * Math.tanh(ratio));
  }
  absX.sort((a, b) => a - b);
  const h = 0.5 * (absX.length - 1);
  const lo = Math.floor(h);
  const median = absX[lo] * (1 - (h - lo)) + absX[lo + 1] * (h - lo);
  assert(Math.abs(median - 11.13) <= 0.5, `AT-LIMS3 median ${median} outside 11.13 ± 0.5`);
  assert(almost(median, 11.130000000000003, 1e-6), `AT-LIMS3 median ${median}`);
}

// --- AT-LIMS4 member half. Admin half is a known gap (no Admin Notifications Spec v1.1). ---
{
  const missingCall = run(F1, "SPX", { callMid: null, putMid: 12 });
  assert(missingCall.valid === false, "AT-LIMS4 missing call → invalid");
  assert(missingCall.invalidReason === "no-straddle", "AT-LIMS4 reason");
  assert(missingCall.x === 0 && missingCall.xUnclamped === 0, "AT-LIMS4 no invented x");
  const msg = limRefusalMessage(missingCall);
  assert(
    msg === "Quad window unavailable for SPX 2026-09-02: ATM straddle not available.",
    "AT-LIMS4 member sentence",
  );
  assert(msg === limStraddleUnavailableMessage("SPX", "2026-09-02"), "AT-LIMS4 helper");
  const missingPut = run(F1, "QQQ", { callMid: 4, putMid: null });
  assert(missingPut.valid === false && missingPut.invalidReason === "no-straddle", "AT-LIMS4 missing put");
  assert(
    limRefusalMessage(missingPut) ===
      "Quad window unavailable for QQQ 2026-09-02: ATM straddle not available.",
    "AT-LIMS4 put sentence",
  );
}

// --- AT-LIMS5 — S ≤ 0 ---
{
  for (const mids of [
    { callMid: 0, putMid: 0 },
    { callMid: -3, putMid: 1 },
    { callMid: 2, putMid: -2 },
  ]) {
    const r = run(F1, "SPY", mids);
    assert(r.valid === false, "AT-LIMS5 invalid");
    assert(r.invalidReason === "no-straddle", "AT-LIMS5 reason");
    assert(
      limRefusalMessage(r) ===
        "Quad window unavailable for SPY 2026-09-02: ATM straddle not available.",
      "AT-LIMS5 sentence",
    );
  }
}

// --- AT-LIMS6 — k absent, non-finite, or ≤ 0 aborts ---
{
  for (const bad of [undefined, "", "0", "-1", "NaN", "Infinity"] as const) {
    let threw = false;
    try {
      loadLimConfig(hotelEnv({ LABS_LIM_STRADDLE_K: bad }));
    } catch (e) {
      threw = true;
      assert(e instanceof LimConfigError, "AT-LIMS6 LimConfigError");
      assert(
        (e as LimConfigError).message.includes("LABS_LIM_STRADDLE_K"),
        "AT-LIMS6 names the key",
      );
    }
    assert(threw, `AT-LIMS6 ${String(bad)} aborts`);
  }
}

// --- AT-LIMS7 is live RTH evidence in the Delta gate, not this process. ---

// --- AT-LIMS8 — live product files do not keep the retired key ---
{
  const retired = ["LIM_CENTRE", "SCALE_PTS"].join("_");
  const roots = [
    join(here, "lim.ts"),
    join(here, "limConfig.ts"),
    join(here, "limChrome.ts"),
    join(here, "lim.test.ts"),
    join(here, "limQuadrant.test.ts"),
    join(here, "lim.c2.test.ts"),
    join(here, "lim.zeroFetch.test.ts"),
    join(here, "lim.vocab.test.ts"),
    join(here, "../../../components/options-lab/HeatmapLimQuadrant.tsx"),
    join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
    join(here, "../../../.env.example"),
    join(here, "../../../../Architecture/29-options-lab-heatmap-templates.md"),
  ];
  for (const p of roots) {
    const text = readFileSync(p, "utf8");
    assert(!text.includes(retired), `AT-LIMS8 ${p}`);
  }
}

// --- AT-LIMS9 — panel trail still consumes xUnclamped ---
{
  const panel = readFileSync(
    join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
    "utf8",
  );
  assert(panel.includes("xUnclamped: limPack.result.xUnclamped"), "AT-LIMS9 trail observe");
  const quad = readFileSync(
    join(here, "../../../components/options-lab/HeatmapLimQuadrant.tsx"),
    "utf8",
  );
  assert(quad.includes("limGhostXY(g.xUnclamped"), "AT-LIMS9 ghosts use xUnclamped");
}

// --- ATM strike: tie takes the lower strike; a missing mid is not borrowed ---
{
  const tie = new Map<string, LadderRow>();
  tie.set(contractKey("call", 4990), { strike: 4990, side: "call", mid: 3 });
  tie.set(contractKey("put", 4990), { strike: 4990, side: "put", mid: 7 });
  tie.set(contractKey("call", 5010), { strike: 5010, side: "call", mid: 100 });
  tie.set(contractKey("put", 5010), { strike: 5010, side: "put", mid: 100 });
  assert(nearestAtmStrike(tie, 5000) === 4990, "tie → lower strike");
  const ctx: ChainContext = {
    symbol: "SPX",
    viewSide: "call",
    spot: 5000,
    strikeStep: 10,
    wings: 50,
    contracts: tie,
    asOf: null,
    contentHash: null,
  };
  const tied = computeLim(ctx, { config: HOTEL, expiration: "2026-09-02", nets: F1 });
  const viaLower = xs(5, 10);
  assert(tied.valid === true, "tie straddle valid");
  assert(almost(tied.x, viaLower.x, 1e-9), "tie uses S at the lower strike");
  assert(!almost(tied.x, xs(5, 200).x, 1e-6), "tie does not use the upper strike");

  const hole = new Map<string, LadderRow>();
  hole.set(contractKey("call", 4990), { strike: 4990, side: "call", mid: 3 });
  hole.set(contractKey("put", 4990), { strike: 4990, side: "put", mid: null });
  hole.set(contractKey("call", 5010), { strike: 5010, side: "call", mid: 100 });
  hole.set(contractKey("put", 5010), { strike: 5010, side: "put", mid: 100 });
  const missed = computeLim(
    { ...ctx, contracts: hole },
    { config: HOTEL, expiration: "2026-09-02", nets: F1 },
  );
  assert(missed.valid === false, "missing ATM put is not borrowed");
  assert(missed.invalidReason === "no-straddle", "missing ATM put reason");
}

// --- Missing spot keeps the spot sentence ---
{
  const r = run(F1, "TSLA", { callMid: 10, putMid: 10 }, null);
  assert(r.valid === false && r.invalidReason === "no-spot", "no spot reason");
  assert(limRefusalMessage(r) === "No spot for TSLA.", "no spot sentence");
}

console.log("lim.test.ts ok");
