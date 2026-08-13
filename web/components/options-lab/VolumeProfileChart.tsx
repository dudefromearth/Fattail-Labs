"use client";

/**
 * Options Lab Volume Profile — **bins only** (AZ-VP-9 · OD-AZ6).
 *
 * OHLC store remains the data plane (input for bins). Candlesticks are not
 * rendered on the member surface.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { buildVolumeProfileBins } from "@/lib/options-lab/volumeProfileBins";

/* ── Appearance (kept for background/grid text) ─────────────────────── */

export type ScaleTextSize = "small" | "medium" | "larger" | "xlarge";

const SCALE_TEXT_OPTIONS: { id: ScaleTextSize; label: string; px: number }[] = [
  { id: "small", label: "Small", px: 10 },
  { id: "medium", label: "Medium", px: 12 },
  { id: "larger", label: "Larger", px: 15 },
  { id: "xlarge", label: "X Large", px: 18 },
];

type ChartAppearance = {
  scaleText: ScaleTextSize;
  bgColor: string;
  bgBrightness: number;
  gridColor: string;
  gridBrightness: number;
};

const DEFAULT_APPEARANCE: ChartAppearance = {
  scaleText: "medium",
  bgColor: "#0c0c0e",
  bgBrightness: 100,
  gridColor: "#3f3f46",
  gridBrightness: 40,
};

const APPEARANCE_STORAGE_KEY = "ft_options_lab_vp_appearance_v1";

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

function colorWithBrightness(hex: string, brightness: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = clamp(brightness, 0, 100) / 100;
  // 50 = identity; >50 toward white; <50 toward black
  if (t >= 0.5) {
    const k = (t - 0.5) * 2;
    return rgbToHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k);
  }
  const k = t * 2;
  return rgbToHex(r * k, g * k, b * k);
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const f = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

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

