import assert from "node:assert/strict";
import { surfaceHostClock } from "./hostLaw";

{
  const residual = new Date("2026-08-14T20:01:00Z");
  assert.equal(
    surfaceHostClock("2026-08-14", residual),
    "residual",
    "T-LM-2: 16:01 ET PM settlement → residual, never live",
  );
  const live = new Date("2026-08-14T18:00:00Z");
  assert.equal(surfaceHostClock("2026-08-14", live), "live");
  const expired = new Date("2026-08-15T04:01:00Z");
  assert.equal(surfaceHostClock("2026-08-14", expired), "expired");
}

console.log("hostLaw.test.ts ok");
