"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type UTCTimestamp,
  type Time,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import {
  fetchTradeChart,
  type TradeChartPayload,
} from "@/lib/tradeLogApi";

type Tf = "5m" | "15m" | "1d";

const TFS: { id: Tf; label: string }[] = [
  { id: "5m", label: "5m" },
  { id: "15m", label: "15m" },
  { id: "1d", label: "1D" },
];

function isDarkMode(): boolean {
  if (typeof document === "undefined") return false;
  const root = document.documentElement;
  if (root.classList.contains("dark")) return true;
  if (root.dataset.theme === "dark") return true;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function chartTheme(dark: boolean) {
  if (dark) {
    return {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      border: "rgba(255,255,255,0.12)",
      up: "#22c55e",
      down: "#ef4444",
      wickUp: "#22c55e",
      wickDown: "#ef4444",
      crosshair: "rgba(255,255,255,0.25)",
    };
  }
  return {
    layout: {
      background: { type: ColorType.Solid, color: "transparent" },
      textColor: "#52525b",
    },
    grid: {
      vertLines: { color: "rgba(0,0,0,0.05)" },
      horzLines: { color: "rgba(0,0,0,0.05)" },
    },
    border: "rgba(0,0,0,0.1)",
    up: "#16a34a",
    down: "#dc2626",
    wickUp: "#16a34a",
    wickDown: "#dc2626",
    crosshair: "rgba(0,0,0,0.2)",
  };
}

/** Massive bars → lightweight-charts candles (seconds UTC; daily as YYYY-MM-DD). */
function toCandleData(
  bars: TradeChartPayload["bars"],
  tf: Tf,
): CandlestickData[] {
  const out: CandlestickData[] = [];
  let lastT: number | string | null = null;
  for (const b of bars) {
    if (b.t == null || b.c == null) continue;
    const o = b.o ?? b.c;
    const h = b.h ?? Math.max(o, b.c);
    const l = b.l ?? Math.min(o, b.c);
    let time: Time;
    if (tf === "1d") {
      const d = new Date(b.t);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      time = `${y}-${m}-${day}` as Time;
    } else {
      // lightweight-charts expects UTC seconds for intraday
      time = Math.floor(b.t / 1000) as UTCTimestamp;
    }
    // Strict ascending unique times required
    if (lastT !== null && time <= lastT) continue;
    lastT = time as number | string;
    out.push({ time, open: o, high: h, low: l, close: b.c });
  }
  return out;
}

function markerTime(ms: number, tf: Tf): Time {
  if (tf === "1d") {
    const d = new Date(ms);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}` as Time;
  }
  return Math.floor(ms / 1000) as UTCTimestamp;
}

/** Snap marker to nearest candle time so markers always land on a bar. */
function nearestBarTime(
  candles: CandlestickData[],
  target: Time,
): Time | null {
  if (!candles.length) return null;
  const toNum = (t: Time): number =>
    typeof t === "number" ? t : Date.parse(String(t) + "T00:00:00Z") / 1000;
  const targetN = toNum(target);
  let best = candles[0].time;
  let bestDist = Math.abs(toNum(best) - targetN);
  for (const c of candles) {
    const dist = Math.abs(toNum(c.time) - targetN);
    if (dist < bestDist) {
      best = c.time;
      bestDist = dist;
    }
  }
  return best;
}

function CandleChart({
  payload,
  tf,
}: {
  payload: TradeChartPayload;
  tf: Tf;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const dark = isDarkMode();
    const theme = chartTheme(dark);
    const chart = createChart(el, {
      width: el.clientWidth,
      height: 220,
      layout: theme.layout,
      grid: theme.grid,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: theme.crosshair, labelBackgroundColor: theme.up },
        horzLine: { color: theme.crosshair, labelBackgroundColor: theme.up },
      },
      rightPriceScale: {
        borderColor: theme.border,
        scaleMargins: { top: 0.12, bottom: 0.08 },
      },
      timeScale: {
        borderColor: theme.border,
        timeVisible: tf !== "1d",
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });
    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: theme.up,
      downColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      wickUpColor: theme.wickUp,
      wickDownColor: theme.wickDown,
      borderVisible: false,
    });
    seriesRef.current = series;

    const candles = toCandleData(payload.bars, tf);
    series.setData(candles);

    // Entry / exit markers on nearest candle
    const markers = (payload.markers || [])
      .map((m) => {
        if (m.t_ms == null) return null;
        const raw = markerTime(m.t_ms, tf);
        const time = nearestBarTime(candles, raw);
        if (!time) return null;
        const isEntry = m.kind === "entry";
        return {
          time,
          position: (isEntry ? "belowBar" : "aboveBar") as
            | "belowBar"
            | "aboveBar",
          color: isEntry ? "#059669" : "#dc2626",
          shape: (isEntry ? "arrowUp" : "arrowDown") as "arrowUp" | "arrowDown",
          text: m.label || (isEntry ? "Entry" : "Exit"),
        };
      })
      .filter((m): m is NonNullable<typeof m> => m != null)
      // unique by time+text (LWC requires sorted by time)
      .sort((a, b) => {
        const na = typeof a.time === "number" ? a.time : String(a.time);
        const nb = typeof b.time === "number" ? b.time : String(b.time);
        if (na < nb) return -1;
        if (na > nb) return 1;
        return 0;
      });
    if (markers.length) {
      series.setMarkers(markers);
    }

    // Structure strike band as price lines (same axis as series only)
    if (payload.structure_band) {
      series.createPriceLine({
        price: payload.structure_band.high,
        color: "rgba(59, 130, 246, 0.55)",
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: "hi",
      });
      series.createPriceLine({
        price: payload.structure_band.low,
        color: "rgba(59, 130, 246, 0.55)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "lo",
      });
    }

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (!hostRef.current || !chartRef.current) return;
      chartRef.current.applyOptions({ width: hostRef.current.clientWidth });
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [payload, tf]);

  const symbol =
    payload.series_ticker || payload.product_symbol || "Underlier";

  return (
    <div
      ref={hostRef}
      className="w-full overflow-hidden rounded-lg"
      role="img"
      aria-label={`${symbol} candlestick chart`}
    />
  );
}

export default function TradeChart({ tradeId }: { tradeId: number }) {
  const [tf, setTf] = useState<Tf>("15m");
  const [payload, setPayload] = useState<TradeChartPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);
    void (async () => {
      const res = await fetchTradeChart(tradeId, tf);
      if (cancelled) return;
      setLoading(false);
      if (!res.ok) {
        if (res.error.kind === "anon") {
          setErr("Sign in to load charts.");
        } else if (res.error.kind === "forbidden") {
          setErr("Trade Log access required for charts.");
        } else {
          setErr(res.error.message || "Chart request failed.");
        }
        setPayload(null);
        return;
      }
      setPayload(res.data);
    })();
    return () => {
      cancelled = true;
    };
  }, [tradeId, tf]);

  const symbolTitle = useMemo(() => {
    if (!payload) return null;
    const charted = payload.series_ticker || payload.product_symbol;
    const product = payload.product_symbol;
    if (!charted) return null;
    if (product && product !== charted) {
      return { primary: charted, secondary: product };
    }
    return { primary: charted, secondary: null as string | null };
  }, [payload]);

  return (
    <section
      className="space-y-2 rounded-xl border border-[var(--color-separator)] bg-[var(--color-canvas)] p-3"
      aria-labelledby="tl-trade-chart-h"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            id="tl-trade-chart-h"
            className="text-[11px] font-bold uppercase tracking-wide text-[var(--color-label-secondary)]"
          >
            Chart
          </h3>
          {symbolTitle && (
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="text-base font-semibold tracking-tight text-[var(--color-label)]">
                {symbolTitle.primary}
              </span>
              {symbolTitle.secondary ? (
                <span className="text-[11px] text-[var(--color-label-tertiary)]">
                  book {symbolTitle.secondary}
                </span>
              ) : null}
              <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-label-tertiary)]">
                candles · {tf}
              </span>
            </div>
          )}
        </div>
        <div
          className="inline-flex shrink-0 rounded-full border border-[var(--color-separator)] bg-[var(--color-surface)] p-0.5"
          role="group"
          aria-label="Chart timeframe"
        >
          {TFS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTf(t.id)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                tf === t.id
                  ? "bg-[var(--color-label)] text-[var(--color-canvas)]"
                  : "text-[var(--color-label-secondary)] hover:bg-[var(--color-fill)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {payload?.proxy_label ? (
        <p className="text-[11px] text-[var(--color-label-secondary)]">
          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950 dark:bg-amber-950 dark:text-amber-100">
            {payload.proxy_label}
          </span>
          {payload.cache?.hit ? (
            <span className="ml-1.5 text-[var(--color-label-tertiary)]">
              · cached
            </span>
          ) : null}
        </p>
      ) : payload?.cache?.hit ? (
        <p className="text-[11px] text-[var(--color-label-tertiary)]">cached</p>
      ) : null}

      {loading && (
        <p className="py-10 text-center text-xs text-[var(--color-label-tertiary)]">
          Loading candles…
        </p>
      )}

      {!loading && err && (
        <p
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100"
          role="alert"
        >
          {err}
        </p>
      )}

      {!loading && !err && payload && !payload.ok && (
        <p
          className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
          role="status"
        >
          {payload.message ||
            "Bars unavailable for this window — chart will not invent candles."}
          {payload.error ? (
            <span className="mt-1 block font-mono text-[10px] opacity-80">
              {payload.error}
            </span>
          ) : null}
        </p>
      )}

      {!loading && !err && payload?.ok && payload.bars.length >= 2 && (
        <CandleChart key={`${tradeId}-${tf}-${payload.cache?.hit}`} payload={payload} tf={tf} />
      )}
    </section>
  );
}
