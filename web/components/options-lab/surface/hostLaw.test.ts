import assert from "node:assert/strict";
import {
  listedExpirationsOf,
  surfaceAsOfLabel,
  surfaceBookClock,
  surfaceClockBlocksAnalysis,
  surfaceHostClock,
} from "./hostLaw";

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

{
  const afterClose = new Date("2026-08-18T20:52:00-04:00");
  assert.equal(
    surfaceHostClock("2026-08-21", afterClose),
    "live",
    "future listed expiration stays live after today's settlement",
  );
  assert.equal(
    surfaceBookClock(["2026-08-18", "2026-08-21"], afterClose),
    "live",
    "calendar: back-month life keeps the book live after front settlement",
  );
  assert.equal(
    surfaceBookClock(["2026-08-18"], afterClose),
    "residual",
    "0DTE-only book after 16:00 ET is residual claim",
  );
  assert.equal(
    surfaceBookClock(["2026-08-14"], afterClose),
    "expired",
  );
}

{
  const dates = listedExpirationsOf({
    expiration: "2026-08-18",
    legs: [
      { expiration: "2026-08-18" },
      { expiration: "2026-08-21" },
    ],
  });
  assert.deepEqual(dates.sort(), ["2026-08-18", "2026-08-21"]);
}

{
  for (const clock of ["live", "residual", "expired"] as const) {
    assert.equal(
      surfaceClockBlocksAnalysis(clock),
      false,
      `${clock} must never block analysis`,
    );
  }
  assert.equal(surfaceAsOfLabel("residual", false), "residual");
  assert.equal(surfaceAsOfLabel("expired", false), "expired");
  assert.equal(surfaceAsOfLabel("live", true), "time machine");
}

console.log("hostLaw.test.ts ok");
