"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import type { OhlcBar } from "@/lib/marketOhlcApi";
import {
  dayClockToX,
  formatPrice,
  layoutDayAxis,
  leftChromeRightPx,
  marketWhereWhen,
  positionPriceView,
  tapePriceView,
  applyLiveTapeClose,
  listedStrikeTicks,
  tickerPriceTicks,
  priceWindow,
  scrollPriceView,
  sessionClockBands,
  zoomPriceView,
  type DayAxis,
  type PriceView,
} from "@/lib/options-lab/timeOrthoTape";
import {
  DEFAULT_TAPE_PREFS,
  TAPE_PREFS_EVENT,
  labelAlignY,
  loadTapePrefs,
  type TapeAxisContent,
  type TapeCandleKind,
  type TapePrefs,
} from "@/lib/options-lab/timeOrthoTapePrefs";
import {
  BAR_MS,
  chartWindow,
  completeSessionBars,
} from "@/lib/options-lab/timeOrthoSession";
import {
  prefetchTimeOrthoTape,
  readTapeCache,
} from "@/lib/options-lab/timeOrthoTapeCache";
import { formatStrike } from "@/lib/options-lab/listedStrikes";

const POLL_MS = 30_000;
const UP = "#22c55e";
const DOWN = "#ef4444";
const AXIS = "rgba(232,237,244,0.58)";
const NOW = "rgba(255,255,255,0.45)";

const BAND_FILL: Record<string, string> = {
  pre: "rgba(255,255,255,0.03)",
  morning: "rgba(90,150,230,0.11)",
  afternoon: "rgba(220,180,70,0.10)",
  closing: "rgba(220,90,130,0.13)",
  post: "rgba(255,255,255,0.03)",
};
const BAND_ACTIVE: Record<string, string> = {
  pre: "rgba(255,255,255,0.06)",
  morning: "rgba(90,150,230,0.18)",
  afternoon: "rgba(220,180,70,0.16)",
  closing: "rgba(220,90,130,0.22)",
  post: "rgba(255,255,255,0.06)",
};

function priceToY(axis: DayAxis, price: number): number {
  const span = axis.priceHi - axis.priceLo || 1;
  return axis.plotY + axis.plotH * (1 - (price - axis.priceLo) / span);
}

export type TapeBookMark = {
  id: string;
  label: string;
  entryAt: number;
  closedAt: number | null;
  closedPnl: number | null;
};

function paintHloc(
  ctx: CanvasRenderingContext2D,
  axis: DayAxis,
  bars: OhlcBar[],
  kind: TapeCandleKind,
) {
  if (kind === "line_close" || kind === "area_close") {
    const pts: Array<{ x: number; y: number }> = [];
    for (const b of bars) {
      if (!Number.isFinite(b.c)) continue;
      const x0 = dayClockToX(b.t, axis);
      const x1 = dayClockToX(b.t + BAR_MS, axis);
      pts.push({ x: (x0 + x1) / 2, y: priceToY(axis, b.c) });
    }
    if (pts.length < 2) return;
    if (kind === "area_close") {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, axis.plotY + axis.plotH);
      for (const p of pts) ctx.lineTo(p.x, p.y);
      ctx.lineTo(pts[pts.length - 1].x, axis.plotY + axis.plotH);
      ctx.closePath();
      ctx.fillStyle = "rgba(34,197,94,0.16)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.strokeStyle = "rgba(232,237,244,0.85)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    return;
  }

  for (const b of bars) {
    const o = b.o ?? b.c;
    const h = b.h ?? Math.max(o, b.c);
    const l = b.l ?? Math.min(o, b.c);
    const x0 = dayClockToX(b.t, axis);
    const x1 = dayClockToX(b.t + BAR_MS, axis);
    const cx = (x0 + x1) / 2;
    const bodyW = Math.max(1.5, Math.abs(x1 - x0) * 0.62);
    const yO = priceToY(axis, o);
    const yC = priceToY(axis, b.c);
    const yH = priceToY(axis, h);
    const yL = priceToY(axis, l);
    const up = b.c >= o;
    ctx.strokeStyle = up ? UP : DOWN;
    ctx.fillStyle = up ? UP : DOWN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, yH);
    ctx.lineTo(cx, yL);
    ctx.stroke();
    if (kind === "ohlc") {
      const tick = Math.max(2, bodyW * 0.45);
      ctx.beginPath();
      ctx.moveTo(cx - tick, yO);
      ctx.lineTo(cx, yO);
      ctx.moveTo(cx, yC);
      ctx.lineTo(cx + tick, yC);
      ctx.stroke();
    } else {
      ctx.fillRect(
        cx - bodyW / 2,
        Math.min(yO, yC),
        bodyW,
        Math.max(1, Math.abs(yC - yO)),
      );
    }
  }
}

