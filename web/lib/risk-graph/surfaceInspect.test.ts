import assert from "node:assert/strict";
import {
  computeSurfaceSheet,
  evaluatePnlAtSpot,
  legsFromRelative,
  sampleSheet,
} from "./surfaceModel";
import {
  cadenceClaim,
  hashPnlGrid,
  isRealityAltered,
  isTimeAltered,
  samplePlayhead,
  sliderToTau,
  tauToSlider,
} from "./surfaceInspect";

const legs = legsFromRelative(
  [{ strike: 100, quantity: 1, right: "call" }],
  100,
  5 / 365.25,
  0.2,
);
const sheet = computeSurfaceSheet(legs, {
  spot: 100,
  nx: 16,
  nt: 9,
  quality: "per_leg_iv",
});

{
  const before = hashPnlGrid(sheet);
  const a = samplePlayhead(sheet, 100, sheet.timeAxis[0]);
  const b = samplePlayhead(sheet, 100, sheet.timeAxis[4]);
  assert.ok(a != null && b != null);
  assert.equal(hashPnlGrid(sheet), before, "T-SMP-1: playhead does not change pnlGrid");
}

{
  const fri = cadenceClaim("5-min");
  assert.equal(fri.label, "5-min");
  assert.equal(fri.lastMinuteGold, false, "T-LM-5: Friday 5-min ≠ last-minute gold");
  const gold = cadenceClaim("3-5s");
  assert.equal(gold.lastMinuteGold, true);
}

{
  const model = evaluatePnlAtSpot(legs, 100, sheet.timeAxis[0]);
  const sampled = sampleSheet(sheet, 100, sheet.timeAxis[0]);
  const debit = legs.reduce((s, l) => s + l.premium * l.qty * 100, 0);
  assert.ok(sampled != null);
  assert.ok(
    Math.abs(sampled! - model) < 80,
    "T-LM-6: sample is model P&L, not a second pricer",
  );
  assert.notEqual(
    sampled,
    debit,
    "T-LM-6: evaluatePnlAtSpot / sample is not the card debit",
  );
}

{
  const now = sheet.timeAxis[0];
  const exp = sheet.timeAxis[sheet.timeAxis.length - 1];
  assert.equal(tauToSlider(now, now, exp), 0, "now sits at the left");
  assert.ok(Math.abs(tauToSlider(exp, now, exp) - 1) < 1e-12, "expiry sits at the right");
  assert.ok(Math.abs(sliderToTau(0, now, exp) - now) < 1e-12);
  assert.ok(Math.abs(sliderToTau(1, now, exp) - exp) < 1e-12);
  assert.equal(isTimeAltered(now, now, exp), false);
  assert.equal(isTimeAltered(exp, now, exp), true);
  assert.equal(
    isRealityAltered({ tau: now, tauNow: now, tauExpiry: exp, volOffsetPts: 0, spotPct: 0 }),
    false,
  );
  assert.equal(
    isRealityAltered({ tau: now, tauNow: now, tauExpiry: exp, volOffsetPts: 5, spotPct: 0 }),
    true,
    "vol offset leaves reality",
  );
  assert.equal(
    isRealityAltered({ tau: now, tauNow: now, tauExpiry: exp, volOffsetPts: 0, spotPct: -1 }),
    true,
    "spot % leaves reality",
  );
}

console.log("surfaceInspect.test.ts ok");
