import assert from "node:assert/strict";
import { boxHalfExtents, frameRadius } from "./box";
import { PERSPECTIVE_FOV } from "./camera";

{
  const sq = boxHalfExtents(800, 800);
  assert.equal(sq.hx, 1, "square host: strike half = 1");
  assert.equal(sq.hy, 1, "square host: price half = 1");
  assert.equal(sq.hz, 0.75, "square host: time is ¾ of strike width");
}

{
  const wide = boxHalfExtents(1600, 800);
  assert.equal(wide.hx, 2, "wide host: strikes stretch with width");
  assert.equal(wide.hy, 1, "wide host: price stays host height");
  assert.equal(wide.hz, 1.5, "wide host: time scales with strike width");
}

{
  const tall = boxHalfExtents(400, 800);
  assert.equal(tall.hx, 0.5, "tall host: strikes shrink with width");
  assert.equal(tall.hy, 1, "tall host: price is the height");
}

{
  const rSq = frameRadius(boxHalfExtents(800, 800), 1, PERSPECTIVE_FOV);
  const rWide = frameRadius(boxHalfExtents(1600, 800), 2, PERSPECTIVE_FOV);
  assert.ok(rSq > 0, "fit radius positive");
  assert.ok(rWide >= rSq - 1e-9, "wider box needs at least the square radius");
}

{
  assert.throws(() => boxHalfExtents(0, 800), /unbounded/);
  assert.throws(() => boxHalfExtents(800, NaN), /unbounded/);
}

console.log("box.test.ts ok");