function paintPriceSpine(
  ctx: CanvasRenderingContext2D,
  axis: DayAxis,
  spineX: number,
  pxTicks: number[],
  kTicks: number[],
  content: TapeAxisContent,
) {
  const { plotY, plotH } = axis;
  const showPx = content === "ticker" || content === "both";
  const showK = content === "strikes" || content === "both";
  ctx.strokeStyle = "rgba(232,237,244,0.42)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(spineX, plotY);
  ctx.lineTo(spineX, plotY + plotH);
  ctx.stroke();
  ctx.font = "10px ui-sans-serif, system-ui, sans-serif";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "rgba(232,237,244,0.4)";
  if (showPx) {
    ctx.textAlign = "right";
    ctx.fillText("px", spineX - 6, plotY - 2);
  }
  if (showK) {
    ctx.textAlign = "left";
    ctx.fillText("K", spineX + 6, plotY - 2);
  }
  ctx.textBaseline = "middle";
  ctx.font = "24.75px ui-sans-serif, system-ui, sans-serif";
  if (showPx) {
    for (const price of pxTicks) {
      const y = Math.round(priceToY(axis, price)) + 0.5;
      ctx.strokeStyle = "rgba(232,237,244,0.35)";
      ctx.beginPath();
      ctx.moveTo(spineX - 5, y);
      ctx.lineTo(spineX, y);
      ctx.stroke();
      ctx.fillStyle = AXIS;
      ctx.textAlign = "right";
      ctx.fillText(formatPrice(price), spineX - 7, y);
    }
  }
  if (showK) {
    for (const k of kTicks) {
      const y = Math.round(priceToY(axis, k)) + 0.5;
      ctx.strokeStyle = "rgba(160,200,255,0.45)";
      ctx.beginPath();
      ctx.moveTo(spineX, y);
      ctx.lineTo(spineX + 5, y);
      ctx.stroke();
      ctx.fillStyle = "rgba(180,210,255,0.82)";
      ctx.textAlign = "left";
      ctx.fillText(formatStrike(k), spineX + 7, y);
    }
  }
}

