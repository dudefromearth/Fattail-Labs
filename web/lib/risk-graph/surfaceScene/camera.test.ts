import assert from "node:assert/strict";
import {
  ISO_EYE,
  ISO_LOOK,
  SLOW_ZOOM_GAIN,
  PERSPECTIVE_FOV,
  ORBIT_RAD_PER_PX,
  ZOOM_STEP,
  applyCameraInspect,
  applyFactoryView,
  eyeRadius,
  fitPose,
  isoPose,
  orbitPose,
  zoomPose,
} from "./camera";

const EPS = 1e-9;

function close(a: number, b: number, label: string) {
  assert.ok(Math.abs(a - b) < EPS, `${label}: ${a} ≠ ${b}`);
}

{
  const iso = isoPose();
  assert.equal(iso.projection, "perspective");
  assert.equal(PERSPECTIVE_FOV, 42);
  assert.equal(iso.zoomGain, SLOW_ZOOM_GAIN);
  assert.equal(SLOW_ZOOM_GAIN, 0.25);
  close(iso.eye.x, ISO_EYE.x, "ISO eye.x");
  close(iso.eye.y, ISO_EYE.y, "ISO eye.y");
  close(iso.eye.z, ISO_EYE.z, "ISO eye.z");
  close(iso.lookAt.x, ISO_LOOK.x, "ISO look.x");
}

{
  const iso = isoPose();
  const moved = orbitPose(iso, 100, 0);
  close(moved.eye.x, 0.6569590884221798, "orbit(100,0) eye.x");
  close(moved.eye.y, 1.25, "orbit(100,0) eye.y");
  close(moved.eye.z, 2.2390633658160493, "orbit(100,0) eye.z");
  close(ORBIT_RAD_PER_PX, 0.005, "orbit scale");
  const back = fitPose(moved);
  close(back.eye.x, ISO_EYE.x, "Fit restores ISO x");
  close(back.eye.y, ISO_EYE.y, "Fit restores ISO y");
  close(back.eye.z, ISO_EYE.z, "Fit restores ISO z");
  const factory = applyFactoryView("iso");
  close(factory.eye.x, ISO_EYE.x, "ISO factory");
  const tOrtho = applyFactoryView("timeOrtho");
  assert.equal(tOrtho.projection, "orthographic", "Time Ortho is orthographic");
  assert.ok(tOrtho.eye.y < 0, "Time Ortho looks from below so Expiry is right");
  assert.ok(tOrtho.up && tOrtho.up.x === 1, "Time Ortho strike reads up");
}

{
  const iso = isoPose();
  const r0 = eyeRadius(iso);
  close(r0, 2.647168298389809, "ISO radius");
  const z = zoomPose(iso, 100);
  close(eyeRadius(z), r0 * (1 + SLOW_ZOOM_GAIN * ZOOM_STEP), "Slow zoom +100");
  close(eyeRadius(z), 2.700111664357605, "Slow zoom known r");
}

{
  let compute = 0;
  const next = orbitPose(isoPose(), 40, 10);
  const out = applyCameraInspect(isoPose(), next, () => {
    compute += 1;
  });
  assert.equal(compute, 0, "T-CAM-1: camera inspect does not compute");
  close(out.eye.x, next.eye.x, "inspect copies eye");
}

console.log("camera.test.ts ok");
