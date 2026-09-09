/**
 *   npx --yes tsx lib/sessions/segments.test.ts
 */
import assert from "node:assert/strict";
import { currentSegmentId, segmentsFor, todayEtIso } from "./segments";

{
  const segs = segmentsFor("2026-09-08", { kind: "open" });
  assert.equal(segs.map((s) => s.label).join(","), "Morning,Afternoon,Closing");
}

{
  const segs = segmentsFor("2026-11-27", { kind: "early", name: "Day after Thanksgiving" });
  assert.equal(segs.length, 2);
  assert.equal(segs[1].truncated, true);
  assert.equal(segs[1].endEtMin, 13 * 60);
}

{
  assert.equal(segmentsFor("2026-11-26", { kind: "closed", name: "Thanksgiving" }).length, 0);
  assert.equal(segmentsFor("2026-09-05", { kind: "weekend", name: "Saturday" }).length, 0);
}

{
  const segs = segmentsFor("2026-09-08", { kind: "open" });
  const now = new Date("2026-09-08T14:30:00Z"); // 10:30 ET during Morning (EDT)
  assert.equal(todayEtIso(now), "2026-09-08");
  assert.equal(currentSegmentId("2026-09-08", { kind: "open" }, segs, now), "morning");
  assert.equal(currentSegmentId("2026-09-07", { kind: "open" }, segs, now), null);
}

console.log("sessions/segments.test.ts ok");
