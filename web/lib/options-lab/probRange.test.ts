/**
 *   npx --yes tsx lib/options-lab/probRange.test.ts
 */

import {
  bandFromMassPct,
  bandFromSpotPct,
  expectedMovePct,
  formatMassPct,
  massInsideSigmaPct,
  nSigmaFromMassPct,
  RANGE_MASS_1SIGMA,
  RANGE_MASS_2SIGMA,
  tYearsFromRemainingHours,
} from "./probRange";
import { MIN_TAU } from "../risk-graph/surfaceModel";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("probRange");

test("1σ mass is 68.27%", () => {
  assert(massInsideSigmaPct(1) === 68.27, `${massInsideSigmaPct(1)}`);
  assert(RANGE_MASS_1SIGMA === 68.27, "const");
  assert(formatMassPct(68.27) === "68.27", formatMassPct(68.27));
});

test("2σ mass is 95.45%", () => {
  assert(massInsideSigmaPct(2) === 95.45, `${massInsideSigmaPct(2)}`);
  assert(RANGE_MASS_2SIGMA === 95.45, "const");
  assert(formatMassPct(95.45) === "95.45", formatMassPct(95.45));
});

test("invert mass % back to nσ", () => {
  const z1 = nSigmaFromMassPct(68.27);
  const z2 = nSigmaFromMassPct(95.45);
  assert(z1 != null && Math.abs(z1 - 1) < 0.002, `z1 ${z1}`);
  assert(z2 != null && Math.abs(z2 - 2) < 0.002, `z2 ${z2}`);
});

test("1σ % of spot is σ√τ · 100", () => {
  const t = 30 / 365.25;
  const pct = expectedMovePct({ ivDecimal: 0.16, tYears: t, nSigma: 1 });
  const raw = 0.16 * Math.sqrt(t) * 100;
  assert(pct != null && Math.abs(pct - raw) < 1e-9, `${pct} vs ${raw}`);
});

test("mass band uses nσ move, not mass as % of spot", () => {
  const t = 30 / 365.25;
  const b = bandFromMassPct({
    spot: 6000,
    ivDecimal: 0.16,
    tYears: t,
    massPct: 68.27,
  });
  const half = 1 * 0.16 * Math.sqrt(t) * 6000;
  assert(b != null, "band");
  assert(Math.abs(b!.hi - (6000 + half)) < 0.05, `hi ${b!.hi}`);
  assert(Math.abs(b!.lo - (6000 - half)) < 0.05, `lo ${b!.lo}`);
});

test("band is ±pct of spot", () => {
  const b = bandFromSpotPct(6000, 10);
  assert(
    b != null && b.lo === 5400 && Math.abs(b.hi - 6600) < 1e-9,
    JSON.stringify(b),
  );
});

test("τ floor is 1 minute", () => {
  assert(tYearsFromRemainingHours(0) === MIN_TAU, "zero remaining");
  assert(tYearsFromRemainingHours(-1) === MIN_TAU, "negative");
});

test("rejects junk", () => {
  assert(expectedMovePct({ ivDecimal: 0, tYears: 0.1, nSigma: 1 }) == null, "iv");
  assert(bandFromSpotPct(0, 10) == null, "spot");
  assert(nSigmaFromMassPct(0) == null, "mass 0");
});

console.log(`\n${n} tests passed`);
