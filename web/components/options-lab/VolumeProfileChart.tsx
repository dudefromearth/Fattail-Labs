"use client";

/**
 * Candlestick chart for Options Lab Volume Profile app.
 * Fills remaining viewport below suite + timeframe controls.
 * Timeframes: Day · 4 hr · 1 hr · 30 min · 10 min
 */

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type CandlestickData,
  type UTCTimestamp,
  type Time,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import {
  fetchMarketOhlc,
  OHL_C_TIMEFRAMES,
  type OhlcPayload,
  type OhlcTf,
} from "@/lib/marketOhlcApi";
import { useOptionsLab } from "@/lib/optionsLabContext";

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

function toCandles(payload: OhlcPayload, tf: OhlcTf): CandlestickData[] {
  const out: CandlestickData[] = [];
  let lastT: number | string | null = null;
  for (const b of payload.bars || []) {
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
      time = Math.floor(b.t / 1000) as UTCTimestamp;
    }
    if (lastT !== null && time <= lastT) continue;
    lastT = time as number | string;
    out.push({ time, open: o, high: h, low: l, close: b.c });
  }
  return out;
}

function CandleHost({
  payload,
  tf,
}: {
  payload: OhlcPayload;
  tf: OhlcTf;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const dark = isDarkMode();
    const theme = chartTheme(dark);

    const size = () => ({
      width: Math.max(1, el.clientWidth),
      height: Math.max(200, el.clientHeight),
    });

    const chart = createChart(el, {
      ...size(),
      layout: theme.layout,
      grid: theme.grid,
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: theme.crosshair, labelBackgroundColor: theme.up },
        horzLine: { color: theme.crosshair, labelBackgroundColor: theme.up },
      },
      rightPriceScale: {
        borderColor: theme.border,
        scaleMargins: { top: 0.06, bottom: 0.06 },
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
    series.setData(toCandles(payload, tf));
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (!hostRef.current || !chartRef.current) return;
      const { width, height } = {
        width: Math.max(1, hostRef.current.clientWidth),
        height: Math.max(200, hostRef.current.clientHeight),
      };
      chartRef.current.applyOptions({ width, height });
    });
    ro.observe(el);
    // One more frame after layout settles (flex fill)
    const raf = requestAnimationFrame(() => {
      if (hostRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: Math.max(1, hostRef.current.clientWidth),
          height: Math.max(200, hostRef.current.clientHeight),
        });
      }
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [payload, tf]);

  return (
    <div
      ref={hostRef}
      className="h-full min-h-[200px] w-full flex-1"
      data-testid="volume-profile-candle-host"
    />
  );
}

export default function VolumeProfileChart() {
  const { symbol } = useOptionsLab();
  const [tf, setTf] = useState<OhlcTf>("1d");
  const [payload, setPayload] = useState<OhlcPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await fetchMarketOhlc(symbol, tf);
        if (cancelled) return;
        setPayload(data);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setPayload(null);
          setError(e instanceof Error ? e.message : "Failed to load OHLC");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [symbol, tf]);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      data-testid="volume-profile-chart"
    >
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <nav
          className="inline-flex flex-wrap items-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
          aria-label="Chart timeframe"
          data-testid="volume-profile-tf"
        >
          {OHL_C_TIMEFRAMES.map((item) => {
            const active = item.id === tf;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTf(item.id)}
                aria-pressed={active}
                className={[
                  "inline-flex min-h-9 items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-tint)]",
                  active
                    ? "bg-[var(--color-surface)] text-[var(--color-label)] shadow-[var(--elevation-1)]"
                    : "text-[var(--color-label-secondary)] hover:text-[var(--color-label)]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
        <span className="text-xs text-[var(--color-label-tertiary)]">
          {payload
            ? `${payload.bar_count} bars · ${payload.series_ticker}${
                payload.proxy_label ? ` · ${payload.proxy_label}` : ""
              }${
                payload.history_span_days != null
                  ? ` · ~${Math.round(Number(payload.history_span_days))}d`
                  : ""
              }`
            : loading
              ? "Loading…"
              : ""}
        </span>
      </div>

      {error && (
        <p className="shrink-0 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[var(--color-separator)] bg-[var(--color-canvas)] p-1">
        {payload && payload.bars?.length ? (
          <CandleHost
            key={`${symbol}-${tf}-${payload.bar_count}`}
            payload={payload}
            tf={tf}
          />
        ) : (
          <div className="flex min-h-[200px] flex-1 items-center justify-center text-sm text-[var(--color-label-tertiary)]">
            {loading ? "Loading candles…" : "No bars for this symbol / timeframe"}
          </div>
        )}
      </div>
    </div>
  );
}
