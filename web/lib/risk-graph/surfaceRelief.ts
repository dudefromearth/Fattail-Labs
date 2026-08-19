/**
 * Per-vertex relief for the P&L tent: slope + crease.
 * Flat faces stay bright; walls and folds go darker.
 */

export const RELIEF_DEFAULT = 0.4;
export const RELIEF_MIN = 0;
export const RELIEF_MAX = 1;

function heightAt(
  h: Float32Array,
  nx: number,
  i: number,
  k: number,
): number {
  return h[k * nx + i];
}

function robustMax(values: Float32Array): number {
  let max = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] > max) max = values[i];
  }
  if (!(max > 1e-8)) return 1;
  return max;
}

/**
 * `heights` is row-major Y (box space) for `nt` time rows × `nx` strikes.
 * Returns 0…1 relief: 0 = flat, 1 = steepest wall / sharpest crease.
 */
export function surfaceReliefFromHeights(
  heights: Float32Array,
  nx: number,
  nt: number,
): Float32Array {
  if (nx < 2 || nt < 2 || heights.length < nx * nt) {
    return new Float32Array(Math.max(0, nx * nt));
  }
  const n = nx * nt;
  const slope = new Float32Array(n);
  const crease = new Float32Array(n);
  for (let k = 0; k < nt; k++) {
    for (let i = 0; i < nx; i++) {
      const idx = k * nx + i;
      const iL = i > 0 ? i - 1 : i;
      const iR = i < nx - 1 ? i + 1 : i;
      const kD = k > 0 ? k - 1 : k;
      const kU = k < nt - 1 ? k + 1 : k;
      const dxSpan = Math.max(1, iR - iL);
      const dzSpan = Math.max(1, kU - kD);
      const dx =
        (heightAt(heights, nx, iR, k) - heightAt(heights, nx, iL, k)) / dxSpan;
      const dz =
        (heightAt(heights, nx, i, kU) - heightAt(heights, nx, i, kD)) / dzSpan;
      slope[idx] = Math.hypot(dx, dz);
      const lap =
        heightAt(heights, nx, iL, k) +
        heightAt(heights, nx, iR, k) +
        heightAt(heights, nx, i, kD) +
        heightAt(heights, nx, i, kU) -
        4 * heightAt(heights, nx, i, k);
      crease[idx] = Math.abs(lap);
    }
  }
  const sMax = robustMax(slope);
  const cMax = robustMax(crease);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const s = slope[i] / sMax;
    const c = crease[i] / cMax;
    const r = 0.58 * s + 0.42 * c;
    out[i] = r < 0 ? 0 : r > 1 ? 1 : r;
  }
  return out;
}

export function clampRelief(v: number): number {
  if (!Number.isFinite(v)) return RELIEF_DEFAULT;
  return Math.min(RELIEF_MAX, Math.max(RELIEF_MIN, v));
}
