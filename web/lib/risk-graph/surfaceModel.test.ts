import assert from "node:assert/strict";
import {
  bindListedSurfaceLegs,
  computeSurfaceSheet,
  evaluateExpiryPnlAtSpot,
  evaluatePnlAtSpot,
  expiryFaceTau,
  legsFromRelative,
  sampleSheet,
  sliceSheetAtTau,
  surfaceStrikeWindow,
  MIN_TAU,
  DEFAULT_NX,
  DEFAULT_NT,
  type SurfaceLeg,
} from "./surfaceModel";
import { relativeShape, batmanDefaultShorts } from "../options-lab/designRelativeShape";

const iv = 0.2;
const tau = 3 / 365.25;
const spot = 100;

{
  const shape = relativeShape({
    strategy_template: "batman",
    wing_width: 4,
    short_gap: batmanDefaultShorts(4),
    trade_side: "buy",
    placement: "atm",
  });
  const legs = legsFromRelative(shape.legs, spot, tau, iv);
  const sheet = computeSurfaceSheet(legs, {
    spot,
    nx: 41,
    nt: 9,
    quality: "per_leg_iv",
    ivSource: "fixture",
  });
  const nowRow = sheet.pnlGrid[0];
  const mid = nowRow[Math.floor(nowRow.length / 2)];
  const left = nowRow[Math.floor(nowRow.length * 0.28)];
  const right = nowRow[Math.floor(nowRow.length * 0.72)];
  assert.ok(left > mid && right > mid, "batman now-slice has two ears");
  const atSpot = evaluatePnlAtSpot(legs, spot, tau);
  const sampled = sampleSheet(sheet, spot, tau);
  assert.ok(sampled != null);
  assert.ok(Math.abs(sampled! - atSpot) < 80, "sample matches evaluate");
}

{
  const shape = relativeShape({
    strategy_template: "butterfly",
    placement: "atm",
    wing_width: 4,
    trade_side: "buy",
  });
  const legs = legsFromRelative(shape.legs, spot, tau, iv);
  const z = evaluatePnlAtSpot(legs, spot, tau);
  assert.ok(Math.abs(z) < 50, "T+0 P&L near zero when premium = mark");
}

{
  const listed = [
    { strike: 100, quantity: 1, right: "call" as const, expiration: "2026-08-17" },
    { strike: 105, quantity: -1, right: "call" as const, expiration: "2026-08-17" },
  ];
  const ok = bindListedSurfaceLegs(
    listed,
    [
      { strike: 100, side: "call", iv: 0.18, iv_source: "exact", mid: 2.1, expiration: "2026-08-17" },
      { strike: 105, side: "call", iv: 0.16, iv_source: "locked", mid: 0.9, expiration: "2026-08-17" },
    ],
    { spot: 100, tauFor: () => 1 / 365.25 },
  );
  assert.equal(ok.ok, true);
  if (ok.ok) {
    assert.equal(ok.legs[0].iv, 0.18);
    assert.equal(ok.legs[1].iv, 0.16);
  }

  const gen = bindListedSurfaceLegs(
    listed,
    [
      { strike: 100, side: "call", iv: 0.18, iv_source: "generation", mid: 2.1, expiration: "2026-08-17" },
      { strike: 105, side: "call", iv: 0.16, iv_source: "generation", mid: 0.9, expiration: "2026-08-17" },
    ],
    { spot: 100, tauFor: () => 1 / 365.25 },
  );
  assert.equal(gen.ok, true, "held-generation IV is lawful for the live sheet");

  const vix = bindListedSurfaceLegs(
    listed,
    [
      { strike: 100, side: "call", iv: 0.18, iv_source: "exact", mid: 2.1, expiration: "2026-08-17" },
      { strike: 105, side: "call", iv: 0.2, iv_source: "vix", mid: 0.9, expiration: "2026-08-17" },
    ],
    { spot: 100, tauFor: () => 1 / 365.25 },
  );
  assert.equal(vix.ok, false);
  if (!vix.ok) assert.equal(vix.hole, "IV NO");

  const sticky = bindListedSurfaceLegs(listed, [], {
    spot: 100,
    tauFor: () => 1 / 365.25,
  });
  assert.equal(sticky.ok, false);
  if (!sticky.ok) assert.equal(sticky.hole, "IV NO");

  const nearest = bindListedSurfaceLegs(
    listed,
    [
      { strike: 100, side: "call", iv: 0.18, iv_source: "nearest", mid: 2.1, expiration: "2026-08-17" },
      { strike: 105, side: "call", iv: 0.16, iv_source: "atm_exp", mid: 0.9, expiration: "2026-08-17" },
    ],
    { spot: 100, tauFor: () => 1 / 365.25 },
  );
  assert.equal(nearest.ok, false);
  if (!nearest.ok) assert.equal(nearest.hole, "IV NO");

  const keepItm = bindListedSurfaceLegs(
    [{ strike: 80, quantity: 1, right: "call", expiration: "2026-08-17" }],
    [{ strike: 80, side: "call", iv: 0.005, iv_source: "exact", mid: 20, expiration: "2026-08-17" }],
    { spot: 100, tauFor: () => 1 / 365.25 },
  );
  assert.equal(keepItm.ok, true);
  if (keepItm.ok) assert.equal(keepItm.legs[0].iv, 0.005);
}

