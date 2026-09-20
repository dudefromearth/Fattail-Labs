/**
 *   npx --yes tsx lib/saVpBand.test.ts
 */
import assert from "node:assert/strict";
import {
  bandContains,
  beginBandFetch,
  displayRow,
  endBandFetch,
  expandBand,
  hitProfile,
  hostToPane,
  panePriceWindow,
  FORCE_VP_EVENT,
  asUnixMs,
  candlesInMsRange,
  mockBinsFromCandles,
  profileFetchPlan,
  profileRowGrain,
  visibleCandleWindow,
  rangeUrl,
  sliceVisible,
  vpBandEpoch,
  windowUrl,
} from "./saVpBand";

assert.equal(profileRowGrain({ layout: "number-of-rows", rowSize: 24, span: 240, tick: 0.25 }), 10);
assert.equal(profileRowGrain({ layout: "ticks-per-row", rowSize: 1, span: 240, tick: 0.25 }), 0.25);
assert.equal(profileRowGrain({ layout: "ticks-per-row", rowSize: 4, span: 240, tick: 0.25 }), 1);
assert.equal(displayRow(40, 400, 0.25), 0.1);
assert.equal(displayRow(800, 400, 0.25), 0.25);
assert.equal(displayRow(2, 400, 0.25), 2 / 400);

const band = expandBand(100, 110);
assert.equal(band.lo, 90);
assert.equal(band.hi, 120);
assert.equal(bandContains(band, 100, 110), true);
assert.equal(bandContains(band, 89, 110), false);

const { rows, max } = sliceVisible(
  [
    { price: 99, volume: 9 },
    { price: 105, volume: 20 },
    { price: 108, volume: 4 },
    { price: 121, volume: 99 },
  ],
  100,
  110,
);
assert.equal(rows.length, 2);
assert.equal(max, 20);

const url = rangeUrl({
  target: "SPX",
  source: "ES",
  from: "2026-01-01",
  to: "2026-09-18",
  lo: 6400,
  hi: 6800,
  row: 0.25,
});
assert.match(url, /\/api\/app\/vp\/v1\/range\/SPX\?/);
assert.match(url, /price_lo=6400/);
assert.match(url, /row=0.25/);
assert.match(url, /source=ES/);

const wait = profileFetchPlan({
  fromT: 0,
  toT: 0,
  target: "SPX",
  source: "ES",
});
assert.equal(wait.kind, "wait");
assert.equal(wait.url, undefined);

const win = profileFetchPlan({
  fromT: 1_000,
  toT: 5_000,
  target: "SPX",
  source: "ES",
});
assert.equal(win.kind, "window");
assert.match(win.url || "", /\/window\/SPX\?/);
assert.match(win.url || "", /from_t=1000/);
assert.doesNotMatch(win.url || "", /\/range\//);
assert.equal(FORCE_VP_EVENT, "sa-vp-update");

const mock = mockBinsFromCandles(
  [
    { high: 101, low: 100 },
    { high: 100.5, low: 99.5 },
    { high: 102, low: 101 },
  ],
  0.25,
);
assert.ok(mock.length > 3);
assert.ok(mock.every((b) => b.volume > 0));
assert.ok(mock.some((b) => b.price >= 100 && b.price <= 101));
assert.equal(asUnixMs(1_700_000_000), 1_700_000_000_000);
assert.equal(asUnixMs(1_700_000_000_000), 1_700_000_000_000);

const times = [100, 400, 700, 1000, 1300];
const vis = visibleCandleWindow({
  logical: { from: 1.2, to: 3.1 },
  times,
  tfMs: 300_000,
});
assert.ok(vis);
assert.equal(vis.fromIdx, 1);
assert.equal(vis.toIdx, 3);
assert.equal(vis.count, 3);
assert.equal(vis.fromT, 400_000);
assert.equal(vis.toT, 1_000_000 + 300_000);

const overlap = candlesInMsRange(times, 400_000, 1_000_000 + 1, 300_000);
assert.ok(overlap);
assert.equal(overlap.count, 3);
assert.equal(overlap.fromIdx, 1);
assert.equal(overlap.toIdx, 3);
assert.equal(candlesInMsRange(times, 0, 10, 300_000), null);

const wurl = windowUrl({
  target: "SPX",
  source: "ES",
  fromT: 1000,
  toT: 2000,
});
assert.match(wurl, /from_t=1000/);
assert.match(wurl, /to_t=2000/);

assert.equal(
  hitProfile([{ x0: 0, y0: 10, x1: 40, y1: 20 }], 10, 15),
  true,
);
assert.equal(
  hitProfile([{ x0: 0, y0: 10, x1: 40, y1: 20 }], 50, 15),
  false,
);

const panePt = hostToPane(80, 12, { width: 500, height: 420 }, { width: 420, height: 400 }, "left");
assert.ok(panePt);
assert.equal(panePt.x, 0);
assert.equal(panePt.y, 12);
assert.equal(
  hostToPane(10, 12, { width: 500, height: 420 }, { width: 420, height: 400 }, "left"),
  null,
);
assert.ok(
  hostToPane(10, 12, { width: 500, height: 420 }, { width: 420, height: 400 }, "right"),
);

const priceAt = (y: number) => 1000 - y;
assert.equal(panePriceWindow(priceAt, 7), null);
const pane = panePriceWindow(priceAt, 400);
assert.ok(pane);
assert.equal(pane.lo, 600);
assert.equal(pane.hi, 1000);
const hostBox = panePriceWindow(priceAt, 450);
assert.ok(hostBox);
assert.notEqual(hostBox.lo, pane.lo);

const epochA = vpBandEpoch({
  source: "ES",
  target: "SPX",
  from: "2026-01-01",
  to: "2026-09-18",
  priceTf: "5m",
  harness: "live",
  apiBase: "/api/app/vp/v1",
});
const epochTf = vpBandEpoch({
  source: "ES",
  target: "SPX",
  from: "2026-01-01",
  to: "2026-09-18",
  priceTf: "15m",
  harness: "live",
  apiBase: "/api/app/vp/v1",
});
const epochSym = vpBandEpoch({
  source: "NQ",
  target: "NDX",
  from: "2026-01-01",
  to: "2026-09-18",
  priceTf: "5m",
  harness: "live",
  apiBase: "/api/app/vp/v1",
});
assert.notEqual(epochA, epochTf);
assert.notEqual(epochA, epochSym);

const flight = { inflight: false, pending: false };
const fetches: string[] = [];
const ensure = (need: boolean) => {
  if (!need) return;
  if (beginBandFetch(flight) === "wait") return;
  fetches.push("fetch");
};
ensure(true);
ensure(true);
assert.deepEqual(fetches, ["fetch"]);
assert.equal(flight.pending, true);
assert.equal(endBandFetch(flight), "again");
ensure(true);
assert.deepEqual(fetches, ["fetch", "fetch"]);
assert.equal(endBandFetch(flight), "idle");

console.log("saVpBand.test.ts ok");
