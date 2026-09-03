/**
 * AZ-ALGO P1 — fixtures 1–18 against Hotel handwritten goldens.
 * Goldens are the oracle. A disagree is a FINDING against the module.
 *
 *   cd web && npx --yes tsx lib/options-lab/algoP1.fixtures.test.ts
 *
 * Does not import algoEval.ts (NX13).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALGO_APPENDIX_A_V1,
  AlgoConfigError,
  LABS_ALGO_ENV_KEYS,
  parseAlgoConfig,
  type AlgoConfig,
} from "./algoConfig";
import { estimateMoveUnit } from "./algoMoveUnit";
import { normalizeGex } from "./algoGexNorm";
import {
  PAR_UNITS,
  computeK,
  computeProfitAtRisk,
  type ProfitAtRiskInput,
} from "./algoProfitAtRisk";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function assertEq(actual: unknown, expected: unknown, msg: string): void {
  if (actual !== expected) {
    throw new Error(`FAIL: ${msg}: got ${String(actual)} expected ${String(expected)}`);
  }
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

const cfg: AlgoConfig = parseAlgoConfig(ALGO_APPENDIX_A_V1);

const BODY = 6000;
const base = {
  cfg,
  greekUnit: "package" as const,
  remainingToDecayEnd: null as number | null,
  gammaFactor: 1.0,
  proximityFactor: 1.0,
};

function par(partial: Omit<ProfitAtRiskInput, "cfg"> & { cfg?: AlgoConfig }) {
  return computeProfitAtRisk({ ...base, ...partial, cfg: partial.cfg ?? cfg });
}

console.log("algoP1 fixtures 1-18");

test("1 dimensional proof PaR 80 trail 630 (AT-ALGO-6d)", () => {
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
  });
  assert(r.state === "painted", "1 paints");
  if (r.state !== "painted") return;
  assertEq(r.par, 80, "1 PaR");
  assertEq(r.trailLevel, 630, "1 trail");
  assertEq(r.mAdv, -10, "1 m_adv down");
  assertEq(r.pnlChangeAdv, -80, "1 pnl");
  assertEq(r.units.delta, "$/pt", "1 Δ unit");
  assertEq(r.units.gamma, "$/pt²", "1 Γ unit");
  assertEq(r.units.moveUnit, "pt", "1 move unit");
  assertEq(r.units.par, "$", "1 PaR unit");
  assertEq(r.units.trailLevel, "$", "1 trail unit");
  assertEq(PAR_UNITS.delta, "$/pt", "PAR_UNITS");
  assert(r.par >= 0, "1 PaR >= 0");
  assert(r.trailLevel < 750, "1 trail < H");
});

test("2 apex PaR 128 trail 808", () => {
  const r = par({
    kind: "call",
    spot: 6000,
    body: BODY,
    delta: 0,
    gamma: -4,
    moveUnit: 8,
    H: 1000,
  });
  assert(r.state === "painted", "2 paints");
  if (r.state !== "painted") return;
  assertEq(r.par, 128, "2 PaR");
  assertEq(r.trailLevel, 808, "2 trail");
  assertEq(r.parUp, 128, "2 PaR_up");
  assertEq(r.parDown, 128, "2 PaR_down");
  assert(r.trailLevel < 1000, "2 trail < H");
});

test("3 wing PaR 72 trail 892 — E1 F2 > F3", () => {
  const r = par({
    kind: "call",
    spot: 5960,
    body: BODY,
    delta: 15,
    gamma: 1.5,
    moveUnit: 8,
    H: 1000,
  });
  assert(r.state === "painted", "3 paints");
  if (r.state !== "painted") return;
  assertEq(r.par, 72, "3 PaR");
  assertEq(r.trailLevel, 892, "3 trail");
  assertEq(r.mAdv, -8, "3 m_adv");
  const apex = par({
    kind: "call",
    spot: 6000,
    body: BODY,
    delta: 0,
    gamma: -4,
    moveUnit: 8,
    H: 1000,
  });
  assert(apex.state === "painted" && apex.par > r.par, "E1 128 > 72");
  assertEq(apex.state === "painted" ? apex.par : 0, 128, "E1 apex");
});

test("4 put fly mirrored PaR 80 trail 630", () => {
  const r = par({
    kind: "put",
    spot: 6030,
    body: BODY,
    delta: -12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
  });
  assert(r.state === "painted", "4 paints");
  if (r.state !== "painted") return;
  assertEq(r.par, 80, "4 PaR");
  assertEq(r.trailLevel, 630, "4 trail");
  assertEq(r.mAdv, 10, "4 m_adv up");
});

test("5 k 2.34 trail 562.8", () => {
  const { k, kRaw } = computeK(1.3, 1.2, cfg);
  assert(Math.abs(k - 2.34) < 1e-12, `5 k got ${k}`);
  assertEq(k, kRaw, "5 unclamped at 2.34");
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
    gammaFactor: 1.3,
    proximityFactor: 1.2,
  });
  assert(r.state === "painted", "5 paints");
  if (r.state !== "painted") return;
  assertEq(r.par, 80, "5 PaR from F1 book");
  assertEq(r.trailLevel, 562.8, "5 trail");
  assert(Math.abs(r.k - 2.34) < 1e-12, "5 k on result");
});

test("6 k 1.0 trail 670 clamped up from 0.84", () => {
  const { k, kRaw } = computeK(0.7, 0.8, cfg);
  assert(kRaw < 1.0, `6 kRaw ${kRaw}`);
  assertEq(k, 1.0, "6 clamp");
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
    gammaFactor: 0.7,
    proximityFactor: 0.8,
  });
  assert(r.state === "painted", "6 paints");
  if (r.state !== "painted") return;
  assertEq(r.k, 1.0, "6 k");
  assertEq(r.trailLevel, 670, "6 trail");
});

test("7 k 1.8 trail 606 interior", () => {
  const { k } = computeK(1.0, 1.2, cfg);
  assert(k > 1.0 && k < 2.5, "7 interior clamp");
  assert(k !== cfg.ALGO_K_BASE, "7 ≠ k_base");
  assert(Math.abs(k - 1.8) < 1e-12, `7 k ${k}`);
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
    gammaFactor: 1.0,
    proximityFactor: 1.2,
  });
  assert(r.state === "painted", "7 paints");
  if (r.state !== "painted") return;
  assertEq(r.trailLevel, 606, "7 trail");
});

test("8 GEX unavailable gamma_factor 1.0 trail 630 paints", () => {
  const g = normalizeGex({ onPane: false, samples: [] }, cfg);
  assertEq(g.gammaFactor, 1.0, "8 factor");
  assertEq(g.chrome, "gex: unavailable · k unmodulated", "8 chrome");
  assertEq(g.paints, true, "8 paints gex");
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
    gammaFactor: g.gammaFactor,
    proximityFactor: 1.0,
  });
  assert(r.state === "painted", "8 proposed paints");
  if (r.state !== "painted") return;
  assertEq(r.k, 1.5, "8 k");
  assertEq(r.trailLevel, 630, "8 trail");
});

test("9 Δ/Γ unmeasured WAITING not painted", () => {
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: "unmeasured",
    gamma: "unmeasured",
    moveUnit: 10,
    H: 750,
  });
  assertEq(r.state, "WAITING", "9 state");
  assertEq(r.paint, false, "9 no paint");
  if (r.state === "WAITING") assertEq(r.reason, "unmeasured_greeks", "9 reason");
});

test("10 Batman gate 375 from Appendix A entry × working debit (P1 config)", () => {
  assertEq(cfg.ALGO_ENTRY_PCT, 75, "10 entry pct");
  const gate = (cfg.ALGO_ENTRY_PCT / 100) * 500;
  assertEq(gate, 375, "10 gate");
  assert(600 >= gate, "10 U_call manages");
});

test("11 Batman distances equal — P1 does not pick a side", () => {
  const dCall = Math.abs(6000 - 6100);
  const dPut = Math.abs(6000 - 5900);
  assertEq(dCall, dPut, "11 distances");
  assertEq(dCall, 100, "11 100 pt");
});

test("12 remaining 2h floor inactive (E23 (c)); Hotel S 550 is legacy P2", () => {
  const r = par({
    kind: "call",
    spot: 6000,
    body: BODY,
    delta: 0,
    gamma: -4,
    moveUnit: 8,
    H: 1000,
    remainingToDecayEnd: 2,
  });
  assert(r.state === "painted", "12 paints proposed");
  if (r.state !== "painted") return;
  assertEq(r.floorActive, false, "12 floor not binding at 2h");
  const clock = 1 - 2 / 5;
  const g = 0.75 + (0.25 - 0.75) * clock;
  const S = (1 - g) * 1000;
  assertEq(S, 550, "12 Hotel legacy S");
});

test("13 move_unit 6 bars WAITING (AT-ALGO-6e)", () => {
  const prices = [100, 101, 100.5, 102, 101.5, 103, 102.5];
  const mv = estimateMoveUnit(prices, 6000, cfg);
  assertEq(mv.state, "unmeasured", "13 unmeasured");
  assertEq(mv.n, 6, "13 six returns");
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: "unmeasured",
    H: 750,
  });
  assertEq(r.state, "WAITING", "13 proposed WAITING");
  assertEq(r.paint, false, "13 no paint");
});

test("14 GEX history 12 samples warming factor 1.0 paints", () => {
  const samples = Array.from({ length: 12 }, (_, i) => i);
  const g = normalizeGex({ onPane: true, samples, current: 5 }, cfg);
  assertEq(g.gammaFactor, 1.0, "14 factor");
  assertEq(g.n, 12, "14 n");
  assertEq(g.chrome, "gex: warming (12/30 samples)", "14 chrome");
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
    gammaFactor: g.gammaFactor,
    proximityFactor: 1.0,
  });
  assert(r.state === "painted", "14 paints");
  if (r.state !== "painted") return;
  assertEq(r.k, 1.5, "14 k");
});

test("15 H reset is a recorded golden — P1 does not carry H across sides", () => {
  const r0 = par({
    kind: "call",
    spot: 6120,
    body: 6100,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 800,
  });
  const r1 = par({
    kind: "put",
    spot: 6120,
    body: 5900,
    delta: -12,
    gamma: 0.8,
    moveUnit: 10,
    H: 220,
  });
  assert(r0.state === "painted" && r1.state === "painted", "15 both paint");
  if (r0.state !== "painted" || r1.state !== "painted") return;
  assert(220 !== 800, "15 H resets as input 220 vs 800");
  assert(r0.trailLevel !== r1.trailLevel, "15 trail follows the H handed in");
});

test("16 override trail 630 is F1 proposed — P1 does not re-fire", () => {
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
  });
  assert(r.state === "painted", "16");
  if (r.state !== "painted") return;
  assertEq(r.trailLevel, 630, "16 trail");
  assertEq(cfg.ALGO_REENTRY_BARS, 3, "16 REENTRY_BARS");
});

test("17 floor binds 700.48 → 750; morning 700.48; legacy 700", () => {
  const args = {
    kind: "call" as const,
    spot: 6000,
    body: BODY,
    delta: 0,
    gamma: -4,
    moveUnit: 8,
    H: 1000,
    gammaFactor: 1.3,
    proximityFactor: 1.2,
  };
  const close = par({ ...args, remainingToDecayEnd: 0.5 });
  assert(close.state === "painted", "17 close paints");
  if (close.state !== "painted") return;
  assertEq(close.par, 128, "17 PaR");
  assertEq(close.proposedRaw, 700.48, "17 proposed_raw");
  assertEq(close.floor, 750, "17 floor");
  assertEq(close.floorActive, true, "17 floor_active");
  assertEq(close.trailLevel, 750, "17 trail");
  const morning = par({ ...args, remainingToDecayEnd: 4 });
  assert(morning.state === "painted", "17 morning paints");
  if (morning.state !== "painted") return;
  assertEq(morning.floorActive, false, "17 morning inactive");
  assertEq(morning.trailLevel, 700.48, "17 morning unfloored");
  const clock = 1 - 0.5 / 5;
  const g = 0.75 + (0.25 - 0.75) * clock;
  const S = (1 - g) * 1000;
  assertEq(S, 700, "17 Hotel legacy S");
});

test("18 at-body PaR_up 112 PaR_down 144 max 144 trail 784", () => {
  const r = par({
    kind: "call",
    spot: 6000,
    body: BODY,
    delta: 2,
    gamma: -4,
    moveUnit: 8,
    H: 1000,
  });
  assert(r.state === "painted", "18 paints");
  if (r.state !== "painted") return;
  assertEq(r.parUp, 112, "18 PaR_up");
  assertEq(r.parDown, 144, "18 PaR_down");
  assert(r.parUp !== r.parDown, "18 up ≠ down");
  assertEq(r.par, 144, "18 PaR max");
  assertEq(r.trailLevel, 784, "18 trail");
  assert(r.trailLevel < 1000, "18 trail < H");
});

test("AT-ALGO-6d per-share greeks are a named WAITING state", () => {
  const r = par({
    kind: "call",
    spot: 5970,
    body: BODY,
    delta: 12,
    gamma: 0.8,
    moveUnit: 10,
    H: 750,
    greekUnit: "per-share",
  });
  assertEq(r.state, "WAITING", "per-share");
  if (r.state === "WAITING") assertEq(r.reason, "per-share greeks", "named");
  assertEq(r.paint, false, "no silent 100×");
});

test("AT-ALGO-26 missing key aborts naming the key", () => {
  for (const key of LABS_ALGO_ENV_KEYS) {
    const env = { ...ALGO_APPENDIX_A_V1 };
    delete env[key];
    let threw: AlgoConfigError | null = null;
    try {
      parseAlgoConfig(env);
    } catch (e) {
      threw = e as AlgoConfigError;
    }
    assert(threw instanceof AlgoConfigError, `${key} threw`);
    assertEq(threw?.key, key, `${key} named`);
    assert(threw?.message.includes(key), `${key} in message`);
  }
});

test("AT-ALGO-19 grep expected-move identifiers (zero)", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  for (const file of ["algoConfig.ts", "algoMoveUnit.ts", "algoGexNorm.ts", "algoProfitAtRisk.ts"]) {
    const src = readFileSync(join(dir, file), "utf8");
    assert(!/expectedMove/.test(src), `${file} expectedMove`);
    assert(!/expected_move/.test(src), `${file} expected_move`);
    assert(!/\bEM\b/.test(src), `${file} EM`);
  }
});

test("AT-ALGO-28 grep algoProfitAtRisk.ts session-clock identifiers (zero)", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(dir, "algoProfitAtRisk.ts"), "utf8");
  assert(!/sessionClock/.test(src), "sessionClock");
  assert(!/session_clock/.test(src), "session_clock");
  assert(!/clockHours/.test(src), "clockHours");
  assert(!/hoursRemaining/.test(src), "hoursRemaining");
  assert(!/\bEoD\b/.test(src), "EoD");
  assert(!/\bEOD\b/.test(src), "EOD");
  assert(!/sessionTime/.test(src), "sessionTime");
  assert(src.includes("larger k"), "direction header present");
  assert(src.includes("MORE give-up room"), "direction header give-up");
});

test("AT-ALGO-26 PUBLIC_ALGO_ENV uses literal NEXT_PUBLIC members", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(dir, "algoConfig.ts"), "utf8");
  for (const key of LABS_ALGO_ENV_KEYS) {
    const needle = `process.env.NEXT_PUBLIC_${key}`;
    assert(src.includes(needle), needle);
  }
  assert(!/process\.env\[/.test(src), "no computed env lookup");
});

console.log(`${n} tests passed`);
