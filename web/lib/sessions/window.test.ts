/**
 *   TZ=UTC npx --yes tsx lib/sessions/window.test.ts
 *   TZ=Asia/Tokyo npx --yes tsx lib/sessions/window.test.ts
 */
import assert from "node:assert/strict";
import {
  occupiesAxis,
  sessionWindow,
  tradingDayInProgress,
} from "./sessionView";
import { etRangeLabel } from "./timeAxis";
import { DAY_MINUTES, WINDOW_DAYS_DEFAULT } from "./timeAxis";

{
  /* AT-GSC-80 */
  const w = sessionWindow("2026-09-08", { now: new Date("2020-01-01T12:00:00Z") });
  assert.equal(w.count, WINDOW_DAYS_DEFAULT);
  assert.equal(w.days.length, 7);
  assert.equal(w.span, 7 * DAY_MINUTES);
  assert.equal(w.isoDates.includes("2026-09-05"), false);
  assert.equal(w.isoDates.includes("2026-09-06"), false);
  const weekendSeam = w.seams.find((s) => s.kind === "weekend");
  assert.ok(weekendSeam, "weekend seam present");
  assert.ok(weekendSeam.skipped.includes("2026-09-05") || weekendSeam.skipped.includes("2026-09-06"));
}

{
  /* AT-GSC-85 Fri→Mon seam, no weekend span (week without a Monday holiday) */
  const w = sessionWindow("2026-09-14", { now: new Date("2020-01-01T12:00:00Z") });
  const iFri = w.isoDates.indexOf("2026-09-11");
  const iMon = w.isoDates.indexOf("2026-09-14");
  assert.ok(iFri >= 0 && iMon === iFri + 1);
  const seam = w.seams.find((s) => s.afterIndex === iFri);
  assert.ok(seam);
  assert.equal(seam.kind, "weekend");
  assert.equal(w.isoDates.includes("2026-09-12"), false);
  assert.equal(w.isoDates.includes("2026-09-13"), false);
}

{
  /* AT-GSC-81 London both sides of 2026-10-25 */
  const w = sessionWindow("2026-10-26", { now: new Date("2020-01-01T12:00:00Z") });
  assert.ok(w.isoDates.includes("2026-10-23"));
  assert.ok(w.isoDates.includes("2026-10-26"));
  assert.equal(w.isoDates.includes("2026-10-25"), false);
  const fri = etRangeLabel("2026-10-23", "Europe/London", 8 * 60, 16 * 60 + 30);
  const mon = etRangeLabel("2026-10-26", "Europe/London", 8 * 60, 16 * 60 + 30);
  assert.equal(fri.startsWith("3:00 AM"), true, fri);
  assert.equal(mon.startsWith("4:00 AM"), true, mon);
}

{
  /* AT-GSC-82 Sydney both sides of 2026-10-03 */
  const w = sessionWindow("2026-10-05", { now: new Date("2020-01-01T12:00:00Z") });
  assert.ok(w.isoDates.includes("2026-10-02"));
  assert.ok(w.isoDates.includes("2026-10-05"));
  assert.equal(w.isoDates.includes("2026-10-03"), false);
  const before = etRangeLabel("2026-10-02", "Australia/Sydney", 10 * 60, 16 * 60);
  const after = etRangeLabel("2026-10-05", "Australia/Sydney", 10 * 60, 16 * 60);
  assert.notEqual(before, after);
}

{
  /* AT-GSC-83 Thanksgiving week */
  const w = sessionWindow("2026-11-27", { now: new Date("2020-01-01T12:00:00Z") });
  const thu = w.days.find((d) => d.isoDate === "2026-11-26");
  const fri = w.days.find((d) => d.isoDate === "2026-11-27");
  assert.ok(thu && fri);
  assert.equal(thu.banner, "closed");
  assert.equal(fri.banner, "early");
  assert.equal(thu.segments.length, 0);
  assert.equal(fri.segments.length, 2);
  assert.equal(fri.segments[1].truncated, true);
  assert.equal(
    fri.segments.find((s) => s.label === "Closing"),
    undefined,
  );
}

{
  /* AT-GSC-88 Christmas collapses; Thanksgiving does not */
  assert.equal(occupiesAxis("2026-12-25"), false);
  assert.equal(occupiesAxis("2026-11-26"), true);
  const xmas = sessionWindow("2026-12-24", { now: new Date("2020-01-01T12:00:00Z") });
  assert.equal(xmas.isoDates.includes("2026-12-25"), false);
  const seam = xmas.seams.find((s) => s.skipped.includes("2026-12-25"));
  assert.ok(seam);
  assert.equal(seam.kind, "cme-closed");
  const tg = sessionWindow("2026-11-26", { now: new Date("2020-01-01T12:00:00Z") });
  assert.ok(tg.isoDates.includes("2026-11-26"));
}

{
  /* GSC4.3 — Sunday 19:00 ET is already Monday's session (EDT) */
  const sunEve = new Date("2026-09-06T23:00:00Z"); // 19:00 EDT
  assert.equal(tradingDayInProgress(sunEve), "2026-09-07");
}

{
  /* AT-GSC-84 structure: last day occupies a full DAY_MINUTES at the end */
  const w = sessionWindow("2026-09-08", { now: new Date("2020-01-01T12:00:00Z") });
  const last = w.days[w.days.length - 1];
  assert.equal(last.axisOrigin + DAY_MINUTES, w.span);
}

console.log("sessions/window.test.ts ok");
