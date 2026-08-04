import React, { useEffect, useLayoutEffect, useDeferredValue, useMemo, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CrosshairMode,
  LineStyle,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  LineSeries,
  UTCTimestamp,
  WhitespaceData,
} from 'lightweight-charts';
import { usePriceTimeCandles } from '../../lib/usePriceTimeCandles';
import { useGexData } from '../../lib/useGexData';
import { useVolumeProfile } from '../../lib/useVolumeProfile';
import { useMarketStructure } from '../../lib/useMarketStructure';
import { useAtmIv } from '../../lib/useAtmIv';
import { usePriceTimePositions } from '../../lib/usePriceTimePositions';
import { PositionBoxPrimitive } from './chart-primitives/PositionBoxPrimitive';
import type { PriceTimeDragInfo } from './chart-primitives/PositionBoxPrimitive';
import { SessionLinePrimitive, buildSessionLineData } from './chart-primitives/SessionLinePrimitive';
import { GexPrimitive } from './chart-primitives/GexPrimitive';
import { VolumeProfilePrimitive } from './chart-primitives/VolumeProfilePrimitive';
import { MarketStructurePrimitive } from './chart-primitives/MarketStructurePrimitive';
import type { RegistryEntry } from '../../types/position-intent';
import type { ChainIVMap } from '../../lib/useChainIV';
import type { VolumeProfileConfig } from './chart-primitives/VolumeProfileSettings';
import type { CanonicalStrikeMap } from '../../lib/snapToNearestStrike';
import { snapToNearestStrike } from '../../lib/snapToNearestStrike';
import { deriveCenterAndWidth } from '../../lib/intentAdapters';

// ─── Draggable status set ────────────────────────────────────────────────────
const DRAGGABLE_STATUSES = new Set(['ANALYSIS', 'PENDING']);

// ─── Strike ladder resolver ───────────────────────────────────────────────────
// Returns the valid strike list for a given expiration.
// If the expiration is not in the live chain (e.g. expired analysis position),
// falls back to the union of all available expirations — SPX/NDX share a fixed
// increment ladder so any live expiration's strikes are valid targets.
// Returns [] only when the chain is completely unavailable (no data at all).
function resolveStrikeLadder(
  canonicalStrikeMap: CanonicalStrikeMap | undefined,
  expiration: string,
): number[] {
  if (!canonicalStrikeMap) return [];
  const direct = canonicalStrikeMap[expiration];
  if (direct && direct.length > 0) return direct;
  // Expiration not in chain — build union from all available expirations
  const all = Object.values(canonicalStrikeMap).flat();
  if (all.length === 0) return [];
  return [...new Set(all)].sort((a, b) => a - b);
}

// ─── Strike hit-test radius (CSS pixels) ─────────────────────────────────────
const STRIKE_HIT_PX = 8;

// ─── Props ────────────────────────────────────────────────────────────────────

export type ChartTimeframe = '1m' | '3m' | '5m' | '10m' | '15m' | '30m' | '1h' | '2h' | '4h';

export interface PriceTimeChartProps {
  symbol: string;
  mode: 'live' | 'history';
  visible: boolean;
  timeframe?: ChartTimeframe;
  sessionOnly?: boolean;       // strip pre/post market bars
  // DELTA additions:
  entries?: RegistryEntry[];   // positions to draw boxes for
  spot?: number;               // live spot from parent
  chainIV?: ChainIVMap | null; // per-leg IV from chain — same source as Risk Graph
  gexEnabled?: boolean;
  vpEnabled?: boolean;
  vpConfig?: VolumeProfileConfig;
  msEnabled?: boolean;         // Market Structure (dealer-gravity zones)
  showSessionLines?: boolean;  // overlay session boundary lines (sub-hour only)
  // Canonical strike map for drag-snap (keyed by expiration)
  canonicalStrikeMap?: CanonicalStrikeMap;
  // Drag-to-reposition
  onRepositionStrategy?: (
    intentId: string,
    grabbedStrike: number,
    strikeOffset: number,
    shiftAll: boolean,
  ) => void;
  onSubmitIntent?: (intentId: string) => void;  // for PENDING → cancel/replace
  // Entry/exit time persistence
  onSetEntryExitTime?: (intentId: string, entryTime?: string, exitTime?: string) => void;
  /** Called once after chart mount with a function the parent can invoke to
   *  trigger an immediate auto-fit to today's session. */
  onAutoFitReady?: (fn: () => void) => void;
}

// ─── Static styles (outside component — no re-creation on render) ────────────

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(28,28,30,0.9)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 5,
  color: '#e0e0e0',
  fontSize: 11,
  padding: '2px 5px',
  colorScheme: 'dark',
};

