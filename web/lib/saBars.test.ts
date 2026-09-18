/**
 *   npx --yes tsx lib/saBars.test.ts
 */
import assert from "node:assert/strict";
import { barInvariant, honestBars, xFor } from "./saBars";

assert.equal(barInvariant({ o: 10, h: 12, l: 9, c: 11 }), true);
assert.equal(barInvariant({ o: 10, h: 11, l: 12, c: 10 }), false);
assert.equal(barInvariant({ o: 10, h: 10, l: 10, c: 10 }), true);

const mixed = honestBars([
  { t: 1, o: 7719, h: 7721, l: 7719, c: 7721 },
  { t: 2, o: 7719, h: 7720, l: 7650, c: 7719 }, // l > not actually fail: 7650 <= 7719
  { t: 3, o: 10, h: 9, l: 8, c: 10 },
]);
assert.equal(mixed.bars.length, 2);
assert.equal(mixed.gaps, 1);
assert.equal(mixed.bars[0].l, 7719);

assert.equal(xFor(50, 0, 100, 0, 200), 100);
console.log("saBars.test.ts ok");
