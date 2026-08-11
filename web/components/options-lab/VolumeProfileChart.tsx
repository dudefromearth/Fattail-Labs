"use client";

/**
 * Candlestick chart for Options Lab Volume Profile.
 *
 * TF switch performance (critical path):
 * 1. Memory series store — no React state holding 100k bars
 * 2. Fast lookback fetch first (e.g. 30d of 5m), paint immediately
 * 3. Background full 3y backfill without blocking the chart
 * 4. Stable chart + applyOptions for appearance
 * 5. Viewport-first setData; pan-left expands from memory
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type LogicalRange,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import {
  OHL_C_TIMEFRAMES,
  type OhlcMeta,
  type OhlcTf,
} from "@/lib/marketOhlcApi";
import {
  getSeries,
  liveRefreshIntervalMs,
  loadSeriesFast,
  loadSeriesFull,
  refreshSeriesLive,
} from "@/lib/marketOhlcSeries";
import { useLiveUnderlierMarks } from "@/lib/market/useLiveUnderlierMarks";
import { useOptionsLab } from "@/lib/optionsLabContext";

/* ── Scale text size ─────────────────────────────────────────────────── */

export type ScaleTextSize = "small" | "medium" | "larger" | "xlarge";

const SCALE_TEXT_OPTIONS: { id: ScaleTextSize; label: string; px: number }[] = [
  { id: "small", label: "Small", px: 10 },
  { id: "medium", label: "Medium", px: 12 },
  { id: "larger", label: "Larger", px: 15 },
  { id: "xlarge", label: "X Large", px: 18 },
];

function scaleFontPx(size: ScaleTextSize): number {
  return SCALE_TEXT_OPTIONS.find((o) => o.id === size)?.px ?? 12;
}

/* ── Color helpers ───────────────────────────────────────────────────── */

