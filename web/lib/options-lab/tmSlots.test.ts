/**
 *   npx --yes tsx lib/options-lab/tmSlots.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  TM_HOLE_NO_DATE,
  captureToday,
  discardArchiveReturnLive,
  enterTodayReplay,
  exitReplay,
  getTmSlots,
  occupancyDigest,
  formatTodayHorizon,
  resetTmSlotsForTests,
  setArchive,
  setPlayhead,
  subscribeTmSlots,
  tradingDateFromAsOf,
} from "./tmSlots";

resetTmSlotsForTests();

const src = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "tmSlots.ts"),
  "utf8",
);
assert.doesNotMatch(src, /\bheldDay\s*[:=]/, "occupancy is not a single date field");

assert.equal(tradingDateFromAsOf("2026-08-28T13:45:00.000Z"), "2026-08-28");
assert.equal(tradingDateFromAsOf(null), null);

assert.equal(
  captureToday({
    t_ms: 1,
    asOf: "",
    contentHash: "a",
    spot: 1,
    symbol: "SPX",
    expiration: "2026-08-28",
  }),
  TM_HOLE_NO_DATE,
);
assert.equal(getTmSlots().today, null);
assert.equal(getTmSlots().hole, TM_HOLE_NO_DATE);

resetTmSlotsForTests();
assert.equal(
  captureToday({
    t_ms: 1_000,
    asOf: "2026-08-28T13:30:00.000Z",
    contentHash: "h1",
    spot: 6400,
    symbol: "SPX",
    expiration: "2026-08-28",
  }),
  null,
);
assert.equal(getTmSlots().today?.gens.length, 1);

captureToday({
  t_ms: 2_000,
  asOf: "2026-08-28T13:30:02.000Z",
  contentHash: "h1",
  spot: 6401,
  symbol: "SPX",
  expiration: "2026-08-28",
});
assert.equal(getTmSlots().today?.gens.length, 1, "same hash replaces in place");
assert.equal(getTmSlots().today?.gens[0].spot, 6401);

captureToday({
  t_ms: 3_000,
  asOf: "2026-08-28T13:30:04.000Z",
  contentHash: "h2",
  spot: 6402,
  symbol: "SPX",
  expiration: "2026-08-28",
});
assert.equal(getTmSlots().today?.gens.length, 2);

resetTmSlotsForTests();
captureToday({
  t_ms: 5_000,
  asOf: "2026-08-28T14:00:00.000Z",
  contentHash: "live",
  spot: 6410,
  symbol: "SPX",
  expiration: "2026-08-28",
});
captureToday({
  t_ms: 1_000,
  asOf: "2026-08-28T13:30:00.000Z",
  contentHash: "open",
  spot: 6400,
  symbol: "SPX",
  expiration: "2026-08-28",
});
assert.deepEqual(
  getTmSlots().today?.gens.map((g) => g.contentHash),
  ["open", "live"],
  "a morning gen inserts before a later live gen",
);

setArchive({ day: "2026-08-25", gens: [] });
assert.equal(getTmSlots().archive?.day, "2026-08-25");
assert.equal(getTmSlots().today?.gens.length, 2, "archive does not discard today");
assert.equal(getTmSlots().playhead.projector, "archive");

captureToday({
  t_ms: 4_000,
  asOf: "2026-08-28T13:30:06.000Z",
  contentHash: "h3",
  spot: 6403,
  symbol: "SPX",
  expiration: "2026-08-28",
});
assert.equal(
  getTmSlots().today?.gens.length,
  3,
  "capture continues while archive is open",
);

resetTmSlotsForTests();
captureToday({
  t_ms: 1_000,
  asOf: "2026-08-28T13:30:00.000Z",
  contentHash: "h1",
  spot: 6400,
  symbol: "SPX",
  expiration: "2026-08-28",
});
const switchSeen: Array<string | null> = [];
const unsubSwitch = subscribeTmSlots(() => {
  switchSeen.push(getTmSlots().archive?.day ?? null);
});
setArchive({ day: "2026-08-25", gens: [] });
setArchive({ day: "2026-08-21", gens: [] });
unsubSwitch();
assert.deepEqual(
  switchSeen,
  ["2026-08-25", null, "2026-08-21"],
  "switch discards the first archive day before accepting the next",
);
assert.equal(getTmSlots().archive?.day, "2026-08-21", "one archive day");
assert.equal(getTmSlots().today?.gens.length, 1);
assert.equal(occupancyDigest().archiveDay, "2026-08-21");

exitReplay();
assert.equal(getTmSlots().archive, null);
assert.equal(getTmSlots().today?.gens.length, 1, "Reset keeps today");
assert.equal(getTmSlots().playhead.projector, "live", "Reset exits replay");
assert.equal(getTmSlots().playhead.t_ms, null);

enterTodayReplay();
assert.equal(getTmSlots().playhead.projector, "today");
assert.equal(getTmSlots().playhead.t_ms, 1_000, "date=today parks newest");
assert.equal(getTmSlots().today?.gens.length, 1);

discardArchiveReturnLive();
assert.equal(getTmSlots().playhead.projector, "live");

setPlayhead(4_000, "today");
captureToday({
  t_ms: 10_000,
  asOf: "2026-08-29T13:30:00.000Z",
  contentHash: "next-day",
  spot: 1,
  symbol: "SPX",
  expiration: "2026-08-29",
});
assert.equal(getTmSlots().today?.tradingDate, "2026-08-29");
assert.equal(getTmSlots().today?.gens.length, 1, "TMI-73 discards previous today");

const tree = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "tmSlots.ts"),
  "utf8",
);
assert.doesNotMatch(tree, /redis/i, "no Redis TM write");

resetTmSlotsForTests();
captureToday({
  t_ms: Date.parse("2026-08-28T09:30:00-04:00"),
  asOf: "2026-08-28T09:30:00-04:00",
  contentHash: "rth",
  spot: 6400,
  symbol: "SPX",
  expiration: "2026-08-28",
});
{
  const h = formatTodayHorizon();
  assert.equal(h.fromOpen, false);
  assert.match(h.line, /Raise a day/);
  assert.doesNotMatch(h.line, /from the open/);
}
resetTmSlotsForTests();
setArchive({
  day: "2026-08-27",
  gens: [
    {
      t_ms: Date.parse("2026-08-27T09:32:00-04:00"),
      asOf: "2026-08-27T09:32:00-04:00",
      contentHash: "first",
      spot: 6400,
      symbol: "SPX",
      expiration: "2026-08-27",
    },
  ],
});
{
  const h = formatTodayHorizon();
  assert.match(h.line, /The archive holds from 9:32 AM ET/);
  assert.doesNotMatch(h.line, /from the open/);
}

console.log("tmSlots.test.ts ok");
