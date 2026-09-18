"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { rebinDisplay, stubViewport, type SaStructure } from "@/lib/saSurface";
import {
  assertAligned,
  autoFitY,
  canvasSpace,
  fromCanvasPrice,
  toCanvasPrice,
  yFor,
} from "@/lib/saScale";
import { useSaCanvas } from "./SaCanvasContext";
import SaPartDialog from "./SaPartDialog";
import type { OhlcBar } from "@/lib/marketOhlcApi";
import { bustSource, fetchGen, peek, prefetch } from "@/lib/saDelivery";
import { adjacentIntervals, adjacentLookbacks, SA_THEME } from "@/lib/saTheme";
import { honestBars, timeTicks, xFor } from "@/lib/saBars";
import { formatTick, priceGrid, resolveTick, snapTick } from "@/lib/saTicks";
import { clampWindow, defaultTimeWindow } from "@/lib/saView";

const LEGEND = [
  { id: "floor", label: "node floor", weight: "thick" },
  { id: "ceiling", label: "node ceiling", weight: "thick" },
  { id: "internodal", label: "internodal crevasse", weight: "thin" },
  { id: "intranode", label: "intranode crevasse", weight: "thin" },
] as const;

const W = 800;
const H = 900;
const LABEL_COL = 108;
const AXIS_WHITE = "#ffffff";
const PROFILE_BLUE = "#2962ff";
const AXIS_TEXT = "#d1d4dc";
const GRID = "rgba(255,255,255,0.07)";
const GRID_MINOR = "rgba(255,255,255,0.03)";
const BG = SA_THEME.bg;

function tfToMs(tf: string): number {
  if (tf === "1m") return 60_000;
  if (tf === "15m") return 900_000;
  if (tf === "1h") return 3_600_000;
  if (tf === "1d") return 86_400_000;
  return 300_000;
}

