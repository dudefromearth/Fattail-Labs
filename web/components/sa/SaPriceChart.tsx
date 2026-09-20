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
import { fetchGen, fetchGenWait, ohlcSpanDays, peek, type FetchGenResult } from "@/lib/saDelivery";
import { honestBars } from "@/lib/saBars";
import { resolveTick, tickDecimals } from "@/lib/saTicks";
import { useSaCanvas } from "./SaCanvasContext";
import { openVpStream } from "@/lib/saStream";
import type { OhlcBar } from "@/lib/marketOhlcApi";
import { partFromPointer } from "@/lib/saLayerStore";
import { liveFromPrintAge } from "@/lib/saLive";
import { defaultTimeWindow, tfMs } from "@/lib/saView";
import {
  canvasOptions,
  candleOptions,
  colorBars,
  visibleHiLo,
} from "@/lib/saChartStyle";
import { targetForSource } from "@/lib/saSurface";
import {
  bandContains,
  beginBandFetch,
  displayRow,
  endBandFetch,
  expandBand,
  hostToPane,
  panePriceWindow,
  rangeUrl,
  windowUrl,
  vpBandEpoch,
  type BandFlight,
  type VpBand,
  type VpBin,
} from "@/lib/saVpBand";
import {
  asVpBins,
  clearPaint,
  emptyPaint,
  VpHistogramPrimitive,
} from "@/lib/saVpSeries";

function toSec(t: number): UTCTimestamp {
  if (t > 1e16) return Math.floor(t / 1e9) as UTCTimestamp;
  if (t > 1e12) return Math.floor(t / 1e3) as UTCTimestamp;
  return Math.floor(t) as UTCTimestamp;
}

