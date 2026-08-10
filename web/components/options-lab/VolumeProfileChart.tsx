"use client";

/**
 * Candlestick chart for Options Lab Volume Profile app.
 * Fills remaining viewport below suite + timeframe controls.
 * Light / dark chart styles (dark default).
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

export type ChartStyle = "dark" | "light";

const STYLE_STORAGE_KEY = "options-lab-chart-style";

function chartTheme(style: ChartStyle) {
  if (style === "dark") {
    return {
      layout: {
        background: { type: ColorType.Solid, color: "#0c0c0e" },
        textColor: "#a1a1aa",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.06)" },
        horzLines: { color: "rgba(255,255,255,0.06)" },
      },
      border: "rgba(255,255,255,0.12)",
      panelBg: "bg-[#0c0c0e]",
      panelBorder: "border-zinc-800",
      up: "#22c55e",
      down: "#ef4444",
      wickUp: "#22c55e",
      wickDown: "#ef4444",
      crosshair: "rgba(255,255,255,0.25)",
    };
  }
  return {
    layout: {
      background: { type: ColorType.Solid, color: "#ffffff" },
      textColor: "#52525b",
    },
    grid: {
      vertLines: { color: "rgba(0,0,0,0.06)" },
      horzLines: { color: "rgba(0,0,0,0.06)" },
    },
    border: "rgba(0,0,0,0.12)",
    panelBg: "bg-white",
    panelBorder: "border-[var(--color-separator)]",
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
  style,
}: {
  payload: OhlcPayload;
  tf: OhlcTf;
  style: ChartStyle;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const theme = chartTheme(style);

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
      chartRef.current.applyOptions({
        width: Math.max(1, hostRef.current.clientWidth),
        height: Math.max(200, hostRef.current.clientHeight),
      });
    });
    ro.observe(el);
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
  }, [payload, tf, style]);

  return (
    <div
      ref={hostRef}
      className="h-full min-h-[200px] w-full flex-1"
      data-testid="volume-profile-candle-host"
    />
  );
}

function StyleToggle({
  style,
  onChange,
}: {
  style: ChartStyle;
  onChange: (s: ChartStyle) => void;
}) {
  return (
    <nav
      className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
      aria-label="Chart color style"
      data-testid="volume-profile-style"
    >
      {(
        [
          { id: "dark" as const, label: "Dark" },
          { id: "light" as const, label: "Light" },
        ] as const
      ).map((item) => {
        const active = item.id === style;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
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
  );
}

export default function VolumeProfileChart() {
  const { symbol } = useOptionsLab();
  const [tf, setTf] = useState<OhlcTf>("1d");
  const [style, setStyle] = useState<ChartStyle>("dark");
  const [payload, setPayload] = useState<OhlcPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Restore style preference; default dark
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STYLE_STORAGE_KEY);
      if (s === "light" || s === "dark") setStyle(s);
    } catch {
      /* ignore */
    }
  }, []);

  const onStyleChange = (s: ChartStyle) => {
    setStyle(s);
    try {
      sessionStorage.setItem(STYLE_STORAGE_KEY, s);
    } catch {
      /* ignore */
    }
  };

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

  const theme = chartTheme(style);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      data-testid="volume-profile-chart"
    >
      {/* Timeframe / style controls — standard page width, centered */}
      <div className="mx-auto w-full max-w-5xl shrink-0 px-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
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
          <StyleToggle style={style} onChange={onStyleChange} />
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
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Chart — full window width */}
      <div
        className={[
          "flex min-h-0 flex-1 flex-col overflow-hidden border-y p-0 sm:rounded-none",
          theme.panelBorder,
          theme.panelBg,
        ].join(" ")}
      >
        {payload && payload.bars?.length ? (
          <CandleHost
            key={`${symbol}-${tf}-${style}-${payload.bar_count}`}
            payload={payload}
            tf={tf}
            style={style}
          />
        ) : (
          <div
            className={[
              "flex min-h-[200px] flex-1 items-center justify-center text-sm",
              style === "dark"
                ? "text-zinc-500"
                : "text-[var(--color-label-tertiary)]",
            ].join(" ")}
          >
            {loading ? "Loading candles…" : "No bars for this symbol / timeframe"}
          </div>
        )}
      </div>
    </div>
  );
}
