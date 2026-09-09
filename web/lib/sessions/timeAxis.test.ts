/**
 *   TZ=UTC npx --yes tsx lib/sessions/timeAxis.test.ts
 *   TZ=Asia/Tokyo npx --yes tsx lib/sessions/timeAxis.test.ts
 */
import assert from "node:assert/strict";
import { EXCHANGES } from "./exchanges";
import { etRangeLabel, noonUtc, zoneOffset } from "./timeAxis";

function row(id: string) {
  const r = EXCHANGES.find((e) => e.id === id);
  assert.ok(r, id);
  return r;
}

function envelope(id: string, isoDate: string): string {
  const r = row(id);
  const first = r.segments[0];
  const last = r.segments[r.segments.length - 1];
  return etRangeLabel(isoDate, r.tz, first.startMin, last.endMin);
}

{
  const d = "2026-09-08";
  assert.equal(envelope("nyse", d), "9:30 AM – 4:00 PM");
  assert.equal(envelope("lse", d), "3:00 AM – 11:30 AM");
  assert.equal(envelope("tse", d), "8:00 PM – 2:30 AM");
  assert.equal(envelope("asx", d), "8:00 PM – 2:00 AM");
}

{
  const d = "2026-10-12";
  assert.equal(etRangeLabel(d, "Australia/Sydney", 10 * 60, 16 * 60), "7:00 PM – 1:00 AM");
  assert.equal(etRangeLabel(d, "Asia/Tokyo", 9 * 60, 15 * 60 + 30).startsWith("8:00 PM"), true);
  assert.equal(etRangeLabel(d, "Europe/London", 8 * 60, 16 * 60 + 30).startsWith("3:00 AM"), true);
}

{
  const d = "2026-10-27";
  assert.equal(etRangeLabel(d, "Europe/London", 8 * 60, 16 * 60 + 30), "4:00 AM – 12:30 PM");
  assert.equal(etRangeLabel(d, "Australia/Sydney", 10 * 60, 16 * 60), "7:00 PM – 1:00 AM");
}

{
  const d = "2026-12-07";
  assert.equal(etRangeLabel(d, "Asia/Tokyo", 9 * 60, 15 * 60 + 30), "7:00 PM – 1:30 AM");
  assert.equal(etRangeLabel(d, "Australia/Sydney", 10 * 60, 16 * 60), "6:00 PM – 12:00 AM");
  assert.equal(etRangeLabel(d, "Europe/London", 8 * 60, 16 * 60 + 30), "3:00 AM – 11:30 AM");
}

{
  const d = "2027-03-16";
  assert.equal(etRangeLabel(d, "Europe/London", 8 * 60, 16 * 60 + 30), "4:00 AM – 12:30 PM");
  assert.equal(etRangeLabel(d, "Australia/Sydney", 10 * 60, 16 * 60), "7:00 PM – 1:00 AM");
}

function doesNotThrow(isoDate: string) {
  assert.doesNotThrow(() => {
    const when = noonUtc(isoDate);
    zoneOffset("America/New_York", when);
    zoneOffset("Europe/London", when);
    zoneOffset("Australia/Sydney", when);
    zoneOffset("Asia/Tokyo", when);
    envelope("nyse", isoDate);
    envelope("lse", isoDate);
    envelope("tse", isoDate);
    envelope("asx", isoDate);
  });
}

doesNotThrow("2026-03-08");
doesNotThrow("2026-10-25");
doesNotThrow("2026-10-03");

assert.equal(row("tse").segments[1].endMin, 15 * 60 + 30);

console.log("sessions/timeAxis.test.ts ok");