{
  const hour = 1 / 365.25 / 24;
  assert.ok(MIN_TAU < hour, "T-LM-1: 1-min floor, not 1-hour (OPF29 AT-L0-τ1/τ4)");
  assert.ok(Math.abs(MIN_TAU - 1 / 365.25 / 24 / 60) < 1e-18);
  assert.equal(DEFAULT_NX, 80);
  assert.equal(DEFAULT_NT, 48);
}

{
  const legs = legsFromRelative(
    [{ strike: 100, quantity: 1, right: "call" }],
    100,
    10 / 365.25,
    0.2,
  );
  const lo = 1 / 365.25;
  const hi = 8 / 365.25;
  const sheet = computeSurfaceSheet(legs, {
    spot: 100,
    nx: 16,
    nt: 7,
    tauLo: lo,
    tauHi: hi,
    quality: "per_leg_iv",
  });
  assert.equal(sheet.timeAxis.length, 7);
  assert.ok(Math.abs(sheet.timeAxis[0] - hi) < 1e-12, "T-WIN-1 timeAxis[0]===tauHi");
  assert.ok(
    Math.abs(sheet.timeAxis[sheet.timeAxis.length - 1] - lo) < 1e-12,
    "T-WIN-1 last===tauLo",
  );
  assert.throws(
    () =>
      computeSurfaceSheet(legs, {
        spot: 100,
        nx: 16,
        nt: 7,
        tauLo: 0,
        tauHi: 20 / 365.25,
      }),
    /remaining life/,
  );
  assert.throws(
    () => computeSurfaceSheet(legs, { spot: 100, nx: Infinity, nt: 8 }),
    /unbounded/,
  );
}

{
  const w = surfaceStrikeWindow([6400, 6450, 6500], 6425);
  assert.ok(w.sMin < 6400 && w.sMax > 6500, "window pads beyond wings");
  assert.ok(w.sMax - w.sMin < 400, "ATM fly is not a ±35% SPX window");
  assert.ok(
    Math.abs((w.sMin + w.sMax) / 2 - 6425) < 1e-9,
    "spot is the midpoint of the strike scale",
  );
  const sheet = computeSurfaceSheet(
    legsFromRelative(
      [
        { strike: 6400, quantity: 1, right: "call" },
        { strike: 6450, quantity: -2, right: "call" },
        { strike: 6500, quantity: 1, right: "call" },
      ],
      6425,
      tau,
      iv,
    ),
    { spot: 6425, ...w, nx: 21, nt: 6, listedStrikes: [6400, 6450, 6500] },
  );
  assert.ok(Math.abs(sheet.sMin - w.sMin) < 1e-9);
  assert.deepEqual(sheet.listedStrikes, [6400, 6450, 6500]);
  const flyLegs = legsFromRelative(
    [
      { strike: 6400, quantity: 1, right: "call" },
      { strike: 6450, quantity: -2, right: "call" },
      { strike: 6500, quantity: 1, right: "call" },
    ],
    6425,
    tau,
    iv,
  );
  const tExp = sheet.timeAxis[sheet.timeAxis.length - 1];
  const peak = Math.abs(evaluatePnlAtSpot(flyLegs, 6450, tExp));
  assert.ok(sheet.displayAbs + 1e-9 >= peak, "display scale follows the fly");
  assert.ok(sheet.displayAbs > 1, "fly has a real P&L scale");
  assert.throws(
    () => computeSurfaceSheet(legsFromRelative([{ strike: 100, quantity: 1, right: "call" }], 100, tau, iv), {
      spot: 100,
      sMin: 120,
      sMax: 80,
    }),
    /sMin/,
  );
}

{
  const short = legsFromRelative(
    [{ strike: 100, quantity: 1, right: "call" }],
    100,
    2 / 365.25,
    iv,
  )[0];
  const long = legsFromRelative(
    [{ strike: 100, quantity: -1, right: "call" }],
    100,
    10 / 365.25,
    iv,
  )[0];
  const both = evaluatePnlAtSpot([short, long], 110, 10 / 365.25);
  const onlyLong = evaluatePnlAtSpot([long], 110, 10 / 365.25);
  assert.ok(
    Math.abs(both - onlyLong) > 1,
    "T0 prices every listed leg — shorter dated are not dropped",
  );
}

{
  const fly = legsFromRelative(
    [
      { strike: 6400, quantity: 1, right: "call" },
      { strike: 6450, quantity: -2, right: "call" },
      { strike: 6500, quantity: 1, right: "call" },
    ],
    6425,
    tau,
    iv,
  );
  const debit = -evaluatePnlAtSpot(fly, 5000, 0);
  const edge = evaluatePnlAtSpot(fly, 5000, 0);
  const peak = evaluatePnlAtSpot(fly, 6450, 0);
  assert.ok(edge < 0, "long fly far below wings is residual debit, not a profit wall");
  assert.ok(peak > edge, "body beats the far-left residual");
  assert.ok(Math.abs(edge + debit) < 1e-6 || debit > 0);
}

