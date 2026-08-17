import assert from "node:assert/strict";
import { evaluatePnlAtSpot, legsFromRelative } from "./surfaceModel";
import {
  autofitShouldRun,
  surfaceAutofitWindow,
  unionListedStrikes,
} from "./surfaceAutofit";

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

{
  const union = unionListedStrikes([
    [6400, 6450, 6500],
    [6300, 6325, 6350],
  ]);
  assert.deepEqual(union, [6300, 6325, 6350, 6400, 6450, 6500]);
  const a = legsFromRelative(
    [
      { strike: 6400, quantity: 1, right: "call" },
      { strike: 6450, quantity: -2, right: "call" },
      { strike: 6500, quantity: 1, right: "call" },
    ],
    6425,
    tau,
    iv,
  );
  const b = legsFromRelative(
    [
      { strike: 6300, quantity: 1, right: "put" },
      { strike: 6325, quantity: -2, right: "put" },
      { strike: 6350, quantity: 1, right: "put" },
    ],
    6425,
    tau,
    iv,
  );
  const w = surfaceAutofitWindow([...a, ...b], 6425, union);
  assert.ok(w.sMin < 6300 && w.sMax > 6500, "AT-AF-6: union of shown Ks is in the box");
}

{
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const hud = fs.readFileSync(
    path.join(__dirname, "../../components/options-lab/surface/CameraHud.tsx"),
    "utf8",
  );
  assert.ok(hud.includes('data-testid="surface-autofit"'), "AT-AF-5: Autofit button exists");
  assert.ok(hud.includes('data-testid="surface-fit"'), "AT-AF-5: Fit stays a separate control");
}

{
  assert.equal(autofitShouldRun("book-change"), true);
  assert.equal(autofitShouldRun("autofit-button"), true);
  assert.equal(autofitShouldRun("what-if"), false, "AT-AF-7: What-if does not Autofit");
  assert.equal(autofitShouldRun("live-spot"), false, "AT-AF-7: live spot drift does not Autofit");
  assert.equal(autofitShouldRun("playhead"), false, "AT-AF-7: playhead does not change the window");
  assert.equal(autofitShouldRun("camera-fit"), false);
}

console.log("surfaceAutofit.test.ts ok");
