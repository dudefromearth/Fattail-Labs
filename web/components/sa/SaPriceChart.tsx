"use client";

import { useEffect, useRef, useState } from "react";
import {
  ColorType,
  LineStyle,
  createChart,
  type CandlestickData,
  type IChartApi,
  type IPriceLine,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { fetchGen, peek } from "@/lib/saDelivery";
import { honestBars } from "@/lib/saBars";
import { resolveTick, tickDecimals } from "@/lib/saTicks";
import { useSaCanvas } from "./SaCanvasContext";
import { openVpStream } from "@/lib/saStream";
import type { OhlcBar } from "@/lib/marketOhlcApi";
import { partFromPointer } from "@/lib/saLayerStore";
import { canvasOptions, candleOptions, colorBars, visibleHiLo } from "@/lib/saChartStyle";
import { targetForSource } from "@/lib/saSurface";
import {
  bandContains,
  displayRow,
  expandBand,
  hitProfile,
  rangeUrl,
  type VpBand,
  type VpBin,
} from "@/lib/saVpBand";
import {
  emptyPaint,
  PROFILE_BLUE,
  VpHistogramSeries,
} from "@/lib/saVpSeries";

function toSec(t: number): UTCTimestamp {
  if (t > 1e16) return Math.floor(t / 1e9) as UTCTimestamp;
  if (t > 1e12) return Math.floor(t / 1e3) as UTCTimestamp;
  return Math.floor(t) as UTCTimestamp;
}

/**
 * Phase A engine + Phase B L2 guest.
 * createChart non-defaults (A17 enumerate):
 *   layout.background / textColor — A13.6/A13.7 dark canvas
 *   width/height — A15 container fit
 * Series non-defaults:
 *   candle priceFormat.minMove — A16 served tick
 *   last-price line — A13.5
 *   L2 custom series lastValueVisible/priceLineVisible false — A12
 */

function toCandles(raw: OhlcBar[]): CandlestickData[] {
  const { bars } = honestBars(raw);
  const out: CandlestickData[] = [];
  let last = -Infinity;
  for (const b of bars) {
    const time = Math.floor(b.t / 1000) as UTCTimestamp;
    if (time <= last) continue;
    last = time;
    out.push({ time, open: b.o, high: b.h, low: b.l, close: b.c });
  }
  return out;
}

export default function SaPriceChart({
  source,
  target,
  spanFloor,
  spanCeiling,
  harness = "live",
}: {
  source: string;
  target?: string;
  spanFloor?: string | null;
  spanCeiling?: string | null;
  harness?: "live" | "fixture";
}) {
  const { prefs, setLiveFlag, open } = useSaCanvas();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const lineRef = useRef<IPriceLine | null>(null);
  const hiLineRef = useRef<IPriceLine | null>(null);
  const loLineRef = useRef<IPriceLine | null>(null);
  const candlesRef = useRef<CandlestickData[]>([]);
  const [tickMs, setTickMs] = useState<number | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const vpSeriesRef = useRef<ISeriesApi<"Custom"> | null>(null);
  const paintRef = useRef(emptyPaint());
  const timesRef = useRef<UTCTimestamp[]>([]);
  const bandRef = useRef<VpBand | null>(null);
  const inflightRef = useRef(false);
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState<number | null>(null);
  const [rangeMs, setRangeMs] = useState<number | null>(null);
  const [vpBins, setVpBins] = useState(0);

  const redrawVp = () => {
    const vp = vpSeriesRef.current;
    if (!vp || !timesRef.current.length) return;
    vp.setData(timesRef.current.map((time) => ({ time, color: PROFILE_BLUE })));
  };

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#131722" },
        textColor: "#d1d4dc",
      },
    });
    chartRef.current = chart;
    seriesRef.current = chart.addCandlestickSeries();
    const view = new VpHistogramSeries(paintRef.current);
    vpSeriesRef.current = chart.addCustomSeries(view);
    const ro = new ResizeObserver(() => {
      if (!hostRef.current || !chartRef.current) return;
      chartRef.current.resize(
        hostRef.current.clientWidth,
        hostRef.current.clientHeight,
      );
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      vpSeriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!source) return;
    const qs = new URLSearchParams({
      tf: prefs.priceTf,
      lookback_days: "0",
    });
    const url = `/api/dev/sa/v1/ohlc/${source}?${qs}`;
    const hit = peek(url);
    const apply = (raw: OhlcBar[]) => {
      const candles = colorBars(toCandles(raw), prefsRef.current);
      candlesRef.current = candles;
      timesRef.current = candles.map((c) => c.time as UTCTimestamp);
      seriesRef.current?.setData(candles);
      redrawVp();
      const t = resolveTick({
        prices: candles.flatMap((c) => [c.open, c.high, c.low, c.close]),
      });
      setTick(t);
      if (t && seriesRef.current) {
        seriesRef.current.applyOptions({
          priceFormat: {
            type: "price",
            minMove: t,
            precision: tickDecimals(t),
          },
        });
      }
    };
    if (hit && Array.isArray(hit.body.bars)) apply(hit.body.bars as OhlcBar[]);
    let cancel = false;
    void fetchGen(url).then((r) => {
      if (cancel) return;
      if (Array.isArray(r.body?.bars)) apply(r.body.bars as OhlcBar[]);
      else if (!hit) setErr("No OHLC");
    });
    return () => {
      cancel = true;
    };
  }, [source, prefs.priceTf]);

  useEffect(() => {
    const paint = paintRef.current;
    paint.orientation = prefs.orientation;
    paint.widthFrac = prefs.profileWidthFrac;
    paint.opacity = prefs.profileOpacity;
    paint.visible = prefs.visible.L2;
    redrawVp();
  }, [
    prefs.orientation,
    prefs.profileWidthFrac,
    prefs.profileOpacity,
    prefs.visible.L2,
  ]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions(canvasOptions(prefs));
    seriesRef.current?.applyOptions(candleOptions(prefs));
    if (hostRef.current) hostRef.current.style.background = prefs.canvasBg;
    if (candlesRef.current.length && seriesRef.current) {
      const stripped = candlesRef.current.map((c) => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      const painted = colorBars(stripped, prefs);
      candlesRef.current = painted;
      seriesRef.current.setData(painted);
    }
  }, [
    prefs.canvasBg,
    prefs.gridColor,
    prefs.gridOpacity,
    prefs.vertGridOn,
    prefs.horzGridOn,
    prefs.crosshairColor,
    prefs.crosshairStyle,
    prefs.axisFont,
    prefs.axisFontSize,
    prefs.axisTextColor,
    prefs.scaleLineColor,
    prefs.marginTop,
    prefs.marginBottom,
    prefs.rightOffsetBars,
    prefs.axis,
    prefs.candleBodyOn,
    prefs.candleBorderOn,
    prefs.candleWickOn,
    prefs.colorByPrevClose,
    prefs.candleUp,
    prefs.candleDown,
    prefs.borderUp,
    prefs.borderDown,
    prefs.wickUp,
    prefs.wickDown,
    prefs.lastPriceOn,
  ]);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    if (!prefs.lastPriceOn && lineRef.current) {
      series.removePriceLine(lineRef.current);
      lineRef.current = null;
    }
  }, [prefs.lastPriceOn, prefs.lastPriceColor]);

  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;
    const drop = (ref: { current: IPriceLine | null }) => {
      if (ref.current) {
        series.removePriceLine(ref.current);
        ref.current = null;
      }
    };
    if (!prefs.hiLoOn) {
      drop(hiLineRef);
      drop(loLineRef);
      return;
    }
    const vis = chart.timeScale().getVisibleRange();
    const from = vis && typeof vis.from === "number" ? vis.from : -Infinity;
    const to = vis && typeof vis.to === "number" ? vis.to : Infinity;
    const hl = visibleHiLo(candlesRef.current, from, to);
    if (!hl) return;
    const ensure = (
      ref: { current: IPriceLine | null },
      price: number,
      color: string,
      title: string,
    ) => {
      if (!ref.current) {
        ref.current = series.createPriceLine({
          price,
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title,
        });
      } else {
        ref.current.applyOptions({ price, color });
      }
    };
    ensure(hiLineRef, hl.hi, prefs.hiColor, "H");
    ensure(loLineRef, hl.lo, prefs.loColor, "L");
    const onRange = () => {
      const r = chart.timeScale().getVisibleRange();
      const a = r && typeof r.from === "number" ? r.from : -Infinity;
      const b = r && typeof r.to === "number" ? r.to : Infinity;
      const next = visibleHiLo(candlesRef.current, a, b);
      if (!next) return;
      hiLineRef.current?.applyOptions({ price: next.hi, color: prefsRef.current.hiColor });
      loLineRef.current?.applyOptions({ price: next.lo, color: prefsRef.current.loColor });
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(onRange);
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(onRange);
    };
  }, [prefs.hiLoOn, prefs.hiColor, prefs.loColor, tick]);

  useEffect(() => {
    if (!source || !prefs.visible.L2) return;
    bandRef.current = null;
    const tgt = target || targetForSource(source);
    const from = spanFloor;
    const to = spanCeiling || spanFloor;
    if (!from || !to) return;

    const readY = (): { lo: number; hi: number } | null => {
      const s = seriesRef.current;
      const el = hostRef.current;
      if (!s || !el || el.clientHeight < 8) return null;
      const hi = s.coordinateToPrice(0);
      const lo = s.coordinateToPrice(el.clientHeight);
      if (lo == null || hi == null) return null;
      return { lo: Math.min(lo, hi), hi: Math.max(lo, hi) };
    };

    const ensure = () => {
      const y = readY();
      if (!y || y.hi <= y.lo) return;
      paintRef.current.visibleLo = y.lo;
      paintRef.current.visibleHi = y.hi;
      const loaded = bandRef.current;
      if (loaded && bandContains(loaded, y.lo, y.hi)) {
        redrawVp();
        return;
      }
      if (inflightRef.current) return;
      const band = expandBand(y.lo, y.hi);
      const row = displayRow(
        y.hi - y.lo,
        hostRef.current?.clientHeight || 400,
        tick || loaded?.row || 0.25,
      );
      const url = rangeUrl({
        target: tgt,
        source,
        from,
        to,
        lo: band.lo,
        hi: band.hi,
        row,
        harness,
      });
      inflightRef.current = true;
      void fetchGen(url)
        .then((r) => {
          const bins = (r.body?.bins || []) as VpBin[];
          bandRef.current = {
            lo: band.lo,
            hi: band.hi,
            row,
            bins,
            floor: (r.body?.coverage as { floor_session?: string } | undefined)
              ?.floor_session || from,
            ceiling:
              (r.body?.coverage as { ceiling_session?: string } | undefined)
                ?.ceiling_session || to,
            truncated: Boolean(
              (r.body?.coverage as { truncated?: boolean } | undefined)
                ?.truncated,
            ),
            generation: r.body?.profile_generation_id
              ? String(r.body.profile_generation_id)
              : null,
            ms: r.ms,
          };
          paintRef.current.bins = bins;
          setVpBins(bins.length);
          setRangeMs(r.ms);
          redrawVp();
        })
        .finally(() => {
          inflightRef.current = false;
        });
    };

    ensure();
    const id = window.setInterval(ensure, 250);
    const ts = chartRef.current?.timeScale();
    const onRange = () => ensure();
    ts?.subscribeVisibleTimeRangeChange(onRange);
    return () => {
      window.clearInterval(id);
      ts?.unsubscribeVisibleTimeRangeChange(onRange);
    };
  }, [source, target, spanFloor, spanCeiling, tick, prefs.visible.L2, harness]);

  useEffect(() => {
    if (!source) return;
    const qs = new URLSearchParams({
      source,
      timeframe: prefs.priceTf,
      harness: "live",
    });
    let lastBeat = Date.now();
    const staleTimer = window.setInterval(() => {
      if (Date.now() - lastBeat > 2500) setLiveFlag("STALE");
    }, 500);
    const onBeat = () => {
      lastBeat = Date.now();
      setLiveFlag("LIVE");
    };
    const stop = openVpStream(`/api/dev/sa/v1/stream?${qs}`, {
      onHello: () => onBeat(),
      onHeartbeat: () => onBeat(),
      onTick: (body) => {
        const t0 = performance.now();
        onBeat();
        if (body.p == null || !seriesRef.current) return;
        const p = prefsRef.current;
        if (!p.lastPriceOn) {
          if (lineRef.current) {
            seriesRef.current.removePriceLine(lineRef.current);
            lineRef.current = null;
          }
          return;
        }
        if (!lineRef.current) {
          lineRef.current = seriesRef.current.createPriceLine({
            price: body.p,
            color: p.lastPriceColor,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "",
          });
        } else {
          lineRef.current.applyOptions({
            price: body.p,
            color: p.lastPriceColor,
          });
        }
        setTickMs(Math.round(performance.now() - t0));
      },
      onBar: (b) => {
        onBeat();
        seriesRef.current?.update({
          time: toSec(b.t),
          open: b.o,
          high: b.h,
          low: b.l,
          close: b.c,
        });
      },
      onGen: () => {
        onBeat();
        const url = `/api/dev/sa/v1/ohlc/${source}?tf=${prefs.priceTf}&lookback_days=0`;
        void fetchGen(url).then((r) => {
          if (Array.isArray(r.body?.bars) && seriesRef.current) {
            const candles = colorBars(
              toCandles(r.body.bars as OhlcBar[]),
              prefsRef.current,
            );
            candlesRef.current = candles;
            timesRef.current = candles.map((c) => c.time as UTCTimestamp);
            seriesRef.current.setData(candles);
            redrawVp();
          }
        });
      },
      onError: () => setLiveFlag("STALE"),
    });
    return () => {
      window.clearInterval(staleTimer);
      stop();
      setLiveFlag("OFF");
      lineRef.current = null;
    };
  }, [source, prefs.priceTf, setLiveFlag]);

  return (
    <div
      ref={hostRef}
      className="min-h-0 flex-1"
      data-testid="sa-price-chart"
      data-phase="B"
      data-source={source}
      data-tick={tick ?? ""}
      data-tick-ms={tickMs ?? ""}
      data-l2={prefs.visible.L2 ? "1" : "0"}
      data-vp-bins={vpBins}
      data-range-ms={rangeMs ?? ""}
      data-anchor={prefs.orientation === "rtl" ? "right" : "left"}
      onContextMenu={(e) => {
        e.preventDefault();
        const r = hostRef.current?.getBoundingClientRect();
        if (!r) return;
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        open(
          partFromPointer({
            x,
            y,
            w: r.width,
            h: r.height,
            axis: prefs.axis,
            profileHit: hitProfile(paintRef.current.hitRects, x, y),
          }),
        );
      }}
      style={{ background: prefs.canvasBg }}
    >
      {err ? (
        <p className="p-3 text-sm text-zinc-400" data-testid="sa-price-chart-empty">
          {err}
        </p>
      ) : null}
    </div>
  );
}
