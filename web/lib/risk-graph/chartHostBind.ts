/**
 * 2D chart host contract: bind pan/zoom to the host node's life.
 * Attach when the node is in the document; detach releases capture and listeners.
 */

import { clampAxisRange } from "./pnlChartViewPolicy";

export type HostView = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

/** Plot inset. Right pad is the GEX scale column — keep in lockstep with HostPnLChart. */
export const CHART_HOST_PAD = { top: 44, right: 92, bottom: 58, left: 90 };
const PAD = CHART_HOST_PAD;

export function bindChartHost(opts: {
  host: HTMLElement;
  view: { current: HostView };
  userAdjusted: { current: boolean };
  draw: () => void;
}): () => void {
  const { host, view, userAdjusted, draw } = opts;
  const safeDraw = () => {
    try {
      draw();
    } catch {
      /* pan/zoom must survive a paint error */
    }
  };
  let dragging = false;
  let pointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let view0: HostView | null = null;

  const toDataX = (canvasX: number, width: number) => {
    const { xMin, xMax } = view.current;
    const cw = width - PAD.left - PAD.right;
    if (!(cw > 0)) return xMin;
    return xMin + ((canvasX - PAD.left) / cw) * (xMax - xMin);
  };
  const toDataY = (canvasY: number, height: number) => {
    const { yMin, yMax } = view.current;
    const ch = height - PAD.top - PAD.bottom;
    if (!(ch > 0)) return yMax;
    return yMax - ((canvasY - PAD.top) / ch) * (yMax - yMin);
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    dragging = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    view0 = { ...view.current };
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable */
    }
    host.style.cursor = "grabbing";
    host.dataset.dragTicks = String(Number(host.dataset.dragTicks || 0) + 1);
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging || !view0) return;
    const width = host.clientWidth;
    const height = host.clientHeight;
    const cw = width - PAD.left - PAD.right;
    const ch = height - PAD.top - PAD.bottom;
    if (!(cw > 0) || !(ch > 0)) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const xRange = view0.xMax - view0.xMin;
    const yRange = view0.yMax - view0.yMin;
    view.current = {
      xMin: view0.xMin - (dx / cw) * xRange,
      xMax: view0.xMax - (dx / cw) * xRange,
      yMin: view0.yMin + (dy / ch) * yRange,
      yMax: view0.yMax + (dy / ch) * yRange,
    };
    if (dx !== 0 || dy !== 0) userAdjusted.current = true;
    safeDraw();
  };

  const onUp = (e?: PointerEvent) => {
    if (pointerId != null) {
      try {
        host.releasePointerCapture(pointerId);
      } catch {
        /* already released */
      }
    }
    if (e && pointerId != null && e.pointerId !== pointerId) return;
    dragging = false;
    pointerId = null;
    view0 = null;
    host.style.cursor = "grab";
  };

  const onWheel = (e: WheelEvent) => {
    if (e.cancelable) e.preventDefault();
    e.stopPropagation();
    host.dataset.wheelTicks = String(Number(host.dataset.wheelTicks || 0) + 1);
    const rect = host.getBoundingClientRect();
    const width = host.clientWidth;
    const height = host.clientHeight;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const z = e.deltaY > 0 ? 1.03 : 0.97;
    const { xMin, xMax, yMin, yMax } = view.current;
    if (e.shiftKey) {
      const y = toDataY(my, height);
      const r = clampAxisRange(y - (y - yMin) * z, y + (yMax - y) * z);
      view.current.yMin = r.min;
      view.current.yMax = r.max;
    } else {
      const x = toDataX(mx, width);
      const r = clampAxisRange(x - (x - xMin) * z, x + (xMax - x) * z);
      view.current.xMin = r.min;
      view.current.xMax = r.max;
    }
    userAdjusted.current = true;
    safeDraw();
  };

  const onLost = () => onUp();

  host.style.touchAction = "none";
  host.style.cursor = "grab";
  host.dataset.wheelBound = "1";
  host.addEventListener("pointerdown", onDown, { capture: true });
  host.addEventListener("pointermove", onMove, { capture: true });
  host.addEventListener("pointerup", onUp, { capture: true });
  host.addEventListener("pointercancel", onUp, { capture: true });
  host.addEventListener("lostpointercapture", onLost);
  host.addEventListener("wheel", onWheel, { passive: false, capture: true });
  window.addEventListener("pointerup", onUp);

  return () => {
    onUp();
    host.removeEventListener("pointerdown", onDown, { capture: true });
    host.removeEventListener("pointermove", onMove, { capture: true });
    host.removeEventListener("pointerup", onUp, { capture: true });
    host.removeEventListener("pointercancel", onUp, { capture: true });
    host.removeEventListener("lostpointercapture", onLost);
    host.removeEventListener("wheel", onWheel, { capture: true });
    window.removeEventListener("pointerup", onUp);
    delete host.dataset.wheelBound;
  };
}
