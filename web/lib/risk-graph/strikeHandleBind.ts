/**
 * Listed-strike handles on the 2D host: yellow ticks at $0.
 * Drag commits a listed-grid step count — never invents strikes (DL-309).
 */

import { CHART_HOST_PAD, type HostView } from "./chartHostBind";

const PAD = CHART_HOST_PAD;
/** Visual tick is short; hit box is ~44px (HIG). */
const HIT_X = 22;
const HIT_Y = 22;

export type StrikeHandle = {
  strike: number;
  positionId: string;
};

export type StrikeDragPreview = {
  positionId: string;
  grabbedStrike: number;
  offset: number;
  shiftAll: boolean;
} | null;

/** Position whose handles are group-selected (Shift-click / Shift-hover). */
export type StrikeGroupSelect = string | null;

export type StrikeDragInfo = {
  positionId: string;
  grabbedStrike: number;
  targetStrike: number;
  shiftKey: boolean;
};

function toDataX(canvasX: number, width: number, view: HostView): number {
  const cw = width - PAD.left - PAD.right;
  if (!(cw > 0)) return view.xMin;
  return view.xMin + ((canvasX - PAD.left) / cw) * (view.xMax - view.xMin);
}

function toCanvasX(price: number, width: number, view: HostView): number {
  const cw = width - PAD.left - PAD.right;
  if (!(cw > 0) || !(view.xMax - view.xMin)) return PAD.left;
  return PAD.left + ((price - view.xMin) / (view.xMax - view.xMin)) * cw;
}

function zeroY(height: number, view: HostView): number {
  const ch = height - PAD.top - PAD.bottom;
  if (!(ch > 0) || !(view.yMax - view.yMin)) return PAD.top;
  return PAD.top + ((view.yMax - 0) / (view.yMax - view.yMin)) * ch;
}

export function hitStrikeHandle(
  e: PointerEvent,
  host: HTMLElement,
  view: HostView,
  handles: readonly StrikeHandle[],
): StrikeHandle | null {
  const rect = host.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const w = host.clientWidth;
  const h = host.clientHeight;
  const zy = zeroY(h, view);
  let best: StrikeHandle | null = null;
  let bestDx = HIT_X;
  for (const hdl of handles) {
    if (!Number.isFinite(hdl.strike)) continue;
    const sx = toCanvasX(hdl.strike, w, view);
    const dx = Math.abs(mx - sx);
    const dy = Math.abs(my - zy);
    if (dx <= HIT_X && dy <= HIT_Y && dx <= bestDx) {
      best = hdl;
      bestDx = dx;
    }
  }
  return best;
}

function sameHandle(a: StrikeHandle | null, b: StrikeHandle | null): boolean {
  if (!a || !b) return a === b;
  return a.positionId === b.positionId && a.strike === b.strike;
}

/**
 * Thick (hot) only while the pointer is in a handle's hit box, or while that
 * handle is the live drag. Leaving proximity — or ending a drag off a handle —
 * returns idle size. Shift thickens the whole position only while Shift is
 * held in that proximity / drag.
 */
export function strikeHandleHot(
  hdl: StrikeHandle,
  state: {
    preview: StrikeDragPreview;
    hover: StrikeHandle | null;
    hoverShift: boolean;
  },
): boolean {
  const { preview, hover, hoverShift } = state;
  if (preview) {
    if (preview.positionId !== hdl.positionId) return false;
    if (preview.shiftAll) return true;
    const dest = preview.grabbedStrike + preview.offset;
    return Math.abs(hdl.strike - dest) < 1e-6;
  }
  if (!hover) return false;
  if (hover.positionId !== hdl.positionId) return false;
  if (hoverShift) return true;
  return hover.strike === hdl.strike;
}

