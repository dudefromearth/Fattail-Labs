/**
 *   npx --yes tsx lib/options-lab/whatIfVol.test.ts
 */

import type { OpfGenerationIn } from "./opfPricingApi";
import {
  formatWhatIfVolReadout,
  impliedVolSliderRange,
  majorityRight,
  measuredAtmIvPct,
  volOffsetPtsFromScenario,
} from "./whatIfVol";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("whatIfVol");

function gen(ivAtm: number): OpfGenerationIn {
  return {
    product: "SPX",
    expiration: "2026-08-19",
    wings: 50,
    content_hash: "t",
    rows: [
      { strike: 5990, side: "call", iv: ivAtm },
      { strike: 6000, side: "call", iv: ivAtm },
      { strike: 6010, side: "call", iv: ivAtm * 1.05 },
      { strike: 6000, side: "put", iv: ivAtm * 0.9 },
    ],
  };
}

test("AT-TM-6 detent = listed ATM IV %", () => {
  const pct = measuredAtmIvPct([gen(0.162)], 6001, "2026-08-19", "call");
  assert(pct === 16.2, `got ${pct}`);
});

test("nearest strike to spot", () => {
  const pct = measuredAtmIvPct([gen(0.2)], 6008, "2026-08-19", "call");
  assert(pct === 21, `6010 iv 0.21 → ${pct}`);
});

test("AT-TM-8 missing IV → null", () => {
  const empty: OpfGenerationIn = {
    product: "SPX",
    expiration: "2026-08-19",
    wings: 50,
    content_hash: "t",
    rows: [{ strike: 6000, side: "call", iv: null }],
  };
  assert(measuredAtmIvPct([empty], 6000, "2026-08-19", "call") == null, "IV NO");
});

test("AT-TM-7 +5 pts wire", () => {
  const pts = volOffsetPtsFromScenario(21.2, 16.2);
  assert(pts === 5, `got ${pts}`);
});

test("V4 range 0.5×–2× measured", () => {
  const r = impliedVolSliderRange(16.2);
  assert(Math.abs(r.min - 8.1) < 1e-9, `min ${r.min}`);
  assert(Math.abs(r.max - 32.4) < 1e-9, `max ${r.max}`);
});

test("majority right mixed/tie → call", () => {
  assert(majorityRight([{ right: "put", quantity: 1 }, { right: "put", quantity: -2 }, { right: "put", quantity: 1 }]) === "put", "put fly");
  assert(majorityRight([{ right: "call", quantity: 1 }, { right: "put", quantity: 1 }]) === "call", "tie");
});

test("V6 readout measured / scenario / IV NO", () => {
  assert(formatWhatIfVolReadout(16.2, 19.4, true) === "16.2% measured · 19.4% scenario", "on");
  assert(formatWhatIfVolReadout(16.2, 19.4, false) === "16.2% measured", "off");
  assert(formatWhatIfVolReadout(null, 0, true, "IV NO") === "IV NO", "named");
});

console.log(`\n${n} tests passed`);
