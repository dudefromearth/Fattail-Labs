import assert from "node:assert/strict";
import {
  formatExpiryClock,
  isRthEt,
  listTimeAxisMarks,
  nyDateTimeToUtcMs,
  openToExpirySpan,
  sheetTimeWindow,
} from "./surfaceTimeAxis";
import { computeSurfaceSheet, legsFromRelative } from "./surfaceModel";

{
  const ten = nyDateTimeToUtcMs("2026-08-18", 10, 0);
  const four = nyDateTimeToUtcMs("2026-08-18", 16, 0);
  const marks = listTimeAxisMarks({ tNow: ten, tExp: four });
  const labels = marks.filter((m) => m.label).map((m) => m.label);
  assert.deepEqual(labels, ["Noon"]);
  assert.ok(marks.every((m) => m.tMs > ten && m.tMs < four));
  assert.ok(marks.some((m) => m.kind === "hour"));
  assert.ok(!marks.some((m) => m.kind === "open"), "Open is already past at 10:00");
}

{
  const eight = nyDateTimeToUtcMs("2026-08-18", 8, 0);
  const four = nyDateTimeToUtcMs("2026-08-18", 16, 0);
  const marks = listTimeAxisMarks({ tNow: eight, tExp: four });
  const labels = marks.filter((m) => m.label).map((m) => m.label);
  assert.deepEqual(labels, ["Open", "Noon"]);
  const open = marks.find((m) => m.kind === "open");
  assert.ok(open);
  assert.equal(formatExpiryClock(open!.tMs), "Aug 18, 9:30 AM ET");
}

{
  const eve = nyDateTimeToUtcMs("2026-08-18", 20, 0);
  const nextFour = nyDateTimeToUtcMs("2026-08-19", 16, 0);
  const marks = listTimeAxisMarks({ tNow: eve, tExp: nextFour });
  const labels = marks.filter((m) => m.label).map((m) => m.label);
  assert.deepEqual(labels, ["Midnight", "Open", "Noon"]);
}

{
  const sat = nyDateTimeToUtcMs("2026-08-22", 8, 0);
  const sun = nyDateTimeToUtcMs("2026-08-23", 16, 0);
  const marks = listTimeAxisMarks({ tNow: sat, tExp: sun });
  assert.ok(!marks.some((m) => m.kind === "open"), "weekend has no Open");
  assert.ok(marks.some((m) => m.label === "Noon"));
  assert.ok(marks.some((m) => m.label === "Midnight"));
}

{
  const eight = nyDateTimeToUtcMs("2026-08-18", 8, 0);
  const four = nyDateTimeToUtcMs("2026-08-18", 16, 0);
  const marks = listTimeAxisMarks({ tNow: eight, tExp: four });
  const span = openToExpirySpan({ tNow: eight, tExp: four }, marks);
  assert.ok(span);
  assert.equal(span!.tNow, nyDateTimeToUtcMs("2026-08-18", 9, 30));
  assert.equal(span!.tExp, four);
}

{
  const two = nyDateTimeToUtcMs("2026-08-18", 14, 0);
  const four = nyDateTimeToUtcMs("2026-08-18", 16, 0);
  const marks = listTimeAxisMarks({ tNow: two, tExp: four });
  const span = openToExpirySpan({ tNow: two, tExp: four }, marks);
  assert.ok(span);
  assert.equal(span!.tNow, two, "already in session → remaining Now to Expiry");
}

{
  const eve = nyDateTimeToUtcMs("2026-08-18", 20, 0);
  const nextFour = nyDateTimeToUtcMs("2026-08-19", 16, 0);
  const marks = listTimeAxisMarks({ tNow: eve, tExp: nextFour });
  const span = openToExpirySpan({ tNow: eve, tExp: nextFour }, marks);
  assert.ok(span);
  assert.equal(span!.tNow, nyDateTimeToUtcMs("2026-08-19", 9, 30));
}

{
  const sat = nyDateTimeToUtcMs("2026-08-22", 8, 0);
  const sun = nyDateTimeToUtcMs("2026-08-23", 16, 0);
  const marks = listTimeAxisMarks({ tNow: sat, tExp: sun });
  assert.equal(openToExpirySpan({ tNow: sat, tExp: sun }, marks), null);
}

{
  assert.equal(isRthEt(nyDateTimeToUtcMs("2026-08-18", 9, 29)), false);
  assert.equal(isRthEt(nyDateTimeToUtcMs("2026-08-18", 9, 30)), true);
  assert.equal(isRthEt(nyDateTimeToUtcMs("2026-08-18", 12, 0)), true);
  assert.equal(isRthEt(nyDateTimeToUtcMs("2026-08-18", 15, 59)), true);
  assert.equal(isRthEt(nyDateTimeToUtcMs("2026-08-18", 16, 0)), false);
  assert.equal(isRthEt(nyDateTimeToUtcMs("2026-08-18", 20, 0)), false);
  assert.equal(isRthEt(nyDateTimeToUtcMs("2026-08-22", 12, 0)), false);
}

{
  const sheet = computeSurfaceSheet(
    legsFromRelative(
      [{ strike: 100, quantity: 1, right: "call" }],
      100,
      6 / 24 / 365.25,
      0.2,
    ),
    { spot: 100, nx: 8, nt: 4 },
  );
  const now = nyDateTimeToUtcMs("2026-08-18", 10, 0);
  const win = sheetTimeWindow(sheet, now);
  const hours = (win.tExp - win.tNow) / 3600_000;
  assert.ok(hours > 5 && hours < 7, `~6h remaining, got ${hours}`);
  assert.ok(formatExpiryClock(win.tExp).includes("ET"));
}

console.log("surfaceTimeAxis.test.ts ok");
