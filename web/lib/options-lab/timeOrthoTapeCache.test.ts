import assert from "node:assert/strict";
import {
  clearTapeCache,
  isFreshTapeCache,
  readTapeCache,
  resetTapeCacheForTests,
  tapeCacheKey,
  writeTapeCache,
} from "./timeOrthoTapeCache";
import { chartWindow, nyWallToUtcMs } from "./timeOrthoSession";

resetTapeCacheForTests();

{
  const noon = nyWallToUtcMs(2026, 8, 18, 12, 0);
  const win = chartWindow(noon);
  const a = writeTapeCache({
    symbol: "spx",
    fromMs: win.fromMs,
    toMs: win.toMs,
    prefillsPriorDay: win.prefillsPriorDay,
    bars: [{ t: win.fromMs + 60_000, o: 1, h: 2, l: 1, c: 1.5 }],
    fetchedAt: noon,
  });
  assert.equal(a.symbol, "SPX");
  const hit = readTapeCache("SPX", noon);
  assert.ok(hit);
  assert.equal(hit.bars.length, 1);
  assert.equal(tapeCacheKey("spx", noon), tapeCacheKey("SPX", noon));
  assert.equal(isFreshTapeCache(hit, noon + 1_000), true);
  assert.equal(isFreshTapeCache(hit, noon + 60_000), false);
}

{
  const noon = nyWallToUtcMs(2026, 8, 18, 12, 0);
  const nextDay = nyWallToUtcMs(2026, 8, 19, 12, 0);
  assert.equal(readTapeCache("SPX", nextDay), null);
}

{
  clearTapeCache("SPX");
  assert.equal(readTapeCache("SPX", nyWallToUtcMs(2026, 8, 18, 12, 0)), null);
}

console.log("timeOrthoTapeCache.test.ts ok");
