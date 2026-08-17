import assert from "node:assert/strict";
import { evaluatePnlAtSpot, legsFromRelative } from "./surfaceModel";
import { surfaceAutofitWindow } from "./surfaceAutofit";

const iv = 0.2;
const tau = 3 / 365.25;

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
  const w = surfaceAutofitWindow(fly, 6425, [6400, 6450, 6500]);
  assert.equal(w.profile, "default");
  assert.ok(w.sMin < 6425 && w.sMax > 6425, "spot stays in the box");
  assert.ok(w.sMin < 6400 && w.sMax > 6500, "listed strikes stay in the box");
  assert.ok(w.pad > 0 && w.sMax - w.contentHi === w.pad);
  assert.ok(Math.abs(w.contentLo - w.pad - w.sMin) < 1e-9 || w.sMin === 0.01);

  const expBes: number[] = [];
  let prev = evaluatePnlAtSpot(fly, w.sMin, 0);
  const step = (w.sMax - w.sMin) / 400;
  for (let i = 1; i <= 400; i++) {
    const s = w.sMin + i * step;
    const pnl = evaluatePnlAtSpot(fly, s, 0);
    if (prev * pnl < 0) expBes.push(s);
    prev = pnl;
  }
  assert.ok(expBes.length >= 2, "expiry breakevens exist");
  const beLo = Math.min(...expBes);
  const beHi = Math.max(...expBes);
  assert.ok(beLo > w.sMin && beHi < w.sMax, "both BEs inside the box");
  assert.ok(beLo - w.sMin > 5 && w.sMax - beHi > 5, "pad beyond the outer zeros");
}

{
  assert.throws(() => surfaceAutofitWindow([], 100), /empty/);
  assert.throws(
    () =>
      surfaceAutofitWindow(
        legsFromRelative([{ strike: 100, quantity: 1, right: "call" }], 100, tau, iv),
        0,
      ),
    /spot/,
  );
}

console.log("surfaceAutofit.test.ts ok");
