/**
 * What-if Time slider: right end is first listed settlement, not
 * both-dead of the longest leg (Coach 1/4-thumb bug).
 */
import assert from "node:assert/strict";
import {
  computeSurfaceSheet,
  expiryFaceTau,
  type SurfaceLeg,
} from "./surfaceModel";
import { sliderToTau, tauToSlider } from "./surfaceInspect";

const day = 1 / 365.25;
function fly(frontTau: number, backTau: number): SurfaceLeg[] {
  return [
    { strike: 100, right: "call", qty: 1, premium: 2, iv: 0.2, tauYears0: backTau },
    { strike: 105, right: "call", qty: -2, premium: 1, iv: 0.2, tauYears0: frontTau },
    { strike: 110, right: "call", qty: 1, premium: 0.4, iv: 0.2, tauYears0: backTau },
  ];
}

{
  const front = 7 * day;
  const back = 28 * day;
  const legs = fly(front, back);
  const face = expiryFaceTau(legs);
  assert.ok(Math.abs(face - (back - front)) < 1e-12);
  const sheet = computeSurfaceSheet(legs, {
    spot: 100,
    nx: 12,
    nt: 8,
    tauHi: back,
    tauLo: face,
  });
  const now = sheet.timeAxis[0];
  const end = sheet.timeAxis[sheet.timeAxis.length - 1];
  assert.ok(Math.abs(tauToSlider(end, now, end) - 1) < 1e-12);
  assert.ok(Math.abs(sliderToTau(1, now, end) - face) < 1e-9);
  assert.ok(
    tauToSlider(face, back, 0) > 0.2 && tauToSlider(face, back, 0) < 0.3,
    "the 1/4-thumb bug: axis to τ=0 puts front expiry near 25%",
  );
}

{
  const t = 5 * day;
  const sheet = computeSurfaceSheet(fly(t, t), {
    spot: 100,
    nx: 12,
    nt: 8,
    tauHi: t,
    tauLo: 0,
  });
  const now = sheet.timeAxis[0];
  const end = sheet.timeAxis[sheet.timeAxis.length - 1];
  assert.ok(Math.abs(end) < 1e-12);
  assert.ok(Math.abs(sliderToTau(1, now, end)) < 1e-12);
}

console.log("surfacePlayhead.test.ts ok");
