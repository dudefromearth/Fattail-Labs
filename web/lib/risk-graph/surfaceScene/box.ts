/**
 * Enclosing box for the Surface sheet.
 * Coach: strikes = host width, price (P&L) = host height, time = depth.
 * Presentation only — does not reprice.
 */

import { PERSPECTIVE_FOV } from "./camera";

export type BoxExtents = {
  /** Half-width — strike / S axis. Tracks host width. */
  hx: number;
  /** Half-height — P&L / price axis. Tracks host height. */
  hy: number;
  /** Half-depth — remaining τ. */
  hz: number;
};

export function boxHalfExtents(cssW: number, cssH: number): BoxExtents {
  if (!Number.isFinite(cssW) || !Number.isFinite(cssH) || cssW <= 0 || cssH <= 0) {
    throw new Error(
      `surface box: host size unbounded or invalid (${String(cssW)}×${String(cssH)})`,
    );
  }
  const aspect = cssW / cssH;
  return {
    hx: aspect,
    hy: 1,
    /** Time depth ≈ ¾ of strike width so τ is a real axis, not a sliver. */
    hz: aspect * 0.75,
  };
}

export function frameRadius(
  box: BoxExtents,
  aspect: number,
  fovDeg: number = PERSPECTIVE_FOV,
  pad = 1.12,
): number {
  if (!Number.isFinite(aspect) || aspect <= 0) {
    throw new Error(`surface box: aspect unbounded or invalid (${String(aspect)})`);
  }
  const halfY = Math.tan((fovDeg * Math.PI) / 180 / 2);
  const halfX = halfY * aspect;
  // Bounding sphere of the box so ISO shows every edge, not a cropped face.
  const sphere = Math.hypot(box.hx, box.hy, box.hz);
  const need = Math.max(sphere / halfX, sphere / halfY);
  return need * pad;
}

/**
 * Ortho frustum that fits the box sphere at zoom=1 (same fit as perspective
 * frameRadius). zoom = eyeRadius / fitRadius: 1 = full box, <1 closer, >1 farther.
 */
export function orthoHalfExtents(
  box: BoxExtents,
  aspect: number,
  zoom = 1,
  pad = 1.12,
): { halfW: number; halfH: number } {
  if (!Number.isFinite(aspect) || aspect <= 0) {
    throw new Error(`surface box: aspect unbounded or invalid (${String(aspect)})`);
  }
  const scale = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  const sphere = Math.hypot(box.hx, box.hy, box.hz);
  const halfH = Math.max(sphere, 0.1) * pad * scale;
  return { halfW: halfH * aspect, halfH };
}
