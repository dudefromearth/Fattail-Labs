/**
 *   npx --yes tsx lib/saViewport.test.ts
 */
import assert from "node:assert/strict";
import { stubViewport } from "./saSurface";

const v = stubViewport({
  nodes: [{ span: [100, 110], attributed_volume: 1, median: 105 }],
  groupings: [],
  edges: [{ price: 100, direction: "up", contrast: 4, span: 0 }],
});
assert.ok(v.lo != null && v.hi != null);
assert.ok(v.lo! < 100 && v.hi! > 110);
assert.match(v.label, /STUBBED-AWAITING-SA-Q2/);
assert.match(v.label, /not a grouping snap/);

const empty = stubViewport({});
assert.equal(empty.lo, null);
assert.match(empty.label, /no grouping/);
import { rebinDisplay } from "./saSurface";
const many = Array.from({ length: 500 }, (_, i) => ({
  price: 100 + i * 0.25,
  volume: 1,
}));
const slim = rebinDisplay(many, 50);
assert.ok(slim.length <= 50);
assert.equal(
  slim.reduce((s, b) => s + b.volume, 0),
  500,
);
console.log("saViewport.test.ts 3 ok");
