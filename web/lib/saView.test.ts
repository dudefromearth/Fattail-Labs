/**
 *   npx --yes tsx lib/saView.test.ts
 */
import assert from "node:assert/strict";
import { clampWindow, defaultTimeWindow, RIGHT_PAD_BARS } from "./saView";

const tf = 300_000;
const dataLo = 1_000_000;
const dataHi = dataLo + 86400_000;
const w = defaultTimeWindow(dataLo, dataHi, tf, 1);
assert.equal(w.hi, dataHi + tf * RIGHT_PAD_BARS);
assert.ok(w.hi > dataHi);
assert.ok(w.lo >= dataLo);
assert.ok(w.hi - w.lo <= 86400_000 + tf * RIGHT_PAD_BARS + 1);

const lost = clampWindow(dataHi + 9e9, dataHi + 9e9 + 1e6, dataLo, dataHi, tf * 8);
assert.ok(lost.lo < dataHi);
assert.ok(lost.hi > dataLo);

console.log("saView.test.ts ok");