{
  const legs = legsFromRelative(
    [{ strike: 100, quantity: 1, right: "call" }],
    100,
    tau,
    iv,
  );
  const sheet = computeSurfaceSheet(legs, {
    spot: 100,
    nx: 21,
    nt: 9,
    quality: "per_leg_iv",
    ivSource: "fixture",
  });
  const now = sliceSheetAtTau(sheet, sheet.timeAxis[0]);
  const exp = sliceSheetAtTau(
    sheet,
    sheet.timeAxis[sheet.timeAxis.length - 1],
  );
  assert.deepEqual(now, sheet.pnlGrid[0], "tn = now is the first row");
  assert.deepEqual(exp, sheet.pnlGrid[sheet.pnlGrid.length - 1], "tn = expiry is the last row");
  const midTau =
    (sheet.timeAxis[0] + sheet.timeAxis[sheet.timeAxis.length - 1]) / 2;
  const mid = sliceSheetAtTau(sheet, midTau);
  const i = Math.floor(sheet.spotAxis.length / 2);
  const sampled = sampleSheet(sheet, sheet.spotAxis[i], midTau);
  assert.ok(sampled != null);
  assert.ok(
    Math.abs(mid[i] - sampled!) < 1e-6,
    "time-plane cut matches bilinear sample on the strike grid",
  );
}

{
  const day = 1 / 365.25;
  const front: SurfaceLeg = {
    strike: 100,
    right: "call",
    qty: -1,
    premium: 2.0,
    iv: 0.2,
    tauYears0: day,
  };
  const back: SurfaceLeg = {
    strike: 100,
    right: "call",
    qty: 1,
    premium: 2.4,
    iv: 0.2,
    tauYears0: 2 * day,
  };
  const cal = [front, back];
  const face = expiryFaceTau(cal);
  assert.ok(Math.abs(face - day) < 1e-12, "calendar face is maxτ − minτ (1 DTE left)");
  assert.equal(expiryFaceTau([front]), 0, "single-DTE face is both-dead / intrinsic");

  const dead80 = evaluatePnlAtSpot(cal, 80, 0);
  const dead100 = evaluatePnlAtSpot(cal, 100, 0);
  const dead120 = evaluatePnlAtSpot(cal, 120, 0);
  assert.ok(
    Math.abs(dead80 - dead100) < 1e-6 && Math.abs(dead100 - dead120) < 1e-6,
    "both-dead same-strike calendar is a flat −debit line",
  );

  const exp80 = evaluateExpiryPnlAtSpot(cal, 80);
  const exp100 = evaluateExpiryPnlAtSpot(cal, 100);
  const exp120 = evaluateExpiryPnlAtSpot(cal, 120);
  const expSpan = Math.max(exp80, exp100, exp120) - Math.min(exp80, exp100, exp120);
  assert.ok(expSpan > 20, "front-exp calendar is a hump, not flat −debit");
  assert.ok(exp100 > exp80 && exp100 > exp120, "long calendar peaks near the strike");

  const t0 = evaluatePnlAtSpot(cal, 100, 2 * day);
  assert.ok(Math.abs(t0 - exp100) > 1, "T+0 magenta is not the cyan face");

  const later: SurfaceLeg = { ...back, tauYears0: 4 * day };
  const triple = [front, { ...back }, later];
  const tripleFace = expiryFaceTau(triple);
  assert.ok(Math.abs(tripleFace - 3 * day) < 1e-12, "3-DTE face is longest remaining at first settlement");
  const midAtFace = evaluatePnlAtSpot(triple, 110, tripleFace);
  const midIfJumpedToMin = evaluatePnlAtSpot(triple, 110, day);
  assert.ok(
    Math.abs(midAtFace - midIfJumpedToMin) > 1,
    "front-exp keeps the middle expiration live — does not jump to last expiry",
  );

  const sheet = computeSurfaceSheet(cal, {
    spot: 100,
    nx: 21,
    nt: 9,
    quality: "per_leg_iv",
    ivSource: "fixture",
  });
  assert.ok(Math.abs(sheet.expiryTau - day) < 1e-12);
  assert.ok(
    Math.abs(sheet.timeAxis[sheet.timeAxis.length - 1] - sheet.expiryTau) < 1e-12,
    "cyan last row is the front-exp face, not τ = 0",
  );
  const last = sheet.pnlGrid[sheet.pnlGrid.length - 1];
  const mid = last[Math.floor(last.length / 2)];
  const wing = last[0];
  assert.ok(mid > wing + 10, "sheet expiry row has calendar shape");
  const nowMid = sheet.pnlGrid[0][Math.floor(last.length / 2)];
  assert.ok(Math.abs(nowMid - mid) > 1, "now row is not the expiry row");
}

console.log("surfaceModel.test.ts ok");
