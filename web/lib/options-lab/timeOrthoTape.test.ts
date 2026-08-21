import assert from "node:assert/strict";
import {
  dayClockToX,
  followPriceView,
  layoutDayAxis,
  leftChromeRightPx,
  listedStrikeTicks,
  positionPriceView,
  scrollPriceView,
  sessionClockBands,
  tickerPriceTicks,
  unionPriceView,
  tapePriceView,
  applyLiveTapeClose,
} from "./timeOrthoTape";
import { BAR_MS, nyWallToUtcMs } from "./timeOrthoSession";

const day = nyWallToUtcMs(2026, 8, 18, 10, 0);
const open = nyWallToUtcMs(2026, 8, 18, 9, 30);
const close = nyWallToUtcMs(2026, 8, 18, 16, 0);
const pre = nyWallToUtcMs(2026, 8, 18, 4, 0);
const post = nyWallToUtcMs(2026, 8, 18, 20, 0);
const noon = nyWallToUtcMs(2026, 8, 18, 12, 0);

{
  const width = 1400;
  const axis = layoutDayAxis(width, 700, day, [], leftChromeRightPx(width));
  const hudRight = leftChromeRightPx(width);
  assert.ok(axis.xOpen > hudRight, "cash open sits to the right of the controls");
  assert.ok(axis.xOpen - hudRight < 80, "open is only slightly past the controls");
  assert.ok(axis.xClose < axis.plotRight, "close is left of the right edge");
  assert.ok(axis.plotRight - axis.xClose >= 80, "post-market has room on the right");

  const xPre = dayClockToX(pre, axis);
  const xOpen = dayClockToX(open, axis);
  const xNoon = dayClockToX(noon, axis);
  const xClose = dayClockToX(close, axis);
  const xPost = dayClockToX(post, axis);
  assert.ok(xPre < xOpen && xOpen < xNoon && xNoon < xClose && xClose < xPost);
  assert.ok(Math.abs(xOpen - axis.xOpen) < 1);
  assert.ok(Math.abs(xClose - axis.xClose) < 1);

  // Uniform RTH: 5m at 10:00 and 10:05 have the same pixel width.
  const t1000 = nyWallToUtcMs(2026, 8, 18, 10, 0);
  const t1005 = nyWallToUtcMs(2026, 8, 18, 10, 5);
  const t1500 = nyWallToUtcMs(2026, 8, 18, 15, 0);
  const t1505 = nyWallToUtcMs(2026, 8, 18, 15, 5);
  const wMorning = dayClockToX(t1005, axis) - dayClockToX(t1000, axis);
  const wClose = dayClockToX(t1505, axis) - dayClockToX(t1500, axis);
  assert.ok(Math.abs(wMorning - wClose) < 0.01);
  // Pre/post padding is compressed vs RTH (same 5 minutes, fewer pixels).
  const t0400 = nyWallToUtcMs(2026, 8, 18, 4, 0);
  const t0405 = nyWallToUtcMs(2026, 8, 18, 4, 5);
  const wPre5 = dayClockToX(t0405, axis) - dayClockToX(t0400, axis);
  assert.ok(wPre5 < wMorning);
}

{
  const bands = sessionClockBands(open);
  const ids = bands.map((b) => b.id);
  assert.deepEqual(ids, ["pre", "morning", "afternoon", "closing", "post"]);
}

{
  const grown = followPriceView({ lo: 100, hi: 110 }, 109, { lo: 100, hi: 106 });
  assert.ok(grown);
  assert.ok(grown.hi >= 110);
  const followed = followPriceView({ lo: 100, hi: 110 }, 112, { lo: 100, hi: 110 });
  assert.ok(followed);
  assert.ok(followed.hi > 110);
  const scrolled = scrollPriceView({ lo: 100, hi: 110 }, 50, 200);
  assert.ok(scrolled.lo > 100);
}

{
  const pos = positionPriceView(5600, 5800);
  const tape = { lo: 5710, hi: 5735 };
  const view = unionPriceView(pos, tape);
  assert.ok(view);
  assert.ok(view.lo <= 5600);
  assert.ok(view.hi >= 5735);
  const shared = tapePriceView({ box: pos, printed: tape, shareBox: true });
  assert.ok(shared);
  assert.equal(shared.lo, 5600);
  assert.equal(shared.hi, 5800);
  const warm = tapePriceView({ box: pos, printed: tape, shareBox: false });
  assert.ok(warm);
  assert.ok(warm.lo < 5600);
  assert.ok(warm.hi > 5735);
  const snap = followPriceView({ lo: 5710, hi: 5730 }, 5720, { lo: 0, hi: 1 });
  assert.ok(snap && snap.lo > 5000, "dummy 0–1 scale must not crush live prices");
}

{
  const slot = Math.floor(Date.now() / BAR_MS) * BAR_MS;
  const bars = [{ t: slot, o: 100, h: 101, l: 99, c: 100.5 }];
  const live = applyLiveTapeClose(bars, 102, slot + 60_000);
  assert.equal(live.length, 1);
  assert.equal(live[0].c, 102);
  assert.equal(live[0].h, 102);
  assert.equal(live[0].l, 99);
  const next = applyLiveTapeClose(bars, 103, slot + BAR_MS + 1000);
  assert.equal(next.length, 2);
  assert.equal(next[1].o, 100.5);
  assert.equal(next[1].c, 103);
}

{
  const openMs = nyWallToUtcMs(2026, 8, 18, 9, 30);
  const sess = sessionClockBands(openMs);
  const aft = sess.find((b) => b.id === "afternoon");
  const clo = sess.find((b) => b.id === "closing");
  assert.ok(aft && clo);
  assert.equal(aft.t0, nyWallToUtcMs(2026, 8, 18, 12, 0));
  assert.equal(clo.t0, nyWallToUtcMs(2026, 8, 18, 14, 30));
}

{
  const listed: number[] = [];
  for (let k = 5600; k <= 5800; k += 5) listed.push(k);
  const ks = listedStrikeTicks(listed, 5650, 5750, 400);
  assert.ok(ks.length >= 3);
  assert.ok(ks.every((s) => listed.includes(s)));
  assert.ok(ks.every((s) => s >= 5650 && s <= 5750));
  const px = tickerPriceTicks(5650, 5750, 400);
  assert.ok(px.length >= 3);
  assert.ok(px.every((p) => p >= 5650 && p <= 5750));
}
