/**
 * AZ-ALGO P2 — F10/11/12/15/16/17 + ALGO-A1 ratchet + AT-ALGO-23.
 *   cd web && npx --yes tsx lib/options-lab/algoP2.fixtures.test.ts
 * Does not import algoEval.ts (NX13).
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALGO_APPENDIX_A_V1,
  parseAlgoConfig,
} from "./algoConfig";
import { computeProfitAtRisk } from "./algoProfitAtRisk";
import {
  applyGMonotone,
  evaluateBatmanGate,
  foldOverrideTick,
  highWaterOnSideSwitch,
  legacyTrail,
  resolveWorkingSide,
  type BatmanFly,
} from "./algoTrailMath";

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

const cfg = parseAlgoConfig(ALGO_APPENDIX_A_V1);
const entryPct = cfg.ALGO_ENTRY_PCT / 100;

const callF10: BatmanFly = { kind: "call", body: 6100, debit: 500, U: 600 };
const putF10: BatmanFly = { kind: "put", body: 5900, debit: 500, U: 40 };

console.log("algoP2 fixtures");

test("F10 Batman gate 375 = 0.75 × 500 working-side debit → Managing on call", () => {
  const g = evaluateBatmanGate(6120, callF10, putF10, entryPct);
  assertEq(g.workingSide, "call", "F10 side");
  assertEq(g.riskTaken, 500, "F10 risk_taken is the call debit");
  assertEq(g.gate, 375, "F10 gate");
  assertEq(g.U, 600, "F10 U call");
  assertEq(g.managing, true, "F10 Managing");
  assertEq(g.paint, true, "F10 paints");
  const pairGate = entryPct * (callF10.debit + putF10.debit);
  assertEq(pairGate, 750, "pair 1000 is the loss bound");
  assert(g.U! < pairGate, "600 < 750 — pair denominator would stay In trade");
  assert(g.managing, "E4: working-side debit is the denominator, not the pair");
});

test("F11 distances equal, U equal → ambiguous, gate does not evaluate, paints nothing", () => {
  const call: BatmanFly = { kind: "call", body: 6100, debit: 500, U: 200 };
  const put: BatmanFly = { kind: "put", body: 5900, debit: 500, U: 200 };
  const side = resolveWorkingSide(6000, call, put);
  assertEq(side, "ambiguous", "F11 side");
  const g = evaluateBatmanGate(6000, call, put, entryPct);
  assertEq(g.workingSide, "ambiguous", "F11 gate side");
  assertEq(g.riskTaken, null, "F11 no risk_taken");
  assertEq(g.gate, null, "F11 gate does not evaluate");
  assertEq(g.managing, false, "F11 not managing");
  assertEq(g.paint, false, "F11 no line either side");
  assertEq(g.named, "working_side: ambiguous", "F11 named");
  const trap = resolveWorkingSide(6000, call, { ...put, U: 200 });
  assertEq(trap, "ambiguous", "tie must not use >= to pick call");
});

test("F11 trap: equal U must not quietly pick a side via >=", () => {
  const call: BatmanFly = { kind: "call", body: 6100, debit: 500, U: 200 };
  const put: BatmanFly = { kind: "put", body: 5900, debit: 500, U: 200 };
  const g = evaluateBatmanGate(6000, call, put, 0.75);
  assert(g.workingSide !== "call", "must not pick call on a tie");
  assert(g.workingSide !== "put", "must not pick put on a tie");
  assertEq(g.paint, false, "nothing renders");
});

test("F12 E(t) null → clock-only g=0.45 S=550 chrome", () => {
  const L = legacyTrail({
    H: 1000,
    g0: 0.75,
    gMin: 0.25,
    E: null,
    EArm: null,
    remainingNow: 2,
    remainingAtArm: 5,
    prevG: null,
  });
  assertEq(L.clockOnly, true, "F12 clock-only");
  assertEq(L.g, 0.45, "F12 g");
  assertEq(L.S, 550, "F12 S");
  assertEq(L.chrome, "floor: legacy (clock-only)", "F12 chrome");
});

test("ALGO-A1 g is a running minimum across a sequence, not two samples", () => {
  const remArm = 5;
  const steps = [5, 4.5, 4, 3.5, 3, 2.5, 2, 2.5, 3, 4, 4.5, 5];
  const gs: number[] = [];
  let prev: number | null = null;
  for (const rem of steps) {
    const L = legacyTrail({
      H: 1000,
      g0: 0.75,
      gMin: 0.25,
      E: null,
      EArm: null,
      remainingNow: rem,
      remainingAtArm: remArm,
      prevG: prev,
    });
    gs.push(L.g);
    prev = L.g;
  }
  for (let i = 1; i < gs.length; i++) {
    assert(gs[i] <= gs[i - 1] + 1e-12, `g rose at i=${i}: ${gs[i - 1]} → ${gs[i]}`);
  }
  assertEq(gs[0], 0.75, "open g0");
  const atTwo = steps.indexOf(2);
  assertEq(gs[atTwo], 0.45, "g at remaining 2h");
  assert(
    gs[gs.length - 1] === 0.45,
    `clock reversal would raise g; ratchet holds 0.45, got ${gs[gs.length - 1]}`,
  );
  const rawAtFour = applyGMonotone(null, 0.65, 0.75, 0.25);
  assertEq(rawAtFour, 0.65, "unratcheted clock at 4h is 0.65");
  assert(gs[steps.lastIndexOf(4)] === 0.45, "after 2h, remaining 4h stays 0.45");
});

test("F15 side switch H resets 800 → 220, h_prior_side recorded", () => {
  const sw = highWaterOnSideSwitch({
    prevWorking: "call",
    nextWorking: "put",
    prevH: 800,
    nextU: 220,
  });
  assertEq(sw.switched, true, "F15 switched");
  assertEq(sw.H, 220, "F15 H resets");
  assertEq(sw.h_prior_side, 800, "F15 h_prior_side");
  const hold = highWaterOnSideSwitch({
    prevWorking: "call",
    nextWorking: "call",
    prevH: 800,
    nextU: 820,
  });
  assertEq(hold.switched, false, "same side ratchets H");
  assertEq(hold.H, 820, "same side max");
  assertEq(hold.h_prior_side, null, "no prior-side stamp");
});

test("F16 override beyond the guide → no re-fire, HUD guide: overridden", () => {
  let st = { overridden: true, reentryCount: 0 };
  for (let i = 0; i < 5; i++) {
    const t = foldOverrideTick({
      U: 500,
      trailLevel: 630,
      prev: st,
      reentryBars: cfg.ALGO_REENTRY_BARS,
    });
    assertEq(t.fire, false, `F16 no re-fire at tick ${i}`);
    assertEq(t.hud, "guide: overridden", `F16 hud tick ${i}`);
    st = t.next;
    assertEq(st.reentryCount, 0, "still beyond → reentry does not count");
  }
  assertEq(cfg.ALGO_REENTRY_BARS, 3, "REENTRY_BARS");
});

test("F17 legacy 700 at the same instant proposed is floored to 750", () => {
  const proposed = computeProfitAtRisk({
    kind: "call",
    spot: 6000,
    body: 6000,
    delta: 0,
    gamma: -4,
    greekUnit: "package",
    moveUnit: 8,
    H: 1000,
    gammaFactor: 1.3,
    proximityFactor: 1.2,
    remainingToDecayEnd: 0.5,
    cfg,
  });
  assert(proposed.state === "painted", "F17 proposed paints");
  if (proposed.state !== "painted") return;
  assertEq(proposed.proposedRaw, 700.48, "F17 proposed_raw");
  assertEq(proposed.floorActive, true, "F17 floor_active");
  assertEq(proposed.trailLevel, 750, "F17 proposed trail (floor)");
  const L = legacyTrail({
    H: 1000,
    g0: 0.75,
    gMin: 0.25,
    E: null,
    EArm: null,
    remainingNow: 0.5,
    remainingAtArm: 5,
    prevG: null,
  });
  assertEq(L.S, 700, "F17 legacy S");
  assertEq(L.g, 0.3, "F17 g");
  assert(L.S !== proposed.trailLevel, "two lines; floor is not applied to legacy");
  assert(proposed.trailLevel > L.S, "proposed tighter than legacy inside the floor window");
});

test("AT-ALGO-23 grep trail module for retired give-up-as-keep product", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(dir, "algoTrailMath.ts"), "utf8");
  assert(!/S\s*=\s*f\s*[×*]\s*H/.test(src), "S = f × H");
  assert(!/S\s*=\s*f\s*\*\s*H/.test(src), "S = f * H");
  assert(!/f\s*[×]\s*H/.test(src), "f × H");
  assert(src.includes("S=(1−g)×H") || src.includes("(1 − g)") || src.includes("(1 - g)"), "law present");
});

console.log(`${n} tests passed`);