function paintTape(
  ctx: CanvasRenderingContext2D,
  axis: DayAxis,
  bars: OhlcBar[],
  nowMs: number,
  prefillsPriorDay: boolean,
  book: TapeBookMark[],
  prefs: TapePrefs,
  listedStrikes: number[],
) {
  const { width, height, plotY, plotH, plotRight, xClose } = axis;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#07070a";
  ctx.fillRect(0, 0, width, height);

  const where = marketWhereWhen(
    nowMs,
    axis.tPre,
    axis.tPost,
    prefillsPriorDay,
    prefs,
  );
  const bands = sessionClockBands(axis.tOpen, prefs);
  const activeId =
    where.phase === "pre" && where.label === "Post-market"
      ? "post"
      : where.phase;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, plotY, plotRight, plotH);
  ctx.clip();

  for (const b of bands) {
    const x0 = dayClockToX(b.t0, axis);
    const x1 = dayClockToX(b.t1, axis);
    ctx.fillStyle =
      b.id === activeId ? BAND_ACTIVE[b.id] || BAND_FILL[b.id] : BAND_FILL[b.id];
    ctx.fillRect(x0, plotY, Math.max(1, x1 - x0), plotH);
  }

  const kTicks = listedStrikeTicks(
    listedStrikes,
    axis.priceLo,
    axis.priceHi,
    plotH,
  );
  const pxTicks = tickerPriceTicks(axis.priceLo, axis.priceHi, plotH);
  for (const price of pxTicks) {
    const y = Math.round(priceToY(axis, price)) + 0.5;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotRight, y);
    ctx.stroke();
  }
  for (const k of kTicks) {
    const y = Math.round(priceToY(axis, k)) + 0.5;
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(plotRight, y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const noonB = bands.find((b) => b.id === "afternoon");
  const closeB = bands.find((b) => b.id === "closing");
  const marks = [
    { t: axis.tOpen, label: "9:30 AM", major: true },
    { t: noonB?.t0 ?? axis.tOpen, label: "12:00 PM", major: false },
    { t: closeB?.t0 ?? axis.tClose, label: "2:30 PM", major: false },
    { t: axis.tClose, label: "4:00 PM", major: true },
  ];
  for (const m of marks) {
    const x = Math.round(dayClockToX(m.t, axis)) + 0.5;
    ctx.strokeStyle = m.major ? "rgba(190,255,80,0.85)" : "rgba(190,255,80,0.45)";
    ctx.lineWidth = m.major ? 3 : 2;
    ctx.beginPath();
    ctx.moveTo(x, plotY + 8);
    ctx.lineTo(x, plotY + plotH - 8);
    ctx.stroke();
  }

  if (nowMs >= axis.tPre && nowMs <= axis.tPost) {
    const x = Math.round(dayClockToX(nowMs, axis)) + 0.5;
    ctx.strokeStyle = NOW;
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, plotY);
    ctx.lineTo(x, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Dim the unprinted future inside RTH so “now” is obvious.
  if (nowMs >= axis.tOpen && nowMs < axis.tClose) {
    const x = dayClockToX(nowMs, axis);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.fillRect(x, plotY, Math.max(0, xClose - x), plotH);
  }

  for (const mark of book) {
    const xIn = dayClockToX(mark.entryAt, axis);
    const closed = mark.closedAt != null;
    const xOut = closed ? dayClockToX(mark.closedAt!, axis) : dayClockToX(nowMs, axis);
    // Ghost of the hold so far (entry → now/close), left of real time.
    ctx.fillStyle = "rgba(180,200,255,0.08)";
    ctx.fillRect(xIn, plotY, Math.max(0, xOut - xIn), plotH);
    ctx.strokeStyle = "rgba(180,200,255,0.45)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(Math.round(xIn) + 0.5, plotY);
    ctx.lineTo(Math.round(xIn) + 0.5, plotY + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    if (closed) {
      const xC = dayClockToX(mark.closedAt!, axis);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(xC, plotY, Math.max(0, axis.plotRight - xC), plotH);
      ctx.strokeStyle = "rgba(255,220,120,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.round(xC) + 0.5, plotY);
      ctx.lineTo(Math.round(xC) + 0.5, plotY + plotH);
      ctx.stroke();
    }
  }

  paintHloc(ctx, axis, bars, prefs.candleKind);

  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.strokeRect(0.5, plotY + 0.5, plotRight - 1, plotH - 1);

  const showLeft = prefs.axisSide === "left" || prefs.axisSide === "both";
  const showRight = prefs.axisSide === "right" || prefs.axisSide === "both";
  if (showLeft) {
    paintPriceSpine(ctx, axis, 52.5, pxTicks, kTicks, prefs.axisContent);
  }
  if (showRight) {
    paintPriceSpine(ctx, axis, plotRight + 0.5, pxTicks, kTicks, prefs.axisContent);
  }

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "13px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(190,255,80,0.9)";
  for (const m of marks) {
    ctx.fillText(m.label, dayClockToX(m.t, axis), plotY + 10);
  }
  ctx.fillStyle = AXIS;
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillText("4AM", dayClockToX(axis.tPre, axis), plotY + plotH + 8);
  ctx.fillText("8PM", dayClockToX(axis.tPost, axis), plotY + plotH + 8);

  ctx.textBaseline = "middle";
  ctx.font = "700 18px ui-sans-serif, system-ui, sans-serif";
  for (const b of bands) {
    const x0 = dayClockToX(b.t0, axis);
    const x1 = dayClockToX(b.t1, axis);
    ctx.fillStyle =
      b.kind === "session" ? "rgba(80,220,90,0.82)" : "rgba(80,220,90,0.55)";
    ctx.fillText(b.label, (x0 + x1) / 2, labelAlignY(prefs.labelAlign, plotY, plotH));
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  ctx.fillStyle = "rgba(232,237,244,0.7)";
  const place =
    where.tapeDay === "prior"
      ? `${where.label} · ${where.clock} · yesterday`
      : `${where.label} · ${where.clock}`;
  ctx.fillText(place, 10, 8);

  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.font = "11px ui-sans-serif, system-ui, sans-serif";
  for (const mark of book) {
    const xIn = dayClockToX(mark.entryAt, axis);
    ctx.fillStyle = "rgba(180,200,255,0.7)";
    ctx.fillText("Entry", xIn, plotY + plotH - 6);
    if (mark.closedAt != null) {
      const xC = dayClockToX(mark.closedAt, axis);
      const pnl = mark.closedPnl;
      const pnlTxt =
        pnl == null
          ? "Close"
          : `Close ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`;
      ctx.fillStyle = "rgba(255,220,120,0.9)";
      ctx.fillText(pnlTxt, xC, plotY + 36);
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.fillText("what might have been", (xC + axis.plotRight) / 2, plotY + plotH * 0.62);
    }
  }
}

export type TimeOrthoTapeHandle = {
  getCanvas: () => HTMLCanvasElement | null;
  /** Paint now and pin the surface box if onAxis is set. */
  redraw: () => void;
};

const TimeOrthoLiveChart = forwardRef<
  TimeOrthoTapeHandle,
  {
    symbol: string;
    book?: TapeBookMark[];
    onAxis?: (span: {
      nowX: number;
      expiryX: number;
      sMinY?: number;
      sMaxY?: number;
    }) => void;
    /** Strike window of the visible position — defines tape Y. */
    positionScale?: { lo: number; hi: number } | null;
    listedStrikes?: number[];
    /** Live underlier mid — last 5m bar tracks this so tape S matches the box spot. */
    liveSpot?: number | null;
    /** False while the tape stays warm under an opaque 3D surface. */
    interactive?: boolean;
  }
>(function TimeOrthoLiveChart(
  {
    symbol,
    book = [],
    onAxis,
    positionScale = null,
    listedStrikes = [],
    liveSpot = null,
    interactive = true,
  },
  ref,
) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bookRef = useRef(book);
  bookRef.current = book;
  const onAxisRef = useRef(onAxis);
  onAxisRef.current = onAxis;
  const positionScaleRef = useRef(positionScale);
  positionScaleRef.current = positionScale;
  const listedRef = useRef(listedStrikes);
  listedRef.current = listedStrikes;
  const liveSpotRef = useRef(liveSpot);
  liveSpotRef.current = liveSpot;
  const prefsRef = useRef<TapePrefs>(DEFAULT_TAPE_PREFS);
  const barsRef = useRef<OhlcBar[]>([]);
  const winRef = useRef({
    fromMs: 0,
    toMs: 0,
    nowMs: 0,
    prefillsPriorDay: false,
  });
  const seeded = readTapeCache(symbol);
  if (seeded && barsRef.current.length === 0) {
    barsRef.current = seeded.bars;
    winRef.current = {
      fromMs: seeded.fromMs,
      toMs: seeded.toMs,
      nowMs: Date.now(),
      prefillsPriorDay: seeded.prefillsPriorDay,
    };
  }
  const priceViewRef = useRef<PriceView | null>(null);
  const userPanRef = useRef(false);
  const axisRef = useRef<DayAxis | null>(null);
  const scaleKey = `${positionScale?.lo ?? ""}:${positionScale?.hi ?? ""}`;

  useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current,
    redraw: () => draw(),
  }));

  const draw = () => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const { fromMs, toMs, prefillsPriorDay } = winRef.current;
    if (!fromMs || !toMs) return;
    const nowMs = prefillsPriorDay ? winRef.current.nowMs : Date.now();
    const dayMs = prefillsPriorDay ? fromMs + 6 * 3600 * 1000 : nowMs;
    const withLive = prefillsPriorDay
      ? barsRef.current
      : applyLiveTapeClose(barsRef.current, liveSpotRef.current, nowMs);
    const paintedBars = completeSessionBars(withLive, fromMs, toMs);
    const asCandles = paintedBars.map((b, i) => ({
      slot: i,
      high: b.h ?? b.c,
      low: b.l ?? b.c,
      open: b.o ?? b.c,
      close: b.c,
    }));
    const posScale = positionPriceView(
      positionScaleRef.current?.lo,
      positionScaleRef.current?.hi,
    );
    const printed = priceWindow(asCandles);
    const shareBox = Boolean(onAxisRef.current && posScale);
    const fitted = tapePriceView({
      box: posScale,
      printed,
      shareBox,
    });
    const price = userPanRef.current
      ? priceViewRef.current ?? fitted
      : fitted;
    if (price) priceViewRef.current = price;
    const axis = layoutDayAxis(
      width,
      height,
      dayMs,
      asCandles,
      leftChromeRightPx(width),
      price ?? undefined,
    );
    axisRef.current = axis;
    const marks = bookRef.current;
    paintTape(
      ctx,
      axis,
      paintedBars,
      nowMs,
      prefillsPriorDay,
      marks,
      prefsRef.current,
      listedRef.current,
    );
    const open = marks.filter((m) => m.closedAt == null);
    const liveMs =
      open.length > 0
        ? nowMs
        : marks.reduce((t, m) => Math.max(t, m.closedAt ?? 0), axis.tOpen);
    const boxLo = positionScaleRef.current?.lo;
    const boxHi = positionScaleRef.current?.hi;
    onAxisRef.current?.({
      nowX: dayClockToX(liveMs, axis),
      expiryX: axis.xClose,
      sMinY:
        boxLo != null && Number.isFinite(boxLo)
          ? priceToY(axis, boxLo)
          : undefined,
      sMaxY:
        boxHi != null && Number.isFinite(boxHi)
          ? priceToY(axis, boxHi)
          : undefined,
    });
    canvas.dataset.xOpen = String(Math.round(axis.xOpen));
    canvas.dataset.xClose = String(Math.round(axis.xClose));
    canvas.dataset.printed = String(barsRef.current.length);
    canvas.dataset.cached = barsRef.current.length > 0 ? "1" : "0";
    canvas.dataset.phase = marketWhereWhen(
      nowMs,
      axis.tPre,
      axis.tPost,
      prefillsPriorDay,
      prefsRef.current,
    ).label;
    if (price) {
      canvas.dataset.priceLo = String(price.lo);
      canvas.dataset.priceHi = String(price.hi);
    }
    canvas.dataset.shareBox = shareBox ? "1" : "0";
  };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const now = Date.now();
    const win = chartWindow(now);
    winRef.current = {
      fromMs: win.fromMs,
      toMs: win.toMs,
      nowMs: now,
      prefillsPriorDay: win.prefillsPriorDay,
    };
    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(host);
    const onWheel = (e: WheelEvent) => {
      const axis = axisRef.current;
      const view = priceViewRef.current;
      if (!axis || !view) return;
      e.preventDefault();
      userPanRef.current = true;
      if (e.ctrlKey || e.metaKey) {
        const rect = host.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const t = 1 - (y - axis.plotY) / Math.max(1, axis.plotH);
        const anchor = view.lo + t * (view.hi - view.lo);
        priceViewRef.current = zoomPriceView(
          view,
          e.deltaY > 0 ? 1.12 : 0.88,
          anchor,
        );
      } else {
        priceViewRef.current = scrollPriceView(view, e.deltaY, axis.plotH);
      }
      draw();
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      ro.disconnect();
      host.removeEventListener("wheel", onWheel);
    };
  }, []);

  useEffect(() => {
    const sym = (symbol || "").trim().toUpperCase();
    if (!sym) return;
    let alive = true;
    const ac = new AbortController();
    const applyCache = () => {
      const cached = readTapeCache(sym);
      if (cached && cached.bars.length) {
        barsRef.current = cached.bars;
        winRef.current = {
          fromMs: cached.fromMs,
          toMs: cached.toMs,
          nowMs: Date.now(),
          prefillsPriorDay: cached.prefillsPriorDay,
        };
      } else {
        barsRef.current = [];
      }
      draw();
    };
    applyCache();
    const paint = async () => {
      applyCache();
      const entry = await prefetchTimeOrthoTape(sym, { signal: ac.signal });
      if (!alive || !entry) return;
      barsRef.current = entry.bars;
      winRef.current = {
        fromMs: entry.fromMs,
        toMs: entry.toMs,
        nowMs: Date.now(),
        prefillsPriorDay: entry.prefillsPriorDay,
      };
      draw();
    };
    void paint().catch(() => {
      /* named empty: tape stays the session grid until 5m bars arrive */
    });
    const id = window.setInterval(() => {
      void paint().catch(() => undefined);
    }, POLL_MS);
    return () => {
      alive = false;
      ac.abort();
      window.clearInterval(id);
    };
  }, [symbol]);

  useEffect(() => {
    prefsRef.current = loadTapePrefs();
    const onPrefs = () => {
      prefsRef.current = loadTapePrefs();
      draw();
    };
    window.addEventListener(TAPE_PREFS_EVENT, onPrefs);
    window.addEventListener("storage", onPrefs);
    return () => {
      window.removeEventListener(TAPE_PREFS_EVENT, onPrefs);
      window.removeEventListener("storage", onPrefs);
    };
  }, []);

  // Pin the box on this frame. Live mid redraws the last candle with the spot.
  useLayoutEffect(() => {
    onAxisRef.current = onAxis;
    positionScaleRef.current = positionScale;
    liveSpotRef.current = liveSpot;
    if (!userPanRef.current) priceViewRef.current = null;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scaleKey, interactive, liveSpot]);

  return (
    <div
      ref={hostRef}
      className={
        "absolute inset-0 z-0 " +
        (interactive ? "pointer-events-auto" : "pointer-events-none")
      }
      data-testid="surface-time-ortho-live-chart"
      data-symbol={symbol}
      data-armed={interactive ? "1" : "0"}
    >
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        data-testid="surface-time-ortho-tape"
      />
    </div>
  );
});

TimeOrthoLiveChart.displayName = "TimeOrthoLiveChart";

export default TimeOrthoLiveChart;
