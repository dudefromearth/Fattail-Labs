import assert from "node:assert/strict";
import { surfaceReliefFromHeights } from "./surfaceRelief";

{
  const nx = 5;
  const nt = 4;
  const h = new Float32Array(nx * nt);
  const r = surfaceReliefFromHeights(h, nx, nt);
  assert.equal(r.length, nx * nt);
  assert.ok(r.every((v) => v === 0), "flat sheet has no relief");
}

{
  const nx = 7;
  const nt = 5;
  const h = new Float32Array(nx * nt);
  for (let k = 0; k < nt; k++) {
    for (let i = 0; i < nx; i++) {
      const x = i - 3;
      h[k * nx + i] = -Math.abs(x) * 0.3;
    }
  }
  const r = surfaceReliefFromHeights(h, nx, nt);
  const ridge = r[2 * nx + 3];
  const wing = r[2 * nx + 0];
  const slope = r[2 * nx + 2];
  assert.ok(ridge > 0.2, "crease at the peak");
  assert.ok(slope > wing * 0.5, "sloped wall has relief");
  assert.ok(r.every((v) => v >= 0 && v <= 1));
}

console.log("surfaceRelief.test.ts ok");
