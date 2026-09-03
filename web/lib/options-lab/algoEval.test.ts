/**
 *   npx --yes tsx lib/options-lab/algoEval.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tickAlgoAlert } from "./algoEval";
import { createAlgoAlert } from "./analyzerBook";
import type { PnLSample } from "./algoTrailMath";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const legs = [
  { strike: 6080, quantity: 1, side: "long" as const, type: "call" as const },
  { strike: 6100, quantity: 2, side: "short" as const, type: "call" as const },
  { strike: 6120, quantity: 1, side: "long" as const, type: "call" as const },
];

function tent(): PnLSample[] {
  const pts: PnLSample[] = [];
  for (let p = 6040; p <= 6160; p += 1) {
    const dist = Math.abs(p - 6100);
    const pnl =
      dist >= 40 ? -2 : dist <= 20 ? 4 - (4 * dist) / 20 : 0 - 2 * ((dist - 20) / 20);
    pts.push({ price: p, pnl });
  }
  return pts;
}

const curve = tent();

function demoAlert() {
  return createAlgoAlert({
    symbol: "SPX",
    positionId: "p1",
    color: "#3b82f6",
    trailColor: "#f59e0b",
    entryPct: 75,
    trailStartPct: 75,
    trailFloorPct: 25,
    overlay: false,
    demo: true,
  });
}

console.log("algoEval AT-ALGO-18");

test("AT-ALGO-18 live (demo false) ticks on the raw mark", () => {
  const a = createAlgoAlert({
    symbol: "SPX",
    positionId: "p1",
    color: "#3b82f6",
    trailColor: "#f59e0b",
    entryPct: 75,
    trailStartPct: 75,
    trailFloorPct: 25,
    overlay: false,
    demo: false,
  });
  const waiting = tickAlgoAlert(a, {
    symbol: "SPX",
    spot: 6088,
    U: 1,
    debit: 4,
    legs,
    curve,
    remainingHours: 4,
    E: null,
  });
  assert(waiting.algoPhase === "waiting", "below gate stays In trade");
  const managing = tickAlgoAlert(waiting, {
    symbol: "SPX",
    spot: 6088,
    U: 3.1,
    debit: 4,
    legs,
    curve,
    remainingHours: 4,
    E: null,
  });
  assert(managing !== waiting, "live path mutates");
  assert(managing.algoPhase === "armed", "crosses into Managing");
  assert(managing.algo?.demo !== true, "still not Demo");
  assert(managing.algo?.trail_state?.xH === 6088, "guide high-water on live mark");
  const moved = tickAlgoAlert(managing, {
    symbol: "SPX",
    spot: 6092,
    U: 3.4,
    debit: 4,
    legs,
    curve,
    remainingHours: 4,
    E: null,
  });
  assert(moved.algo?.trail_state?.H === 3.4, "high-water ratchets");
  assert(moved.algo?.trail_state?.xH === 6092, "guide moves with the live mark");
});

test("demo: move spot to arm, time to tighten f", () => {
  let a = demoAlert();
  a = tickAlgoAlert(a, {
    symbol: "SPX",
    spot: 6088,
    U: 1,
    debit: 4,
    legs,
    curve,
    remainingHours: 4,
    E: null,
  });
  assert(a.algoPhase === "waiting", "below 75% of debit");
  a = tickAlgoAlert(a, {
    symbol: "SPX",
    spot: 6088,
    U: 3.1,
    debit: 4,
    legs,
    curve,
    remainingHours: 4,
    E: null,
  });
  assert(a.algoPhase === "armed", "armed on What-if spot/P&L");
  assert(a.algo?.trail_state?.xH === 6088, "high-water at sim spot");
  const f0 = a.algo!.trail_state!.f;
  a = tickAlgoAlert(a, {
    symbol: "SPX",
    spot: 6088,
    U: 3.1,
    debit: 4,
    legs,
    curve,
    remainingHours: 0,
    E: null,
  });
  assert(a.algo!.trail_state!.f <= f0, "time to EoD tightens f");
  assert(Math.abs(a.algo!.trail_state!.f - 0.25) < 1e-9, "fMin at decay end");
});

test("AT-ALGO-12 algoEval has no 1s heavy resolve", () => {
  const dir = dirname(fileURLToPath(import.meta.url));
  const src = readFileSync(join(dir, "algoEval.ts"), "utf8");
  assert(!/setInterval\s*\(/.test(src), "no interval in eval");
  assert(!/setTimeout\s*\(/.test(src), "no timeout loop");
});

function test(name: string, fn: () => void) {
  fn();
  console.log(`  ok  ${name}`);
}
