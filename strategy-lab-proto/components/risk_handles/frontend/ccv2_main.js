/**
 * CCv2 Risk Graph with MSC-style strike handles.
 * Commit on mouseup via setTriggerValue("strike_drag", payload) — NOT v1 Streamlit globals.
 */
const PADDING = { top: 36, right: 18, bottom: 48, left: 64 };
const HIT_PX = 16;
const instances = new WeakMap();

function ensureDom(parentElement) {
  let root = parentElement.querySelector(".rg-root");
  if (root) return root;
  root = document.createElement("div");
  root.className = "rg-root";
  root.innerHTML = `
    <div class="rg-wrap">
      <canvas class="rg-canvas"></canvas>
      <div class="rg-hint">Drag amber handles to resize · <b>Shift+drag</b> slides whole position strike-by-strike</div>
      <div class="rg-badge" style="display:none"></div>
    </div>
  `;
  parentElement.appendChild(root);
  return root;
}

function makeState() {
  return {
    data: null,
    view: null,
    isPanning: false,
    isStrikeDrag: false,
    panStart: null,
    viewAtStart: null,
    dragHandle: null,
    hoverStrike: null,
    dpr: 1,
    bound: false,
  };
}

export default function (component) {
  const { data, parentElement, setTriggerValue, setStateValue } = component;
  const root = ensureDom(parentElement);
  const canvas = root.querySelector(".rg-canvas");
  const badge = root.querySelector(".rg-badge");
  const ctx = canvas.getContext("2d");

  let st = instances.get(parentElement);
  if (!st) {
    st = makeState();
    st.viewportSeq = -1;
    instances.set(parentElement, st);
  }

  // Hydrate from Python each render
  // MSC viewState: only replace client viewport when Python bumps viewport_seq
  // (Autofit). Handle-drag re-renders keep the sticky pan/zoom box.
  if (data) {
    st.data = data;
    st.data.handles = (data.handles || []).map((h) => ({
      ...h,
      orig_strike: h.strike,
    }));
    const seq = data.viewport_seq != null ? data.viewport_seq : 0;
    if (data.viewport && (st.view == null || seq !== st.viewportSeq)) {
      st.view = {
        xMin: data.viewport.x_min,
        xMax: data.viewport.x_max,
        yMin: data.viewport.y_min,
        yMax: data.viewport.y_max,
      };
      st.viewportSeq = seq;
    }
  }

  function publishView() {
    if (!st.view || typeof setStateValue !== "function") return;
    setStateValue("view_box", {
      x_min: st.view.xMin,
      x_max: st.view.xMax,
      y_min: st.view.yMin,
      y_max: st.view.yMax,
    });
  }

  function chartSize() {
    const w = canvas.getBoundingClientRect().width || 800;
    const h = canvas.getBoundingClientRect().height || 440;
    return { w, h };
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    st.dpr = window.devicePixelRatio || 1;
    const w = Math.max(1, Math.floor(rect.width * st.dpr));
    const h = Math.max(1, Math.floor(rect.height * st.dpr));
    canvas.width = w;
    canvas.height = h;
    ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
    draw();
  }

  function toCX(price, w) {
    const { xMin, xMax } = st.view;
    return (
      PADDING.left +
      ((price - xMin) / (xMax - xMin || 1)) * (w - PADDING.left - PADDING.right)
    );
  }
  function toCY(pnl, h) {
    const { yMin, yMax } = st.view;
    return (
      PADDING.top +
      (1 - (pnl - yMin) / (yMax - yMin || 1)) * (h - PADDING.top - PADDING.bottom)
    );
  }
  function toDataX(cx, w) {
    const { xMin, xMax } = st.view;
    return (
      xMin +
      ((cx - PADDING.left) / (w - PADDING.left - PADDING.right || 1)) * (xMax - xMin)
    );
  }

  function dragOffset() {
    if (!st.isStrikeDrag || !st.dragHandle) return 0;
    return st.dragHandle.lastOffset || 0;
  }
  function shiftAllActive() {
    return st.isStrikeDrag && st.dragHandle && st.dragHandle.shiftKey;
  }
  function seriesX(price) {
    return shiftAllActive() ? price + dragOffset() : price;
  }
  function effectiveHandles() {
    if (!st.data || !st.data.handles) return [];
    if (!st.isStrikeDrag || !st.dragHandle) return st.data.handles;
    const off = dragOffset();
    return st.data.handles.map((h) => {
      let d = 0;
      if (st.dragHandle.shiftKey) d = off;
      else if (
        h.strike === st.dragHandle.strike ||
        h.orig_strike === st.dragHandle.orig_strike
      )
        d = off;
      const base = h.orig_strike != null ? h.orig_strike : h.strike;
      return { ...h, strike: base + d, _preview: d !== 0 };
    });
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

  function draw() {
    if (!st.data || !st.view) return;
    const { w, h } = chartSize();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#12141a";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#1e2430";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 6; i++) {
      const y = PADDING.top + (i / 6) * (h - PADDING.top - PADDING.bottom);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();
    }

    const prices = st.data.prices || [];
    const exp = st.data.expiry_pnl || [];
    const rt = st.data.realtime_pnl || [];
    const zeroY = toCY(0, h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(
      PADDING.left,
      PADDING.top,
      w - PADDING.left - PADDING.right,
      h - PADDING.top - PADDING.bottom
    );
    ctx.clip();

    // positive fill under expiry
    ctx.fillStyle = "rgba(13,61,42,0.85)";
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < prices.length; i++) {
      const x = toCX(seriesX(prices[i]), w);
      const y = toCY(Math.max(0, exp[i] || 0), h);
      if (!started) {
        ctx.moveTo(x, zeroY);
        started = true;
      }
      ctx.lineTo(x, y);
    }
    if (prices.length) {
      ctx.lineTo(toCX(seriesX(prices[prices.length - 1]), w), zeroY);
      ctx.closePath();
      ctx.fill();
    }

    function strokeSeries(pnls, color, width) {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i < prices.length; i++) {
        const x = toCX(seriesX(prices[i]), w);
        const y = toCY(pnls[i] || 0, h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    strokeSeries(exp, "#3b82f6", 2);
    strokeSeries(rt, "#e056fd", 2);

    ctx.strokeStyle = "#5a6270";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, zeroY);
    ctx.lineTo(w - PADDING.right, zeroY);
    ctx.stroke();

    if (st.data.max_profit != null) {
      const y = toCY(st.data.max_profit, h);
      ctx.strokeStyle = "rgba(77,163,255,0.45)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (st.data.max_loss != null) {
      const y = toCY(-Math.abs(st.data.max_loss), h);
      ctx.strokeStyle = "rgba(240,113,120,0.45)";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(w - PADDING.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    const spotX = toCX(st.data.spot, w);
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
    ctx.fillText(String(Math.round(st.data.spot)), spotX, PADDING.top - 8);

    const pnlSpot = interp(prices, rt, st.data.spot);
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

    const handles = effectiveHandles();
    for (const h of handles) {
      const x = toCX(h.strike, w);
      if (x < PADDING.left || x > w - PADDING.right) continue;
      const hot =
        st.hoverStrike === h.orig_strike ||
        st.hoverStrike === h.strike ||
        (st.dragHandle && st.dragHandle.orig_strike === h.orig_strike);
      ctx.strokeStyle = hot ? "rgba(251,191,36,0.55)" : "rgba(42,64,96,0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, h - PADDING.bottom);
      ctx.stroke();

      const hh = hot ? 16 : 10;
      ctx.strokeStyle = hot ? "#fbbf24" : "#f59e0b";
      ctx.lineWidth = hot ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(x, zeroY - hh);
      ctx.lineTo(x, zeroY + hh);
      ctx.stroke();

      ctx.fillStyle = hot ? "#fbbf24" : "#f59e0b";
      ctx.beginPath();
      ctx.moveTo(x, zeroY - 6);
      ctx.lineTo(x + 6, zeroY);
      ctx.lineTo(x, zeroY + 6);
      ctx.lineTo(x - 6, zeroY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#8ab4f8";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const label =
        h.role === "wing"
          ? `${Math.round(h.strike)} wing`
          : `${Math.round(h.strike)} short`;
      ctx.fillText(label, x, zeroY + 22);
    }

    ctx.fillStyle = "#9aa0a6";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 6; i++) {
      const p = st.view.xMin + (i / 6) * (st.view.xMax - st.view.xMin);
      const x = toCX(p, w);
      ctx.fillText(String(Math.round(p)), x, h - 14);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const p = st.view.yMin + (i / 5) * (st.view.yMax - st.view.yMin);
      const y = toCY(p, h);
      ctx.fillText(String(Math.round(p)), PADDING.left - 6, y + 3);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = "#3b82f6";
    ctx.fillText("At Expiry", PADDING.left + 6, PADDING.top + 12);
    ctx.fillStyle = "#e056fd";
    ctx.fillText("Real-Time", PADDING.left + 80, PADDING.top + 12);
    ctx.restore();

    if (st.isStrikeDrag && st.dragHandle && st.dragHandle.lastOffset) {
      badge.style.display = "block";
      const o = st.dragHandle.lastOffset;
      const mode = st.dragHandle.shiftKey ? "move all " : "";
      badge.textContent = `${mode}${o > 0 ? "+" : ""}${o}`;
    } else {
      badge.style.display = "none";
    }
  }

  function hitHandle(mx, my) {
    if (!st.data || !st.view) return null;
    const { w, h } = chartSize();
    const zeroY = toCY(0, h);
    for (const h of st.data.handles) {
      const x = toCX(h.strike, w);
      if (Math.abs(mx - x) < HIT_PX && Math.abs(my - zeroY) < HIT_PX) return h;
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
      st.isStrikeDrag = true;
      st.dragHandle = {
        strike: h.strike,
        orig_strike: h.orig_strike != null ? h.orig_strike : h.strike,
        role: h.role,
        side: h.side,
        startDataX: toDataX(mx, w),
        lastOffset: 0,
        shiftKey: e.shiftKey,
      };
      canvas.style.cursor = "grabbing";
      draw();
      e.preventDefault();
      return;
    }
    st.isPanning = true;
    st.panStart = { x: e.clientX, y: e.clientY };
    st.viewAtStart = { ...st.view };
    canvas.style.cursor = "grabbing";
  }

  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { w, h } = chartSize();

    if (st.isStrikeDrag && st.dragHandle) {
      const cur = toDataX(mx, w);
      const raw = cur - st.dragHandle.startDataX;
      const inc = st.data.strike_increment || 1;
      const offset = Math.round(raw / inc) * inc;
      st.dragHandle.lastOffset = offset;
      st.dragHandle.shiftKey = e.shiftKey;
      draw();
      return;
    }
    if (st.isPanning && st.panStart && st.viewAtStart) {
      const dx = e.clientX - st.panStart.x;
      const dy = e.clientY - st.panStart.y;
      const cw = w - PADDING.left - PADDING.right;
      const ch = h - PADDING.top - PADDING.bottom;
      const xRange = st.viewAtStart.xMax - st.viewAtStart.xMin;
      const yRange = st.viewAtStart.yMax - st.viewAtStart.yMin;
      st.view = {
        xMin: st.viewAtStart.xMin - (dx / cw) * xRange,
        xMax: st.viewAtStart.xMax - (dx / cw) * xRange,
        yMin: st.viewAtStart.yMin + (dy / ch) * yRange,
        yMax: st.viewAtStart.yMax + (dy / ch) * yRange,
      };
      draw();
      return;
    }
    const hh = hitHandle(mx, my);
    st.hoverStrike = hh ? hh.strike : null;
    canvas.style.cursor = hh ? "ew-resize" : "grab";
    if (hh) draw();
  }

  function onUp() {
    if (st.isStrikeDrag && st.dragHandle) {
      const offset = st.dragHandle.lastOffset || 0;
      const payload = {
        type: "strike_drag",
        grabbed_strike: st.dragHandle.orig_strike,
        new_strike: st.dragHandle.orig_strike + offset,
        offset,
        role: st.dragHandle.role,
        side: st.dragHandle.side,
        shift_key: !!st.dragHandle.shiftKey,
        ts: Date.now(),
      };
      st.isStrikeDrag = false;
      st.dragHandle = null;
      canvas.style.cursor = "grab";
      // Keep visual at new place until Python re-renders with new data
      draw();
      // Publish sticky viewport BEFORE drag trigger so Python keeps the same scale
      publishView();
      if (offset !== 0 && typeof setTriggerValue === "function") {
        setTriggerValue("strike_drag", payload);
      }
      return;
    }
    if (st.isPanning) {
      publishView();
    }
    st.isPanning = false;
    st.panStart = null;
    st.viewAtStart = null;
    canvas.style.cursor = "grab";
  }

  function onWheel(e) {
    e.preventDefault();
    if (!st.view) return;
    const { w } = chartSize();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const pivot = toDataX(mx, w);
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    const xRange = st.view.xMax - st.view.xMin;
    const newRange = xRange * factor;
    const leftFrac = (pivot - st.view.xMin) / (xRange || 1);
    st.view = {
      ...st.view,
      xMin: pivot - leftFrac * newRange,
      xMax: pivot + (1 - leftFrac) * newRange,
    };
    draw();
    // Debounce-ish: publish after wheel
    publishView();
  }

  if (!st.bound) {
    st.bound = true;
    st._onDown = onDown;
    st._onMove = onMove;
    st._onUp = onUp;
    st._onWheel = onWheel;
    st._onResize = resizeCanvas;
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resizeCanvas);
  } else {
    // rebind to latest closures (setTriggerValue, data)
    canvas.removeEventListener("mousedown", st._onDown);
    window.removeEventListener("mousemove", st._onMove);
    window.removeEventListener("mouseup", st._onUp);
    canvas.removeEventListener("wheel", st._onWheel);
    window.removeEventListener("resize", st._onResize);
    st._onDown = onDown;
    st._onMove = onMove;
    st._onUp = onUp;
    st._onWheel = onWheel;
    st._onResize = resizeCanvas;
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", resizeCanvas);
  }

  resizeCanvas();

  return () => {
    canvas.removeEventListener("mousedown", st._onDown);
    window.removeEventListener("mousemove", st._onMove);
    window.removeEventListener("mouseup", st._onUp);
    canvas.removeEventListener("wheel", st._onWheel);
    window.removeEventListener("resize", st._onResize);
    st.bound = false;
  };
}
