import assert from "node:assert/strict";
import {
  sessionBoundaryUnix,
  sessionHoursForSource,
  zonedHmToUnix,
} from "./saSession";

const es = sessionHoursForSource("ES");
assert.deepEqual(es.openHm, [18, 0]);
assert.deepEqual(es.closeHm, [17, 0]);

const equity = sessionHoursForSource("SPY");
assert.deepEqual(equity.openHm, [9, 30]);
assert.deepEqual(equity.closeHm, [16, 0]);

// 2026-09-18 17:00 America/New_York is EDT (UTC-4) → 21:00 UTC
const close = zonedHmToUnix(2026, 9, 18, 17, 0, "America/New_York");
assert.equal(close, Date.UTC(2026, 8, 18, 21, 0, 0) / 1000);

const thuOpen = zonedHmToUnix(2026, 9, 17, 18, 0, "America/New_York");
assert.equal(thuOpen, Date.UTC(2026, 8, 17, 22, 0, 0) / 1000);
const friOpen = zonedHmToUnix(2026, 9, 18, 18, 0, "America/New_York");

const marks = sessionBoundaryUnix({
  fromSec: Date.UTC(2026, 8, 17, 20, 0, 0) / 1000,
  toSec: Date.UTC(2026, 8, 19, 4, 0, 0) / 1000,
  openHm: [18, 0],
  closeHm: [17, 0],
});
assert.ok(marks.includes(close));
assert.ok(marks.includes(thuOpen));
assert.equal(marks.includes(friOpen), false);
console.log("saSession.test.ts ok");
