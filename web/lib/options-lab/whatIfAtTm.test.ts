/**
 * AT-TM-1…14 proof — fixed nowMs, no wall clock.
 *
 *   npx --yes tsx lib/options-lab/whatIfAtTm.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { nyDateTimeToUtcMs } from "../risk-graph/surfaceTimeAxis";
import { MIN_TAU } from "../risk-graph/surfaceModel";
import {
  remainingLastTradeHours,
  tauYearsWhatIf,
  tauYearsWhatIfAfterElapsed,
} from "./whatIfClocks";
import {
  formatWhatIfVolReadout,
  measuredAtmIvPct,
  volOffsetPtsFromScenario,
  WHATIF_SESSION_KEY,
} from "./whatIfVol";
import { resolveLocalBookCurves } from "./localBookCurves";
import type { OpfGenerationIn } from "./opfPricingApi";
import type { ParsedTosTrade } from "./tosParser";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

const here = dirname(fileURLToPath(import.meta.url));
const ymd = "2026-08-19";
const tenEt = nyDateTimeToUtcMs(ymd, 10, 0);
const fifteenEt = nyDateTimeToUtcMs(ymd, 15, 0);
const fifteenThirtyEt = nyDateTimeToUtcMs(ymd, 15, 30);
const sixteenTenEt = nyDateTimeToUtcMs(ymd, 16, 10);
const hourFloor = 1 / (365 * 24);

function trade(exp: string): ParsedTosTrade {
  return {
    action: "BUY",
    structure: "single",
    symbol: "SPX",
    expiration: exp,
    right: "call",
    limit: 2,
    debit: 2,
    isCredit: false,
    strikes: [100],
    width: null,
    body: 100,
    legs: [{ strike: 100, quantity: 1, right: "call", expiration: exp }],
    raw: `BUY +1 SPX 100 CALL @2.00 LMT`,
  };
}

function gen(exp: string, iv: number | null = 0.2): OpfGenerationIn {
  return {
    product: "SPX",
    expiration: exp,
    wings: 50,
    spot: 100,
    content_hash: "h1",
    rows: [{ strike: 100, side: "call", iv, mid: 2 }],
  };
}

console.log("AT-TM");

test("AT-TM-1 SPX 10:00 max remaining ∈ (6, 6.5]; τ is 16:00 not 16:15", () => {
  const rem = remainingLastTradeHours(ymd, "SPX", tenEt);
  assert(rem > 6 && rem <= 6.5, `remaining ${rem}`);
  assert(rem !== 72, "not 72h");
  const tauH = tauYearsWhatIf(ymd, tenEt) * 365.25 * 24;
  assert(tauH > 5.9 && tauH < 6.1, `τ hours ${tauH}`);
});

test("AT-TM-2 equity 10:00 remaining ∈ (5.75, 6.1]", () => {
  const rem = remainingLastTradeHours(ymd, "SPY", tenEt);
  assert(rem > 5.75 && rem <= 6.1, `remaining ${rem}`);
});

test("AT-TM-3 equity max → τ floor; index after 16:00 remaining > 0, τ floored", () => {
  const remEq = remainingLastTradeHours(ymd, "SPY", tenEt);
  const tauMax = tauYearsWhatIfAfterElapsed(ymd, tenEt, remEq);
  assert(tauMax <= MIN_TAU * 1.01, `equity max τ ${tauMax}`);
  const remIdx = remainingLastTradeHours(ymd, "SPX", sixteenTenEt);
  assert(remIdx > 0 && remIdx < 0.2, `index remaining after 16:00 ${remIdx}`);
  const tauIdx = tauYearsWhatIf(ymd, sixteenTenEt);
  assert(tauIdx <= MIN_TAU, `index τ after settlement ${tauIdx}`);
  assert(tauIdx < hourFloor, "not the 1-hour floor");
});

test("AT-TM-4 calendar front exp caps remaining", () => {
  const rem = remainingLastTradeHours("2026-08-21", "SPX", tenEt);
  assert(rem > 48, `front later ${rem}`);
});

test("AT-TM-5 empty book named WAITING / no fake 16%", () => {
  const col = readFileSync(
    join(here, "../../components/options-lab/AnalyzerControlsColumn.tsx"),
    "utf8",
  );
  const parent = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert(parent.includes('"WAITING"'), "WAITING state");
  assert(parent.includes('"IV NO"'), "IV NO state");
  assert(!col.includes("max={72}"), "no 72h");
  assert(!col.includes("max={30}"), "no ±30");
});

test("AT-TM-6 detent = listed ATM IV %", () => {
  const g: OpfGenerationIn = {
    product: "SPX",
    expiration: ymd,
    wings: 50,
    content_hash: "t",
    rows: [
      { strike: 5990, side: "call", iv: 0.162 },
      { strike: 6000, side: "call", iv: 0.162 },
    ],
  };
  assert(measuredAtmIvPct([g], 6001, ymd, "call") === 16.2, "16.2");
});

test("AT-TM-7 +5 pts wire; expiry curve unchanged", () => {
  assert(volOffsetPtsFromScenario(21.2, 16.2) === 5, "pts");
  const base = resolveLocalBookCurves({
    trade: trade("2026-09-18"),
    generations: [gen("2026-09-18")],
    spot: 100,
  });
  const bumped = resolveLocalBookCurves({
    trade: trade("2026-09-18"),
    generations: [gen("2026-09-18")],
    spot: 100,
    volOffsetPts: 5,
  });
  assert(base.ok && bumped.ok, "sheets");
  if (!base.ok || !bumped.ok) return;
  const mid = Math.floor(
    (base.result.curves!.expiration!.points!.length - 1) / 2,
  );
  assert(
    Math.abs(
      base.result.curves!.expiration!.points![mid].y -
        bumped.result.curves!.expiration!.points![mid].y,
    ) < 1e-9,
    "expiry unchanged",
  );
  assert(
    base.result.curves!.model_t0!.points![mid].y !==
      bumped.result.curves!.model_t0!.points![mid].y,
    "T+0 moves",
  );
});

test("AT-TM-8 missing ATM IV → null, no 16% placeholder", () => {
  const empty: OpfGenerationIn = {
    product: "SPX",
    expiration: ymd,
    wings: 50,
    content_hash: "t",
    rows: [{ strike: 6000, side: "call", iv: null }],
  };
  assert(measuredAtmIvPct([empty], 6000, ymd, "call") == null, "IV NO");
  assert(formatWhatIfVolReadout(null, 16, true, "IV NO") === "IV NO", "named");
});

test("AT-TM-9 Enable off shows measured only", () => {
  const s = formatWhatIfVolReadout(16.2, 19.4, false);
  assert(s === "16.2% measured", s);
  assert(!s.includes("scenario"), "no scenario when off");
});

test("AT-TM-10 Enable + offset → RECON override", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert(src.includes("whatIfActive"), "what-if active");
  assert(src.includes('? "override"'), "B4 override");
  assert(src.includes("wiredVolPts"), "offset gates banner");
});

test("AT-TM-11 shared session key + same pts mapping", () => {
  const az = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  const surf = readFileSync(
    join(here, "../../components/options-lab/surface/SurfaceApp.tsx"),
    "utf8",
  );
  assert(az.includes("saveWhatIfSession"), "Analyzer writes");
  assert(surf.includes("saveWhatIfSession"), "Surface writes");
  assert(WHATIF_SESSION_KEY === "ft_options_lab_whatif_v1", "key");
  assert(volOffsetPtsFromScenario(19.4, 16.2) === 3.2, "same scalar");
});

test("AT-TM-12 Implied vol label; engine still vol_offset_pts", () => {
  const col = readFileSync(
    join(here, "../../components/options-lab/AnalyzerControlsColumn.tsx"),
    "utf8",
  );
  const hud = readFileSync(
    join(here, "../../components/options-lab/surface/TimeHud.tsx"),
    "utf8",
  );
  assert(col.includes("Implied vol"), "Analyzer");
  assert(hud.includes("Implied vol"), "Surface");
  assert(!/\bpts\b/.test(hud), "no member pts on HUD");
});

test("AT-TM-13 15:30 Analyzer T+0 still moves vs 15:00", () => {
  const a = resolveLocalBookCurves({
    trade: trade(ymd),
    generations: [gen(ymd)],
    spot: 100,
    nowMs: fifteenEt,
  });
  const b = resolveLocalBookCurves({
    trade: trade(ymd),
    generations: [gen(ymd)],
    spot: 100,
    nowMs: fifteenThirtyEt,
  });
  assert(a.ok && b.ok, "sheets");
  if (!a.ok || !b.ok) return;
  const tauA = Number(Object.values(a.result.meta?.tau_by_leg ?? {})[0]);
  const tauB = Number(Object.values(b.result.meta?.tau_by_leg ?? {})[0]);
  assert(tauA > tauB, `${tauA} vs ${tauB}`);
  assert(tauB < hourFloor, `below 1-hour floor ${tauB}`);
  const mid = Math.floor((a.result.curves!.model_t0!.points!.length - 1) / 2);
  assert(
    a.result.curves!.model_t0!.points![mid].y !==
      b.result.curves!.model_t0!.points![mid].y,
    "T+0 moves",
  );
});

test("AT-TM-14 Surface What-if τ helper still moves at 15:30", () => {
  const a = tauYearsWhatIf(ymd, fifteenEt);
  const b = tauYearsWhatIf(ymd, fifteenThirtyEt);
  assert(a > b, `${a} vs ${b}`);
  assert(b < hourFloor, "not 1-hour floor");
  assert(b >= MIN_TAU || b > 0, "1-min floor path");
  const rem = remainingLastTradeHours(ymd, "SPX", fifteenThirtyEt);
  const atMax = tauYearsWhatIfAfterElapsed(ymd, fifteenThirtyEt, rem);
  assert(atMax <= MIN_TAU * 1.01, `max remaining τ ${atMax}`);
  const src = readFileSync(
    join(here, "../../components/options-lab/surface/SurfaceApp.tsx"),
    "utf8",
  );
  assert(src.includes("tauYearsWhatIfAfterElapsed"), "HUD wire");
  assert(!src.includes("fractionalT"), "no 1-hour floor");
});

console.log(`\n${n} tests passed`);
