/**
 * Interactive Risk Graph with MSC-style strike handles.
 *
 * Strike drag protocol mirrors MarketSwarm-Canonical ms-transplant/PnLChart:
 *  - Hit-test amber ticks on zero line (±15px)
 *  - Drag → offset in price points
 *  - Mouseup → commit {grabbedStrike, newStrike, offset, shiftKey, role}
 *  - Pan on empty chart; wheel zoom
 */

const PADDING = { top: 36, right: 18, bottom: 48, left: 64 };
const HIT_PX = 16;

const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
const badge = document.getElementById("badge");

let data = null;
let view = null; // {xMin,xMax,yMin,yMax}

// Interaction
let isPanning = false;
let isStrikeDrag = false;
let panStart = null;
let viewAtStart = null;
let dragHandle = null; // {strike, role, startDataX, lastOffset, shiftKey}
let hoverStrike = null;
let dpr = 1;

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function chartSize() {
  const w = canvas.getBoundingClientRect().width;
  const h = canvas.getBoundingClientRect().height;
  return { w, h, cw: w - PADDING.left - PADDING.right, ch: h - PADDING.top - PADDING.bottom };
}

function toCX(price, w) {
  const { xMin, xMax } = view;
  return PADDING.left + ((price - xMin) / (xMax - xMin)) * (w - PADDING.left - PADDING.right);
}
function toCY(pnl, h) {
  const { yMin, yMax } = view;
  return PADDING.top + (1 - (pnl - yMin) / (yMax - yMin)) * (h - PADDING.top - PADDING.bottom);
}
function toDataX(cx, w) {
  const { xMin, xMax } = view;
  return xMin + ((cx - PADDING.left) / (w - PADDING.left - PADDING.right)) * (xMax - xMin);
}

function interp(prices, pnls, x) {
  if (!prices.length) return 0;
  if (x <= prices[0]) return pnls[0];
  if (x >= prices[prices.length - 1]) return pnls[pnls.length - 1];
  for (let i = 1; i < prices.length; i++) {
    if (x <= prices[i]) {
      const t = (x - prices[i - 1]) / (prices[i] - prices[i - 1] || 1);
      return pnls[i - 1] + t * (pnls[i] - pnls[i - 1]);
    }
  }
  return pnls[pnls.length - 1];
}

function dragOffset() {
  if (!isStrikeDrag || !dragHandle) return 0;
  return dragHandle.lastOffset || 0;
}

function shiftAllActive() {
  return isStrikeDrag && dragHandle && dragHandle.shiftKey;
}

function effectiveHandles() {
  if (!data || !data.handles) return [];
  if (!isStrikeDrag || !dragHandle) return data.handles;
  // Live offset preview
  //  · Shift: move **entire position** (all legs) — MSC Shift+drag
  //  · Else: only the grabbed handle (resize wing / short)
  const off = dragOffset();
  return data.handles.map((h) => {
    let d = 0;
    if (dragHandle.shiftKey) d = off;
    else if (h.strike === dragHandle.strike || h.orig_strike === dragHandle.orig_strike) d = off;
    return { ...h, strike: (h.orig_strike != null ? h.orig_strike : h.strike) + d, _preview: d !== 0 };
  });
}

/** Shift prices by offset for live curve preview during Shift+drag. */
function seriesX(price) {
  if (shiftAllActive()) return price + dragOffset();
  return price;
}