export function bindStrikeHandles(opts: {
  host: HTMLElement;
  view: { current: HostView };
  handles: { current: readonly StrikeHandle[] };
  preview: { current: StrikeDragPreview };
  hover: { current: StrikeHandle | null };
  group: { current: StrikeGroupSelect };
  hoverShift: { current: boolean };
  draw: () => void;
  onPreview?: (info: StrikeDragInfo | null) => void;
  onCommit: (info: StrikeDragInfo) => void;
  /** Snap pointer price to a listed strike detent. Missing/empty → stay put. */
  snapTarget?: (
    positionId: string,
    grabbedStrike: number,
    rawTarget: number,
  ) => number;
}): () => void {
  const {
    host,
    view,
    handles,
    preview,
    hover,
    group,
    hoverShift,
    draw,
    onPreview,
    onCommit,
    snapTarget,
  } = opts;
  let dragging = false;
  let pointerId: number | null = null;
  let grabbed: StrikeHandle | null = null;
  let startDataX = 0;
  let lastShift = false;

  const wholePosition = (_positionId: string, shiftKey: boolean) => shiftKey;

  const clearProximity = () => {
    hover.current = null;
    hoverShift.current = false;
    group.current = null;
    delete host.dataset.strikeHover;
    delete host.dataset.strikeGroup;
    if (!dragging) host.style.cursor = "grab";
  };

  const setHover = (next: StrikeHandle | null, shiftKey: boolean) => {
    const shiftChanged = hoverShift.current !== shiftKey;
    hoverShift.current = shiftKey;
    const changed = !sameHandle(hover.current, next) || shiftChanged;
    hover.current = next;
    if (next) {
      host.style.cursor = dragging ? "grabbing" : "grab";
      host.dataset.strikeHover = "1";
      if (shiftKey) host.dataset.strikeGroup = next.positionId;
      else delete host.dataset.strikeGroup;
    } else {
      clearProximity();
    }
    if (changed) draw();
  };

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const hit = hitStrikeHandle(e, host, view.current, handles.current);
    if (!hit) {
      if (hover.current || group.current || hoverShift.current) {
        clearProximity();
        draw();
      }
      return;
    }
    e.stopImmediatePropagation();
    if (e.shiftKey) {
      group.current = hit.positionId;
      host.dataset.strikeGroup = hit.positionId;
    } else if (group.current && group.current !== hit.positionId) {
      group.current = null;
      delete host.dataset.strikeGroup;
    }
    dragging = true;
    pointerId = e.pointerId;
    grabbed = hit;
    lastShift = wholePosition(hit.positionId, e.shiftKey);
    hover.current = hit;
    hoverShift.current = e.shiftKey;
    const rect = host.getBoundingClientRect();
    startDataX = toDataX(e.clientX - rect.left, host.clientWidth, view.current);
    preview.current = {
      positionId: hit.positionId,
      grabbedStrike: hit.strike,
      offset: 0,
      shiftAll: lastShift,
    };
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      /* not capturable */
    }
    host.style.cursor = "grabbing";
    host.dataset.strikeDrag = "1";
    host.dataset.strikeHover = "1";
    onPreview?.({
      positionId: hit.positionId,
      grabbedStrike: hit.strike,
      targetStrike: hit.strike,
      shiftKey: lastShift,
    });
    draw();
  };

  const detent = (hdl: StrikeHandle, raw: number) => {
    const snapped = snapTarget?.(hdl.positionId, hdl.strike, raw);
    if (snapped == null || !Number.isFinite(snapped)) return hdl.strike;
    return snapped;
  };

  const onMove = (e: PointerEvent) => {
    if (dragging && grabbed) {
      host.style.cursor = "grabbing";
      const rect = host.getBoundingClientRect();
      const x = toDataX(e.clientX - rect.left, host.clientWidth, view.current);
      const target = detent(grabbed, grabbed.strike + (x - startDataX));
      lastShift = wholePosition(grabbed.positionId, e.shiftKey);
      preview.current = {
        positionId: grabbed.positionId,
        grabbedStrike: grabbed.strike,
        offset: target - grabbed.strike,
        shiftAll: lastShift,
      };
      onPreview?.({
        positionId: grabbed.positionId,
        grabbedStrike: grabbed.strike,
        targetStrike: target,
        shiftKey: lastShift,
      });
      draw();
      return;
    }
    if (e.buttons) return;
    const hit = hitStrikeHandle(e, host, view.current, handles.current);
    setHover(hit, e.shiftKey);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== "Shift") return;
    if (dragging && grabbed) {
      lastShift = wholePosition(grabbed.positionId, e.type === "keydown");
      const p = preview.current;
      if (p) {
        preview.current = { ...p, shiftAll: lastShift };
        onPreview?.({
          positionId: grabbed.positionId,
          grabbedStrike: grabbed.strike,
          targetStrike: grabbed.strike + p.offset,
          shiftKey: lastShift,
        });
      }
      draw();
      return;
    }
    if (hover.current) setHover(hover.current, e.type === "keydown");
  };

  const releasePtr = (id: number | null) => {
    if (id == null) return;
    try {
      if (host.hasPointerCapture(id)) host.releasePointerCapture(id);
    } catch {
      /* already released */
    }
  };

  const onUp = (e?: PointerEvent) => {
    if (!dragging) return;
    if (e && pointerId != null && e.pointerId !== pointerId) return;
    const g = grabbed;
    const p = preview.current;
    const captured = pointerId;
    dragging = false;
    pointerId = null;
    grabbed = null;
    preview.current = null;
    delete host.dataset.strikeDrag;
    releasePtr(captured);
    const still = e
      ? hitStrikeHandle(e, host, view.current, handles.current)
      : null;
    if (still) {
      hover.current = still;
      hoverShift.current = !!(e && e.shiftKey);
      group.current = null;
      host.style.cursor = "grab";
      host.dataset.strikeHover = "1";
      if (e?.shiftKey) host.dataset.strikeGroup = still.positionId;
      else delete host.dataset.strikeGroup;
    } else {
      clearProximity();
    }
    onPreview?.(null);
    if (g && p && Number.isFinite(p.offset) && p.offset !== 0) {
      const target = snapTarget
        ? snapTarget(g.positionId, g.strike, g.strike + p.offset)
        : g.strike + p.offset;
      if (target !== g.strike) {
        onCommit({
          positionId: g.positionId,
          grabbedStrike: g.strike,
          targetStrike: target,
          shiftKey: lastShift,
        });
      }
    }
    draw();
  };

  const onLeave = () => {
    if (dragging) return;
    if (!hover.current && !group.current && !hoverShift.current) return;
    setHover(null, false);
  };

  host.addEventListener("pointerdown", onDown, { capture: true });
  host.addEventListener("pointermove", onMove, { capture: true });
  host.addEventListener("pointerup", onUp, { capture: true });
  host.addEventListener("pointercancel", onUp, { capture: true });
  host.addEventListener("lostpointercapture", onUp);
  host.addEventListener("pointerleave", onLeave);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);

  return () => {
    if (dragging) onUp();
    clearProximity();
    host.removeEventListener("pointerdown", onDown, { capture: true });
    host.removeEventListener("pointermove", onMove, { capture: true });
    host.removeEventListener("pointerup", onUp, { capture: true });
    host.removeEventListener("pointercancel", onUp, { capture: true });
    host.removeEventListener("lostpointercapture", onUp);
    host.removeEventListener("pointerleave", onLeave);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("keyup", onKey);
    delete host.dataset.strikeDrag;
  };
}
