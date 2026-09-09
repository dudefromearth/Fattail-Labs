/**
 *   npx --yes tsx lib/marketCalendar/index.test.ts
 */
import assert from "node:assert/strict";
import {
  earlyCloses,
  easterSunday,
  nyseHolidays,
  OVERRIDES,
  statusFor,
} from "./index";

function dates(year: number): string[] {
  return nyseHolidays(year).map((h) => h.date.slice(5));
}

function early(year: number): string[] {
  return earlyCloses(year).map((h) => h.date.slice(5));
}

assert.deepEqual(dates(2026), [
  "01-01",
  "01-19",
  "02-16",
  "04-03",
  "05-25",
  "06-19",
  "07-03",
  "09-07",
  "11-26",
  "12-25",
]);

assert.deepEqual(dates(2027), [
  "01-01",
  "01-18",
  "02-15",
  "03-26",
  "05-31",
  "06-18",
  "07-05",
  "09-06",
  "11-25",
  "12-24",
]);

assert.deepEqual(early(2026), ["11-27", "12-24"]);
assert.deepEqual(early(2027), ["11-26"]);

const e26 = easterSunday(2026);
assert.equal(`${e26.y}-${String(e26.m).padStart(2, "0")}-${String(e26.d).padStart(2, "0")}`, "2026-04-05");
assert.equal(nyseHolidays(2026).find((h) => h.name === "Good Friday")?.date, "2026-04-03");
assert.equal(nyseHolidays(2027).find((h) => h.name === "Good Friday")?.date, "2027-03-26");

assert.equal(statusFor("2021-12-31").kind, "open");
assert.equal(statusFor("2020-07-03").kind, "closed");

assert.equal(nyseHolidays(2031).length, 10);

assert.deepEqual(early(2028), ["07-03", "11-24"]);

assert.equal(OVERRIDES.length, 0);

assert.equal(statusFor("2026-11-26").kind, "closed");
assert.equal(statusFor("2026-11-27").kind, "early");
assert.equal(statusFor("2026-09-05").kind, "weekend");

console.log("marketCalendar/index.test.ts ok");
