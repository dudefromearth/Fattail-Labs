/**
 *   npx --yes tsx lib/options-lab/analyzerAutofitPad.test.ts
 */

import {
  AUTOFIT_PTS_PER_INCH_DEFAULT,
  AUTOFIT_PTS_PER_INCH_MAX,
  AUTOFIT_PTS_PER_INCH_MIN,
  clampAutofitPtsPerInch,
  plotInchesFromPx,
} from "./analyzerAutofitPad";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

console.log("analyzerAutofitPad");
assert(
  clampAutofitPtsPerInch(1) === AUTOFIT_PTS_PER_INCH_MIN,
  "floor",
);
assert(
  clampAutofitPtsPerInch(999) === AUTOFIT_PTS_PER_INCH_MAX,
  "cap",
);
assert(
  clampAutofitPtsPerInch("nope") === AUTOFIT_PTS_PER_INCH_DEFAULT,
  "bad → default",
);
assert(AUTOFIT_PTS_PER_INCH_DEFAULT === 12, "crowd default is 12");
assert(Math.abs(plotInchesFromPx(960) - 10) < 1e-9, "960px is 10 CSS inches");
console.log("  4 tests passed");
