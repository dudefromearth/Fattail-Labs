import assert from "node:assert/strict";
import { nearLevel, parkMovedBreakEvens } from "./t0BreakEvenGhost";

assert.equal(nearLevel(100, [100.1], 0.25), true);
assert.equal(nearLevel(100, [101], 0.25), false);

{
  const ghosts = parkMovedBreakEvens([5700, 5750], [5702, 5750], [], 1);
  assert.ok(ghosts.some((s) => Math.abs(s - 5700) < 0.01));
  assert.ok(!ghosts.some((s) => Math.abs(s - 5750) < 0.01));
}

{
  const again = parkMovedBreakEvens([5702], [5703], [5700], 1);
  assert.equal(again.filter((s) => Math.abs(s - 5700) < 0.01).length, 1);
}
