/** REQ-009 — futures axis from spec.display_shape. Cash indices keep saTicks. */

import type { DisplayShape } from "./symbology/types";

export function snapByShape(
  price: number,
  shape: DisplayShape,
  tickSize: number,
): number {
  if (!Number.isFinite(price)) return price;
  if (shape.kind === "fractional" && shape.fraction) {
    const den = shape.fraction.denominator;
    const ticks = Math.round(price * den);
    return ticks / den;
  }
  if (!(tickSize > 0)) return price;
  const n = Math.round(price / tickSize);
  return n * tickSize;
}

export function formatByShape(
  price: number,
  shape: DisplayShape,
  tickSize: number,
): string {
  const snapped = snapByShape(price, shape, tickSize);
  if (shape.kind === "fractional" && shape.fraction) {
    const den = shape.fraction.denominator;
    const ticks = Math.round(snapped * den);
    const whole = Math.trunc(ticks / den);
    const num = ((ticks % den) + den) % den;
    const width = shape.fraction.width;
    return `${whole}${shape.fraction.separator}${String(num).padStart(width, "0")}`;
  }
  return snapped.toFixed(shape.precision);
}
