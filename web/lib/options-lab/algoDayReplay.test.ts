/**
 *   npx --yes tsx lib/options-lab/algoDayReplay.test.ts
 */

import {
  clampReplayWindow,
  fullReplayWindow,
  panReplayWindow,
  replayCursor,
  replayFrac,
  replayFracInWindow,
  sampleAtFrac,
  sampleAtWindowFrac,
  sessionOpenCursor,
  sessionOpenSpot,
  sessionSpotNow,
  spotPctFromReplay,
  zoomReplayWindow,
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

{
  const full = fullReplayWindow(samples);
  assert(full != null && full.loMs === 1_000 && full.hiMs === 7_000, "full window");
  const panned = panReplayWindow({ loMs: 3_000, hiMs: 5_000 }, samples, 0.5);
  assert(panned.loMs < 3_000, "drag right reveals older");
  const left = panReplayWindow({ loMs: 1_000, hiMs: 3_000 }, samples, 1);
  assert(left.loMs === 1_000, "cannot pan past first print");
  const zIn = zoomReplayWindow({ loMs: 1_000, hiMs: 7_000 }, samples, 4_000, 0.5);
  assert(zIn.hiMs - zIn.loMs < 7_000 - 1_000, "compress shortens span");
  const zOut = zoomReplayWindow(zIn, samples, 4_000, 4);
  assert(zOut.hiMs - zOut.loMs >= zIn.hiMs - zIn.loMs, "expand lengthens span");
  const clamped = clampReplayWindow({ loMs: 0, hiMs: 9_000 }, samples);
  assert(clamped.loMs === 1_000 && clamped.hiMs === 7_000, "clamp to samples");
  assert(Math.abs(replayFracInWindow({ loMs: 1_000, hiMs: 7_000 }, 4_000) - 0.5) < 1e-9, "mid in window");
  const at = sampleAtWindowFrac(samples, { loMs: 1_000, hiMs: 7_000 }, 1);
  assert(at != null && at.spot === 102, "window frac 1");
}

console.log("  16 tests passed");
