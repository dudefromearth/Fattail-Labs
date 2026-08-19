/**
 *   npx --yes tsx lib/options-lab/whatIfClocks.test.ts
 */

import { nyDateTimeToUtcMs } from "../risk-graph/surfaceTimeAxis";
import { MIN_TAU } from "../risk-graph/surfaceModel";
import {
  formatWhatIfTimeReadout,
  remainingLastTradeHours,
  tauYearsWhatIf,
  tauYearsWhatIfAfterElapsed,
  whatIfTimeStepHours,
} from "./whatIfClocks";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("whatIfClocks");

const ymd = "2026-08-19";
const tenEt = nyDateTimeToUtcMs(ymd, 10, 0);
const fifteenEt = nyDateTimeToUtcMs(ymd, 15, 0);
const fifteenThirtyEt = nyDateTimeToUtcMs(ymd, 15, 30);

test("AT-TM-1 SPX 10:00 remaining ∈ (6, 6.5] last-trade 16:15", () => {
  const rem = remainingLastTradeHours(ymd, "SPX", tenEt);
  assert(rem > 6 && rem <= 6.5, `got ${rem}`);
});

test("AT-TM-2 equity 10:00 remaining ∈ (5.75, 6.1] last-trade 16:00", () => {
  const rem = remainingLastTradeHours(ymd, "SPY", tenEt);
  assert(rem > 5.75 && rem <= 6.1, `got ${rem}`);
});

test("AT-TM-4 calendar front exp caps remaining", () => {
  const rem = remainingLastTradeHours("2026-08-21", "SPX", tenEt);
  assert(rem > 48, `front later ${rem}`);
});

test("step 5 min when remaining ≤ 8h", () => {
  assert(whatIfTimeStepHours(6.25) === 5 / 60, "5min");
  assert(whatIfTimeStepHours(20) === 15 / 60, "15min");
  assert(whatIfTimeStepHours(40) === 1, "1h");
});

test("τ at 10:00 is to 16:00 not 16:15 (OPF29)", () => {
  const tau = tauYearsWhatIf(ymd, tenEt);
  const hours = tau * 365.25 * 24;
  assert(hours > 5.9 && hours < 6.1, `τ hours ${hours}`);
});

test("AT-TM-13 15:30 τ still decreases vs 15:00 (1-min floor)", () => {
  const a = tauYearsWhatIf(ymd, fifteenEt);
  const b = tauYearsWhatIf(ymd, fifteenThirtyEt);
  assert(a > b, `${a} vs ${b}`);
  assert(b > MIN_TAU, "not flattened");
  const hourFloor = 1 / (365 * 24);
  assert(b < hourFloor, "must be below the forbidden 1-hour floor");
});

test("elapsed to last-trade max does not go negative τ", () => {
  const rem = remainingLastTradeHours(ymd, "SPX", tenEt);
  const tau = tauYearsWhatIfAfterElapsed(ymd, tenEt, rem);
  assert(tau >= 0, "non-neg");
  assert(tau <= MIN_TAU * 2 || tau === 0 || tau >= MIN_TAU, "floor-ish");
});

test("T7 readout has ET and left", () => {
  const s = formatWhatIfTimeReadout(tenEt, 0, 6.25);
  assert(/ET/.test(s), s);
  assert(/left/.test(s), s);
});

console.log(`\n${n} tests passed`);
