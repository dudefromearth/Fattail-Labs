/**
 *   npx --yes tsx lib/risk-graph/axisGrid.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  AXIS_GRID_MAX_LINES,
  AXIS_GRID_MIN_LINES,
  AXIS_GRID_MIN_STEP,
  ceilNice125,
  dollarAxisLineCount,
  dollarAxisStep,
} from "./axisGrid";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("axisGrid");

function is125(step: number): boolean {
  const mag = 10 ** Math.floor(Math.log10(step));
  const k = Math.round(step / mag);
  return k === 1 || k === 2 || k === 5 || k === 10;
}

test("1–2–5 ceil", () => {
  assert(ceilNice125(10) === 10, "10");
  assert(ceilNice125(11) === 20, "11→20");
  assert(ceilNice125(20) === 20, "20");
  assert(ceilNice125(21) === 50, "21→50");
  assert(ceilNice125(50) === 50, "50");
  assert(ceilNice125(51) === 100, "51→100");
  assert(ceilNice125(100) === 100, "100");
});

test("floor is $10 — never $1/$2/$5", () => {
  for (const r of [5, 20, 40, 80, 90]) {
    const s = dollarAxisStep(r);
    assert(s >= AXIS_GRID_MIN_STEP, `${r} step ${s} >= 10`);
    assert(is125(s), `${r} is 1-2-5`);
  }
});

test("tight span stays at $10 even if fewer than 10 lines", () => {
  const s = dollarAxisStep(80);
  assert(s === 10, "80-wide → $10");
  assert(
    dollarAxisLineCount(0, 80, s) < AXIS_GRID_MIN_LINES,
    "accept <10 when floor binds",
  );
});

test("≥10 lines when the span allows, never denser than ~20 intervals", () => {
  const spans = [200, 400, 500, 800, 1200, 2000, 2500, 8000, 20_000, 80_000];
  for (const r of spans) {
    const s = dollarAxisStep(r);
    const intervals = r / s;
    assert(s >= AXIS_GRID_MIN_STEP, `${r} floor`);
    assert(is125(s), `${r} 1-2-5 (${s})`);
    assert(intervals <= AXIS_GRID_MAX_LINES + 1e-9, `${r}/${s} <= 20`);
    assert(
      intervals + 1e-9 >= AXIS_GRID_MIN_LINES || s === AXIS_GRID_MIN_STEP,
      `${r}/${s} >= 10 unless floor`,
    );
  }
});

test("known rungs", () => {
  assert(dollarAxisStep(200) === 10, "200 → 10 (20 intervals)");
  assert(dollarAxisStep(400) === 20, "400 → 20");
  assert(dollarAxisStep(500) === 50, "500 → 50");
  assert(dollarAxisStep(1200) === 100, "1200 → 100");
  assert(dollarAxisStep(2000) === 100, "2000 → 100");
  assert(dollarAxisStep(2500) === 200, "2500 → 200");
});

test("P&L and underlier use the same helper independently", () => {
  const y = dollarAxisStep(1800);
  const x = dollarAxisStep(400);
  assert(y === 100, "P&L 1800 → 100");
  assert(x === 20, "underlier 400 → 20");
});

test("HostPnLChart: dollar axes use dollarAxisStep; GEX does not", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const host = readFileSync(
    join(here, "../../components/options-lab/risk-graph/HostPnLChart.tsx"),
    "utf8",
  );
  assert(host.includes("dollarAxisStep"), "dollar grid helper");
  assert(host.includes("dollarAxisStep(yMax - yMin)"), "P&L Y");
  assert(host.includes("dollarAxisStep(xMax - xMin)"), "underlier X");
  assert(
    /const step = niceStep\(Math\.max\(dispPeak/.test(host),
    "GEX ticks stay on niceStep (not $10 floor)",
  );
});

console.log(`\n${n} tests passed`);
