import assert from "node:assert/strict";
import { evaluatePnlAtSpot, legsFromRelative } from "./surfaceModel";
import {
  applyWidthPad,
  autofitShouldRun,
  surfaceAutofitWindow,
  surfaceValueWindow,
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
  assert.ok(w.pad > 0 && Math.abs(w.sMax - w.contentHi - w.pad) < 1e-9);
  assert.ok(Math.abs(w.contentLo - w.pad - w.sMin) < 1e-9 || w.sMin === 0.01);
  assert.ok(w.padFrac === 0.5, "default Autofit pad is 50%");

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
  assert.ok(hud.includes('data-testid="surface-relief"'), "Curvature lives in Camera");
}

{
  const tight = applyWidthPad(6400, 6500, 0);
  const airy = applyWidthPad(6400, 6500, 0.3);
  assert.ok(tight.sMax - tight.sMin < airy.sMax - airy.sMin, "width pad widens the window");
  assert.ok(
    Math.abs(airy.sMax - 6500 - (6400 - airy.sMin)) < 1e-9,
    "width pad is equal left and right",
  );
  const y = surfaceValueWindow(-50, 150, 0.2);
  assert.ok(Math.abs(y.yMax - 150 - (-50 - y.yMin)) < 1e-9, "height pad is equal top and bottom");
}

{
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const planes = fs.readFileSync(
    path.join(__dirname, "../../components/options-lab/surface/PlanesHud.tsx"),
    "utf8",
  );
  assert.ok(planes.includes("Time Plane"), "Time Plane is independent of What-if");
  assert.ok(!planes.includes("surface-relief"), "Curvature is not in Planes");
  assert.ok(
    planes.includes('data-testid="surface-plane-time-pos"'),
    "Time slider sits with Strike",
  );
  assert.ok(planes.includes('data-testid="surface-width-pad"'), "width pad control");
  assert.ok(planes.includes('data-testid="surface-height-pad"'), "height pad control");
  assert.ok(
    planes.includes('data-testid="surface-planes-autofit"'),
    "Autofit on the pad panel restores defaults",
  );
  assert.ok(
    !planes.includes("Candles") && !planes.includes("surface-candles"),
    "Planes has no Candles checkbox; tape is T Ortho only",
  );
}

{
  const fs = require("node:fs") as typeof import("node:fs");
  const path = require("node:path") as typeof import("node:path");
  const app = fs.readFileSync(
    path.join(__dirname, "../../components/options-lab/surface/SurfaceApp.tsx"),
    "utf8",
  );
  const scene = fs.readFileSync(
    path.join(__dirname, "surfaceScene/index.ts"),
    "utf8",
  );
  assert.ok(
    !app.includes("setCandlesOn"),
    "ISO never toggles 3D candles; T Ortho tape is always on",
  );
  assert.ok(
    app.includes("SURFACE_VALUE_PLANE_OPACITY_DEFAULT"),
    "$0 plane default is 40%",
  );
  assert.ok(
    app.includes("function applySurfaceDefaults"),
    "Autofit restores pad and $0 plane defaults",
  );
  assert.ok(
    app.includes("setWidthPadFrac(SURFACE_PAD_FRAC)"),
    "Autofit Width pad back to 50%",
  );
  assert.ok(
    app.includes("setValueOpacity(0)"),
    "T Ortho hides the $0 plane",
  );
  assert.ok(
    app.includes("setValueOpacity(valueOpacityBeforeEggRef.current)"),
    "leaving T Ortho restores the last $0 plane setting",
  );
  assert.ok(
    app.includes("visible: timeOn"),
    "Time Plane visibility is the checkbox, not What-if",
  );
  assert.ok(
    !app.includes("timeWalked"),
    "Time Plane is not gated on What-if time walk",
  );
  assert.ok(
    !scene.includes('group.name = "surface-candles"'),
    "no 3D candle meshes hanging off the Now wall",
  );
  assert.ok(
    scene.includes('if (!egg)') && scene.includes("world.scale.z = 1"),
    "leaving T Ortho restores ISO world scale",
  );
  assert.ok(scene.includes("dataset.spotLab"), "spot print on the front floor edge");
  assert.ok(scene.includes("#facc15"), "spot orb/label uses Analyzer yellow-400");
  assert.ok(
    scene.includes("width:10px;height:10px") && scene.includes("SPOT_MARK_CSS"),
    "spot orb is the same 10px ball as listed strikes",
  );
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