function draw() {
  if (!data || !view) return;
  const { w, h } = chartSize();
  ctx.clearRect(0, 0, w, h);

  // bg
  ctx.fillStyle = "#12141a";
  ctx.fillRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = "#1e2430";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i++) {
    const y = PADDING.top + (i / 6) * (h - PADDING.top - PADDING.bottom);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, y);
    ctx.lineTo(w - PADDING.right, y);
    ctx.stroke();
  }

  const prices = data.prices;
  const exp = data.expiry_pnl;
  const rt = data.realtime_pnl;
  const zeroY = toCY(0, h);

  // clip chart area
  ctx.save();
  ctx.beginPath();
  ctx.rect(PADDING.left, PADDING.top, w - PADDING.left - PADDING.right, h - PADDING.top - PADDING.bottom);
  ctx.clip();

  // expiry fill positive (Shift+drag translates the whole tent along X)
  ctx.fillStyle = "rgba(13,61,42,0.85)";
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < prices.length; i++) {
    const x = toCX(seriesX(prices[i]), w);
    const y = toCY(Math.max(0, exp[i]), h);
    if (!started) {
      ctx.moveTo(x, zeroY);
      started = true;
    }
    ctx.lineTo(x, y);
  }
  ctx.lineTo(toCX(seriesX(prices[prices.length - 1]), w), zeroY);
  ctx.closePath();
  ctx.fill();

  // curves
  function strokeSeries(pnls, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i < prices.length; i++) {
      const x = toCX(seriesX(prices[i]), w);
      const y = toCY(pnls[i], h);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  strokeSeries(exp, "#3b82f6", 2);
  strokeSeries(rt, "#e056fd", 2);

  // zero line
  ctx.strokeStyle = "#5a6270";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PADDING.left, zeroY);
  ctx.lineTo(w - PADDING.right, zeroY);
  ctx.stroke();

  // max profit / risk rails
  if (data.max_profit != null) {
    const y = toCY(data.max_profit, h);
    ctx.strokeStyle = "rgba(77,163,255,0.45)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, y);
    ctx.lineTo(w - PADDING.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (data.max_loss != null) {
    const y = toCY(-Math.abs(data.max_loss), h);
    ctx.strokeStyle = "rgba(240,113,120,0.45)";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, y);
    ctx.lineTo(w - PADDING.right, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // spot
  const spotX = toCX(data.spot, w);
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(spotX, PADDING.top);
  ctx.lineTo(spotX, h - PADDING.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#fbbf24";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText(String(Math.round(data.spot)), spotX, PADDING.top - 8);

  // P&L at spot on RT
  const pnlSpot = interp(prices, rt, data.spot);
  const py = toCY(pnlSpot, h);
  ctx.fillStyle = "#3ddc84";
  ctx.beginPath();
  ctx.arc(spotX, py, 5, 0, Math.PI * 2);
  ctx.fill();
  const sign = pnlSpot >= 0 ? "+" : "";
  ctx.fillStyle = "#e8eaed";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`${sign}$${Math.round(pnlSpot)}`, spotX + 8, py - 8);

  // strike verticals + HANDLES (MSC style: tick on zero line)
  const handles = effectiveHandles();
  for (const h of handles) {
    const x = toCX(h.strike, w);
    if (x < PADDING.left || x > w - PADDING.right) continue;
    const hot = hoverStrike === h.strike || (dragHandle && dragHandle.strike === h.orig_strike);
    // vertical guide
    ctx.strokeStyle = hot ? "rgba(251,191,36,0.55)" : "rgba(42,64,96,0.55)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, PADDING.top);
    ctx.lineTo(x, h - PADDING.bottom);
    ctx.stroke();

    // handle on zero line
    const hh = hot || (dragHandle && dragHandle.strike === h.orig_strike) ? 16 : 10;
    ctx.strokeStyle = hot || (dragHandle && dragHandle.strike === h.orig_strike) ? "#fbbf24" : "#f59e0b";
    ctx.lineWidth = hot || (dragHandle && dragHandle.strike === h.orig_strike) ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, zeroY - hh);
    ctx.lineTo(x, zeroY + hh);
    ctx.stroke();

    // diamond grab
    ctx.fillStyle = hot || (dragHandle && dragHandle.strike === h.orig_strike) ? "#fbbf24" : "#f59e0b";
    ctx.beginPath();
    ctx.moveTo(x, zeroY - 6);
    ctx.lineTo(x + 6, zeroY);
    ctx.lineTo(x, zeroY + 6);
    ctx.lineTo(x - 6, zeroY);
    ctx.closePath();
    ctx.fill();

    // label
    ctx.fillStyle = "#8ab4f8";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    const label = h.role === "wing" ? `${Math.round(h.strike)} wing` : `${Math.round(h.strike)} short`;
    ctx.fillText(label, x, zeroY + 22);
  }

  // axes labels
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  const xticks = 6;
  for (let i = 0; i <= xticks; i++) {
    const p = view.xMin + (i / xticks) * (view.xMax - view.xMin);
    const x = toCX(p, w);
    ctx.fillText(String(Math.round(p)), x, h - 14);
  }
  ctx.textAlign = "right";
  for (let i = 0; i <= 5; i++) {
    const p = view.yMin + (i / 5) * (view.yMax - view.yMin);
    const y = toCY(p, h);
    ctx.fillText(String(Math.round(p)), PADDING.left - 6, y + 3);
  }

  // legend
  ctx.textAlign = "left";
  ctx.fillStyle = "#3b82f6";
  ctx.fillText("At Expiry", PADDING.left + 6, PADDING.top + 12);
  ctx.fillStyle = "#e056fd";
  ctx.fillText("Real-Time", PADDING.left + 80, PADDING.top + 12);

  ctx.restore();

  // drag badge
  if (isStrikeDrag && dragHandle && dragHandle.lastOffset) {
    badge.style.display = "block";
    const o = dragHandle.lastOffset;
    const mode = dragHandle.shiftKey ? "move all " : "";
    badge.textContent = `${mode}${o > 0 ? "+" : ""}${o}`;
  } else {
    badge.style.display = "none";
  }
}

function hitHandle(mx, my) {
  if (!data || !view) return null;
  const { w, h } = chartSize();
  const zeroY = toCY(0, h);
  for (const h of data.handles) {
    const x = toCX(h.strike, w);
    if (Math.abs(mx - x) < HIT_PX && Math.abs(my - zeroY) < HIT_PX) {
      return h;
    }
  }
  return null;
}

function onDown(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const { w } = chartSize();

  const h = hitHandle(mx, my);
  if (h) {
    isStrikeDrag = true;
    dragHandle = {
      strike: h.strike,
      orig_strike: h.strike,
      role: h.role,
      side: h.side,
      startDataX: toDataX(mx, w),
      lastOffset: 0,
      shiftKey: e.shiftKey,
    };
    canvas.style.cursor = "grabbing";
    draw();
    return;
  }

  isPanning = true;
  panStart = { x: e.clientX, y: e.clientY };
  viewAtStart = { ...view };
  canvas.style.cursor = "grabbing";
}

function onMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const { w, h } = chartSize();

  if (isStrikeDrag && dragHandle) {
    const cur = toDataX(mx, w);
    const raw = cur - dragHandle.startDataX;
    // snap preview to strike increment
    const inc = data.strike_increment || 1;
    const offset = Math.round(raw / inc) * inc;
    dragHandle.lastOffset = offset;
    dragHandle.shiftKey = e.shiftKey;
    draw();
    return;
  }

  if (isPanning && panStart && viewAtStart) {
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    const cw = w - PADDING.left - PADDING.right;
    const ch = h - PADDING.top - PADDING.bottom;
    const xRange = viewAtStart.xMax - viewAtStart.xMin;
    const yRange = viewAtStart.yMax - viewAtStart.yMin;
    view = {
      xMin: viewAtStart.xMin - (dx / cw) * xRange,
      xMax: viewAtStart.xMax - (dx / cw) * xRange,
      yMin: viewAtStart.yMin + (dy / ch) * yRange,
      yMax: viewAtStart.yMax + (dy / ch) * yRange,
    };
    draw();
    return;
  }

  const hh = hitHandle(mx, my);
  hoverStrike = hh ? hh.strike : null;
  canvas.style.cursor = hh ? "ew-resize" : "grab";
  if (hh) draw();
}