function BinsHost({
  symbol,
  tf,
  seriesRev,
  bg,
  textColor,
  liveMid,
}: {
  symbol: string;
  tf: OhlcTf;
  seriesRev: number;
  bg: string;
  textColor: string;
  liveMid?: number | null;
}) {
  const entry = getSeries(symbol, tf);
  const bars = entry?.ohlcBars?.length
    ? entry.ohlcBars
    : (entry?.candles || []).map((c) => ({
        t: 0,
        o: c.open,
        h: c.high,
        l: c.low,
        c: c.close,
        v: 1,
      }));

  // Use recent window for readable profile (last ~400 bars of TF)
  const windowBars = bars.slice(-400);
  const profile = useMemo(
    () => buildVolumeProfileBins(windowBars, 56),
    // seriesRev forces recompute when store bumps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symbol, tf, seriesRev, windowBars.length],
  );

  const maxVol = Math.max(1, ...profile.bins.map((b) => b.volume));
  const fontPx =
    SCALE_TEXT_OPTIONS.find((o) => o.id === "medium")?.px ?? 12;

  return (
    <div
      className="flex h-full min-h-[280px] w-full flex-col"
      data-testid="volume-profile-bins-host"
      style={{ backgroundColor: bg, color: textColor, fontSize: fontPx }}
    >
      <div className="flex shrink-0 flex-wrap gap-3 border-b border-white/10 px-3 py-1.5 text-[11px] opacity-80">
        <span data-testid="volume-profile-interim-label">
          From OHLC window — not measured tick VP
        </span>
        <span>
          {windowBars.length} bars · estimate only · no candles
        </span>
        {liveMid != null && (
          <span className="text-amber-300">Live {liveMid.toFixed(2)}</span>
        )}
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden px-2 py-2">
        <div className="flex h-full flex-col-reverse justify-between gap-px">
          {profile.bins.map((bin, i) => {
            const w = (bin.volume / maxVol) * 100;
            const nearLive =
              liveMid != null &&
              liveMid >= bin.low &&
              liveMid <= bin.high;
            return (
              <div
                key={i}
                className="flex items-center gap-2"
                style={{ height: `${100 / Math.max(profile.bins.length, 1)}%` }}
              >
                <span className="w-14 shrink-0 text-right font-mono text-[10px] opacity-60">
                  {bin.mid.toFixed(0)}
                </span>
                <div className="relative h-full min-w-0 flex-1">
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: `${Math.max(w, 0.5)}%`,
                      backgroundColor: "rgba(148, 163, 184, 0.45)",
                      outline: nearLive
                        ? "1px solid rgba(251,191,36,0.9)"
                        : undefined,
                    }}
                    title={`${bin.low.toFixed(2)}–${bin.high.toFixed(2)} vol ${bin.volume.toFixed(0)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Explicitly no candle host */}
      <div className="sr-only" data-testid="volume-profile-no-candles">
        candlesticks removed
      </div>
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
  const [meta, setMeta] = useState<OhlcMeta | null>(null);
  const [seriesRev, setSeriesRev] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [backfilling, setBackfilling] = useState(false);
  const [liveAsOf, setLiveAsOf] = useState<string | null>(null);

  const { bySymbol: liveBySymbol, transport: liveTransport } =
    useLiveUnderlierMarks({
      symbols: [symbol],
      enabled: !!symbol,
    });
  const liveMid = liveBySymbol.get(symbol)?.mid ?? null;

  const bumpSeries = useCallback(() => {
    setSeriesRev((n) => n + 1);
  }, []);

  const patchAppearance = useCallback((patch: Partial<ChartAppearance>) => {
    setAppearance((prev) => {
      const next = { ...prev, ...patch };
      saveAppearance(next);
      return next;
    });
  }, []);

  useEffect(() => {
    setAppearance(loadAppearance());
    setHydrated(true);
  }, []);

  useEffect(() => {
    const def = profile?.ohlc_default_tf as OhlcTf | undefined;
    if (def && OHL_C_TIMEFRAMES.some((t) => t.id === def)) {
      setTf(def);
    }
  }, [profile?.ohlc_default_tf, symbol]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const warm = getSeries(symbol, tf);
        if (warm && (warm.ohlcBars?.length >= 2 || warm.candles.length >= 2)) {
          setMeta({ ...warm.meta, fromCache: true });
          bumpSeries();
        }
        const { entry, needsBackfill } = await loadSeriesFast(symbol, tf, {
          signal: ac.signal,
        });
        if (cancelled) return;
        setMeta(entry.meta);
        bumpSeries();
        setLoading(false);

        if (needsBackfill) {
          setBackfilling(true);
          try {
            const full = await loadSeriesFull(symbol, tf, {
              signal: ac.signal,
            });
            if (!cancelled) {
              setMeta(full.meta);
              bumpSeries();
            }
          } finally {
            if (!cancelled) setBackfilling(false);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "OHLC load failed");
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [symbol, tf, bumpSeries]);

  useEffect(() => {
    if (!symbol) return;
    let cancelled = false;
    const ac = new AbortController();
    const intervalMs = liveRefreshIntervalMs(tf);

    const tick = async () => {
      try {
        const entry = await refreshSeriesLive(symbol, tf, {
          signal: ac.signal,
        });
        if (cancelled || !entry) return;
        setMeta({ ...entry.meta, fromCache: false });
        setLiveAsOf(new Date().toISOString());
        bumpSeries();
      } catch {
        /* non-fatal */
      }
    };

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

  const bg = colorWithBrightness(appearance.bgColor, appearance.bgBrightness);
  const isDark = relativeLuminance(bg) < 0.45;
  const textColor = isDark ? "#c4c4cc" : "#3f3f46";

  const entry = getSeries(symbol, tf);
  const hasSeries =
    hydrated &&
    (meta != null ||
      (entry?.ohlcBars?.length ?? 0) >= 2 ||
      (entry?.candles?.length ?? 0) >= 2);

  return (
    <div
      className="flex min-h-0 flex-1 flex-col gap-2"
      data-testid="volume-profile-chart"
    >
      <div className="mx-auto w-full max-w-5xl shrink-0 space-y-2 px-3 sm:px-4">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Bar period (OHLC estimate — not tick measurement)"
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
                  liveMid != null
                    ? ` · live ${liveMid.toFixed(2)}${
                        liveTransport === "stream" ? "" : ` (${liveTransport})`
                      }`
                    : " · live mid —"
                }${liveAsOf ? " · tip refresh on" : ""} · OHLC estimate`
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
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden border-y border-[var(--color-separator)] p-0"
        style={{ backgroundColor: bg }}
      >
        {hasSeries ? (
          <BinsHost
            symbol={symbol}
            tf={tf}
            seriesRev={seriesRev}
            bg={bg}
            textColor={textColor}
            liveMid={liveMid}
          />
        ) : (
          <div
            className="flex min-h-[200px] flex-1 items-center justify-center text-sm"
            style={{ color: textColor }}
          >
            {loading || !hydrated
              ? "Loading profile…"
              : "No bars for this symbol / timeframe"}
          </div>
        )}
      </div>
    </div>
  );
}
