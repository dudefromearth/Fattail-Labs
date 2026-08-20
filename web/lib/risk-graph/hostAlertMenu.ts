/**
 * MSC Risk Graph alert menus on the 2D host.
 * Blank plot → Canvas (price) alert. Near tent → Position alert (pick Shown card).
 */

import { CHART_HOST_PAD, type HostView } from "./chartHostBind";
import type { PnLPoint } from "./pnlChartTypes";

const PAD = CHART_HOST_PAD;
/** MSC: 8px from a curve counts as "on the tent". */
export const CURVE_HIT_DISTANCE = 8;

export type AlertMenuKind = "canvas" | "position";

export type PositionAlertChoice = {
  id: string;
  strikesLabel: string;
};

export type HostAlertMenu = {
  x: number;
  y: number;
  price: number;
  kind: AlertMenuKind;
};

export function toHostDataX(
  canvasX: number,
  width: number,
  view: HostView,
): number {
  const cw = width - PAD.left - PAD.right;
  if (!(cw > 0)) return view.xMin;
  return view.xMin + ((canvasX - PAD.left) / cw) * (view.xMax - view.xMin);
}

export function toHostCanvasY(
  pnl: number,
  height: number,
  view: HostView,
): number {
  const ch = height - PAD.top - PAD.bottom;
  if (!(ch > 0) || !(view.yMax - view.yMin)) return PAD.top;
  return PAD.top + ((view.yMax - pnl) / (view.yMax - view.yMin)) * ch;
}

export function findPnLAtPrice(
  pts: readonly PnLPoint[],
  price: number,
): number | null {
  if (!pts.length || !Number.isFinite(price)) return null;
  if (price <= pts[0].price) return pts[0].pnl;
  const last = pts[pts.length - 1];
  if (price >= last.price) return last.pnl;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (price <= b.price) {
      const t = (b.price - a.price) ? (price - a.price) / (b.price - a.price) : 0;
      return a.pnl + t * (b.pnl - a.pnl);
    }
  }
  return last.pnl;
}

export function inPlot(
  mx: number,
  my: number,
  width: number,
  height: number,
): boolean {
  return (
    mx >= PAD.left &&
    mx <= width - PAD.right &&
    my >= PAD.top &&
    my <= height - PAD.bottom
  );
}

export function nearTent(
  mx: number,
  my: number,
  width: number,
  height: number,
  view: HostView,
  expiration: readonly PnLPoint[],
  theoretical: readonly PnLPoint[],
): boolean {
  const price = toHostDataX(mx, width, view);
  const exp = findPnLAtPrice(expiration, price);
  const theo = findPnLAtPrice(theoretical, price);
  const expY = exp != null ? toHostCanvasY(exp, height, view) : null;
  const theoY = theo != null ? toHostCanvasY(theo, height, view) : null;
  const expDist = expY != null ? Math.abs(my - expY) : Infinity;
  const theoDist = theoY != null ? Math.abs(my - theoY) : Infinity;
  return Math.min(expDist, theoDist) <= CURVE_HIT_DISTANCE;
}

export function resolveAlertMenuKind(
  nearCurve: boolean,
  positionCount: number,
): AlertMenuKind {
  return nearCurve && positionCount > 0 ? "position" : "canvas";
}