export default function SaStructureChart({
  data,
  caption,
  profileQuery,
  source,
  target,
}: {
  data: SaStructure;
  caption?: string;
  source?: string;
  target?: string;
  profileQuery?: {
    target: string;
    source: string;
    from: string;
    to: string;
    harness?: string;
  };
}) {
  const { prefs, open, registerViewReset } = useSaCanvas();
  const vis = prefs.visible;
  const hostRef = useRef<HTMLDivElement | null>(null);
  const yRef = useRef({ lo: 0, hi: 1 });
  const tRef = useRef({ lo: 0, hi: 1 });
  const dragRef = useRef<{
    lastX: number;
    lastY: number;
    mode: "plot" | "time";
    moved: boolean;
    anchorT: number;
    startLo: number;
    startHi: number;
  } | null>(null);
  const pannedRef = useRef(false);
  const userPannedRef = useRef(false);
  const userTimePannedRef = useRef(false);
  const pqRef = useRef(profileQuery);
  pqRef.current = profileQuery;
  const [bars, setBars] = useState<OhlcBar[]>([]);
  const [rangeBins, setRangeBins] = useState<{ price: number; volume: number }[]>(
    [],
  );
  const [yLo, setYLo] = useState<number | null>(null);
  const [yHi, setYHi] = useState<number | null>(null);
  const [viewTLo, setViewTLo] = useState<number | null>(null);
  const [viewTHi, setViewTHi] = useState<number | null>(null);
  const [hair, setHair] = useState<{
    price: number;
    vol: number;
    klass: string | null;
  } | null>(null);
  const [stale, setStale] = useState(false);
  const [loadingEdge, setLoadingEdge] = useState(false);
  const [watchRev, setWatchRev] = useState(0);
  const [painted, setPainted] = useState(false);
  const [hostSize, setHostSize] = useState({ w: 800, h: 900 });
  const padRef = useRef(80);
  const pqKey = profileQuery
    ? `${profileQuery.harness || "live"}:${profileQuery.source}:${profileQuery.target}:${profileQuery.from}:${profileQuery.to}`
    : "";
  const space = canvasSpace(data.flags?.mapping);
  const mapPx = (p: number) => toCanvasPrice(p, data.mapping, space);
  const sourceSym = source || profileQuery?.source || data.source || "";
  const dataTRef = useRef({ lo: 0, hi: 1, pLo: 0, pHi: 1 });

  useEffect(() => {
    if (!vis.L1 || !sourceSym) return;
    const qs = new URLSearchParams({
      tf: prefs.priceTf,
      lookback_days: "0",
    });
    const url = `/api/dev/sa/v1/ohlc/${sourceSym}?${qs}`;
    const cached = peek(url);
    if (cached && Array.isArray(cached.body.bars)) {
      setBars(cached.body.bars as OhlcBar[]);
      setPainted(true);
    } else {
      setLoadingEdge(true);
    }
    let cancel = false;
    void fetchGen(url).then((r) => {
      if (cancel) return;
      if (Array.isArray(r.body?.bars)) {
        setBars(r.body.bars as OhlcBar[]);
        setPainted(true);
      }
      setStale(r.stale);
      setLoadingEdge(false);
    });
    return () => {
      cancel = true;
    };
  }, [vis.L1, sourceSym, prefs.priceTf, watchRev]);

  useEffect(() => {
    if (!sourceSym) return;
    const t = window.setTimeout(() => {
      for (const tf of adjacentIntervals(prefs.priceTf)) {
        prefetch(`/api/dev/sa/v1/ohlc/${sourceSym}?tf=${tf}&lookback_days=0`);
      }
    }, 800);
    return () => window.clearTimeout(t);
  }, [sourceSym, prefs.priceTf, prefs.priceLookbackDays]);

  useEffect(() => {
    const pq = pqRef.current;
    if (!pq || (pq.harness || "live") === "fixture") return;
    const url = `/api/dev/sa/v1/structure/${pq.target}?harness=live&source=${pq.source}&kind=developing`;
    const id = window.setInterval(() => {
      void fetchGen(url).then((r) => {
        if (r.status === 200 && !r.fromCache) {
          bustSource(pq.source);
          setWatchRev((n) => n + 1);
        }
      });
    }, 12000);
    return () => window.clearInterval(id);
  }, [pqKey]);

  useEffect(() => {
    setYLo(null);
    setYHi(null);
    setViewTLo(null);
    setViewTHi(null);
    userPannedRef.current = false;
    userTimePannedRef.current = false;
  }, [pqKey, space, prefs.priceTf]);

  useEffect(() => {
    const { bars: honest } = honestBars(bars);
    if (!honest.length) return;
    const tf = tfToMs(prefs.priceTf);
    const dataHi = honest[honest.length - 1].t + tf;
    const dataLo = honest[0].t;
    if (viewTLo == null || viewTHi == null) {
      const w = defaultTimeWindow(
        dataLo,
        dataHi,
        tf,
        prefs.priceLookbackDays || 1,
      );
      setViewTLo(w.lo);
      setViewTHi(w.hi);
    }
  }, [bars, viewTLo, viewTHi, prefs.priceTf, prefs.priceLookbackDays]);

  useEffect(() => {
    if (userPannedRef.current) return;
    const { bars: honest } = honestBars(bars);
    const tf = tfToMs(prefs.priceTf);
    const loT = viewTLo ?? Number.NEGATIVE_INFINITY;
    const hiT = viewTHi ?? Number.POSITIVE_INFINITY;
    const vis = honest.filter((b) => b.t + tf >= loT && b.t <= hiT);
    const prices: number[] = [];
    for (const b of vis.length ? vis : honest) {
      prices.push(mapPx(b.h), mapPx(b.l));
    }
    if (!prices.length) {
      for (const b of data.bins || []) prices.push(mapPx(b.price));
    }
    const fit = autoFitY(prices, 0);
    if (fit) {
      setYLo(fit.lo);
      setYHi(fit.hi);
    }
  }, [data.bins, bars, space, pqKey, viewTLo, viewTHi, prefs.priceTf]);

  useEffect(() => {
    registerViewReset(() => {
      userPannedRef.current = false;
      userTimePannedRef.current = false;
      setViewTLo(null);
      setViewTHi(null);
      setYLo(null);
      setYHi(null);
    });
  }, [registerViewReset]);

  useEffect(() => {
    const pq = pqRef.current;
    if (!vis.L2 || !pq || !pq.from || !pq.to) return;
    if (yLo == null || yHi == null) return;
    const t = window.setTimeout(() => {
      const row = Math.max((yHi - yLo) / 240, 0.01);
      const srcLo = fromCanvasPrice(yLo, data.mapping, space);
      const srcHi = fromCanvasPrice(yHi, data.mapping, space);
      const qs = new URLSearchParams({
        from: pq.from,
        to: pq.to,
        source: pq.source,
        price_lo: String(Math.min(srcLo, srcHi)),
        price_hi: String(Math.max(srcLo, srcHi)),
        row: String(row),
        harness: pq.harness || "live",
      });
      const url = `/api/dev/sa/v1/range/${pq.target}?${qs}`;
      const cached = peek(url);
      if (cached && Array.isArray(cached.body.bins)) {
        setRangeBins(cached.body.bins as { price: number; volume: number }[]);
      }
      void fetchGen(url).then((r) => {
        if (Array.isArray(r.body?.bins)) {
          setRangeBins(r.body.bins as { price: number; volume: number }[]);
        }
        if (r.stale) setStale(true);
      });
    }, 80);
    return () => {
      window.clearTimeout(t);
    };
  }, [vis.L2, pqKey, yLo, yHi, watchRev]);

  const displayBins = useMemo(
    () =>
      rebinDisplay(rangeBins.length ? rangeBins : data.bins || [], 280).map(
        (b) => ({ ...b, price: mapPx(b.price) }),
      ),
    [rangeBins, data.bins, space, data.mapping],
  );
  const { bars: honestRaw, gaps: barGaps } = useMemo(
    () => honestBars(bars),
    [bars],
  );
  const canvasBars = useMemo(
    () =>
      honestRaw.map((b) => ({
        ...b,
        o: mapPx(b.o),
        h: mapPx(b.h),
        l: mapPx(b.l),
        c: mapPx(b.c),
      })),
    [honestRaw, space, data.mapping],
  );
  const tfMs = tfToMs(prefs.priceTf);
  const dataTLo = canvasBars.length ? canvasBars[0].t : 0;
  const dataTHi = canvasBars.length
    ? canvasBars[canvasBars.length - 1].t + tfMs
    : 1;
  const tLo = viewTLo ?? dataTLo;
  const tHi = viewTHi ?? dataTHi;
  tRef.current = { lo: tLo, hi: tHi };
  const pad = 0;
  padRef.current = 0;
  const yPadPx = SA_THEME.yPadPx;
  const plotTop = (y: number) =>
    yPadPx + (y / H) * Math.max(1, hostSize.h - 2 * yPadPx);
  const tick = resolveTick({
    vpRow: data.vp_row,
    prices: [
      ...(data.bins || []).map((b) => b.price),
      ...honestRaw.map((b) => b.c),
    ],
  });
  const grid = tick
    ? priceGrid(yLo ?? 0, yHi ?? 1, tick, Math.max(6, Math.round(hostSize.h / 70)))
    : { majors: [], minors: [] };
  const vp = useMemo(() => stubViewport(data), [data]);
  const lo = yLo ?? 0;
  const hi = yHi ?? 1;
  yRef.current = { lo, hi };
  const pLo = honestRaw.length ? Math.min(...honestRaw.map((b) => b.l)) : lo;
  const pHi = honestRaw.length ? Math.max(...honestRaw.map((b) => b.h)) : hi;
  dataTRef.current = { lo: dataTLo, hi: dataTHi, pLo, pHi };
  const visibleRows = displayBins.filter(
    (b) => b.price >= lo && b.price <= hi,
  );
  const visibleMax = Math.max(1, ...visibleRows.map((b) => b.volume));
  const leftAxis = prefs.axis === "left" || prefs.axis === "both";
  const rightAxis = prefs.axis === "right" || prefs.axis === "both";
  const x0 = 0;
  const x1 = W;
  const plotLeft = leftAxis ? LABEL_COL : 0;
  const plotRight = rightAxis ? LABEL_COL : 0;
  const plotW = x1 - x0;
  const frac = Math.max(0.35, Math.min(0.75, prefs.profileWidthFrac || 0.62));
  const maxBar = Math.max(8, plotW * frac);
  const opacity = Math.max(0.35, Math.min(0.5, prefs.profileOpacity || 0.42));
  const flushRight = prefs.orientation === "rtl";
  const namedEmpty =
    !painted && !displayBins.length && !canvasBars.length
      ? data.named_state || "Loading…"
      : null;
  const lastPx =
    canvasBars.length > 0 ? canvasBars[canvasBars.length - 1].c : null;
  const lastY = lastPx != null ? yFor(lastPx, lo, hi, H, pad) : null;
  const lastUp =
    canvasBars.length > 1
      ? canvasBars[canvasBars.length - 1].c >=
        (canvasBars[canvasBars.length - 2].c ?? canvasBars[canvasBars.length - 1].c)
      : true;

  const proofP =
    lastPx != null
      ? lastPx
      : visibleRows.length
        ? visibleRows[Math.floor(visibleRows.length / 2)].price
        : (lo + hi) / 2;
  const proofY = yFor(proofP, lo, hi, H, pad);
  const aligned = assertAligned(proofY, proofY, proofY, 1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const ro = new ResizeObserver(() => {
      const r = host.getBoundingClientRect();
      setHostSize({ w: r.width, h: r.height });
    });
    ro.observe(host);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const hostR = host.getBoundingClientRect();
      const onTime =
        e.clientY > hostR.bottom - SA_THEME.yPadPx - 8;
      const factor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
      if (onTime) {
        userTimePannedRef.current = true;
        const { lo: a, hi: b } = tRef.current;
        if (b <= a) return;
        const u = (e.clientX - hostR.left - plotLeft) / Math.max(1, hostR.width - plotLeft - plotRight);
        const at = a + Math.min(1, Math.max(0, u)) * (b - a);
        const span = Math.min(90 * 86400_000, Math.max(tfToMs(prefs.priceTf) * 8, (b - a) * factor));
        const next = clampWindow(
          at - u * span,
          at - u * span + span,
          dataTRef.current.lo,
          dataTRef.current.hi,
          tfToMs(prefs.priceTf) * 8,
        );
        tRef.current = next;
        setViewTLo(next.lo);
        setViewTHi(next.hi);
        return;
      }
      userPannedRef.current = true;
      const { lo: a, hi: b } = yRef.current;
      if (b === a) return;
      const svg = host.querySelector("svg");
      const r = (svg || host).getBoundingClientRect();
      const y = ((e.clientY - r.top) / Math.max(1, r.height)) * H;
      const t = y / Math.max(1, H);
      const price = b - t * (b - a);
      const span = Math.max((b - a) * factor, 0.25);
      const next = clampWindow(
        price - t * span,
        price - t * span + span,
        dataTRef.current.pLo,
        dataTRef.current.pHi,
        0.25 * 8,
      );
      yRef.current = next;
      setYLo(next.lo);
      setYHi(next.hi);
    };
    host.addEventListener("wheel", onWheel, { passive: false });
    return () => host.removeEventListener("wheel", onWheel);
  }, [prefs.axis, prefs.priceTf]);

  return (
    <div
      ref={hostRef}
      className="relative min-h-0 flex-1 overflow-hidden"
      data-testid="sa-chart-host"
      data-overlay={vis.L3 ? "on" : "off"}
      data-space={space}
      data-mapping={data.flags?.mapping || "FAILED"}
      data-align={aligned ? "ok" : "fail"}
      data-tf={prefs.priceTf}
      data-stale={stale ? "1" : "0"}
      data-loading={loadingEdge ? "1" : "0"}
      data-painted={painted ? "1" : "0"}
      data-bar-gaps={String(barGaps)}
      data-tick={tick ?? ""}
      data-ypad={String(SA_THEME.yPadPx)}
      style={{
        background: BG,
        fontFamily: SA_THEME.uiFont,
        letterSpacing: SA_THEME.letterSpacing,
      }}
    >
      {namedEmpty ? (
        <p
          className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-zinc-400"
          data-testid="sa-chart-empty-named"
        >
          {namedEmpty}
        </p>
      ) : (
        <svg
          className="absolute"
          style={{
            top: yPadPx,
            left: plotLeft,
            right: plotRight,
            height: `calc(100% - ${2 * yPadPx}px)`,
          }}
          role="img"
          aria-label="Full-history volume profile"
          data-testid="sa-histogram"
          data-profile="full-history"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          onDoubleClick={() => {
            userPannedRef.current = false;
            userTimePannedRef.current = false;
            setViewTLo(null);
            setViewTHi(null);
            setYLo(null);
            setYHi(null);
          }}
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            pannedRef.current = false;
            const { lo: a, hi: b } = tRef.current;
            dragRef.current = {
              lastX: e.clientX,
              lastY: e.clientY,
              mode: "plot",
              moved: false,
              anchorT: a,
              startLo: a,
              startHi: b,
            };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerLeave={() => {
            dragRef.current = null;
            setHair(null);
          }}
          onMouseLeave={() => setHair(null)}
          onPointerMove={(e) => {
            if (dragRef.current?.mode === "plot") {
              const r = e.currentTarget.getBoundingClientRect();
              const dx = e.clientX - dragRef.current.lastX;
              const dy = e.clientY - dragRef.current.lastY;
              dragRef.current.lastX = e.clientX;
              dragRef.current.lastY = e.clientY;
              if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                pannedRef.current = true;
                dragRef.current.moved = true;
              }
              if (Math.abs(dy) > 0) {
                userPannedRef.current = true;
                const dPrice =
                  (dy / Math.max(1, r.height)) *
                  (yRef.current.hi - yRef.current.lo);
                const next = clampWindow(
                  yRef.current.lo + dPrice,
                  yRef.current.hi + dPrice,
                  dataTRef.current.pLo,
                  dataTRef.current.pHi,
                  0.25 * 8,
                );
                yRef.current = next;
                setYLo(next.lo);
                setYHi(next.hi);
              }
              if (Math.abs(dx) > 0) {
                userTimePannedRef.current = true;
                const dTime =
                  -(dx / Math.max(1, r.width)) *
                  (tRef.current.hi - tRef.current.lo);
                const next = clampWindow(
                  tRef.current.lo + dTime,
                  tRef.current.hi + dTime,
                  dataTRef.current.lo,
                  dataTRef.current.hi,
                  tfMs * 8,
                );
                tRef.current = next;
                setViewTLo(next.lo);
                setViewTHi(next.hi);
              }
              return;
            }
          }}
          onMouseMove={(e) => {
            if (dragRef.current) return;
            const svg = e.currentTarget;
            const r = svg.getBoundingClientRect();
            const y = ((e.clientY - r.top) / Math.max(1, r.height)) * H;
            const t = y / Math.max(1, H);
            const price = hi - t * (hi - lo);
            let vol = 0;
            let best = Infinity;
            for (const b of displayBins) {
              const d = Math.abs(b.price - price);
              if (d < best) {
                best = d;
                vol = b.volume;
              }
            }
            let klass: string | null = null;
            if (vis.L3) {
              let cd = Infinity;
              for (const ed of data.edges || []) {
                const d = Math.abs(mapPx(ed.price) - price);
                if (d < cd) {
                  cd = d;
                  klass = ed.direction === "up" ? "node floor" : "node ceiling";
                }
              }
              for (const c of data.crevasses || []) {
                const mid = mapPx((c.span[0] + c.span[1]) / 2);
                const d = Math.abs(mid - price);
                if (d < cd) {
                  cd = d;
                  klass =
                    c.tag === "intra-node" ? "intranode" : "internodal";
                }
              }
            }
            setHair({
              price: tick ? snapTick(price, tick) : price,
              vol,
              klass,
            });
          }}
        >
          {vis.L0 ? (
            <g data-layer="L0" onClick={() => open("grid")}>
              <rect width={W} height={H} fill={BG} />
              {grid.minors.map((p) => {
                const y = yFor(p, lo, hi, H, pad);
                return (
                  <line
                    key={`gm-${p}`}
                    x1={x0}
                    x2={x1}
                    y1={y}
                    y2={y}
                    stroke={GRID_MINOR}
                    strokeWidth={1}
                  />
                );
              })}
              {grid.majors.map((p) => {
                const y = yFor(p, lo, hi, H, pad);
                return (
                  <line
                    key={`g-${p}`}
                    x1={x0}
                    x2={x1}
                    y1={y}
                    y2={y}
                    stroke={GRID}
                    strokeWidth={1}
                  />
                );
              })}
              {canvasBars.length
                ? timeTicks(tLo, tHi, hostSize.w).map((tick) => {
                    const x = xFor(tick.t, tLo, tHi, x0, x1);
                    return (
                      <line
                        key={`vt-${tick.t}`}
                        x1={x}
                        x2={x}
                        y1={pad}
                        y2={H - pad}
                        stroke={GRID}
                        strokeWidth={1}
                      />
                    );
                  })
                : null}
            </g>
          ) : (
            <rect width={W} height={H} fill={BG} />
          )}

          {vis.L1 && canvasBars.length ? (
            <g data-layer="L1">
              {prefs.priceFormat === "line"
                ? (() => {
                    const pts = canvasBars
                      .map((b) => {
                        const x = xFor(b.t, tLo, tHi, x0, x1);
                        const y = yFor(b.c, lo, hi, H, pad);
                        return `${x},${y}`;
                      })
                      .join(" ");
                    return (
                      <polyline
                        fill="none"
                        stroke={SA_THEME.candleUpStroke}
                        strokeWidth={1}
                        vectorEffect="non-scaling-stroke"
                        points={pts}
                      />
                    );
                  })()
                : canvasBars.map((b) => {
                    const x = xFor(b.t, tLo, tHi, x0, x1);
                    const nextX = xFor(b.t + tfMs, tLo, tHi, x0, x1);
                    const bw = Math.max(1, (nextX - x) * 0.7);
                    const yH = yFor(b.h, lo, hi, H, pad);
                    const yL = yFor(b.l, lo, hi, H, pad);
                    const yO = yFor(b.o, lo, hi, H, pad);
                    const yC = yFor(b.c, lo, hi, H, pad);
                    const up = b.c >= b.o;
                    const fill = up
                      ? SA_THEME.candleUpFill
                      : SA_THEME.candleDownFill;
                    const stroke = up
                      ? SA_THEME.candleUpStroke
                      : SA_THEME.candleDownStroke;
                    return (
                      <g key={b.t} data-bar-ok="1">
                        <line
                          x1={x + bw / 2}
                          x2={x + bw / 2}
                          y1={yH}
                          y2={yL}
                          stroke={stroke}
                          strokeWidth={1}
                          vectorEffect="non-scaling-stroke"
                        />
                        {prefs.priceFormat === "candle" ? (
                          <rect
                            x={x}
                            y={Math.min(yO, yC)}
                            width={bw}
                            height={Math.max(1, Math.abs(yC - yO))}
                            fill={fill}
                            stroke={stroke}
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                          />
                        ) : (
                          <line
                            x1={x}
                            x2={x + bw}
                            y1={yC}
                            y2={yC}
                            stroke={stroke}
                            strokeWidth={1}
                            vectorEffect="non-scaling-stroke"
                          />
                        )}
                      </g>
                    );
                  })}
            </g>
          ) : null}

          {vis.L2 ? (
            <g
              data-layer="L2"
              data-testid="sa-profile-full-history"
              data-anchor={flushRight ? "right" : "left"}
              onClick={() => {
                if (pannedRef.current) return;
                open("L2");
              }}
            >
              {visibleRows.map((b, i) => {
                const y = yFor(b.price, lo, hi, H, pad);
                const next = visibleRows[i + 1];
                const yNext = next ? yFor(next.price, lo, hi, H, pad) : y + 2;
                const bh = Math.max(1, Math.abs(yNext - y));
                const raw = b.volume > 0 ? (b.volume / visibleMax) * maxBar : 0;
                const bw = b.volume > 0 ? Math.max(1, raw) : 0;
                const x = flushRight ? x1 - bw : x0;
                return (
                  <rect
                    key={`b-${b.price}-${i}`}
                    x={x}
                    y={Math.min(y, yNext)}
                    width={bw}
                    height={bh}
                    fill={PROFILE_BLUE}
                    opacity={opacity}
                  />
                );
              })}
            </g>
          ) : null}

          {vis.L3
            ? (data.nodes || []).map((n) => {
                const y1 = yFor(mapPx(n.span[1]), lo, hi, H, pad);
                const y0 = yFor(mapPx(n.span[0]), lo, hi, H, pad);
                return (
                  <rect
                    key={`n-${n.span[0]}`}
                    data-layer="L3"
                    x={x0}
                    y={y1}
                    width={plotW}
                    height={Math.max(2, y0 - y1)}
                    fill="#1e293b"
                    opacity={0.35}
                  />
                );
              })
            : null}
          {vis.L3
            ? (data.edges || []).map((e) => {
                const y = yFor(mapPx(e.price), lo, hi, H, pad);
                return (
                  <line
                    key={`e-${e.price}-${e.direction}`}
                    data-layer="L3"
                    x1={x0}
                    x2={x1}
                    y1={y}
                    y2={y}
                    stroke={
                      e.direction === "up"
                        ? SA_THEME.candleUpStroke
                        : SA_THEME.candleDownStroke
                    }
                    strokeWidth={4}
                  />
                );
              })
            : null}
          {vis.L3
            ? (data.crevasses || []).map((c) => {
                const y = yFor(mapPx((c.span[0] + c.span[1]) / 2), lo, hi, H, pad);
                return (
                  <line
                    key={`c-${c.span[0]}`}
                    data-layer="L3"
                    x1={x0}
                    x2={x1}
                    y1={y}
                    y2={y}
                    stroke="#94a3b8"
                    strokeWidth={1.1}
                    strokeDasharray={c.tag === "intra-node" ? "4 5" : undefined}
                  />
                );
              })
            : null}

          {vis.L4 ? <g data-layer="L4" data-reserved="footprint" /> : null}

          {lastY != null && lastPx != null ? (
            <line
              data-testid="sa-last-price-line"
              x1={x0}
              x2={x1}
              y1={lastY}
              y2={lastY}
              stroke={lastUp ? SA_THEME.candleUpStroke : SA_THEME.candleDownStroke}
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          ) : null}


          <circle
            data-testid="sa-align-proof"
            data-delta="0"
            cx={x0}
            cy={proofY}
            r={0}
            fill="none"
          />
        </svg>
      )}
      {!namedEmpty ? (
        <>
          {leftAxis
            ? grid.majors.map((p) => (
                <div
                  key={`pl-${p}`}
                  data-testid="sa-price-tick"
                  className="pointer-events-none absolute"
                  style={{
                    left: 0,
                    top: plotTop(yFor(p, lo, hi, H, pad)),
                    width: LABEL_COL - 6,
                    paddingRight: 6,
                    boxSizing: "border-box",
                    transform: "translateY(-50%)",
                    textAlign: "right",
                    color: AXIS_TEXT,
                    fontFamily: SA_THEME.axisFont,
                    fontSize: SA_THEME.axisSize,
                    letterSpacing: SA_THEME.letterSpacing,
                    lineHeight: 1,
                  }}
                >
                  {tick ? formatTick(p, tick) : String(p)}
                </div>
              ))
            : null}
          {rightAxis
            ? grid.majors.map((p) => (
                <div
                  key={`pr-${p}`}
                  data-testid="sa-price-tick"
                  className="pointer-events-none absolute"
                  style={{
                    right: 0,
                    top: plotTop(yFor(p, lo, hi, H, pad)),
                    width: LABEL_COL - 6,
                    paddingLeft: 6,
                    boxSizing: "border-box",
                    transform: "translateY(-50%)",
                    textAlign: "left",
                    color: AXIS_TEXT,
                    fontFamily: SA_THEME.axisFont,
                    fontSize: SA_THEME.axisSize,
                    letterSpacing: SA_THEME.letterSpacing,
                    lineHeight: 1,
                  }}
                >
                  {tick ? formatTick(p, tick) : String(p)}
                </div>
              ))
            : null}
          {lastPx != null && lastY != null ? (
            <div
              data-testid="sa-last-price"
              data-price={lastPx}
              className="pointer-events-none absolute px-1 py-0.5 text-white"
              style={{
                ...(rightAxis ? { right: 0 } : { left: 0 }),
                top: plotTop(lastY),
                transform: "translateY(-50%)",
                background: lastUp
                  ? SA_THEME.candleUpStroke
                  : SA_THEME.candleDownStroke,
                fontFamily: SA_THEME.axisFont,
                fontSize: SA_THEME.axisSize,
                letterSpacing: SA_THEME.letterSpacing,
                lineHeight: 1,
                borderRadius: 2,
                textAlign: "right",
                minWidth: LABEL_COL - 8,
              }}
            >
              {tick ? formatTick(lastPx, tick) : lastPx.toFixed(2)}
            </div>
          ) : null}
          <div
            data-testid="sa-time-axis"
            data-tlo={tLo}
            data-thi={tHi}
            data-nbars={canvasBars.length}
            className="pointer-events-none absolute bottom-0"
            style={{
              height: 36,
              left: plotLeft,
              right: plotRight,
            }}
          >
            {canvasBars.length
              ? timeTicks(tLo, tHi, hostSize.w).map((tk) => (
                  <div
                    key={tk.t}
                    className="absolute"
                    style={{
                      left: `${(xFor(tk.t, tLo, tHi, x0, x1) / W) * 100}%`,
                      bottom: 2,
                      transform: "translateX(-50%)",
                      color: AXIS_TEXT,
                      fontFamily: SA_THEME.axisFont,
                      fontSize: SA_THEME.timeSize,
                      letterSpacing: SA_THEME.letterSpacing,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tk.label}
                  </div>
                ))
              : null}
          </div>
          {leftAxis ? (
            <>
              <div
                data-testid="sa-axis-left"
                className="absolute z-10 p-0"
                style={{
                  left: plotLeft,
                  top: yPadPx,
                  bottom: yPadPx,
                  width: 2,
                  background: AXIS_WHITE,
                }}
              />
              <div
                data-testid="sa-price-scale"
                className="absolute z-20 cursor-ns-resize"
                style={{
                  left: 0,
                  width: LABEL_COL,
                  top: yPadPx,
                  bottom: yPadPx,
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const u = (e.clientY - r.top) / Math.max(1, r.height);
                  const { lo: a, hi: b } = yRef.current;
                  dragRef.current = {
                    lastX: e.clientX,
                    lastY: e.clientY,
                    mode: "time",
                    moved: false,
                    anchorT: b - u * (b - a),
                    startLo: a,
                    startHi: b,
                  };
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  const d = dragRef.current;
                  if (!d) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const dy = e.clientY - d.lastY;
                  if (Math.abs(dy) > 2) d.moved = true;
                  d.lastY = e.clientY;
                  userPannedRef.current = true;
                  const span0 = d.startHi - d.startLo;
                  const factor = Math.exp((dy / Math.max(1, r.height)) * 3);
                  const span = Math.max(0.25 * 8, span0 * factor);
                  const u = (d.anchorT - d.startLo) / span0;
                  d.startLo = d.anchorT - u * span;
                  d.startHi = d.startLo + span;
                  const next = clampWindow(
                    d.startLo,
                    d.startHi,
                    dataTRef.current.pLo,
                    dataTRef.current.pHi,
                    0.25 * 8,
                  );
                  d.startLo = next.lo;
                  d.startHi = next.hi;
                  yRef.current = next;
                  setYLo(next.lo);
                  setYHi(next.hi);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  userPannedRef.current = false;
                  setYLo(null);
                  setYHi(null);
                }}
                onPointerUp={(e) => {
                  const d = dragRef.current;
                  dragRef.current = null;
                  if (d && !d.moved && e.detail < 2) open("axis");
                }}
              />
            </>
          ) : null}
          {rightAxis ? (
            <button
              type="button"
              data-testid="sa-axis-right"
              aria-label="Price scale"
              className="absolute z-10 p-0"
              style={{
                right: plotRight,
                top: yPadPx,
                bottom: yPadPx,
                width: 2,
                background: AXIS_WHITE,
                border: 0,
              }}
              onClick={() => open("axis")}
            />
          ) : null}
          <div
            data-testid="sa-axis-time"
            aria-label="Time scale"
            className="absolute z-20 cursor-ew-resize"
            style={{
              left: plotLeft,
              right: plotRight,
              bottom: 0,
              height: yPadPx,
            }}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              e.preventDefault();
              const r = e.currentTarget.getBoundingClientRect();
              const u = (e.clientX - r.left) / Math.max(1, r.width);
              const { lo: a, hi: b } = tRef.current;
              dragRef.current = {
                lastX: e.clientX,
                lastY: e.clientY,
                mode: "time",
                moved: false,
                anchorT: a + Math.min(1, Math.max(0, u)) * (b - a),
                startLo: a,
                startHi: b,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = dragRef.current;
              if (!d || d.mode !== "time") return;
              const r = e.currentTarget.getBoundingClientRect();
              const dx = e.clientX - d.lastX;
              if (Math.abs(e.clientX - d.lastX) > 2 || Math.abs(e.clientY - d.lastY) > 2) {
                d.moved = true;
              }
              d.lastX = e.clientX;
              d.lastY = e.clientY;
              userTimePannedRef.current = true;
              const span0 = d.startHi - d.startLo;
              const factor = Math.exp((-dx / Math.max(1, r.width)) * 3);
              const minSpan = tfMs * 8;
              const maxSpan = 90 * 86400_000;
              const span = Math.min(maxSpan, Math.max(minSpan, span0 * factor));
              d.startLo = d.anchorT - ((d.anchorT - d.startLo) / span0) * span;
              d.startHi = d.startLo + span;
              const next = clampWindow(
                d.startLo,
                d.startHi,
                dataTRef.current.lo,
                dataTRef.current.hi,
                minSpan,
              );
              d.startLo = next.lo;
              d.startHi = next.hi;
              tRef.current = next;
              setViewTLo(next.lo);
              setViewTHi(next.hi);
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              userTimePannedRef.current = false;
              setViewTLo(null);
              setViewTHi(null);
            }}
            onPointerUp={(e) => {
              const d = dragRef.current;
              dragRef.current = null;
              if (d && !d.moved && e.detail < 2) open("range");
            }}
          >
            <div
              className="absolute left-0 right-0"
              style={{
                top: 0,
                height: 2,
                background: AXIS_WHITE,
              }}
            />
          </div>
        </>
      ) : null}
      {loadingEdge && painted ? (
        <p
          className="pointer-events-none absolute left-3 top-8 text-[10px] uppercase tracking-wide text-zinc-500"
          data-testid="sa-loading-edge"
        >
          loading edge
        </p>
      ) : null}
      {stale ? (
        <p
          className="pointer-events-none absolute right-3 top-8 rounded bg-amber-900/80 px-1.5 text-[10px] uppercase text-amber-100"
          data-testid="sa-stale-badge"
        >
          STALE
        </p>
      ) : null}
      {hair ? (
        <div
          className="pointer-events-none absolute left-3 top-2 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-zinc-200"
          data-testid="sa-crosshair"
        >
          {hair.price.toFixed(2)} · vol {hair.vol}
          {hair.klass ? ` · ${hair.klass}` : ""}
        </div>
      ) : null}
      <p
        className="pointer-events-none absolute bottom-1 left-3 right-28 truncate text-[10px] leading-tight text-zinc-500"
        data-testid="sa-chart-caption"
      >
        {caption || data.caption || ""}
      </p>
      <p
        className="pointer-events-none absolute bottom-1 right-3 max-w-[40%] truncate text-[10px] text-zinc-600"
        title={vp.label}
        data-testid="sa-viewport-stub"
      >
        {vp.label}
      </p>
      {vis.L3 && prefs.legendOn ? (
        <ul
          className="absolute right-2 top-8 space-y-1 rounded border border-zinc-700 bg-black/80 px-2 py-1.5 text-[11px] text-zinc-200"
          data-testid="sa-legend-strip"
          onClick={() => open("legend")}
        >
          {LEGEND.map((row) => (
            <li key={row.id} className="flex items-center gap-2">
              <span
                className="inline-block bg-zinc-200"
                style={{ width: 18, height: row.weight === "thick" ? 4 : 1 }}
              />
              {row.label}
            </li>
          ))}
        </ul>
      ) : vis.L3 ? (
        <button
          type="button"
          className="absolute right-2 top-2 rounded border border-zinc-700 px-2 py-0.5 text-[10px] uppercase text-zinc-400"
          data-testid="sa-legend-toggle"
          onClick={() => open("legend")}
        >
          Legend
        </button>
      ) : null}
      <SaPartDialog />
    </div>
  );
}