/**
 * Phase A engine + Phase B L2 guest primitive on the candle series.
 * createChart non-defaults (A17 enumerate):
 *   layout.background / textColor — A13.6/A13.7 dark canvas
 *   width/height — A15 container fit
 * Series non-defaults:
 *   candle priceFormat.minMove — A16 served tick
 *   last-price line — A13.5
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
  apiBase = "/api/app/vp/v1",
  contract,
}: {
  source: string;
  target?: string;
  spanFloor?: string | null;
  spanCeiling?: string | null;
  harness?: "live" | "fixture";
  apiBase?: string;
  contract?: string | null;
}) {
  const { prefs, setLiveFlag, open } = useSaCanvas();
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const lineRef = useRef<IPriceLine | null>(null);
  const hiLineRef = useRef<IPriceLine | null>(null);
  const loLineRef = useRef<IPriceLine | null>(null);
  const candlesRef = useRef<CandlestickData[]>([]);
  const developingRef = useRef<CandlestickData | null>(null);
  const [tickMs, setTickMs] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const primitiveRef = useRef<VpHistogramPrimitive | null>(null);
  const paintRef = useRef(emptyPaint());
  const timesRef = useRef<UTCTimestamp[]>([]);
  const bandRef = useRef<VpBand | null>(null);
  const flightRef = useRef<BandFlight>({ inflight: false, pending: false });
  const bandEpochRef = useRef("");
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState<number | null>(null);
  const [rangeMs, setRangeMs] = useState<number | null>(null);
  const [vpBins, setVpBins] = useState(0);
  const [histDays, setHistDays] = useState<number | null>(null);
  const [histBars, setHistBars] = useState<number | null>(null);
  const [histWarn, setHistWarn] = useState<string | null>(null);
  const [histComplete, setHistComplete] = useState(false);
  const [binSource, setBinSource] = useState<string | null>(null);
  const rawBarsRef = useRef<OhlcBar[]>([]);
  const atBirthRef = useRef(false);
  const pagingRef = useRef(false);

  const requestVpUpdate = () => {
    primitiveRef.current?.requestUpdate();
  };

  const clearHistogram = () => {
    bandRef.current = null;
    if (primitiveRef.current) primitiveRef.current.clearBins();
    else clearPaint(paintRef.current);
    setVpBins(0);
    requestVpUpdate();
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
    const series = chart.addCandlestickSeries({
      priceScaleId: "left",
    });
    seriesRef.current = series;
    if (candlesRef.current.length) {
      series.setData(candlesRef.current);
    }
    const primitive = new VpHistogramPrimitive(paintRef.current);
    series.attachPrimitive(primitive);
    primitiveRef.current = primitive;
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
      const attached = primitiveRef.current;
      if (attached) series.detachPrimitive(attached);
      primitiveRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!source) return;
    clearHistogram();
    atBirthRef.current = false;
    pagingRef.current = false;
    rawBarsRef.current = [];
    setHistComplete(false);
    const qs = new URLSearchParams({
      tf: prefs.priceTf,
    });
    if (contract) qs.set("contract", contract);
    const url = `${apiBase}/ohlc/${source}?${qs}`;
    const hit = peek(url);
    const cachedBars = Array.isArray(hit?.body?.bars)
      ? (hit.body.bars as OhlcBar[])
      : [];
    const cacheComplete =
      Boolean(hit?.body?.at_contract_birth) ||
      Number(hit?.body?.bars_served) >= Number(hit?.body?.bars_rule);
    const apply = (raw: OhlcBar[], resetView: boolean) => {
      const candles = colorBars(toCandles(raw), prefsRef.current);
      candlesRef.current = candles;
      timesRef.current = candles.map((c) => c.time as UTCTimestamp);
      seriesRef.current?.setData(candles);
      const times = timesRef.current as number[];
      if (resetView && times.length && chartRef.current) {
        const dataLo = times[0] * 1000;
        const dataHi = times[times.length - 1] * 1000;
        const w = defaultTimeWindow(dataLo, dataHi, tfMs(prefsRef.current.priceTf), 1);
        try {
          chartRef.current.timeScale().setVisibleRange({
            from: Math.floor(w.lo / 1000) as UTCTimestamp,
            to: Math.floor(w.hi / 1000) as UTCTimestamp,
          });
        } catch {
          /* engine may reject empty */
        }
      }
      requestVpUpdate();
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
    if (cachedBars.length && cacheComplete) apply(cachedBars, true);
    let cancel = false;
    const ingest = (r: FetchGenResult, resetView: boolean) => {
      const named = String(r.body?.named_state || "");
      if (named && named !== "SHORT HISTORY" && !(Array.isArray(r.body?.bars) && r.body.bars.length)) {
        setErr(named === "MASSIVE EMPTY" ? "History unavailable" : named);
        return;
      }
      const incoming = Array.isArray(r.body?.bars) ? (r.body.bars as OhlcBar[]) : [];
      if (incoming.length) {
        rawBarsRef.current = incoming;
        apply(incoming, resetView);
      } else if (!cachedBars.length) setErr("No OHLC");
      atBirthRef.current = Boolean(r.body?.at_contract_birth);
      setHistComplete(Boolean(r.body?.at_contract_birth));
      const served = Number(r.body?.bars_served);
      const rule = Number(r.body?.bars_rule);
      if (Number.isFinite(served)) setHistBars(served);
      if (r.body?.named_state === "MASSIVE EMPTY") {
        setHistWarn("History unavailable. Price is not on this chart right now.");
      } else if (r.body?.short_history === true) {
        setHistWarn(
          `SHORT HISTORY: ${served || 0} bars (need ${rule || 5000}). Not silent.`,
        );
      } else {
        setHistWarn(null);
      }
    };
    void fetchGenWait(url).then((r) => {
      if (cancel) return;
      ingest(r, true);
    });
    return () => {
      cancel = true;
    };
  }, [source, prefs.priceTf, apiBase, contract]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !source) return;
    const onRange = () => {
      if (pagingRef.current || atBirthRef.current) return;
      const vis = chart.timeScale().getVisibleRange();
      const first = timesRef.current[0];
      if (!vis || first == null) return;
      if (Number(vis.from) > Number(first) + 120) return;
      const head = rawBarsRef.current[0];
      if (!head?.t) return;
      pagingRef.current = true;
      const qs = new URLSearchParams({ tf: prefsRef.current.priceTf });
      if (contract) qs.set("contract", contract);
      qs.set("before_t", String(head.t));
      void fetchGenWait(`${apiBase}/ohlc/${source}?${qs}`)
        .then((r) => {
          const older = Array.isArray(r.body?.bars)
            ? (r.body.bars as OhlcBar[])
            : [];
          atBirthRef.current = Boolean(r.body?.at_contract_birth);
          setHistComplete(Boolean(r.body?.at_contract_birth));
          if (!older.length) return;
          const seen = new Set(rawBarsRef.current.map((b) => b.t));
          const prepend = older.filter((b) => !seen.has(b.t));
          if (!prepend.length) {
            atBirthRef.current = true;
            setHistComplete(true);
            return;
          }
          const combined = [...prepend, ...rawBarsRef.current].slice(-40000);
          rawBarsRef.current = combined;
          const candles = colorBars(toCandles(combined), prefsRef.current);
          candlesRef.current = candles;
          timesRef.current = candles.map((c) => c.time as UTCTimestamp);
          seriesRef.current?.setData(candles);
          setHistBars(combined.length);
          if (r.body?.short_history === true) {
            setHistWarn(
              `SHORT HISTORY: ${combined.length} bars (need ${Number(r.body?.bars_rule) || 5000}). Not silent.`,
            );
          }
        })
        .finally(() => {
          pagingRef.current = false;
        });
    };
    chart.timeScale().subscribeVisibleTimeRangeChange(onRange);
    return () => {
      chart.timeScale().unsubscribeVisibleTimeRangeChange(onRange);
    };
  }, [source, prefs.priceTf, apiBase, contract]);

  useEffect(() => {
    const paint = paintRef.current;
    paint.orientation = prefs.orientation;
    paint.widthFrac = prefs.profileWidthFrac || 0.62;
    paint.opacity = prefs.profileOpacity || 0.42;
    paint.visible = prefs.visible.L2 !== false;
    requestVpUpdate();
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
    paintRef.current.visible = prefs.visible.L2 !== false;
    requestVpUpdate();
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
    prefs.visible.L2,
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
    if (!source) return;
    let cancelled = false;
    flightRef.current = { inflight: false, pending: false };
    paintRef.current.visible = prefs.visible.L2 !== false;
    const tgt = target || targetForSource(source);
    const from = spanFloor;
    const to = spanCeiling || spanFloor;
    const epoch = vpBandEpoch({
      source,
      target: tgt,
      from,
      to,
      priceTf: prefs.priceTf,
      harness,
      apiBase,
    });
    if (bandEpochRef.current !== epoch) {
      bandEpochRef.current = epoch;
      clearHistogram();
    }
    const vr = prefs.profileMode !== "full-history";
    if (!vr && (!from || !to)) {
      return () => {
        cancelled = true;
      };
    }

    const readY = (): { lo: number; hi: number } | null => {
      const s = seriesRef.current;
      const chart = chartRef.current;
      if (s && chart) {
        const paneH = chart.paneSize().height;
        const y = panePriceWindow((coord) => s.coordinateToPrice(coord), paneH);
        if (y) return y;
      }
      const bars = candlesRef.current;
      if (!bars.length) return null;
      let lo = Infinity;
      let hi = -Infinity;
      for (const b of bars) {
        if (b.low < lo) lo = b.low;
        if (b.high > hi) hi = b.high;
      }
      if (!(hi > lo)) return null;
      return { lo, hi };
    };

    const paneHeightPx = () => {
      const paneH = chartRef.current?.paneSize().height;
      return paneH && paneH >= 8 ? paneH : 400;
    };

    const ensure = () => {
      if (cancelled) return;
      const y = readY();
      if (y && y.hi > y.lo) {
        paintRef.current.visibleLo = y.lo;
        paintRef.current.visibleHi = y.hi;
      }
      const loaded = bandRef.current;
      if (y && loaded && loaded.bins.length && bandContains(loaded, y.lo, y.hi)) {
        return;
      }
      if (beginBandFetch(flightRef.current) === "wait") return;
      const band = y ? expandBand(y.lo, y.hi) : null;
      const row = y
        ? displayRow(
            y.hi - y.lo,
            paneHeightPx(),
            tick || loaded?.row || 0.25,
          )
        : undefined;
      const vis = chartRef.current?.timeScale().getVisibleRange();
      const fromT =
        vis && typeof vis.from === "number" ? Number(vis.from) * 1000 : 0;
      const toT =
        vis && typeof vis.to === "number" ? Number(vis.to) * 1000 : 0;
      const url = vr && fromT && toT
        ? windowUrl({
            target: tgt,
            source,
            fromT,
            toT,
            row,
            apiBase,
          })
        : rangeUrl({
            target: tgt,
            source,
            from,
            to,
            lo: band?.lo,
            hi: band?.hi,
            row,
            harness,
            apiBase,
          });
      const applyBins = (r: FetchGenResult, bins: VpBin[]) => {
        if (cancelled) return;
        const prices = bins.map((b) => b.price);
        bandRef.current = {
          lo: band?.lo ?? (prices.length ? Math.min(...prices) : 0),
          hi: band?.hi ?? (prices.length ? Math.max(...prices) : 0),
          row: row ?? 0.25,
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
        const srcLabel = String(r.body?.bin_source || "");
        setBinSource(srcLabel || null);
        requestVpUpdate();
      };
      void fetchGen(url)
        .then((r) => {
          if (cancelled) return;
          const bins = asVpBins(r.body?.bins);
          if (bins.length || !band) {
            applyBins(r, bins);
            return;
          }
          return fetchGen(
            rangeUrl({
              target: tgt,
              source,
              from,
              to,
              harness,
              apiBase,
            }),
          ).then((r2) => applyBins(r2, asVpBins(r2.body?.bins)));
        })
        .finally(() => {
          if (cancelled) return;
          if (endBandFetch(flightRef.current) === "again") ensure();
        });
    };

    ensure();
    const ts = chartRef.current?.timeScale();
    const onRange = () => ensure();
    ts?.subscribeVisibleTimeRangeChange(onRange);
    return () => {
      cancelled = true;
      ts?.unsubscribeVisibleTimeRangeChange(onRange);
    };
  }, [source, target, spanFloor, spanCeiling, tick, prefs.priceTf, prefs.visible.L2, prefs.profileMode, harness, apiBase]);

  useEffect(() => {
    if (!source) return;
    const qs = new URLSearchParams({
      source,
      timeframe: prefs.priceTf,
      harness: "live",
    });
    let lastBeat = Date.now();
    const staleTimer = window.setInterval(() => {
      if (Date.now() - lastBeat > 5000) setLiveFlag("STALE");
    }, 500);
    const markLive = () => {
      lastBeat = Date.now();
    };
    const stop = openVpStream(`${apiBase}/stream?${qs}`, {
      onHello: () => markLive(),
      onHeartbeat: (d) => {
        markLive();
        const age = (d as { last_print_age_ms?: unknown }).last_print_age_ms;
        if (typeof age === "number") setLiveFlag(liveFromPrintAge(age));
      },
      onTick: (body) => {
        const t0 = performance.now();
        markLive();
        setLiveFlag("LIVE");
        if (body.p == null || !seriesRef.current) return;
        const p = prefsRef.current;
        const px = body.p;
        const tSec = toSec(body.t ?? Date.now());
        const step = Math.round(tfMs(p.priceTf) / 1000);
        const openT = (Math.floor(Number(tSec) / step) * step) as UTCTimestamp;
        const cur = developingRef.current;
        const next: CandlestickData =
          !cur || cur.time !== openT
            ? { time: openT, open: px, high: px, low: px, close: px }
            : {
                time: openT,
                open: cur.open,
                high: Math.max(cur.high, px),
                low: Math.min(cur.low, px),
                close: px,
              };
        developingRef.current = next;
        seriesRef.current.update(next);
        if (!p.lastPriceOn) {
          if (lineRef.current) {
            seriesRef.current.removePriceLine(lineRef.current);
            lineRef.current = null;
          }
        } else if (!lineRef.current) {
          lineRef.current = seriesRef.current.createPriceLine({
            price: px,
            color: p.lastPriceColor,
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: "",
          });
        } else {
          lineRef.current.applyOptions({
            price: px,
            color: p.lastPriceColor,
          });
        }
        setTickMs(Math.round(performance.now() - t0));
      },
      onBar: (b) => {
        markLive();
        setLiveFlag("LIVE");
        const candle: CandlestickData = {
          time: toSec(b.t),
          open: b.o,
          high: b.h,
          low: b.l,
          close: b.c,
        };
        developingRef.current = candle;
        seriesRef.current?.update(candle);
      },
      onGen: () => {
        markLive();
        const url = `${apiBase}/ohlc/${source}?tf=${prefs.priceTf}&lookback_days=0`;
        void fetchGenWait(url).then((r) => {
          if (Array.isArray(r.body?.bars) && seriesRef.current) {
            const candles = colorBars(
              toCandles(r.body.bars as OhlcBar[]),
              prefsRef.current,
            );
            candlesRef.current = candles;
            timesRef.current = candles.map((c) => c.time as UTCTimestamp);
            seriesRef.current.setData(candles);
            requestVpUpdate();
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
  }, [source, prefs.priceTf, setLiveFlag, apiBase]);

  return (
    <div
      ref={wrapRef}
      className="relative min-h-0 flex-1"
      data-testid="sa-price-chart"
      data-phase="B"
      data-vp-paint="primitive"
      data-source={source}
      data-tick={tick ?? ""}
      data-tick-ms={tickMs ?? ""}
      data-l2={prefs.visible.L2 ? "1" : "0"}
      data-vp-bins={vpBins}
      data-history-days={histDays ?? ""}
      data-bar-count={candlesRef.current.length}
      data-range-ms={rangeMs ?? ""}
      data-anchor={prefs.orientation === "rtl" ? "right" : "left"}
      onContextMenu={(e) => {
        e.preventDefault();
        const host = hostRef.current;
        const chart = chartRef.current;
        const r = host?.getBoundingClientRect();
        if (!host || !chart || !r) return;
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const pt = hostToPane(
          x,
          y,
          { width: r.width, height: r.height },
          chart.paneSize(),
          prefs.axis,
        );
        const profileHit = pt
          ? primitiveRef.current?.hitTest(pt.x, pt.y) != null
          : false;
        open(
          partFromPointer({
            x,
            y,
            w: r.width,
            h: r.height,
            axis: prefs.axis,
            profileHit,
          }),
        );
      }}
      style={{ background: prefs.canvasBg }}
    >
      <div ref={hostRef} className="h-full min-h-0 w-full" />
      <p
        className="pointer-events-none absolute left-2 top-8 z-20 max-w-[28rem] rounded border border-zinc-600 bg-[#1e222d] px-2 py-1 text-[11px] text-zinc-300"
        data-testid="sa-profile-mode"
      >
        {prefs.profileMode === "full-history" ? "Full History" : "Visible Range"}
        {binSource ? ` · ${binSource}` : ""}
      </p>
      {histWarn ? (
        <p
          className="pointer-events-none absolute left-2 top-2 z-20 max-w-[28rem] rounded border border-amber-700 bg-[#1e222d] px-2 py-1 text-[11px] text-amber-300"
          data-testid="sa-short-history"
        >
          {histWarn}
        </p>
      ) : histComplete ? (
        <p className="pointer-events-none absolute left-2 top-2 z-20 max-w-[28rem] rounded border border-zinc-600 bg-[#1e222d] px-2 py-1 text-[11px] text-zinc-300">
          Max available
        </p>
      ) : histBars != null ? (
        <p className="pointer-events-none absolute left-2 top-2 z-20 max-w-[28rem] rounded border border-zinc-600 bg-[#1e222d] px-2 py-1 text-[11px] text-zinc-300">
          {`${histBars} bars`}
        </p>
      ) : histDays != null ? (
        <p className="pointer-events-none absolute left-2 top-2 z-20 max-w-[28rem] rounded border border-zinc-600 bg-[#1e222d] px-2 py-1 text-[11px] text-zinc-300">
          {`Price ${histDays.toFixed(0)}d`}
        </p>
      ) : null}
      {err ? (
        <p className="relative z-10 p-3 text-sm text-zinc-400" data-testid="sa-price-chart-empty">
          {err}
        </p>
      ) : null}
    </div>
  );
}
