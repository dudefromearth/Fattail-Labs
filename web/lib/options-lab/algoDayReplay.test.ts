/**
 *   npx --yes tsx lib/options-lab/algoDayReplay.test.ts
 */

import {
  replayCursor,
  replayFrac,
  sampleAtFrac,
  sessionOpenCursor,
  sessionOpenSpot,
  sessionSpotNow,
  spotPctFromReplay,
} from "./algoDayReplay";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const samples = [
  { t_ms: 1_000, spot: 100 },
  { t_ms: 4_000, spot: 101 },
  { t_ms: 7_000, spot: 102 },
];

console.log("algoDayReplay");

{
  const c = replayCursor({
    samples,
    originWallMs: 0,
    originSampleMs: 1_000,
    nowWallMs: 0,
    speed: 10,
  });
  assert(c != null && c.spot === 100 && c.idx === 0, "t=0 first print");
}

{
  const c = replayCursor({
    samples,
    originWallMs: 10_000,
    originSampleMs: 1_000,
    nowWallMs: 10_300,
    speed: 10,
  });
  assert(c != null && c.spot === 101 && c.idx === 1, "0.3s at 10x → 3s in");
}

{
  const c = replayCursor({
    samples,
    originWallMs: 0,
    originSampleMs: 1_000,
    nowWallMs: 10_000,
    speed: 20,
  });
  assert(c != null && c.done && c.spot === 102, "past last sample is done");
}

assert(Math.abs(spotPctFromReplay(7700, 7641) - ((7700 / 7641) * 100 - 100)) < 1e-9, "pct");

{
  const ohlc = [
    { t_ms: 1, spot: 6410.25, o: 6382.5, h: 6412, l: 6380, c: 6410.25 },
    { t_ms: 2, spot: 6411, o: 6410.25, h: 6413, l: 6408, c: 6411 },
  ];
  assert(sessionOpenSpot(ohlc) === 6382.5, "open is first bar o, not close");
  const cur = sessionOpenCursor(ohlc);
  assert(cur != null && cur.spot === 6382.5 && cur.idx === 0, "cursor at open");
  assert(sessionOpenSpot([{ t_ms: 1, spot: 5000 }]) === 5000, "marks: first print");
  assert(sessionOpenSpot([]) == null, "empty path");
  assert(sessionSpotNow(null, 6382.5) === 6382.5, "parked at open");
  const walking = sessionOpenCursor(ohlc);
  assert(walking != null, "cursor");
  walking.spot = 6401;
  assert(sessionSpotNow(walking, 6382.5) === 6401, "playhead wins for entry");
}

{
  assert(Math.abs(replayFrac(samples, 4_000) - 0.5) < 1e-9, "mid frac");
  const s = sampleAtFrac(samples, 0);
  assert(s != null && s.spot === 100, "frac 0");
  const e = sampleAtFrac(samples, 1);
  assert(e != null && e.spot === 102, "frac 1");
}

console.log("  8 tests passed");