type Hsl = { h: number; s: number; l: number };

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function normalizeHex(hex: string): string {
  let h = (hex || "").trim().replace(/^#/, "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return "#0c0c0e";
  return `#${h.toLowerCase()}`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const p = (n: number) =>
    clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`;
}

function hexToHsl(hex: string): Hsl {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360;
  const ss = clamp(s, 0, 100) / 100;
  const ll = clamp(l, 0, 100) / 100;
  if (ss === 0) {
    const v = ll * 255;
    return rgbToHex(v, v, v);
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
  const p = 2 * ll - q;
  const hk = hh / 360;
  const r = hue2rgb(p, q, hk + 1 / 3) * 255;
  const g = hue2rgb(p, q, hk) * 255;
  const b = hue2rgb(p, q, hk - 1 / 3) * 255;
  return rgbToHex(r, g, b);
}

function colorWithBrightness(hex: string, brightness: number): string {
  const { h, s } = hexToHsl(hex);
  return hslToHex(h, s, clamp(brightness, 0, 100));
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
}

/* ── Appearance ──────────────────────────────────────────────────────── */

export type ChartAppearance = {
  scaleText: ScaleTextSize;
  bgColor: string;
  bgBrightness: number;
  gridColor: string;
  gridBrightness: number;
};

const APPEARANCE_STORAGE_KEY = "options-lab-chart-appearance-v1";

const DEFAULT_APPEARANCE: ChartAppearance = {
  scaleText: "medium",
  bgColor: "#0c0c0e",
  bgBrightness: 5,
  gridColor: "#ffffff",
  gridBrightness: 100,
};

const PRESETS: { id: string; label: string; patch: Partial<ChartAppearance> }[] =
  [
    {
      id: "dark",
      label: "Dark",
      patch: {
        bgColor: "#0c0c0e",
        bgBrightness: 5,
        gridColor: "#ffffff",
        gridBrightness: 100,
      },
    },
    {
      id: "light",
      label: "Light",
      patch: {
        bgColor: "#ffffff",
        bgBrightness: 100,
        gridColor: "#000000",
        gridBrightness: 0,
      },
    },
  ];

function loadAppearance(): ChartAppearance {
  try {
    const raw = sessionStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_APPEARANCE };
    const p = JSON.parse(raw) as Partial<ChartAppearance>;
    return {
      scaleText:
        p.scaleText && SCALE_TEXT_OPTIONS.some((o) => o.id === p.scaleText)
          ? p.scaleText
          : DEFAULT_APPEARANCE.scaleText,
      bgColor: normalizeHex(p.bgColor ?? DEFAULT_APPEARANCE.bgColor),
      bgBrightness: clamp(
        Number(p.bgBrightness ?? DEFAULT_APPEARANCE.bgBrightness),
        0,
        100,
      ),
      gridColor: normalizeHex(p.gridColor ?? DEFAULT_APPEARANCE.gridColor),
      gridBrightness: clamp(
        Number(p.gridBrightness ?? DEFAULT_APPEARANCE.gridBrightness),
        0,
        100,
      ),
    };
  } catch {
    return { ...DEFAULT_APPEARANCE };
  }
}

function saveAppearance(a: ChartAppearance): void {
  try {
    sessionStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

type ResolvedTheme = {
  bg: string;
  textColor: string;
  gridColor: string;
  border: string;
  crosshair: string;
  up: string;
  down: string;
  wickUp: string;
  wickDown: string;
  fontSize: number;
  isDark: boolean;
};

function resolveTheme(a: ChartAppearance): ResolvedTheme {
  const bg = colorWithBrightness(a.bgColor, a.bgBrightness);
  const gridSolid = colorWithBrightness(a.gridColor, a.gridBrightness);
  const isDark = relativeLuminance(bg) < 0.45;
  const textColor = isDark ? "#c4c4cc" : "#3f3f46";
  const border = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";
  const crosshair = isDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.22)";
  const gridAlpha = isDark ? 0.14 : 0.12;
  return {
    bg,
    textColor,
    gridColor: rgbaFromHex(gridSolid, gridAlpha),
    border,
    crosshair,
    up: isDark ? "#22c55e" : "#16a34a",
    down: isDark ? "#ef4444" : "#dc2626",
    wickUp: isDark ? "#22c55e" : "#16a34a",
    wickDown: isDark ? "#ef4444" : "#dc2626",
    fontSize: scaleFontPx(a.scaleText),
    isDark,
  };
}

function applyThemeToChart(
  chart: IChartApi,
  series: ISeriesApi<"Candlestick">,
  theme: ResolvedTheme,
  tf: OhlcTf,
): void {
  chart.applyOptions({
    layout: {
      background: { type: ColorType.Solid, color: theme.bg },
      textColor: theme.textColor,
      fontSize: theme.fontSize,
    },
    grid: {
      vertLines: { color: theme.gridColor },
      horzLines: { color: theme.gridColor },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        color: theme.crosshair,
        labelBackgroundColor: theme.up,
      },
      horzLine: {
        color: theme.crosshair,
        labelBackgroundColor: theme.up,
      },
    },
    rightPriceScale: { borderColor: theme.border },
    timeScale: {
      borderColor: theme.border,
      timeVisible: tf !== "1d",
      secondsVisible: false,
    },
  });
  series.applyOptions({
    upColor: theme.up,
    downColor: theme.down,
    borderUpColor: theme.up,
    borderDownColor: theme.down,
    wickUpColor: theme.wickUp,
    wickDownColor: theme.wickDown,
    borderVisible: false,
  });
}

/* ── Viewport windowing ──────────────────────────────────────────────── */

/** Bars in LWC on first paint of a series. */
const INITIAL_SERIES_BARS = 3500;
const EXPAND_CHUNK = 2500;
const LEFT_EDGE_BARS = 80;

function visibleBarCount(tf: OhlcTf, widthPx: number): number {
  const byWidth = Math.floor(Math.max(280, widthPx) / 7);
  const tfBias: Record<OhlcTf, number> = {
    "1d": 1.15,
    "4h": 1.1,
    "1h": 1.0,
    "30m": 0.95,
    "10m": 0.9,
    "5m": 0.85,
  };
  const n = Math.round(byWidth * (tfBias[tf] ?? 1));
  return Math.max(40, Math.min(280, n));
}

function showRecentBars(
  chart: IChartApi,
  seriesBarCount: number,
  visible: number,
): void {
  if (seriesBarCount < 1) return;
  const vis = Math.min(visible, seriesBarCount);
  const to = seriesBarCount - 1 + 4;
  const from = Math.max(-0.5, to - vis);
  chart.timeScale().setVisibleLogicalRange({ from, to });
}

/* ── Chart host (stable instance) ────────────────────────────────────── */

function CandleHost({
  symbol,
  tf,
  /** Bumps when module series store updates for this symbol|tf. */
  seriesRev,
  appearance,
  liveMid,
}: {
  symbol: string;
  tf: OhlcTf;
  seriesRev: number;
  appearance: ChartAppearance;
  /** Market Bus underlier mid for live price line */
  liveMid?: number | null;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const liveLineRef = useRef<ReturnType<
    ISeriesApi<"Candlestick">["createPriceLine"]
  > | null>(null);
  const fullCandlesRef = useRef<CandlestickData[]>([]);
  const paintedFromRef = useRef(0);
  /** Length of fullCandles last applied to memory (for backfill offset). */
  const memoryLenRef = useRef(0);
  const expandingRef = useRef(false);
  const tfRef = useRef(tf);
  tfRef.current = tf;
  /** Last symbol|tf we setData for — avoid resetting viewport on backfill. */
  const dataIdentityRef = useRef("");

  const theme = useMemo(() => resolveTheme(appearance), [appearance]);

  // Create chart once
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;

    const chart = createChart(el, {
      width: Math.max(1, el.clientWidth),
      height: Math.max(200, el.clientHeight),
      layout: {
        background: { type: ColorType.Solid, color: theme.bg },
        textColor: theme.textColor,
        fontSize: theme.fontSize,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: theme.crosshair,
          labelBackgroundColor: theme.up,
        },
        horzLine: {
          color: theme.crosshair,
          labelBackgroundColor: theme.up,
        },
      },
      rightPriceScale: {
        borderColor: theme.border,
        scaleMargins: { top: 0.06, bottom: 0.06 },
      },
      timeScale: {
        borderColor: theme.border,
        timeVisible: tfRef.current !== "1d",
        secondsVisible: false,
        rightOffset: 4,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });
    const series = chart.addCandlestickSeries({
      upColor: theme.up,
      downColor: theme.down,
      borderUpColor: theme.up,
      borderDownColor: theme.down,
      wickUpColor: theme.wickUp,
      wickDownColor: theme.wickDown,
      borderVisible: false,
    });
    chartRef.current = chart;
    seriesRef.current = series;

    const expandIfNeeded = (range: LogicalRange | null) => {
      if (!range || expandingRef.current) return;
      const full = fullCandlesRef.current;
      const fromIdx = paintedFromRef.current;
      if (fromIdx <= 0) return;
      if (range.from > LEFT_EDGE_BARS) return;

      expandingRef.current = true;
      try {
        const add = Math.min(EXPAND_CHUNK, fromIdx);
        const newFrom = fromIdx - add;
        const painted = full.slice(newFrom);
        const prevLen = full.length - fromIdx;
        const rangeBefore = chart.timeScale().getVisibleLogicalRange();

        series.setData(painted);
        paintedFromRef.current = newFrom;

        if (rangeBefore) {
          const delta = painted.length - prevLen;
          chart.timeScale().setVisibleLogicalRange({
            from: rangeBefore.from + delta,
            to: rangeBefore.to + delta,
          });
        }
      } finally {
        expandingRef.current = false;
      }
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(expandIfNeeded);

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
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(expandIfNeeded);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Appearance only
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;
    applyThemeToChart(chart, series, theme, tf);
  }, [theme, tf]);

  // Series data from module store (not React props with bars)
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const el = hostRef.current;
    if (!chart || !series || !el) return;

    const entry = getSeries(symbol, tf);
    const full = entry?.candles ?? [];
    fullCandlesRef.current = full;

    if (full.length < 1) {
      series.setData([]);
      paintedFromRef.current = 0;
      memoryLenRef.current = 0;
      dataIdentityRef.current = "";
      return;
    }

    const identity = `${symbol}|${tf}`;
    const isTfOrSymbolChange = dataIdentityRef.current !== identity;

    if (isTfOrSymbolChange) {
      dataIdentityRef.current = identity;
      const fromIdx = Math.max(0, full.length - INITIAL_SERIES_BARS);
      paintedFromRef.current = fromIdx;
      memoryLenRef.current = full.length;
      const painted = full.slice(fromIdx);
      series.setData(painted);
      showRecentBars(
        chart,
        painted.length,
        visibleBarCount(tf, el.clientWidth),
      );
      return;
    }

    // Same symbol|tf — history backfill (left) and/or live tip update (right).
    const prevLen = memoryLenRef.current;
    const grew = full.length - prevLen;
    if (grew > 0) {
      // Prefer treating growth as older history on the left (backfill).
      // Live merge usually keeps length similar or adds tip bars on the right.
      paintedFromRef.current += grew;
      memoryLenRef.current = full.length;
    } else {
      memoryLenRef.current = full.length;
    }
    // Re-apply painted window so the latest candle OHLC updates live
    const fromIdx = paintedFromRef.current;
    const painted = full.slice(fromIdx);
    if (painted.length >= 1) {
      const rangeBefore = chart.timeScale().getVisibleLogicalRange();
      series.setData(painted);
      if (rangeBefore) {
        chart.timeScale().setVisibleLogicalRange(rangeBefore);
      }
    }
  }, [symbol, tf, seriesRev]);

  // Live mid price line from Market Bus underlier marks
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    try {
      if (liveMid == null || !Number.isFinite(liveMid) || liveMid <= 0) {
        if (liveLineRef.current) {
          series.removePriceLine(liveLineRef.current);
          liveLineRef.current = null;
        }
        return;
      }
      if (liveLineRef.current) {
        liveLineRef.current.applyOptions({ price: liveMid });
        return;
      }
      liveLineRef.current = series.createPriceLine({
        price: liveMid,
        color: "rgba(251, 191, 36, 0.95)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "Live",
      });
    } catch {
      liveLineRef.current = null;
    }
  }, [liveMid, seriesRev, symbol, tf]);

  return (
    <div
      ref={hostRef}
      className="h-full min-h-[200px] w-full flex-1"
      data-testid="volume-profile-candle-host"
    />
  );
}

/* ── Controls UI ─────────────────────────────────────────────────────── */

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  testId?: string;
}) {
  return (
    <nav
      className="inline-flex flex-wrap items-center gap-0.5 rounded-full bg-[var(--color-fill)] p-1"
      aria-label={label}
      data-testid={testId}
    >
      {options.map((item) => {
        const active = item.id === value;
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

function ColorBrightnessControl({
  label,
  color,
  brightness,
  onColor,
  onBrightness,
  testId,
}: {
  label: string;
  color: string;
  brightness: number;
  onColor: (hex: string) => void;
  onBrightness: (n: number) => void;
  testId: string;
}) {
  const preview = colorWithBrightness(color, brightness);
  return (
    <div
      className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-[var(--color-separator)] bg-[var(--color-fill)] px-2.5 py-1.5"
      data-testid={testId}
    >
      <span className="text-xs font-medium text-[var(--color-label-secondary)]">
        {label}
      </span>
      <label className="inline-flex cursor-pointer items-center gap-1.5">
        <span className="sr-only">{label} color</span>
        <input
          type="color"
          value={colorWithBrightness(color, brightness)}
          onChange={(e) => onColor(normalizeHex(e.target.value))}
          className="h-8 w-10 cursor-pointer rounded border border-[var(--color-separator)] bg-transparent p-0.5"
          title={`${label} color`}
          aria-label={`${label} color`}
        />
      </label>
      <label className="inline-flex items-center gap-1.5 text-xs text-[var(--color-label-secondary)]">
        <span className="whitespace-nowrap">Bright</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={brightness}
          onChange={(e) => onBrightness(Number(e.target.value))}
          className="h-2 w-24 cursor-pointer accent-[var(--color-tint)] sm:w-28"
          aria-label={`${label} brightness`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={brightness}
        />
        <span className="w-7 tabular-nums text-[var(--color-label-tertiary)]">
          {brightness}
        </span>
      </label>
      <span
        className="h-5 w-5 shrink-0 rounded border border-[var(--color-separator)]"
        style={{ backgroundColor: preview }}
        title={`Preview: ${preview}`}
        aria-hidden
      />
    </div>
  );
}

/* ── Main ────────────────────────────────────────────────────────────── */

export default function VolumeProfileChart() {
  const { symbol, profile } = useOptionsLab();
  const [tf, setTf] = useState<OhlcTf>("1d");
  const [appearance, setAppearance] =
    useState<ChartAppearance>(DEFAULT_APPEARANCE);
  const [hydrated, setHydrated] = useState(false);
  /** Lightweight meta only — never the bars array. */
  const [meta, setMeta] = useState<OhlcMeta | null>(null);
  const [seriesRev, setSeriesRev] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [liveAsOf, setLiveAsOf] = useState<string | null>(null);

  // Live underlier mid — site-wide pattern (HTTP ensure_fresh + WS bind)
  const { bySymbol: liveBySymbol, transport: liveTransport } =
    useLiveUnderlierMarks({
      enabledOnly: true,
      pollMs: 5000,
      enabled: Boolean(symbol),
      symbols: symbol ? [symbol] : null,
    });
  const liveMark = liveBySymbol.get((symbol || "").toUpperCase());
  // Chart tip: native mid preferred; labeled proxy only if no native print
  const liveMid =
    liveMark?.mid ?? (liveMark?.viaProxy ? liveMark.proxyMid : null) ?? null;

  // Prefer symbol-profile default TF once
  useEffect(() => {
    const def = profile?.ohlc_default_tf as OhlcTf | undefined;
    if (def && OHL_C_TIMEFRAMES.some((t) => t.id === def)) {
      setTf(def);
    }
    // only when product identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.symbol]);

  const bumpSeries = useCallback(() => {
    setSeriesRev((n) => n + 1);
  }, []);

  useEffect(() => {
    setAppearance(loadAppearance());
    setHydrated(true);
  }, []);

  const patchAppearance = useCallback((patch: Partial<ChartAppearance>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...patch };
      saveAppearance(next);
      return next;
    });
  }, []);

  // TF / symbol load: memory → fast network → background full
  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    // Sync warm path: paint from memory before any await
    const warm = getSeries(symbol, tf);
    if (warm && warm.candles.length >= 2) {
      setMeta(warm.meta);
      setLoading(false);
      setError(null);
      setBackfilling(!warm.complete);
      bumpSeries();
    } else {
      setLoading(true);
      setError(null);
      setBackfilling(false);
      // Keep previous chart until new data arrives (no flash empty)
    }

    void (async () => {
      try {
        const { entry, fromCache, needsBackfill } = await loadSeriesFast(
          symbol,
          tf,
          { signal: ac.signal },
        );
        if (cancelled) return;
        setMeta({ ...entry.meta, fromCache });
        setLoading(false);
        setError(null);
        bumpSeries();

        if (!needsBackfill) {
          setBackfilling(false);
          return;
        }

        setBackfilling(true);
        try {
          const full = await loadSeriesFull(symbol, tf, {
            signal: ac.signal,
          });
          if (cancelled) return;
          setMeta({ ...full.meta, fromCache: false });
          setBackfilling(false);
          bumpSeries();
        } catch (e) {
          if (cancelled || (e instanceof DOMException && e.name === "AbortError"))
            return;
          // Fast chart stays; backfill failure is non-fatal
          setBackfilling(false);
        }
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError"))
          return;
        if (!warm) {
          setMeta(null);
          setError(e instanceof Error ? e.message : "Failed to load OHLC");
        }
        setLoading(false);
        setBackfilling(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [symbol, tf, bumpSeries]);

  // Live tip: re-fetch recent bars on an interval (visibility-aware)
  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    const ac = new AbortController();
    const intervalMs = liveRefreshIntervalMs(tf);

    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const entry = await refreshSeriesLive(symbol, tf, {
          signal: ac.signal,
        });
        if (cancelled || !entry) return;
        setMeta({ ...entry.meta, fromCache: false });
        setLiveAsOf(new Date().toISOString());
        bumpSeries();
      } catch {
        /* non-fatal — keep last series */
      }
    };

    // First live tick shortly after mount (don’t race initial load)
    const t0 = window.setTimeout(() => void tick(), 4_000);
    const id = window.setInterval(() => void tick(), intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      ac.abort();
      window.clearTimeout(t0);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [symbol, tf, bumpSeries]);

  const theme = useMemo(() => resolveTheme(appearance), [appearance]);
  const hasSeries =
    hydrated && (meta != null || getSeries(symbol, tf)?.candles.length);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      data-testid="volume-profile-chart"
    >
      <div className="mx-auto w-full max-w-5xl shrink-0 space-y-2 px-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Bar period (time each candle represents)"
            value={tf}
            options={OHL_C_TIMEFRAMES}
            onChange={setTf}
            testId="volume-profile-tf"
          />
          <span className="text-xs text-[var(--color-label-tertiary)]">
            {meta
              ? `${meta.bar_count} bars · ${meta.series_ticker}${
                  meta.proxy_label ? ` · ${meta.proxy_label}` : ""
                }${
                  meta.history_span_days != null
                    ? ` · ~${Math.round(Number(meta.history_span_days))}d`
                    : ""
                }${meta.fromCache ? " · cached" : ""}${
                  loading ? " · …" : ""
                }${backfilling ? " · loading history…" : ""}${
                  meta.complete ? "" : backfilling ? "" : " · partial"
                }${
                  liveMid != null
                    ? ` · live ${liveMid.toFixed(2)}${
                        liveTransport === "stream" ? "" : ` (${liveTransport})`
                      }`
                    : " · live mid —"
                }${liveAsOf ? " · tip refresh on" : ""}`
              : loading
                ? "Loading…"
                : ""}
          </span>
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          data-testid="volume-profile-appearance"
        >
          <Segmented
            label="Scale text size"
            value={appearance.scaleText}
            options={SCALE_TEXT_OPTIONS.map((o) => ({
              id: o.id,
              label: o.label,
            }))}
            onChange={(scaleText) => patchAppearance({ scaleText })}
            testId="volume-profile-scale-text"
          />

          <Segmented
            label="Background preset"
            value={
              (PRESETS.find(
                (p) =>
                  p.patch.bgColor === appearance.bgColor &&
                  p.patch.bgBrightness === appearance.bgBrightness &&
                  p.patch.gridColor === appearance.gridColor &&
                  p.patch.gridBrightness === appearance.gridBrightness,
              )?.id ?? "custom") as string
            }
            options={[
              ...PRESETS.map((p) => ({ id: p.id, label: p.label })),
              { id: "custom", label: "Custom" },
            ]}
            onChange={(id) => {
              const p = PRESETS.find((x) => x.id === id);
              if (p) patchAppearance(p.patch);
            }}
            testId="volume-profile-preset"
          />

          <ColorBrightnessControl
            label="Background"
            color={appearance.bgColor}
            brightness={appearance.bgBrightness}
            onColor={(bgColor) => patchAppearance({ bgColor })}
            onBrightness={(bgBrightness) => patchAppearance({ bgBrightness })}
            testId="volume-profile-bg"
          />

          <ColorBrightnessControl
            label="Grid"
            color={appearance.gridColor}
            brightness={appearance.gridBrightness}
            onColor={(gridColor) => patchAppearance({ gridColor })}
            onBrightness={(gridBrightness) =>
              patchAppearance({ gridBrightness })
            }
            testId="volume-profile-grid"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-[var(--color-separator)] p-0"
        style={{ backgroundColor: theme.bg }}
      >
        {hasSeries ? (
          <CandleHost
            symbol={symbol}
            tf={tf}
            seriesRev={seriesRev}
            appearance={appearance}
            liveMid={liveMid}
          />
        ) : (
          <div
            className="flex min-h-[200px] flex-1 items-center justify-center text-sm"
            style={{ color: theme.textColor }}
          >
            {loading || !hydrated
              ? "Loading candles…"
              : "No bars for this symbol / timeframe"}
          </div>
        )}
      </div>
    </div>
  );
}