// ─── Market-hours filter (9:30–16:00 America/New_York) ───────────────────────
function isRegularHours(unixSec: number): boolean {
  const d = new Date(unixSec * 1000);
  // Use Intl to get wall-clock time in ET (handles DST automatically)
  const etStr = d.toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false,
    hour: '2-digit', minute: '2-digit' });
  const [h, m] = etStr.split(':').map(Number);
  const totalMin = h * 60 + m;
  return totalMin >= 9 * 60 + 30 && totalMin < 16 * 60;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PriceTimeChart({
  symbol,
  mode: _mode,
  visible,
  timeframe = '5m',
  sessionOnly = false,
  entries,
  spot,
  chainIV,
  canonicalStrikeMap,
  gexEnabled,
  vpEnabled,
  vpConfig,
  msEnabled,
  showSessionLines = false,
  onRepositionStrategy,
  onSubmitIntent,
  onSetEntryExitTime,
  onAutoFitReady,
}: PriceTimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const spotLineRef = useRef<ISeriesApi<'Line'> | null>(null);
  // Invisible line series used solely to extend the time axis 45 days forward,
  // so timeToCoordinate() returns valid coords for future expiration dates.
  const whitespaceSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const posBoxRef = useRef<PositionBoxPrimitive | null>(null);
  const gexPrimRef = useRef<GexPrimitive | null>(null);
  const vpPrimRef = useRef<VolumeProfilePrimitive | null>(null);
  const msPrimRef = useRef<MarketStructurePrimitive | null>(null);
  const liveBarRef = useRef<{ time: UTCTimestamp; open: number; high: number; low: number } | null>(null);
  // Set to true once historical candles are loaded — gates the live-bar update() calls.
  const candlesLoadedRef = useRef(false);
  const sessionLinePrimRef = useRef<SessionLinePrimitive | null>(null);

  // ── Drag-to-reposition state (all refs — no React re-renders during drag) ──
  const isDraggingRef = useRef(false);
  const dragStartPriceRef = useRef(0);
  const dragIntentIdRef = useRef('');
  const dragGrabbedStrikeRef = useRef(0);
  const lastDragOffsetRef = useRef(0);
  const lastShiftKeyRef = useRef(false);
  const hoveredStrikeRef = useRef<{ intentId: string; strike: number } | null>(null);
  // Transient drop-error message
  const [dragError, setDragError] = useState<string | null>(null);

  // Stable callback refs so mouse handlers don't re-bind
  const onRepositionRef = useRef(onRepositionStrategy);
  onRepositionRef.current = onRepositionStrategy;
  const onSubmitIntentRef = useRef(onSubmitIntent);
  onSubmitIntentRef.current = onSubmitIntent;
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const positionBoundsRef = useRef<ReturnType<typeof usePriceTimePositions>>([]);
  const spotRef = useRef(spot);
  spotRef.current = spot;

  // Stable ref for canonical strike map (used inside mouse event handlers)
  const canonicalStrikeMapRef = useRef(canonicalStrikeMap);
  canonicalStrikeMapRef.current = canonicalStrikeMap;

  // Fetch 30 days of history. Default visible window = last 2 days anchored to now — see candle effect.
  const { candles } = usePriceTimeCandles(symbol, 30, timeframe);
  const { gexData } = useGexData(symbol, gexEnabled ?? false);
  const { buckets, poc, vah, val } = useVolumeProfile(symbol, 30, vpEnabled ?? false);
  const { data: msData } = useMarketStructure(msEnabled ?? false);

  // ── Entry / expiry date overrides ────────────────────────────────────────
  // datetime-local values: "YYYY-MM-DDTHH:MM" in local time.
  // Changes persist to the intent registry for all visible positions.
  const [testEntry, setTestEntry] = useState('');
  const [testExpiry, setTestExpiry] = useState('');
  const testEntryTs  = testEntry  ? new Date(testEntry).getTime()  / 1000 : undefined;
  const testExpiryTs = testExpiry ? new Date(testExpiry).getTime() / 1000 : undefined;

  // Stable ref for persistence callback (avoid re-creating handlers on every render)
  const setEntryExitRef = useRef(onSetEntryExitTime);
  setEntryExitRef.current = onSetEntryExitTime;

  // Persist entry/expiry changes to each visible position in the registry
  const handleEntryChange = useCallback((val: string) => {
    setTestEntry(val);
    const fn = setEntryExitRef.current;
    const all = entriesRef.current;
    if (!fn || !all) return;
    const iso = val ? new Date(val).toISOString() : undefined;
    for (const e of all) {
      if (e.visible) fn(e.intent.intent_id, iso, undefined);
    }
  }, []);

  const handleExpiryChange = useCallback((val: string) => {
    setTestExpiry(val);
    const fn = setEntryExitRef.current;
    const all = entriesRef.current;
    if (!fn || !all) return;
    const iso = val ? new Date(val).toISOString() : undefined;
    for (const e of all) {
      if (e.visible) fn(e.intent.intent_id, undefined, iso);
    }
  }, []);

  // ── Black-Scholes position overlay ─────────────────────────────────────────
  const atmIv = useAtmIv(symbol);
  // Extract candle timestamps to drive the bar-resolution envelope.
  // MUST match the bars actually in the chart series: when sessionOnly=true,
  // only RTH bars are fed to candleSeriesRef, so snapping entryTime to a
  // pre-market bar (from the unfiltered array) yields a timestamp that has no
  // data point in the series → timeToCoordinate() returns null → bxEntry = 0.
  const candleTimes = useMemo(
    () => {
      const src = sessionOnly
        ? candles.filter(c => isRegularHours(c.time as number))
        : candles;
      return src.map(c => c.time as number);
    },
    [candles, sessionOnly],
  );
  // When hidden, yield BSM recomputation to idle time so Risk Graph interactions
  // are never blocked. When visible, always use the live spot for fresh pricing.
  const deferredSpot = useDeferredValue(spot ?? 0);
  const positionBounds = usePriceTimePositions(entries, atmIv, chainIV, visible ? (spot ?? 0) : deferredSpot, testEntryTs, testExpiryTs, undefined, candleTimes);
  positionBoundsRef.current = positionBounds;

  // ── Strike hit-test helper ────────────────────────────────────────────────
  // Returns the intentId + strike of the nearest draggable strike line within
  // STRIKE_HIT_PX of mouseY, or null.
  const hitTestStrike = useCallback((mouseY: number): { intentId: string; strike: number } | null => {
    const series = candleSeriesRef.current;
    if (!series) return null;
    const allEntries = entriesRef.current ?? [];

    // Return the nearest strike within STRIKE_HIT_PX — not the first one found.
    // When two strike lines are close together (tight butterfly wings), the
    // minimum-distance result matches the user's expectation; first-found
    // depends on iteration order and is non-deterministic from the user's view.
    let nearest: { intentId: string; strike: number } | null = null;
    let nearestDist = STRIKE_HIT_PX + 1; // start beyond threshold

    for (const b of positionBoundsRef.current) {
      const entry = allEntries.find(e => e.intent.intent_id === b.intentId);
      if (!entry || !DRAGGABLE_STATUSES.has(entry.status)) continue;
      for (const leg of b.legs ?? []) {
        const yMedia = series.priceToCoordinate(leg.strike);
        if (yMedia === null) continue;
        const dist = Math.abs(mouseY - yMedia);
        if (dist <= STRIKE_HIT_PX && dist < nearestDist) {
          nearestDist = dist;
          nearest = { intentId: b.intentId, strike: leg.strike };
        }
      }
    }
    return nearest;
  }, []);

  // ── Chart init — runs once on mount ────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: 'rgba(128,128,128,0.15)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(128,128,128,0.15)', style: LineStyle.Dotted },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      localization: {
        // Crosshair tooltip: full date + 24h time in ET
        timeFormatter: (utcSeconds: number) => {
          return new Date(utcSeconds * 1000).toLocaleString('en-US', {
            timeZone: 'America/New_York',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (utcSeconds: number, tickMarkType: number) => {
          // LWC v5 TickMarkType: Year=0, Month=1, DayOfMonth=2, Time=3, TimeWithSeconds=4
          const d  = new Date(utcSeconds * 1000);
          const et = { timeZone: 'America/New_York' } as const;
          if (tickMarkType >= 3) {
            // Intraday time tick — "9:30", "14:00"
            const h = parseInt(d.toLocaleString('en-US', { ...et, hour: 'numeric', hour12: false }), 10);
            const m = d.toLocaleString('en-US', { ...et, minute: '2-digit' });
            return `${h}:${m}`;
          }
          if (tickMarkType === 2) {
            // Day boundary — "Mon", "Tue"
            return d.toLocaleString('en-US', { ...et, weekday: 'short' });
          }
          if (tickMarkType === 1) {
            // Month boundary — "Mar 26"
            return d.toLocaleString('en-US', { ...et, month: 'short', day: 'numeric' });
          }
          // Year boundary (0) — "2026"
          return d.toLocaleString('en-US', { ...et, year: 'numeric' });
        },
      },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    // Candlestick series
    const cs = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = cs;

    // Spot price line (amber dashed)
    const spotLine = chart.addSeries(LineSeries, {
      color: 'rgba(251, 191, 36, 0.8)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    spotLineRef.current = spotLine;

    // Invisible whitespace series — extends time axis 45 days forward AND 7
    // days backward so timeToCoordinate() returns valid coords for both future
    // expiration dates and past entry times (including after-hours creation).
    // Without backward coverage, an entry time created after market close on a
    // previous session falls in a gap (after last candle, before initNow) and
    // timeToCoordinate() returns null → bxEntry = 0 → strikes start at left edge.
    const wsSeries = chart.addSeries(LineSeries, {
      color: 'rgba(0,0,0,0)',
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: false,
    });
    whitespaceSeriesRef.current = wsSeries;
    const initNow = Math.floor(Date.now() / 1000);
    const wsData: WhitespaceData<UTCTimestamp>[] = [];
    // Start at a clean hour boundary so that Math.round(t/3600)*3600 in the
    // primitive's resolveX() always lands on an exact whitespace entry.
    // A non-aligned start (initNow - 30*86400) shifts every entry off the hour,
    // making the hourly fallback always return null → bxEntry/bxExpiry fall back
    // to 0/bitmapWidth and lines span the full chart width.
    const wsStart = Math.floor((initNow - 30 * 86400) / 3600) * 3600;
    for (let t = wsStart; t <= initNow + 45 * 86400; t += 3600) {
      wsData.push({ time: t as UTCTimestamp });
    }
    wsSeries.setData(wsData);

    // PositionBoxPrimitive — attach to candlestick series
    const boxPrim = new PositionBoxPrimitive({ showLossBand: false });
    cs.attachPrimitive(boxPrim);
    posBoxRef.current = boxPrim;

    // Register the imperative auto-fit function with the parent.
    // Called when the Time view is revealed or the user clicks the Time button.
    // Reads positionBoundsRef (always current) so it never captures stale data.
    if (onAutoFitReady) {
      onAutoFitReady(() => {
        const c = chartRef.current;
        const cs = candleSeriesRef.current;
        if (!c || !cs) return;

        // Resize: chart dimensions may be zero if it was hidden (display:none)
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) c.resize(rect.width, rect.height);
        }

        const bounds = positionBoundsRef.current;

        // ── Time axis: entry → expiration with padding ───────────────────────
        if (bounds.length > 0) {
          const minEntry  = Math.min(...bounds.map(b => b.entryTime));
          const maxExpiry = Math.max(...bounds.map(b => b.expirationTime));
          const span    = maxExpiry - minEntry;
          const timePad = Math.max(1800, span * 0.05);
          c.timeScale().setVisibleRange({
            from: (minEntry  - timePad) as UTCTimestamp,
            to:   (maxExpiry + timePad) as UTCTimestamp,
          });
        }

        // ── Price axis: strikes ± 75 fixed padding ───────────────────────────
        // Collect all leg strikes across all positions. theoSegments are P&L-space
        // values (not price-space) and must NOT be used for Y-range computation.
        const allStrikes: number[] = [];
        for (const b of bounds) {
          for (const leg of b.legs ?? []) {
            allStrikes.push(leg.strike);
          }
        }

        if (allStrikes.length > 0) {
          const minPrice = Math.min(...allStrikes) - 75;
          const maxPrice = Math.max(...allStrikes) + 75;
          cs.applyOptions({
            autoscaleInfoProvider: () => ({
              priceRange: {
                minValue: minPrice,
                maxValue: maxPrice,
              },
            }),
          });
          c.priceScale('right').applyOptions({ autoScale: true });
        }

        // Reset hash so next strategy change triggers a fresh fit
        prevStratHashRef.current = '';
      });
    }

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      spotLineRef.current = null;
      whitespaceSeriesRef.current = null;
      posBoxRef.current = null;
      gexPrimRef.current = null;
      vpPrimRef.current = null;
      msPrimRef.current = null;
      candlesLoadedRef.current = false;
    };
  }, []);

  // ── ResizeObserver — keeps chart sized to container ─────────────────────────
  useEffect(() => {
    if (!containerRef.current || !chartRef.current) return;
    const observer = new ResizeObserver(observerEntries => {
      const entry = observerEntries[0];
      if (entry) {
        chartRef.current?.resize(
          entry.contentRect.width,
          entry.contentRect.height,
        );
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // ── Drag-to-reposition mouse handlers ─────────────────────────────────────
  // Attached once to the chart container. Uses refs for all mutable state so
  // there is zero React re-render during the drag — only the primitive repaints.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const series = candleSeriesRef.current;

      if (isDraggingRef.current && series) {
        // ── Active drag: snap to nearest chain strike for visual detent ──
        const currentPrice = series.coordinateToPrice(mouseY);
        if (currentPrice === null) return;
        const rawOffset = currentPrice - dragStartPriceRef.current;

        // Resolve chain strikes for the dragged intent's expiration.
        // If chain data is unavailable, freeze the position in place — a
        // non-chain strike must never be shown or committed.
        const dragEntry = (entriesRef.current ?? []).find(
          en => en.intent.intent_id === dragIntentIdRef.current,
        );
        const dragExp = dragEntry?.intent.legs[0]?.expiration ?? '';
        let dragStrikes = resolveStrikeLadder(canonicalStrikeMapRef.current, dragExp);

        if (dragStrikes.length === 0) {
          // Chain unavailable (market closed / pipeline not running).
          // Synthesize a ladder from the position's own leg strikes so drag
          // works during development and weekend testing. The increment is
          // inferred from the minimum non-zero spacing between legs, defaulting
          // to 5 (the standard SPX/NDX weekly increment).
          const legStrikes = (dragEntry?.intent.legs ?? [])
            .map(l => l.strike)
            .sort((a, b) => a - b);
          let increment = 5;
          if (legStrikes.length >= 2) {
            for (let i = 1; i < legStrikes.length; i++) {
              const d = legStrikes[i] - legStrikes[i - 1];
              if (d > 0) increment = Math.min(increment, d);
            }
          }
          const grabbed = dragGrabbedStrikeRef.current;
          const base = Math.round(grabbed / increment) * increment;
          dragStrikes = Array.from({ length: 81 }, (_, i) => base + (i - 40) * increment);
        }

        // Snap grabbed strike to nearest chain strike — strict detent, no in-between.
        const rawTarget = dragGrabbedStrikeRef.current + rawOffset;
        const offset = snapToNearestStrike(rawTarget, dragStrikes) - dragGrabbedStrikeRef.current;

        if (offset !== lastDragOffsetRef.current || e.shiftKey !== lastShiftKeyRef.current) {
          lastDragOffsetRef.current = offset;
          lastShiftKeyRef.current = e.shiftKey;
          posBoxRef.current?.setDragInfo({
            intentId: dragIntentIdRef.current,
            grabbedStrike: dragGrabbedStrikeRef.current,
            offset,
            shiftKey: e.shiftKey,
          });
        }
        return;
      }

      // ── Hover: hit-test strike lines ──────────────────────────────────
      const hit = hitTestStrike(mouseY);
      const prev = hoveredStrikeRef.current;
      if (hit?.intentId !== prev?.intentId || hit?.strike !== prev?.strike) {
        hoveredStrikeRef.current = hit;
        posBoxRef.current?.setHighlight(hit);
        el.style.cursor = hit ? 'grab' : '';

        // Disable LWC pan/zoom while hovering over a draggable strike so that
        // the subsequent mousedown is not captured as a pan gesture before our
        // drag handler can claim it. Re-enable immediately when the cursor leaves
        // the strike zone. No effect during an active drag (already disabled).
        if (!isDraggingRef.current) {
          chartRef.current?.applyOptions({
            handleScroll: hit === null,
            handleScale: hit === null,
          });
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left-click only
      const hit = hoveredStrikeRef.current;
      if (!hit) return;

      const series = candleSeriesRef.current;
      if (!series) return;

      const rect = el.getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const price = series.coordinateToPrice(mouseY);
      if (price === null) return;

      isDraggingRef.current = true;
      dragStartPriceRef.current = price;
      dragIntentIdRef.current = hit.intentId;
      dragGrabbedStrikeRef.current = hit.strike;
      lastDragOffsetRef.current = 0;
      lastShiftKeyRef.current = e.shiftKey;
      el.style.cursor = 'grabbing';

      // Set drag state immediately so the strike turns amber before first move
      posBoxRef.current?.setDragInfo({
        intentId: hit.intentId,
        grabbedStrike: hit.strike,
        offset: 0,
        shiftKey: e.shiftKey,
      });

      chartRef.current?.applyOptions({ handleScroll: false, handleScale: false });

      e.preventDefault();
      // stopImmediatePropagation: prevent any same-phase listener (including LWC's
      // document-level capture handler, if any) from also acting on this mousedown.
      e.stopImmediatePropagation();
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const offset = lastDragOffsetRef.current;
      const intentId = dragIntentIdRef.current;
      const grabbedStrike = dragGrabbedStrikeRef.current;
      const shiftKey = lastShiftKeyRef.current;

      isDraggingRef.current = false;
      lastDragOffsetRef.current = 0;
      posBoxRef.current?.setDragInfo(null);
      el.style.cursor = '';

      chartRef.current?.applyOptions({ handleScroll: true, handleScale: true });

      // offset is already chain-snapped from mousemove — use directly (no double-snap)
      if (offset === 0) return;

      // Force auto-fit on next render — equivalent to Risk Graph's pnlChartRef.current?.autoFit()
      // called immediately after onRepositionStrategy(). Resetting prevStratHashRef guarantees
      // strategyChanged=true on the positionBounds re-render that follows the registry update,
      // regardless of how the drag preview modified the ref during the drag gesture.
      prevStratHashRef.current = '';

      onRepositionRef.current?.(intentId, grabbedStrike, offset, shiftKey);

      const entry = (entriesRef.current ?? []).find(
        en => en.intent.intent_id === intentId,
      );
      if (entry?.status === 'PENDING') {
        setTimeout(() => onSubmitIntentRef.current?.(intentId), 100);
      }
    };

    const handleMouseLeave = () => {
      if (isDraggingRef.current) {
        // Treat leaving the chart as dropping
        handleMouseUp(new MouseEvent('mouseup'));
      }
      if (hoveredStrikeRef.current) {
        hoveredStrikeRef.current = null;
        posBoxRef.current?.setHighlight(null);
        el.style.cursor = '';
      }
      // Restore LWC scroll/scale if the cursor leaves while hovering a strike
      // (user hovered but did not click — no drag, no mouseup to restore it).
      if (!isDraggingRef.current) {
        chartRef.current?.applyOptions({ handleScroll: true, handleScale: true });
      }
    };

    // mousemove: element-level bubble for hover hit-test. Also registered at document
    // level so active drags track the cursor even when it leaves the chart container.
    el.addEventListener('mousemove', handleMouseMove);
    const handleMouseMoveDoc = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;       // only needed for out-of-container tracking
      if (el.contains(e.target as Node)) return; // already handled by el listener above
      handleMouseMove(e);
    };
    document.addEventListener('mousemove', handleMouseMoveDoc);

    el.addEventListener('mouseleave', handleMouseLeave);

    // mousedown: document capture — fires before ANY element-level listener, including
    // LWC's own capture-phase pan handler registered on the container during chart init.
    // Element-level capture fires after document capture, so using the element was always
    // losing the race when LWC called stopImmediatePropagation() on the same element.
    // Gate: only act when the event target is inside our container.
    const handleMouseDownDoc = (e: MouseEvent) => {
      if (!el.contains(e.target as Node)) return;
      handleMouseDown(e);
    };
    document.addEventListener('mousedown', handleMouseDownDoc, { capture: true });

    // mouseup: document capture — catches release outside the container (drag-and-release
    // beyond the chart edge) so the drop is always committed, not silently dropped.
    const handleMouseUpDoc = (e: MouseEvent) => {
      handleMouseUp(e);
    };
    document.addEventListener('mouseup', handleMouseUpDoc, { capture: true });

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mousemove', handleMouseMoveDoc);
      document.removeEventListener('mousedown', handleMouseDownDoc, { capture: true });
      document.removeEventListener('mouseup', handleMouseUpDoc, { capture: true });
    };
  }, [hitTestStrike]);

  // ── Historical candle data — fires on candle poll (60s), session filter, or
  // timeframe change. Calls setData() once with the full history slice.
  // Whitespace extension is handled separately by whitespaceSeriesRef.
  const initialRangeSetRef = useRef(false);
  useEffect(() => {
    if (!candleSeriesRef.current || candles.length === 0) return;

    const stepSec = timeframe === '4h' ? 14400 : timeframe === '2h' ? 7200 : timeframe === '1h' ? 3600 : timeframe === '30m' ? 1800 : timeframe === '15m' ? 900 : timeframe === '3m' ? 180 : timeframe === '1m' ? 60 : 300;
    const nowSec = Math.floor(Date.now() / 1000);
    const barTime = (Math.floor(nowSec / stepSec) * stepSec) as UTCTimestamp;

    const display = sessionOnly
      ? candles.filter(c => isRegularHours(c.time as number))
      : candles;

    // Exclude the current bar bucket — the live-bar effect owns that slot.
    const history = display.filter(c => (c.time as number) < barTime);

    // Reset live bar on timeframe/session change so update() starts fresh.
    liveBarRef.current = null;

    candleSeriesRef.current.setData(history);
    candlesLoadedRef.current = true;

    // When RTH-only is active, build a whitespace series that covers ONLY
    // trading hours (8am–5pm ET per day).  Overnight hours must be absent so
    // LWC finds no data there and collapses the gap between sessions — that is
    // the RTH compression effect the user sees.  We also add explicit entries
    // at every session boundary (9:30, 12:30, 14:30, 16:00) so that
    // timeToCoordinate() always resolves for session label / position overlay use.
    if (sessionOnly && whitespaceSeriesRef.current) {
      // DST-aware: compute UTC seconds for an ET wall-clock time on the
      // calendar day that contains anchorUtcSec.
      const etToUtc = (anchorUtcSec: number, etHour: number, etMin: number): number => {
        const d = new Date(anchorUtcSec * 1000);
        const etHourCurrent = parseInt(
          d.toLocaleString('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false }), 10,
        );
        const offsetHours = ((d.getUTCHours() - etHourCurrent) + 24) % 24;
        const et = d.toLocaleString('en-US', {
          timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour12: false,
        });
        const [mo, dy, yr] = et.split(',')[0].trim().split('/').map(Number);
        return Date.UTC(yr, mo - 1, dy, etHour + offsetHours, etMin, 0) / 1000;
      };

      const wsSet = new Set<number>();
      for (let anchor = nowSec - 30 * 86400; anchor <= nowSec + 45 * 86400; anchor += 86400) {
        // Hourly markers 8am–5pm ET: covers pre-open context + all RTH + buffer.
        // Leaving overnight hours absent lets LWC compress those gaps to zero.
        for (let h = 8; h <= 17; h++) wsSet.add(etToUtc(anchor, h, 0));
        // Exact session boundary times (9:30 / 12:30 / 14:30 / 16:00 ET) so
        // timeToCoordinate() resolves precisely for session labels and position boxes.
        for (const [h, m] of [[9, 30], [12, 30], [14, 30], [16, 0]] as [number, number][]) {
          wsSet.add(etToUtc(anchor, h, m));
        }
      }

      const wsData: WhitespaceData<UTCTimestamp>[] = Array.from(wsSet)
        .sort((a, b) => a - b)
        .map(t => ({ time: t as UTCTimestamp }));
      whitespaceSeriesRef.current.setData(wsData);
    }

    if (!initialRangeSetRef.current && chartRef.current) {
      initialRangeSetRef.current = true;
      chartRef.current.timeScale().setVisibleRange({
        from: (nowSec - 2 * 86400) as UTCTimestamp,
        to:   (nowSec + 3600)      as UTCTimestamp,
      });
    }
  }, [candles, sessionOnly, timeframe]);

  // ── Live bar — fires on every spot tick (≈1s). Uses series.update() which
  // appends or updates the last bar in place — no full series rebuild.
  // Whitespace lives on a separate series so update() is never blocked.
  useEffect(() => {
    if (!candleSeriesRef.current || !spot || spot <= 0 || !candlesLoadedRef.current) return;

    const stepSec = timeframe === '4h' ? 14400 : timeframe === '2h' ? 7200 : timeframe === '1h' ? 3600 : timeframe === '30m' ? 1800 : timeframe === '15m' ? 900 : timeframe === '3m' ? 180 : timeframe === '1m' ? 60 : 300;
    const nowSec = Math.floor(Date.now() / 1000);
    const barTime = (Math.floor(nowSec / stepSec) * stepSec) as UTCTimestamp;

    const prev = liveBarRef.current;
    if (!prev || (prev.time as number) !== barTime) {
      liveBarRef.current = { time: barTime, open: spot, high: spot, low: spot };
    } else {
      liveBarRef.current = {
        time: barTime,
        open: prev.open,
        high: Math.max(prev.high, spot),
        low:  Math.min(prev.low,  spot),
      };
    }

    candleSeriesRef.current.update({
      time:  liveBarRef.current.time,
      open:  liveBarRef.current.open,
      high:  liveBarRef.current.high,
      low:   liveBarRef.current.low,
      close: spot,
    });
  }, [spot, timeframe]);

  // ── GEX primitive: attach/detach on toggle ──────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (gexEnabled && gexPrimRef.current === null) {
      const gex = new GexPrimitive({ mode: 'combined' });
      candleSeriesRef.current.attachPrimitive(gex);
      gexPrimRef.current = gex;
    } else if (!gexEnabled && gexPrimRef.current !== null) {
      candleSeriesRef.current.detachPrimitive(gexPrimRef.current);
      gexPrimRef.current = null;
    }
  }, [gexEnabled]);

  // ── GEX data update ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (gexPrimRef.current && gexData.length > 0) {
      gexPrimRef.current.updateData(gexData);
    }
  }, [gexData]);

  // ── VP primitive: attach/detach on toggle ───────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (vpEnabled && vpPrimRef.current === null) {
      const alpha = vpConfig ? (100 - vpConfig.transparency) / 100 : 0.65;
      const vp = new VolumeProfilePrimitive({
        color: vpConfig?.color ?? '#3b82f6',
        alpha,
        maxBarWidthPercent: vpConfig?.widthPercent ?? 30,
      });
      candleSeriesRef.current.attachPrimitive(vp);
      vpPrimRef.current = vp;
    } else if (!vpEnabled && vpPrimRef.current !== null) {
      candleSeriesRef.current.detachPrimitive(vpPrimRef.current);
      vpPrimRef.current = null;
    }
  }, [vpEnabled]);

  // ── VP data update ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (vpPrimRef.current && buckets.length > 0) {
      vpPrimRef.current.updateData(buckets);
      vpPrimRef.current.updateOptions({ poc, vah, val });
    }
  }, [buckets, poc, vah, val]);

  // ── VP config update (color/transparency/width) ─────────────────────────────
  useEffect(() => {
    if (!vpPrimRef.current || !vpConfig) return;
    vpPrimRef.current.updateOptions({
      color: vpConfig.color,
      alpha: (100 - vpConfig.transparency) / 100,
      maxBarWidthPercent: vpConfig.widthPercent,
    });
  }, [vpConfig]);

  // ── MS primitive: attach/detach on toggle ───────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (msEnabled && msPrimRef.current === null) {
      const ms = new MarketStructurePrimitive();
      candleSeriesRef.current.attachPrimitive(ms);
      msPrimRef.current = ms;
    } else if (!msEnabled && msPrimRef.current !== null) {
      candleSeriesRef.current.detachPrimitive(msPrimRef.current);
      msPrimRef.current = null;
    }
  }, [msEnabled]);

  // ── MS data update ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (msPrimRef.current) {
      msPrimRef.current.updateData(msData);
    }
  }, [msData]);

  // ── Session lines: sub-hour timeframes only ──────────────────────────────────
  const SUB_HOUR_TFS = new Set<ChartTimeframe>(['1m', '3m', '5m', '10m', '15m', '30m']);
  const sessionLinesActive = showSessionLines && SUB_HOUR_TFS.has(timeframe ?? '5m');

  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (sessionLinesActive && sessionLinePrimRef.current === null) {
      const prim = new SessionLinePrimitive();
      candleSeriesRef.current.attachPrimitive(prim);
      sessionLinePrimRef.current = prim;
    } else if (!sessionLinesActive && sessionLinePrimRef.current !== null) {
      candleSeriesRef.current.detachPrimitive(sessionLinePrimRef.current);
      sessionLinePrimRef.current = null;
    }
  }, [sessionLinesActive]);

  // ── Session line data update ─────────────────────────────────────────────────
  useEffect(() => {
    if (!sessionLinePrimRef.current || !sessionLinesActive) return;
    const timestamps = candles.map(c => c.time as number);
    sessionLinePrimRef.current.update(buildSessionLineData(timestamps));
  }, [candles, sessionLinesActive]);

  // ── Pre-render: resize LWC before first paint when chart becomes visible ────
  // useLayoutEffect fires synchronously after DOM mutations but before the browser
  // paints — ensures LWC has correct dimensions on the very first visible frame
  // so there is no blank-then-rendered flash. positionBoundsRef and
  // candlesLoadedRef are refs so they are always current without being deps.
  useLayoutEffect(() => {
    if (!visible || !chartRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      chartRef.current.resize(rect.width, rect.height);
    }
    // Auto-fit time range immediately so the first painted frame is already
    // centred on the position lifecycle, not the default candle range.
    const bounds = positionBoundsRef.current;
    if (bounds.length > 0 && candlesLoadedRef.current) {
      const minEntry  = Math.min(...bounds.map(b => b.entryTime));
      const maxExpiry = Math.max(...bounds.map(b => b.expirationTime));
      const span      = maxExpiry - minEntry;
      const timePad   = Math.max(1800, span * 0.05);
      chartRef.current.timeScale().setVisibleRange({
        from: (minEntry - timePad) as UTCTimestamp,
        to:   (maxExpiry + timePad) as UTCTimestamp,
      });
    }
  }, [visible]);

  // ── Position box update + auto-fit ─────────────────────────────────────────
  // Mirrors the Risk Graph's auto-fit behavior: when the strategy changes or the
  // chart becomes visible, fit both axes to show the full position range.
  //
  // IMPORTANT: setVisibleRange throws "Value is null" on an empty chart (LWC
  // calls ensureNotNull(timeToIndex) internally). Guard with candles.length so
  // we only adjust the range after the chart has at least one data point.
  const prevStratHashRef = useRef('');
  const prevVisibleRef = useRef(visible);

  useEffect(() => {
    if (!posBoxRef.current || !chartRef.current || !candleSeriesRef.current) return;
    posBoxRef.current.updateData(positionBounds);

    if (candles.length === 0) {
      prevVisibleRef.current = visible;
      return;
    }

    // Detect strategy change (same approach as Risk Graph's strategyHash)
    const becameVisible = visible && !prevVisibleRef.current;
    const stratHash = positionBounds
      .flatMap(b => (b.legs ?? []).map(l => `${l.strike}:${l.option_type}`))
      .sort()
      .join(',');
    const strategyChanged = stratHash !== prevStratHashRef.current && stratHash !== '';

    prevStratHashRef.current = stratHash;
    prevVisibleRef.current = visible;

    const shouldAutoFit = strategyChanged || becameVisible;

    // ── Time axis ──────────────────────────────────────────────────────────
    // Only refit on auto-fit events (strategy change or became visible) so the
    // user's pan/zoom is preserved between spot ticks.
    const ts = chartRef.current.timeScale();

    if (shouldAutoFit && positionBounds.length > 0) {
      const minEntry  = Math.min(...positionBounds.map(b => b.entryTime));
      const maxExpiry = Math.max(...positionBounds.map(b => b.expirationTime));
      const span      = maxExpiry - minEntry;
      const timePad   = Math.max(1800, span * 0.05);
      ts.setVisibleRange({
        from: (minEntry  - timePad) as UTCTimestamp,
        to:   (maxExpiry + timePad) as UTCTimestamp,
      });
    }

    // ── Price axis: strikes ± 75 fixed padding ───────────────────────────────
    // theoSegments are P&L-space values, not price-space — must not be used here.
    // Only applied on shouldAutoFit so user pan/zoom is preserved mid-session.
    if (shouldAutoFit) {
      const allStrikes: number[] = [];
      for (const b of positionBounds) {
        for (const leg of b.legs ?? []) {
          allStrikes.push(leg.strike);
        }
      }

      if (allStrikes.length > 0) {
        const minPrice = Math.min(...allStrikes) - 75;
        const maxPrice = Math.max(...allStrikes) + 75;
        candleSeriesRef.current.applyOptions({
          autoscaleInfoProvider: () => ({
            priceRange: {
              minValue: minPrice,
              maxValue: maxPrice,
            },
          }),
        });
        chartRef.current.priceScale('right').applyOptions({ autoScale: true });
      }
    }
  }, [positionBounds, candles.length, visible, spot]);

  // ── Spot line update ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!spotLineRef.current || !spot || spot <= 0) return;
    const now = Math.floor(Date.now() / 1000) as UTCTimestamp;
    const past = (now - 90 * 86400) as UTCTimestamp;
    spotLineRef.current.setData([
      { time: past, value: spot },
      { time: now, value: spot },
    ]);
  }, [spot]);

  const hasOverride = testEntry !== '' || testExpiry !== '';

  // Auto-clear drag error after 2.5 seconds
  useEffect(() => {
    if (!dragError) return;
    const t = setTimeout(() => setDragError(null), 2500);
    return () => clearTimeout(t);
  }, [dragError]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: visible ? 'block' : 'none' }}>
      {/* Chart canvas */}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      {/* Drop-error message — transient, auto-clears after 2.5s */}
      {dragError && (
        <div style={{
          position: 'absolute',
          bottom: 48,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 25,
          background: 'rgba(239, 68, 68, 0.9)',
          borderRadius: 6,
          padding: '6px 14px',
          color: '#fff',
          fontSize: 11,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {dragError}
        </div>
      )}

      {/* Test controls — position box time override */}
      <div style={{
        position: 'absolute',
        top: 8,
        left: 8,
        zIndex: 20,
        display: 'flex',
        gap: 6,
        alignItems: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        padding: '4px 10px',
        borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ color: '#888', fontSize: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Override</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa', fontSize: 11 }}>
          Entry
          <input
            type="datetime-local"
            value={testEntry}
            onChange={e => handleEntryChange(e.target.value)}
            style={INPUT_STYLE}
          />
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#aaa', fontSize: 11 }}>
          Expiry
          <input
            type="datetime-local"
            value={testExpiry}
            onChange={e => handleExpiryChange(e.target.value)}
            style={INPUT_STYLE}
          />
        </label>
        {hasOverride && (
          <button
            onClick={() => { handleEntryChange(''); handleExpiryChange(''); }}
            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
            title="Clear test overrides"
          >×</button>
        )}
      </div>
    </div>
  );
}
