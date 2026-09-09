/**
 *   npx --yes tsx lib/sessions/sessionView.test.ts
 */
import assert from "node:assert/strict";
import { paintFor, sessionView } from "./sessionView";
import { segmentOnAxis } from "./timeAxis";

{
  const v = sessionView("2026-11-26");
  assert.equal(v.banner, "closed");
  assert.equal(v.holidayName, "Thanksgiving");
  assert.equal(v.bandEndEtMin, null);
  assert.equal(paintFor(v, "nyse").kind, "closed");
  assert.equal(paintFor(v, "spx-gth").kind, "closed");
  assert.equal(paintFor(v, "spx-reg").kind, "closed");
  assert.equal(paintFor(v, "tsx").kind, "open");
  assert.equal(paintFor(v, "es").kind, "modified");
  assert.equal(v.torontoNormalOpen, true);
}

{
  const v = sessionView("2026-11-27");
  assert.equal(v.banner, "early");
  assert.equal(v.bandEndEtMin, 13 * 60);
  const ny = paintFor(v, "nyse");
  assert.equal(ny.kind, "early");
  if (ny.kind === "early") assert.equal(ny.etLabel, "9:30 AM – 1:00 PM");
  const spx = paintFor(v, "spx-reg");
  assert.equal(spx.kind, "early");
  if (spx.kind === "early") assert.equal(spx.etLabel, "9:30 AM – 1:15 PM");
  const es = paintFor(v, "es");
  assert.equal(es.kind, "early");
  if (es.kind === "early") {
    assert.equal(es.etLabel, "6:00 PM – 1:15 PM");
    assert.notEqual(es.etLabel.includes("5:00 PM"), true);
  }
}

{
  const v = sessionView("2026-09-05");
  assert.equal(v.banner, "weekend");
  assert.equal(v.globexSundayNamed, true);
  assert.equal(paintFor(v, "nyse").kind, "closed");
  assert.equal(paintFor(v, "us-pre").kind, "closed");
}

{
  const v = sessionView("2026-10-12");
  assert.equal(paintFor(v, "tsx").kind, "open");
  assert.equal(v.torontoNormalOpen, true);
}

{
  /* AT-GSC-50 */
  const v = sessionView("2026-09-08", {
    now: new Date("2020-01-01T12:00:00Z"),
  });
  assert.equal(v.segments.length, 3);
  assert.equal(v.segments[0].label, "Morning");
  assert.equal(v.segments[0].startEtMin, 9 * 60 + 30);
  assert.equal(v.segments[0].endEtMin, 12 * 60 + 30);
  assert.equal(v.segments[1].label, "Afternoon");
  assert.equal(v.segments[1].startEtMin, 12 * 60 + 30);
  assert.equal(v.segments[1].endEtMin, 14 * 60 + 30);
  assert.equal(v.segments[2].label, "Closing");
  assert.equal(v.segments[2].startEtMin, 14 * 60 + 30);
  assert.equal(v.segments[2].endEtMin, 16 * 60);
  assert.equal(v.segments.every((s) => !s.truncated), true);
  for (const s of v.segments) {
    const { a, b } = segmentOnAxis(
      "2026-09-08",
      "America/New_York",
      s.startEtMin,
      s.endEtMin,
    );
    assert.equal(s.axisStart, a);
    assert.equal(s.axisEnd, b);
  }
  assert.equal(v.currentSegment, null);
}

{
  /* AT-GSC-51 */
  const v = sessionView("2026-11-27", {
    now: new Date("2020-01-01T12:00:00Z"),
  });
  assert.equal(v.segments.length, 2);
  assert.equal(v.segments[0].label, "Morning");
  assert.equal(v.segments[0].truncated, false);
  assert.equal(v.segments[0].endEtMin, 12 * 60 + 30);
  assert.equal(v.segments[1].label, "Afternoon");
  assert.equal(v.segments[1].truncated, true);
  assert.equal(v.segments[1].endEtMin, 13 * 60);
  assert.equal(
    v.segments.find((s) => s.label === "Closing"),
    undefined,
  );
  assert.equal(v.currentSegment, null);
}

{
  /* AT-GSC-52 */
  const v = sessionView("2026-11-26");
  assert.equal(v.segments.length, 0);
  assert.equal(v.currentSegment, null);
}

{
  /* AT-GSC-53 */
  const v = sessionView("2026-09-05");
  assert.equal(v.segments.length, 0);
  assert.equal(v.currentSegment, null);
}

{
  /* AT-GSC-54 — past open day, clock in Afternoon ET */
  const v = sessionView("2026-09-08", {
    now: new Date("2026-09-09T17:00:00Z"),
  });
  assert.equal(v.banner, "open");
  assert.equal(v.segments.length, 3);
  assert.equal(v.currentSegment, null);
}

console.log("sessions/sessionView.test.ts ok");
