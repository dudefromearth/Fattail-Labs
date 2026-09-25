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
import {
  fetchGenWait,
  fetchWindowExclusive,
  peek,
  type FetchGenResult,
} from "@/lib/saDelivery";
import { honestBars } from "@/lib/saBars";
import { resolveTick, tickDecimals } from "@/lib/saTicks";
import { fetchSpec } from "@/lib/symbology/api";
import { useSaCanvas } from "./SaCanvasContext";
import { openVpStream } from "@/lib/saStream";
import type { OhlcBar } from "@/lib/marketOhlcApi";
import { partFromPointer } from "@/lib/saLayerStore";
import { liveFromPrintAge } from "@/lib/saLive";
import { defaultTimeWindow, nativeOhlcTf, resampleOhlc, tfMs } from "@/lib/saView";
import {
  canvasOptions,
  candleOptions,
  colorBars,
  visibleHiLo,
} from "@/lib/saChartStyle";
import { targetForSource } from "@/lib/saSurface";
import {
  FORCE_VP_EVENT,
  RANGE_DEBOUNCE_MS,
  asUnixMs,
  beginBandFetch,
  candlesInMsRange,
  profileRowGrain,
  visibleCandleWindow,
  type VpShapeClass,
  endBandFetch,
  expandBand,
  hostToPane,
  panePriceWindow,
  profileFetchPlan,
  scheduleDebounced,
  vpBandEpoch,
  type BandFlight,
  type VisibleCandleWindow,
  type VpBand,
  type VpBin,
} from "@/lib/saVpBand";
import {
  asVpBins,
  clearPaint,
  emptyPaint,
  VpHistogramPrimitive,
} from "@/lib/saVpSeries";
import {
  emptySessionPaint,
  SessionLinesPrimitive,
} from "@/lib/saSessionLines";
import {
  sessionBoundaryUnix,
  sessionHoursForSource,
} from "@/lib/saSession";

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
  const sessionRef = useRef<SessionLinesPrimitive | null>(null);
  const paintRef = useRef(emptyPaint());
  const timesRef = useRef<UTCTimestamp[]>([]);
  const bandRef = useRef<VpBand | null>(null);
  const flightRef = useRef<BandFlight>({ inflight: false, pending: false });
  const bandEpochRef = useRef("");
  const [err, setErr] = useState<string | null>(null);
  const [tick, setTick] = useState<number | null>(null);
  const [specTick, setSpecTick] = useState<number | null>(null);
  const [specPrecision, setSpecPrecision] = useState<number | null>(null);
  const [rangeMs, setRangeMs] = useState<number | null>(null);
  const [vpBins, setVpBins] = useState(0);
  const [histDays, setHistDays] = useState<number | null>(null);
  const [histBars, setHistBars] = useState<number | null>(null);
  const [histWarn, setHistWarn] = useState<string | null>(null);
  const [histComplete, setHistComplete] = useState(false);
  const [binSource, setBinSource] = useState<string | null>(null);
  const [visibleBars, setVisibleBars] = useState(0);
  const rawBarsRef = useRef<OhlcBar[]>([]);
  const atBirthRef = useRef(false);
  const pagingRef = useRef(false);
  const intendedWindowRef = useRef<{ lo: number; hi: number } | null>(null);
  const kickHoldRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const kickVpRef = useRef<
    (mode?: "now" | "debounce", cls?: VpShapeClass) => void
  >(() => {});

  const syncPrimitiveTime = () => {
    primitiveRef.current?.setTimeBase(
      () => timesRef.current as number[],
      tfMs(prefsRef.current.priceTf),
    );
  };

  const clearHistogram = () => {
    bandRef.current = null;
    if (primitiveRef.current) primitiveRef.current.clearBins();
    else clearPaint(paintRef.current);
    setVpBins(0);
    setVisibleBars(0);
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
      // A brand-new chart/series has no explicit range yet, so it defaults
      // to fitting ALL loaded candles instead of a Visible Range window —
      // and candlesRef.current can already be populated here even on a
      // true first mount (persisted OHLC cache), before apply() ever runs.
      // Restore a previously-computed window if we have one (remount);
      // otherwise compute a fresh narrow default right here, same as
      // apply()'s reset branch — never leave a populated series with no
      // explicit range.
      const times = candlesRef.current.map((c) => c.time as UTCTimestamp);
      const restore =
        intendedWindowRef.current ??
        (times.length
          ? defaultTimeWindow(
              times[0] * 1000,
              times[times.length - 1] * 1000,
              tfMs(prefsRef.current.priceTf),
              prefsRef.current.priceLookbackDays,
            )
          : null);
      if (restore) {
        try {
          chart.timeScale().setVisibleRange({
            from: Math.floor(restore.lo / 1000) as UTCTimestamp,
            to: Math.floor(restore.hi / 1000) as UTCTimestamp,
          });
          intendedWindowRef.current = restore;
        } catch {
          /* engine may reject empty */
        }
      }
    }
    const primitive = new VpHistogramPrimitive(paintRef.current);
    series.attachPrimitive(primitive);
    primitiveRef.current = primitive;
    const session = new SessionLinesPrimitive(emptySessionPaint());
    series.attachPrimitive(session);
    sessionRef.current = session;
    const ro = new ResizeObserver(() => {
      if (!hostRef.current || !chartRef.current) return;
      chartRef.current.resize(
        hostRef.current.clientWidth,
        hostRef.current.clientHeight,
      );
      kickVpRef.current("now", "diff");
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      const attached = primitiveRef.current;
      if (attached) series.detachPrimitive(attached);
      primitiveRef.current = null;
      const sess = sessionRef.current;
      if (sess) series.detachPrimitive(sess);
      sessionRef.current = null;
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const root = source.toUpperCase();
    if (root !== "ES" && root !== "MES") {
      setSpecTick(null);
      setSpecPrecision(null);
      return;
    }
    let cancel = false;
    void fetchSpec(root)
      .then((s) => {
        if (cancel) return;
        setSpecTick(s.tick_size);
        setSpecPrecision(s.display_shape?.precision ?? 2);
      })
      .catch(() => {
        if (cancel) return;
        setSpecTick(null);
        setSpecPrecision(null);
      });
    return () => {
      cancel = true;
    };
  }, [source]);

  useEffect(() => {
    if (!specTick || !seriesRef.current) return;
    seriesRef.current.applyOptions({
      priceFormat: {
        type: "price",
        minMove: specTick,
        precision: specPrecision ?? tickDecimals(specTick),
      },
    });
    setTick(specTick);
  }, [specTick, specPrecision]);

  useEffect(() => {
    if (!source) return;
    clearHistogram();
    atBirthRef.current = false;
    pagingRef.current = false;
    rawBarsRef.current = [];
    setHistComplete(false);
    const qs = new URLSearchParams({
      tf: nativeOhlcTf(prefs.priceTf),
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
        const w = defaultTimeWindow(
          dataLo,
          dataHi,
          tfMs(prefsRef.current.priceTf),
          prefsRef.current.priceLookbackDays,
        );
        try {
          chartRef.current.timeScale().setVisibleRange({
            from: Math.floor(w.lo / 1000) as UTCTimestamp,
            to: Math.floor(w.hi / 1000) as UTCTimestamp,
          });
        } catch {
          /* engine may reject empty */
        }
        intendedWindowRef.current = { lo: w.lo, hi: w.hi };
        syncPrimitiveTime();
        primitiveRef.current?.refresh();
        requestAnimationFrame(() => {
          kickVpRef.current("now", "rebuild");
          syncSession();
        });
      } else {
        syncPrimitiveTime();
        kickVpRef.current("now", "rebuild");
      }
      const derived = resolveTick({
        prices: candles.flatMap((c) => [c.open, c.high, c.low, c.close]),
      });
      const t = specTick ?? derived;
      setTick(t);
      if (t && seriesRef.current) {
        seriesRef.current.applyOptions({
          priceFormat: {
            type: "price",
            minMove: t,
            precision: specPrecision ?? tickDecimals(t),
          },
        });
      }
    };
    if (cachedBars.length && cacheComplete) {
      apply(resampleOhlc(cachedBars, tfMs(prefs.priceTf)), true);
    }
    let cancel = false;
    const ingest = (r: FetchGenResult, resetView: boolean) => {
      const named = String(r.body?.named_state || "");
      if (named && named !== "SHORT HISTORY" && !(Array.isArray(r.body?.bars) && r.body.bars.length)) {
        setErr(named === "MASSIVE EMPTY" ? "History unavailable" : named);
        return;
      }
      const native = Array.isArray(r.body?.bars) ? (r.body.bars as OhlcBar[]) : [];
      // Server serves native tf only (1m|5m|15m|1h|1d) — grouped display
      // intervals (10m, 2h, ...) resample client-side from that native fetch.
      const incoming = resampleOhlc(native, tfMs(prefsRef.current.priceTf));
      if (incoming.length) {
        rawBarsRef.current = incoming;
        apply(incoming, resetView);
      } else if (!cachedBars.length) {
        setErr(r.status && r.status !== 200 ? `No OHLC (HTTP ${r.status})` : "No OHLC");
      }
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
      const qs = new URLSearchParams({ tf: nativeOhlcTf(prefsRef.current.priceTf) });
      if (contract) qs.set("contract", contract);
      qs.set("before_t", String(head.t));
      void fetchGenWait(`${apiBase}/ohlc/${source}?${qs}`)
        .then((r) => {
          const olderNative = Array.isArray(r.body?.bars)
            ? (r.body.bars as OhlcBar[])
            : [];
          const older = resampleOhlc(olderNative, tfMs(prefsRef.current.priceTf));
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
          // setData() re-fits the visible range to the whole series unless we
          // restore it (same failure mode fixed in the onGen handler below).
          // Here bar INDICES shift because we just prepended older bars, so
          // restore by TIME (stable across a prepend), not by logical range —
          // otherwise every backfill snaps the chart to "uncompressed" and,
          // since the new fit-all edge sits right at the trigger distance
          // again, re-fires this same handler in a loop.
          const preRange = chart.timeScale().getVisibleRange();
          seriesRef.current?.setData(candles);
          if (preRange) {
            try {
              chart.timeScale().setVisibleRange(preRange);
            } catch {
              /* engine may reject a range outside the newly loaded data */
            }
          }
          setHistBars(combined.length);
          syncPrimitiveTime();
          kickVpRef.current("now", "rebuild");
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
    paint.color = prefs.profileColor || "#2962ff";
    paint.visible = prefs.visible.L2 !== false;
    primitiveRef.current?.refresh();
  }, [
    prefs.orientation,
    prefs.profileWidthFrac,
    prefs.profileOpacity,
    prefs.profileColor,
    prefs.visible.L2,
  ]);

  const syncSession = () => {
    const sess = sessionRef.current;
    const chart = chartRef.current;
    if (!sess || !chart) return;
    const p = sess.paint;
    p.visible = prefsRef.current.sessionLinesOn !== false;
    p.color = prefsRef.current.sessionLineColor || "#787b86";
    p.opacity = prefsRef.current.sessionLineOpacity ?? 0.45;
    p.width = prefsRef.current.sessionLineWidth || "thin";
    p.style = prefsRef.current.sessionLineStyle || "dashed";
    const vis = chart.timeScale().getVisibleRange();
    if (vis && typeof vis.from === "number" && typeof vis.to === "number") {
      const hours = sessionHoursForSource(source);
      p.times = sessionBoundaryUnix({
        fromSec: Number(vis.from),
        toSec: Number(vis.to),
        openHm: hours.openHm,
        closeHm: hours.closeHm,
      });
    }
    sess.refresh();
  };

  useEffect(() => {
    syncSession();
  }, [
    source,
    prefs.sessionLinesOn,
    prefs.sessionLineColor,
    prefs.sessionLineOpacity,
    prefs.sessionLineWidth,
    prefs.sessionLineStyle,
    prefs.chartTimeZone,
  ]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions(canvasOptions(prefs));
    seriesRef.current?.applyOptions(candleOptions(prefs));
    paintRef.current.visible = prefs.visible.L2 !== false;
    primitiveRef.current?.refresh();
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

    const barMs = tfMs(prefs.priceTf);
    let lastSent = "";
    // Paint ordering guard. Real server bins must never be regressed back
    // to the cruder candle-occupancy mock for the same window, and a slow
    // stale response must never clobber a newer one that already landed —
    // repeated/duplicate run() calls for one window (pan, resize, refetch
    // retries) were racing their synchronous mock-paint against each
    // other's async real data with no ordering check at all.
    let paintSeq = 0;
    let paintedSeq = 0;
    let paintedWasReal = false;

    const computeWindow = (): VisibleCandleWindow | null => {
      syncPrimitiveTime();
      const times = timesRef.current as number[];
      if (!times.length) return null;
      const chart = chartRef.current;
      const series = seriesRef.current;
      const ts = chart?.timeScale();
      const logical = ts?.getVisibleLogicalRange() ?? null;
      if (series && logical) {
        const info = series.barsInLogicalRange(logical);
        if (info && info.from != null && info.to != null) {
          const fromT = asUnixMs(Number(info.from));
          const toT = asUnixMs(Number(info.to)) + barMs;
          const w = candlesInMsRange(times, fromT, toT, barMs);
          if (w) return w;
        }
      }
      const fromPrim = primitiveRef.current?.visibleWindow();
      if (fromPrim && fromPrim.count > 0) return fromPrim;
      if (logical) {
        const w = visibleCandleWindow({ logical, times, tfMs: barMs });
        if (w) return w;
      }
      const vis = ts?.getVisibleRange();
      if (vis && typeof vis.from === "number" && typeof vis.to === "number") {
        return candlesInMsRange(
          times,
          asUnixMs(Number(vis.from)),
          asUnixMs(Number(vis.to)) + barMs,
          barMs,
        );
      }
      const pending = intendedWindowRef.current;
      if (pending) return candlesInMsRange(times, pending.lo, pending.hi, barMs);
      return null;
    };

    const candleRange = (): { lo: number; hi: number } => {
      const y = readY();
      if (y && y.hi > y.lo) return y;
      const bars = candlesRef.current;
      let lo = Infinity;
      let hi = -Infinity;
      for (const b of bars) {
        if (b.low < lo) lo = b.low;
        if (b.high > hi) hi = b.high;
      }
      return hi > lo ? { lo, hi } : { lo: 0, hi: 1 };
    };

    const tick = specTick || 0.25;
    const rowForView = (): number => {
      const y = readY();
      const span = y && y.hi > y.lo ? y.hi - y.lo : tick;
      return profileRowGrain({
        layout: prefs.profileRowsLayout || "number-of-rows",
        rowSize: prefs.profileRowSize ?? 24,
        span,
        tick,
      });
    };
    const paintBins = (bins: VpBin[], sourceLabel: string | null) => {
      const scale = candleRange();
      const row = rowForView();
      paintRef.current.row = row;
      primitiveRef.current?.forceDraw(bins, scale.lo, scale.hi, row);
      setVpBins(bins.length);
      setBinSource(sourceLabel);
      requestAnimationFrame(() => primitiveRef.current?.refresh());
    };

    const run = (cls: VpShapeClass = "diff") => {
      if (cancelled) return;
      if (!timesRef.current.length) return;
      const w = computeWindow();
      if (!w) return;
      // Defense in depth against computeWindow()'s barsInLogicalRange
      // strategy reporting the whole loaded series instead of what's on
      // screen (happens transiently around setData() calls before the
      // chart's visible range is re-narrowed — lightweight-charts auto-fits
      // to full content otherwise). The library itself never renders bars
      // narrower than ~1px, so more candles than pane pixels is never a
      // real on-screen window — it's this settle race. Wait for the next
      // trigger instead of firing a fetch spanning the full history.
      const paneW = chartRef.current?.paneSize().width;
      if (paneW && w.count > paneW) return;
      const sent = `${w.fromT}:${w.toT}:${w.count}:${cls}`;
      if (cls === "diff" && sent === lastSent) return;
      lastSent = sent;
      const mySeq = ++paintSeq;
      setVisibleBars(w.count);
      const row = rowForView();
      // REQ-007 v2 law: "the client never assembles a histogram from bars."
      // This used to paint a candle-occupancy placeholder (mockBinsFromCandles)
      // here, rendered with the exact same real-looking bars as true server
      // data — a member had no way to tell a fabricated placeholder from
      // real per-tick volume just by looking at the chart. That's exactly
      // the silent-lie failure mode the OPF doctrine forbids. Paint nothing
      // until the real /window response lands; the primitive was already
      // cleared for this epoch (interval/source/target change) above, so an
      // empty profile layer with the candles still visible is the honest
      // state while the fetch is in flight — not a fabricated one.
      const y = readY();
      if (y && y.hi > y.lo) {
        paintRef.current.visibleLo = y.lo;
        paintRef.current.visibleHi = y.hi;
      }
      const plan = profileFetchPlan({
        fromT: w.fromT,
        toT: w.toT,
        target: tgt,
        source,
        row,
        apiBase,
      });
      if (plan.kind === "wait" || !plan.url) return;
      if (beginBandFetch(flightRef.current) === "wait") return;
      void fetchWindowExclusive(plan.url)
        .then((r) => {
          if (cancelled) return;
          const namedState = (r.body as { named_state?: unknown } | null)?.named_state;
          if (typeof namedState === "string" && namedState) {
            // The server returns some failures (e.g. CONTRACT MISMATCH —
            // row_not_multiple_of_substrate) as HTTP 200 with an error body
            // instead of a 4xx. r.ok alone can't catch that; a named_state
            // here means real data was refused, not that there's none to
            // show — this must surface, never look identical to "no bins."
            console.error(`[SaPriceChart] window named_state=${namedState}`, r.body);
            setErr(`Profile unavailable (${namedState})`);
            return;
          }
          const bins = asVpBins(r.body?.bins);
          if (!bins.length) return;
          // A slower, older request that lands after a newer one already
          // painted real data must not clobber it with stale bins.
          if (mySeq < paintedSeq && paintedWasReal) return;
          paintBins(bins, String(r.body?.bin_source || "window"));
          paintedSeq = Math.max(paintedSeq, mySeq);
          paintedWasReal = true;
          setRangeMs(r.ms);
        })
        .finally(() => {
          if (cancelled) return;
          if (endBandFetch(flightRef.current) === "again") run(cls);
        });
    };

    const kick = (
      mode: "now" | "debounce" = "debounce",
      cls: VpShapeClass = "diff",
    ) => {
      if (mode === "now") {
        if (kickHoldRef.current) clearTimeout(kickHoldRef.current);
        run(cls);
        return;
      }
      scheduleDebounced(kickHoldRef, RANGE_DEBOUNCE_MS, () => run(cls));
    };
    kickVpRef.current = kick;
    syncPrimitiveTime();
    primitiveRef.current?.onNeedWindow(() => kick("debounce", "diff"));

    const ts = chartRef.current?.timeScale();
    const onTimeline = () => {
      kick("debounce", "diff");
      syncSession();
    };
    ts?.subscribeVisibleTimeRangeChange(onTimeline);
    ts?.subscribeVisibleLogicalRangeChange(onTimeline);
    const host = wrapRef.current;
    const onForce = () => kick("now", "rebuild");
    host?.addEventListener(FORCE_VP_EVENT, onForce);
    window.addEventListener(FORCE_VP_EVENT, onForce);
    kick("now", "rebuild");
    return () => {
      cancelled = true;
      if (kickHoldRef.current) clearTimeout(kickHoldRef.current);
      primitiveRef.current?.onNeedWindow(null);
      ts?.unsubscribeVisibleTimeRangeChange(onTimeline);
      ts?.unsubscribeVisibleLogicalRangeChange(onTimeline);
      host?.removeEventListener(FORCE_VP_EVENT, onForce);
      window.removeEventListener(FORCE_VP_EVENT, onForce);
    };
  }, [source, target, spanFloor, spanCeiling, prefs.priceTf, prefs.visible.L2, prefs.profileRowsLayout, prefs.profileRowSize, harness, apiBase, specTick]);

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
        primitiveRef.current?.refresh();
        kickVpRef.current("debounce", "diff");
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
        syncPrimitiveTime();
        kickVpRef.current("now", "diff");
      },
      onGen: () => {
        markLive();
        const url = `${apiBase}/ohlc/${source}?tf=${nativeOhlcTf(prefs.priceTf)}&lookback_days=0`;
        void fetchGenWait(url).then((r) => {
          if (Array.isArray(r.body?.bars) && seriesRef.current) {
            // setData() re-fits the visible range to the whole series unless
            // we explicitly restore it — the very next computeWindow() call
            // (from kickVpRef below) would then read "entire loaded history"
            // as the visible window instead of what's on screen, firing a
            // VP fetch spanning the full series rather than REQ-007's
            // visible-range-only window.
            const ts = chartRef.current?.timeScale();
            const preGenLogical = ts?.getVisibleLogicalRange() ?? null;
            const resampled = resampleOhlc(
              r.body.bars as OhlcBar[],
              tfMs(prefsRef.current.priceTf),
            );
            const candles = colorBars(toCandles(resampled), prefsRef.current);
            rawBarsRef.current = resampled;
            candlesRef.current = candles;
            timesRef.current = candles.map((c) => c.time as UTCTimestamp);
            seriesRef.current.setData(candles);
            // Restoring a captured range verbatim just perpetuates whatever
            // state was already there — including a corrupted/overly-wide
            // one from elsewhere. Clamp the restore to a sane bar count
            // (pane width) so a bad prior state can't propagate forever
            // through every subsequent live tick.
            const paneW = chartRef.current?.paneSize().width;
            if (
              preGenLogical &&
              paneW &&
              Number(preGenLogical.to) - Number(preGenLogical.from) > paneW
            ) {
              const to = Number(preGenLogical.to);
              ts?.setVisibleLogicalRange({ from: to - paneW, to });
            } else if (preGenLogical) {
              ts?.setVisibleLogicalRange(preGenLogical);
            }
            syncPrimitiveTime();
            kickVpRef.current("now", "rebuild");
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
      data-vp-visible-bars={visibleBars}
      data-bin-source={binSource ?? ""}
      data-profile-mode="visible-range"
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
      {err ? (
        <p className="relative z-10 p-3 text-sm text-zinc-400" data-testid="sa-price-chart-empty">
          {err}
        </p>
      ) : null}
    </div>
  );
}
