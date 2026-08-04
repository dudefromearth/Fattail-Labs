import React, { useEffect, useRef } from 'react';
import {
  createChart,
  CrosshairMode,
  LineStyle,
  IChartApi,
  ISeriesApi,
  CandlestickSeries,
  UTCTimestamp,
} from 'lightweight-charts';
import { usePriceTimeCandles } from '../../lib/usePriceTimeCandles';
import { useHistoryEntries } from '../../lib/useHistoryEntries';

// ─── Pure P&L helpers (copied from PriceTimeChart — pure math, no shared import) ──

function expirationPnL(
  legs: Array<{ strike: number; option_type: string; quantity: number; entry_price: number }>,
  price: number,
): number {
  return legs.reduce((sum, leg) => {
    const intrinsic =
      leg.option_type === 'call'
        ? Math.max(0, price - leg.strike)
        : Math.max(0, leg.strike - price);
    return sum + leg.quantity * (intrinsic - leg.entry_price) * 100;
  }, 0);
}

function findBreakevenPrices(
  legs: Array<{ strike: number; option_type: string; quantity: number; entry_price: number }>,
  _spot: number,
): number[] {
  const strikes = legs.map(l => l.strike);
  const minP = Math.min(...strikes) * 0.85;
  const maxP = Math.max(...strikes) * 1.15;
  const step = (maxP - minP) / 300;

  const breakevens: number[] = [];
  let prevPnl = expirationPnL(legs, minP);

  for (let price = minP + step; price <= maxP; price += step) {
    const pnl = expirationPnL(legs, price);
    if (prevPnl * pnl < 0) {
      const t = prevPnl / (prevPnl - pnl);
      breakevens.push(price - step + t * step);
    }
    prevPnl = pnl;
  }

  return breakevens;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PriceTimeHistoryProps {
  symbol: string;
  visible: boolean;
}

// Price line reference for cleanup
interface PriceLineRef {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  line: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PriceTimeHistory({ symbol, visible }: PriceTimeHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const priceLinesRef = useRef<PriceLineRef[]>([]);

  const { candles } = usePriceTimeCandles(symbol, 90);
  const { entries } = useHistoryEntries(symbol, visible);

  // ── Chart init — runs once on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'var(--text-primary, #e0e0e0)',
      },
      grid: {
        vertLines: { color: 'rgba(128,128,128,0.15)', style: LineStyle.Dotted },
        horzLines: { color: 'rgba(128,128,128,0.15)', style: LineStyle.Dotted },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderVisible: false },
      localization: {
        timeFormatter: (utcSeconds: number) => {
          return new Date(utcSeconds * 1000).toLocaleTimeString('en-US', {
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (utcSeconds: number, tickMarkType: any) => {
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const includeDate = tickMarkType >= 2;
          return new Date(utcSeconds * 1000).toLocaleString('en-US', {
            timeZone: tz,
            ...(includeDate ? { month: 'short', day: 'numeric' } : {}),
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          });
        },
      },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    const cs = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });
    candleSeriesRef.current = cs;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      priceLinesRef.current = [];
    };
  }, []);

  // ── ResizeObserver ───────────────────────────────────────────────────────────
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

  // ── Candle data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (candleSeriesRef.current && candles.length > 0) {
      candleSeriesRef.current.setData(candles);
      chartRef.current?.timeScale().fitContent();
    }
  }, [candles]);

  // ── Draw closed position price lines ────────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current) return;

    // Remove all existing price lines
    for (const ref of priceLinesRef.current) {
      try {
        candleSeriesRef.current.removePriceLine(ref.line);
      } catch {
        // Line may already be removed — ignore
      }
    }
    priceLinesRef.current = [];

    if (!entries || entries.length === 0) return;

    const AMBER_STROKE = 'rgba(251, 191, 36, 0.8)';

    for (const entry of entries) {
      const legs = entry.intent.legs;
      if (!legs || legs.length < 1) continue;

      const frozenSpot = entry.intent.frozen_spot ?? 5000;
      const legsForCalc = legs as unknown as Array<{
        strike: number;
        option_type: string;
        quantity: number;
        entry_price: number;
      }>;

      const breakevens = findBreakevenPrices(legsForCalc, frozenSpot);
      if (breakevens.length < 2) continue;

      const lower = Math.min(...breakevens);
      const upper = Math.max(...breakevens);
      const label = entry.intent.notation || 'CLOSED';

      // Upper breakeven line — labeled
      const upperLine = candleSeriesRef.current.createPriceLine({
        price: upper,
        color: AMBER_STROKE,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: label,
      });

      // Lower breakeven line — unlabeled (avoids clutter)
      const lowerLine = candleSeriesRef.current.createPriceLine({
        price: lower,
        color: AMBER_STROKE,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: false,
        title: '',
      });

      priceLinesRef.current.push({ line: upperLine }, { line: lowerLine });
    }
  }, [entries]);

  // ── Entry time placeholder line — shows approximate position creation ───────
  // (Will be replaced by actual entry timestamp when GOLF adds created_at to RegistryEntry)
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;
    // No-op placeholder — time-axis markers require series markers or
    // a custom primitive. Deferred to GOLF phase.
  }, [entries]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: visible ? 'block' : 'none',
      }}
    />
  );
}