function onUp() {
  if (isStrikeDrag && dragHandle) {
    const offset = dragHandle.lastOffset || 0;
    const payload = {
      type: "strike_drag",
      grabbed_strike: dragHandle.orig_strike,
      new_strike: dragHandle.orig_strike + offset,
      offset,
      role: dragHandle.role,
      side: dragHandle.side,
      shift_key: !!dragHandle.shiftKey,
      ts: Date.now(),
    };
    isStrikeDrag = false;
    dragHandle = null;
    canvas.style.cursor = "grab";
    draw();
    if (offset !== 0) {
      Streamlit.setComponentValue(payload);
    }
    return;
  }
  isPanning = false;
  panStart = null;
  viewAtStart = null;
  canvas.style.cursor = "grab";
}

function onWheel(e) {
  e.preventDefault();
  if (!view) return;
  const { w } = chartSize();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const pivot = toDataX(mx, w);
  const factor = e.deltaY > 0 ? 1.08 : 0.92;
  const xRange = view.xMax - view.xMin;
  const newRange = xRange * factor;
  const leftFrac = (pivot - view.xMin) / xRange;
  view = {
    ...view,
    xMin: pivot - leftFrac * newRange,
    xMax: pivot + (1 - leftFrac) * newRange,
  };
  draw();
}

function onRender(event) {
  data = event.detail.args.data;
  if (!data) return;
  view = {
    xMin: data.viewport.x_min,
    xMax: data.viewport.x_max,
    yMin: data.viewport.y_min,
    yMax: data.viewport.y_max,
  };
  // stash orig strike on handles
  data.handles = (data.handles || []).map((h) => ({ ...h, orig_strike: h.strike }));
  resizeCanvas();
  Streamlit.setFrameHeight(450);
}

// Events
canvas.addEventListener("mousedown", onDown);
window.addEventListener("mousemove", onMove);
window.addEventListener("mouseup", onUp);
canvas.addEventListener("wheel", onWheel, { passive: false });
window.addEventListener("resize", resizeCanvas);

// Streamlit component API (lib injects Streamlit global)
function init() {
  if (typeof Streamlit === "undefined") {
    // Dev fallback message
    document.getElementById("hint").textContent =
      "Streamlit runtime missing — open via Strategy Lab component.";
    return;
  }
  Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);
  Streamlit.setComponentReady();
  Streamlit.setFrameHeight(450);
}

init();
