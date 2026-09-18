/**
 *   npx --yes tsx lib/saAxis.test.ts
 * A19 five zooms: years-wide → tight intraday; both axes yield, never crowd.
 */
import assert from "node:assert/strict";
import { priceStepForSpan, timeLabelAt, timeUnitForSpan } from "./saAxis";

const zooms: { name: string; spanSec: number; unit: ReturnType<typeof timeUnitForSpan> }[] = [
  { name: "years-wide", spanSec: 3 * 365 * 86400, unit: "year" },
  { name: "months", spanSec: 180 * 86400, unit: "month" },
  { name: "weeks", spanSec: 21 * 86400, unit: "date" },
  { name: "days", spanSec: 3 * 86400, unit: "date" },
  { name: "tight-intraday", spanSec: 6 * 3600, unit: "hm" },
];

const seen: string[] = [];
for (const z of zooms) {
  const u = timeUnitForSpan(z.spanSec);
  assert.equal(u, z.unit, z.name);
  seen.push(u);
}
assert.deepEqual(seen, ["year", "month", "date", "date", "hm"]);

const d0 = new Date("2026-09-18T10:00:00Z");
const d1 = new Date("2026-09-18T11:00:00Z");
const d2 = new Date("2026-09-19T00:00:00Z");
assert.equal(timeLabelAt(d1, "hm", d0), "11:00");
assert.match(timeLabelAt(d2, "hm", d1), /Sep/);

assert.equal(priceStepForSpan(2, 0.25), 0.25);
assert.ok(priceStepForSpan(80, 0.25) >= 5);
assert.ok(priceStepForSpan(800, 0.25) >= 50);

console.log("saAxis.test.ts ok — 5 zooms collapse");
