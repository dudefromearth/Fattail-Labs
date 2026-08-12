/**
 * PnLChart - Custom Canvas-based P&L chart (Labs risk-graph presentation)
 *
 * Heritage: MSC Risk Graph 2D chart UX (interaction grammar only).
 * Re-typed for Labs; no MSC runtime import. Pricing SoR is OPF (DL-293, DL-302).
 *
 * Simple, no-nonsense charting:
 * - Auto-fit on load or when data changes
 * - Drag to pan
 * - Scroll to zoom
 * - Click Auto-Fit button to reset view
 */

import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle, useState } from 'react';
import {
  atmCenteredXRange,
  fitPnlYRange,
  AUTOFIT_PAD_FRAC,
  EXP_BREAKEVEN_MAX_VIEWPORT_FRAC,
  type AutofitProfile,
} from '@/lib/risk-graph/pricing/autofitView';

export interface PnLPoint {
  price: number;
  pnl: number;
}

export type PriceAlertType = 'price_above' | 'price_below' | 'price_touch';

/** Backdrop render props - passed to backdrop component */
export interface BackdropRenderProps {
  /** Chart area width (excluding padding) */
  width: number;
  /** Chart area height (excluding padding) */
  height: number;
  /** Minimum price in current view (X-axis) */
  priceMin: number;
  /** Maximum price in current view (X-axis) */
  priceMax: number;
  /** Current spot price */
  spotPrice: number;
}

/** P&L zone annotation rendered on the chart */
export interface PnLAlertZone {
  type: 'profit_target' | 'trailing_stop_hwm' | 'trailing_stop_level' | 'theta_gamma_zone';
  pnlValue?: number;       // For horizontal lines at P&L level
  priceLow?: number;        // For vertical shaded zones
  priceHigh?: number;
  color: string;
  label: string;
  style: 'dashed' | 'solid' | 'shaded';
}

export interface PnLChartProps {
  expirationData: PnLPoint[];
  theoreticalData: PnLPoint[];
  /** High-res server curve — replaces theoreticalData for rendering when present */
  hiResTheoreticalData?: PnLPoint[] | null;
  /** Stroke for primary T+0 series (Mkt magenta or Theo orange). Default magenta. */
  theoreticalStroke?: string;
  /** Legend label for primary T+0 (e.g. "Real-Time (Mkt)"). Default "Real-Time". */
  theoreticalLegendLabel?: string;
  /**
   * Optional secondary T+0 series (Both mode: Theo under Mkt).
   * Drawn before primary so primary stays on top.
   */
  secondaryTheoreticalData?: PnLPoint[];
  secondaryTheoreticalStroke?: string;
  secondaryTheoreticalLegendLabel?: string;
  spotPrice: number;
  /** If provided, draw the spot indicator line here instead of at spotPrice.
   *  spotPrice continues to control axis bounds and auto-fit. */
  spotIndicatorPrice?: number;
  expirationBreakevens: number[];
  theoreticalBreakevens: number[];
  strikes: number[];
  onOpenAlertDialog?: (price: number, type: PriceAlertType) => void;
  alertLines?: { price: number; color: string; label?: string; style?: 'dashed' | 'solid' | 'dimmed' | 'active' }[];
  /** P&L alert zones - horizontal lines and shaded regions */
  pnlAlertZones?: PnLAlertZone[];
  /** Faded curves for sim-expired strategies */
  expiredExpirationData?: PnLPoint[];
  expiredTheoreticalData?: PnLPoint[];
  /** Optional backdrop render function - rendered behind chart */
  renderBackdrop?: (props: BackdropRenderProps) => React.ReactNode;
  /** GEX data — used to fit x-axis when no positions are loaded (priority 2) */
  gexByStrike?: Record<number, { calls: number; puts: number }>;
  /** VP profile — used to fit x-axis when no positions or GEX are loaded (priority 3) */
  vpProfile?: { bins: number[]; min: number; step: number };
  /** Map of strike price → strategy ID for drag hit detection */
  strikeToStrategyId?: Map<number, string>;
/** Strike drag-to-reposition callback. info during drag, null on release (commit). */
  onStrikeDrag?: (info: StrikeDragInfo | null) => void;
  /** Right-click near a curve fires this instead of the price context menu */
  onCurveContextMenu?: (price: number, pnl: number, curveType: 'expiration' | 'theoretical', event: React.MouseEvent) => void;
  /** Position labels for context menu — each is slash-joined strikes with P/C (e.g. "6595C/6625C/6655C") */
  positionLabels?: { id: string; strikesLabel: string }[];
  /** Callback when user selects a position from context menu for a position-specific alert */
  onPositionAlertSelect?: (positionId: string, price: number) => void;
  /**
   * Autofit profile. `time_spread` (calendar/diagonal): mild Y soft-cap so
   * residual peaks don't hide −debit.
   */
  autofitProfile?: AutofitProfile;
  /**
   * Full price width of the PROB 1σ band (hi − lo). Autofit X uses a window
   * where 1σ = 1/3 of the viewport (never less); structure wins if wider.
   */
  oneSigmaBandWidth?: number;
  // Note: left-click on highlighted curve opens position-only context menu inline (no external callback needed)
}

/** Info emitted during a strike drag operation */
export interface StrikeDragInfo {
  strategyId: string;
  grabbedStrike: number; // original strike value before drag
  offset: number;        // snapped offset in price points
  shiftKey: boolean;     // true = move all legs, false = move only grabbed leg
}

export interface PnLChartHandle {
  autoFit: () => void;
}

interface ViewState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const PADDING = { top: 40, right: 20, bottom: 50, left: 60 };
const CURVE_HIT_DISTANCE = 8; // px

/** Linearly interpolate P&L at a given price from sorted PnLPoint array. */
function findPnLAtPrice(data: PnLPoint[], price: number): number | null {
  if (data.length < 2) return null;
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1];
    const curr = data[i];
    if ((prev.price <= price && curr.price >= price) || (prev.price >= price && curr.price <= price)) {
      const t = (price - prev.price) / (curr.price - prev.price);
      return prev.pnl + t * (curr.pnl - prev.pnl);
    }
  }
  return null;
}

const DEFAULT_T0_STROKE = '#e879f9';
const DEFAULT_T0_SECONDARY_STROKE = '#f97316';

const PnLChart = forwardRef<PnLChartHandle, PnLChartProps>(({
  expirationData,
  theoreticalData: theoreticalDataRaw,
  hiResTheoreticalData,
  theoreticalStroke = DEFAULT_T0_STROKE,
  theoreticalLegendLabel = 'Real-Time',
  secondaryTheoreticalData = [],
  secondaryTheoreticalStroke = DEFAULT_T0_SECONDARY_STROKE,
  secondaryTheoreticalLegendLabel = 'Real-Time (Theo)',
  spotPrice,
  spotIndicatorPrice,
  expirationBreakevens,
  theoreticalBreakevens,
  strikes,
  onOpenAlertDialog,
  alertLines = [],
  pnlAlertZones = [],
  expiredExpirationData = [],
  expiredTheoreticalData = [],
  renderBackdrop,
  strikeToStrategyId,
  onStrikeDrag,
  onCurveContextMenu,
  positionLabels = [],
  onPositionAlertSelect,
  gexByStrike,
  vpProfile,
  autofitProfile = 'default',
  oneSigmaBandWidth,
}, ref) => {
  // Use hi-res server curve when available, fall back to client approximate
  const theoreticalData = hiResTheoreticalData ?? theoreticalDataRaw;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animated opacity for expired curves (fades in/out over 250ms)
  const expiredOpacityRef = useRef(0);
  const expiredAnimFrameRef = useRef<number>(0);

  // View state (what portion of data is visible)
  const viewState = useRef<ViewState>({ xMin: 0, xMax: 100, yMin: -100, yMax: 100 });

  // Curve hover state (ref — no rerender on mousemove, drives draw via scheduleDraw)
  const hoveredCurveRef = useRef<'expiration' | 'theoretical' | null>(null);

  // Drag state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const viewAtDragStart = useRef<ViewState | null>(null);
  const isXAxisDrag = useRef(false); // True when dragging on X-axis to zoom
  const isYAxisDrag = useRef(false); // True when dragging on Y-axis to zoom
  const [cursorStyle, setCursorStyle] = useState('grab');
  const [axisZoomHint, setAxisZoomHint] = useState<'x' | 'y' | null>(null);
  const [crosshair, setCrosshair] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; price: number; nearCurve?: { pnl: number; curveType: 'expiration' | 'theoretical' } } | null>(null);

  // Strike drag-to-reposition state
  const isStrikeDragging = useRef(false);
  const strikeDragStartDataX = useRef(0);
  const lastDragOffsetRef = useRef(0);
  const lastShiftKeyRef = useRef(false);
  const dragStrategyIdRef = useRef('');
  const dragGrabbedStrikeRef = useRef(0);
  const onStrikeDragRef = useRef(onStrikeDrag);
  onStrikeDragRef.current = onStrikeDrag;
  const strikesRef = useRef(strikes);
  strikesRef.current = strikes;
  const strikeToStrategyIdRef = useRef(strikeToStrategyId);
  strikeToStrategyIdRef.current = strikeToStrategyId;
  const expirationDataRef = useRef(expirationData);
  expirationDataRef.current = expirationData;
  const theoreticalDataRef = useRef(theoreticalData);
  theoreticalDataRef.current = theoreticalData;

  // Strike interval for badge display — from chain data

  // Backdrop dimensions and view state - updated on draw
  const [backdropProps, setBackdropProps] = useState<BackdropRenderProps | null>(null);
  const lastBackdropRef = useRef<string>('');

  // rAF batching — coalesce multiple draw() requests into one frame.
  // Uses a ref to avoid a dependency on `draw` (which is declared below).
  const rafRef = useRef<number>(0);
  const drawRef = useRef<() => void>(() => {});

  /**
   * Autofit (ATM-centered):
   *  1. Center X on live ATM (spot).
   *  2. Keep the full position visible.
   *  3. ~30% pad (default) / wider + Y soft-cap for calendar/diagonal.
   */
  const calculateFitBounds = useCallback((): ViewState => {
    if (expirationData.length === 0 && expiredExpirationData.length === 0) {
      const extra: number[] = [];
      if (gexByStrike) {
        for (const k of Object.keys(gexByStrike)) {
          const n = Number(k);
          if (Number.isFinite(n)) extra.push(n);
        }
      }
      if (vpProfile && vpProfile.bins.length > 0) {
        extra.push(vpProfile.min);
        extra.push(vpProfile.min + (vpProfile.bins.length - 1) * vpProfile.step);
      }
      const { xMin, xMax } = atmCenteredXRange({
        spot: spotPrice,
        contentPrices: extra,
        padFrac: AUTOFIT_PAD_FRAC,
        profile: autofitProfile,
        oneSigmaBandWidth,
      });
      return { xMin, xMax, yMin: -100, yMax: 100 };
    }

    const expBes = expirationBreakevens.filter(b => Number.isFinite(b));
    const allBreakevens = [...expBes, ...theoreticalBreakevens]
      .filter(b => Number.isFinite(b));
    const contentPrices = [
      ...strikes.filter(s => Number.isFinite(s)),
      ...allBreakevens,
    ];

    const { xMin, xMax } = atmCenteredXRange({
      spot: spotPrice,
      contentPrices,
      padFrac: AUTOFIT_PAD_FRAC,
      profile: autofitProfile,
      oneSigmaBandWidth,
      // Labs: exp-line BEs occupy ≤ ½ viewport (+ pad); MSC structure/1σ still floor
      expBreakevenPrices: expBes,
      expBreakevenMaxViewportFrac: EXP_BREAKEVEN_MAX_VIEWPORT_FRAC,
    });

    // Y from curves in the visible X window
    const visibleExpData = expirationData.filter(p => p.price >= xMin && p.price <= xMax);
    const visibleTheoData = theoreticalData.filter(p => p.price >= xMin && p.price <= xMax);
    const visibleSecTheoData = secondaryTheoreticalData.filter(p => p.price >= xMin && p.price <= xMax);
    const visibleExpiredExpData = expiredExpirationData.filter(p => p.price >= xMin && p.price <= xMax);
    const visibleExpiredTheoData = expiredTheoreticalData.filter(p => p.price >= xMin && p.price <= xMax);

    const allY = [
      ...visibleExpData.map(p => p.pnl),
      ...visibleTheoData.map(p => p.pnl),
      ...visibleSecTheoData.map(p => p.pnl),
      ...visibleExpiredExpData.map(p => p.pnl),
      ...visibleExpiredTheoData.map(p => p.pnl),
      0,
    ];

    if (allY.length <= 1) {
      allY.push(...expirationData.map(p => p.pnl));
      allY.push(...theoreticalData.map(p => p.pnl));
      allY.push(...secondaryTheoreticalData.map(p => p.pnl));
      allY.push(...expiredExpirationData.map(p => p.pnl));
      allY.push(...expiredTheoreticalData.map(p => p.pnl));
    }

    // Always include global curve extrema so a sharp tent peak is never
    // under-sampled out of the Y range (grid may miss exact body strike).
    const allCurvePnls = [
      ...expirationData.map(p => p.pnl),
      ...theoreticalData.map(p => p.pnl),
      ...secondaryTheoreticalData.map(p => p.pnl),
      ...expiredExpirationData.map(p => p.pnl),
      ...expiredTheoreticalData.map(p => p.pnl),
    ].filter(Number.isFinite);
    if (allCurvePnls.length > 0) {
      allY.push(Math.max(...allCurvePnls), Math.min(...allCurvePnls));
    }

    const { yMin, yMax } = fitPnlYRange(allY, autofitProfile);
    return { xMin, xMax, yMin, yMax };
  }, [
    expirationData, theoreticalData, secondaryTheoreticalData, strikes, spotPrice,
    expirationBreakevens, theoreticalBreakevens, expiredExpirationData, expiredTheoreticalData,
    gexByStrike, vpProfile, autofitProfile, oneSigmaBandWidth,
  ]);

  // Auto-fit view to data
  const autoFit = useCallback(() => {
    viewState.current = calculateFitBounds();
    draw();
  }, [calculateFitBounds]);

  // Expose autoFit to parent
  useImperativeHandle(ref, () => ({ autoFit }));

  // Convert data coordinates to canvas pixels
  const toCanvasX = useCallback((price: number, width: number): number => {
    const { xMin, xMax } = viewState.current;
    const chartWidth = width - PADDING.left - PADDING.right;
    return PADDING.left + ((price - xMin) / (xMax - xMin)) * chartWidth;
  }, []);

  const toCanvasY = useCallback((pnl: number, height: number): number => {
    const { yMin, yMax } = viewState.current;
    const chartHeight = height - PADDING.top - PADDING.bottom;
    return PADDING.top + ((yMax - pnl) / (yMax - yMin)) * chartHeight;
  }, []);

  // Convert canvas pixels to data coordinates
  const toDataX = useCallback((canvasX: number, width: number): number => {
    const { xMin, xMax } = viewState.current;
    const chartWidth = width - PADDING.left - PADDING.right;
    return xMin + ((canvasX - PADDING.left) / chartWidth) * (xMax - xMin);
  }, []);

  const toDataY = useCallback((canvasY: number, height: number): number => {
    const { yMin, yMax } = viewState.current;
    const chartHeight = height - PADDING.top - PADDING.bottom;
    return yMax - ((canvasY - PADDING.top) / chartHeight) * (yMax - yMin);
  }, []);

  // Draw the chart
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Skip drawing if container has no dimensions yet
    if (width < 50 || height < 50) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const { xMin, xMax, yMin, yMax } = viewState.current;

    // Read theme colors from CSS custom properties
    const cs = getComputedStyle(document.documentElement);
    const themeColors = {
      bgBase: cs.getPropertyValue('--bg-base').trim() || '#0a0a0a',
      bgSurface: cs.getPropertyValue('--bg-surface').trim() || '#111',
      gridLine: cs.getPropertyValue('--border-subtle').trim() || '#1a1a1a',
      zeroLine: cs.getPropertyValue('--border-default').trim() || '#333',
      axisText: cs.getPropertyValue('--text-tertiary').trim() || '#555',
      legendText: cs.getPropertyValue('--text-muted').trim() || '#666',
      labelBright: cs.getPropertyValue('--text-bright').trim() || '#fff',
    };
    const isLight = document.documentElement.dataset.theme === 'light';
    const chartBg = isLight ? '#ffffff' : themeColors.bgBase;
    const chartBgAlpha = isLight ? 'rgba(255,255,255,0.4)' : 'rgba(10,10,10,0.4)';

    // Update backdrop props for external render — only when values change
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;
    const bpKey = `${chartWidth}|${chartHeight}|${xMin.toFixed(1)}|${xMax.toFixed(1)}|${spotPrice}`;
    if (bpKey !== lastBackdropRef.current) {
      lastBackdropRef.current = bpKey;
      setBackdropProps({
        width: chartWidth,
        height: chartHeight,
        priceMin: xMin,
        priceMax: xMax,
        spotPrice,
      });
    }

    // Clear - fill axis areas, leave chart area for backdrop to show
    ctx.fillStyle = chartBg;
    // Top padding
    ctx.fillRect(0, 0, width, PADDING.top);
    // Bottom padding
    ctx.fillRect(0, height - PADDING.bottom, width, PADDING.bottom);
    // Left padding
    ctx.fillRect(0, PADDING.top, PADDING.left, chartHeight);
    // Right padding
    ctx.fillRect(width - PADDING.right, PADDING.top, PADDING.right, chartHeight);

    // Chart area background (semi-transparent if backdrop exists)
    if (renderBackdrop) {
      ctx.fillStyle = chartBgAlpha;
    } else {
      ctx.fillStyle = chartBg;
    }
    ctx.fillRect(PADDING.left, PADDING.top, chartWidth, chartHeight);

    // Draw grid
    ctx.strokeStyle = themeColors.gridLine;
    ctx.lineWidth = 1;

    // Y grid lines and labels
    const yRange = yMax - yMin;
    const yStep = calculateNiceStep(yRange, 6);
    const yStart = Math.ceil(yMin / yStep) * yStep;

    ctx.font = '15px monospace';
    ctx.fillStyle = themeColors.axisText;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let y = yStart; y <= yMax; y += yStep) {
      const canvasY = toCanvasY(y, height);
      if (canvasY >= PADDING.top && canvasY <= height - PADDING.bottom) {
        ctx.beginPath();
        ctx.moveTo(PADDING.left, canvasY);
        ctx.lineTo(width - PADDING.right, canvasY);
        ctx.stroke();

        const label = y >= 0 ? `+$${y.toFixed(0)}` : `-$${Math.abs(y).toFixed(0)}`;
        ctx.fillText(label, PADDING.left - 5, canvasY);
      }
    }

    // X grid lines and labels
    const xRange = xMax - xMin;
    const xStep = calculateNiceStep(xRange, 10);
    const xStart = Math.ceil(xMin / xStep) * xStep;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let x = xStart; x <= xMax; x += xStep) {
      const canvasX = toCanvasX(x, width);
      if (canvasX >= PADDING.left && canvasX <= width - PADDING.right) {
        ctx.beginPath();
        ctx.moveTo(canvasX, PADDING.top);
        ctx.lineTo(canvasX, height - PADDING.bottom);
        ctx.stroke();

        ctx.fillText(x.toFixed(0), canvasX, height - PADDING.bottom + 5);
      }
    }

    // Draw zero line (more prominent)
    const zeroY = toCanvasY(0, height);
    if (zeroY >= PADDING.top && zeroY <= height - PADDING.bottom) {
      ctx.strokeStyle = themeColors.zeroLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, zeroY);
      ctx.lineTo(width - PADDING.right, zeroY);
      ctx.stroke();
    }

    // Draw spot price line — indicator position can differ from axis-fit spot
    const spotDrawPrice = spotIndicatorPrice ?? spotPrice;
    const spotX = toCanvasX(spotDrawPrice, width);
    if (spotX >= PADDING.left && spotX <= width - PADDING.right) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(spotX, PADDING.top);
      ctx.lineTo(spotX, height - PADDING.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = '#fbbf24';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(spotDrawPrice.toFixed(0), spotX, PADDING.top - 5);
    }

    // Draw strike markers (thicker when hovered or dragging)
    const dragging = isStrikeDragging.current;
    const hovered = hoveredStrikeRef.current;
    strikes.forEach(strike => {
      const x = toCanvasX(strike, width);
      if (x >= PADDING.left && x <= width - PADDING.right) {
        const isHot = dragging || strike === hovered;
        ctx.strokeStyle = isHot ? '#fbbf24' : '#f59e0b';
        ctx.lineWidth = isHot ? 3 : 1;
        ctx.beginPath();
        ctx.moveTo(x, zeroY - (isHot ? 14 : 8));
        ctx.lineTo(x, zeroY + (isHot ? 14 : 8));
        ctx.stroke();
      }
    });

    // Draw drag offset indicator badge
    if (dragging && lastDragOffsetRef.current !== 0 && strikes.length > 0) {
      const rawOffset = lastDragOffsetRef.current;
      const label = `${rawOffset > 0 ? '+' : ''}${rawOffset}`;
      ctx.save();
      ctx.font = 'bold 13px monospace';
      const avgStrike = strikes.reduce((a, b) => a + b, 0) / strikes.length;
      const labelX = toCanvasX(avgStrike, width);
      const metrics = ctx.measureText(label);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
      ctx.beginPath();
      ctx.roundRect(labelX - metrics.width / 2 - 6, zeroY - 30, metrics.width + 12, 20, 4);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, labelX, zeroY - 20);
      ctx.restore();
    }

    // Draw expiration breakeven markers (blue, matches expiration curve)
    ctx.fillStyle = '#3b82f6';
    ctx.font = '9px monospace';
    expirationBreakevens.forEach(be => {
      const x = toCanvasX(be, width);
      if (x >= PADDING.left && x <= width - PADDING.right) {
        ctx.beginPath();
        ctx.arc(x, zeroY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${be.toFixed(0)}`, x, zeroY + 12);
      }
    });

    // Draw primary T+0 breakeven markers (match primary real-time stroke)
    ctx.fillStyle = theoreticalStroke;
    theoreticalBreakevens.forEach(be => {
      const x = toCanvasX(be, width);
      if (x >= PADDING.left && x <= width - PADDING.right) {
        ctx.beginPath();
        ctx.arc(x, zeroY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${be.toFixed(0)}`, x, zeroY - 12);
      }
    });

    // Draw faded expired strategy curves (ghost lines behind active curves).
    // Neutral dashed grey — not blue/magenta/orange (those are live Mkt/Theo/Expiry).
    const expAlpha = expiredOpacityRef.current;
    if (expiredExpirationData.length > 1 && expAlpha > 0.01) {
      ctx.globalAlpha = expAlpha;
      ctx.strokeStyle = '#9ca3af'; // lighter grey ghost (was #6b7280)
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      let started = false;
      expiredExpirationData.forEach(point => {
        const x = toCanvasX(point.price, width);
        const y = toCanvasY(point.pnl, height);
        if (!started) { ctx.moveTo(x, y); started = true; }
        else { ctx.lineTo(x, y); }
      });
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // Expired theoretical (real-time) curve intentionally omitted —
    // only the at-expiration ghost (dashed grey) is shown when a position has expired.

    // Draw expiration P&L curve (thicker + glow when dragging or hovered)
    const expHovered = hoveredCurveRef.current === 'expiration';
    if (expirationData.length > 1) {
      if (dragging || expHovered) {
        // Glow effect behind the curve
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = expHovered ? 8 : 6;
        ctx.globalAlpha = 0.2;
        if (expHovered) { ctx.shadowColor = '#3b82f6'; ctx.shadowBlur = 8; }
        ctx.beginPath();
        let gs = false;
        expirationData.forEach(point => {
          const x = toCanvasX(point.price, width);
          const y = toCanvasY(point.pnl, height);
          if (!gs) { ctx.moveTo(x, y); gs = true; } else { ctx.lineTo(x, y); }
        });
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = dragging ? 3 : expHovered ? 4 : 2;
      ctx.beginPath();

      let started = false;
      expirationData.forEach(point => {
        const x = toCanvasX(point.price, width);
        const y = toCanvasY(point.pnl, height);

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Fill area (green above zero, red below)
      ctx.globalAlpha = 0.1;
      expirationData.forEach((point, i) => {
        if (i === 0) return;
        const prev = expirationData[i - 1];
        const x1 = toCanvasX(prev.price, width);
        const x2 = toCanvasX(point.price, width);
        const y1 = toCanvasY(prev.pnl, height);
        const y2 = toCanvasY(point.pnl, height);

        ctx.fillStyle = point.pnl >= 0 ? '#4ade80' : '#f87171';
        ctx.beginPath();
        ctx.moveTo(x1, zeroY);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x2, zeroY);
        ctx.closePath();
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    // Draw theoretical P&L curve
    // Smoothing: quadraticCurveTo through midpoints — data unchanged, only path rendering.
    // To revert: replace the smooth* helpers below with plain moveTo/lineTo sequences.
    // Catmull-Rom spline: passes through every data point (peak is accurate),
    // smooth between points. To revert: replace with plain moveTo/lineTo.
    const smoothCurvePath = (pts: { price: number; pnl: number }[]) => {
      if (pts.length < 2) return;
      const xs = pts.map(p => toCanvasX(p.price, width));
      const ys = pts.map(p => toCanvasY(p.pnl, height));
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 0; i < xs.length - 1; i++) {
        const p0x = xs[Math.max(0, i - 1)],        p0y = ys[Math.max(0, i - 1)];
        const p1x = xs[i],                          p1y = ys[i];
        const p2x = xs[i + 1],                      p2y = ys[i + 1];
        const p3x = xs[Math.min(xs.length-1, i+2)], p3y = ys[Math.min(ys.length-1, i+2)];
        const cp1x = p1x + (p2x - p0x) / 16;
        const cp1y = p1y + (p2y - p0y) / 16;
        const cp2x = p2x - (p3x - p1x) / 16;
        const cp2y = p2y - (p3y - p1y) / 16;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2x, p2y);
      }
    };

    // Secondary T+0 first (Both mode: Theo under Mkt) so primary stays on top
    if (secondaryTheoreticalData.length > 1) {
      ctx.strokeStyle = secondaryTheoreticalStroke;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      smoothCurvePath(secondaryTheoreticalData);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const theoHovered = hoveredCurveRef.current === 'theoretical';
    if (theoreticalData.length > 1) {
      if (theoHovered) {
        ctx.save();
        ctx.strokeStyle = theoreticalStroke;
        ctx.lineWidth = 8;
        ctx.globalAlpha = 0.2;
        ctx.shadowColor = theoreticalStroke;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        smoothCurvePath(theoreticalData);
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = theoreticalStroke;
      ctx.lineWidth = theoHovered ? 4 : 2;
      ctx.beginPath();
      smoothCurvePath(theoreticalData);
      ctx.stroke();
    }

    // Draw alert lines with visual distinction
    alertLines.forEach(alert => {
      const x = toCanvasX(alert.price, width);
      if (x >= PADDING.left && x <= width - PADDING.right) {
        const lineStyle = alert.style || 'dashed';

        // Active style: glow halo behind the line
        if (lineStyle === 'active') {
          ctx.save();
          ctx.strokeStyle = alert.color;
          ctx.lineWidth = 6;
          ctx.globalAlpha = 0.2;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(x, PADDING.top);
          ctx.lineTo(x, height - PADDING.bottom);
          ctx.stroke();
          ctx.restore();
        }

        ctx.strokeStyle = alert.color;
        ctx.lineWidth = lineStyle === 'active' ? 3 : lineStyle === 'solid' ? 2 : 1;
        ctx.globalAlpha = lineStyle === 'dimmed' ? 0.3 : 1;
        if (lineStyle === 'dashed' || lineStyle === 'dimmed') {
          ctx.setLineDash([4, 4]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.beginPath();
        ctx.moveTo(x, PADDING.top);
        ctx.lineTo(x, height - PADDING.bottom);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;

        // Label
        if (alert.label) {
          ctx.fillStyle = alert.color;
          ctx.globalAlpha = lineStyle === 'dimmed' ? 0.3 : 1;
          ctx.font = lineStyle === 'active' ? 'bold 10px monospace' : '9px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(alert.label, x, PADDING.top - 5);
          ctx.globalAlpha = 1;
        }
      }
    });

    // Draw P&L alert zones (horizontal lines and shaded regions)
    pnlAlertZones.forEach(zone => {
      if (zone.style === 'shaded' && zone.priceLow != null && zone.priceHigh != null) {
        // Vertical shaded zone between price levels
        const x1 = toCanvasX(zone.priceLow, width);
        const x2 = toCanvasX(zone.priceHigh, width);
        const clampedX1 = Math.max(PADDING.left, Math.min(x1, width - PADDING.right));
        const clampedX2 = Math.max(PADDING.left, Math.min(x2, width - PADDING.right));
        ctx.fillStyle = zone.color;
        ctx.globalAlpha = 0.1;
        ctx.fillRect(clampedX1, PADDING.top, clampedX2 - clampedX1, chartHeight);
        ctx.globalAlpha = 1;
        // Label at top
        const midX = (clampedX1 + clampedX2) / 2;
        ctx.fillStyle = zone.color;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 0.7;
        ctx.fillText(zone.label, midX, PADDING.top + 12);
        ctx.globalAlpha = 1;
      } else if (zone.pnlValue != null) {
        // Horizontal P&L line
        const y = toCanvasY(zone.pnlValue, height);
        if (y >= PADDING.top && y <= height - PADDING.bottom) {
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = 1;
          if (zone.style === 'dashed') {
            ctx.setLineDash([6, 3]);
          } else {
            ctx.setLineDash([3, 3]);
          }
          ctx.beginPath();
          ctx.moveTo(PADDING.left, y);
          ctx.lineTo(width - PADDING.right, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Label on right side
          ctx.fillStyle = zone.color;
          ctx.font = '8px monospace';
          ctx.textAlign = 'right';
          ctx.fillText(zone.label, width - PADDING.right - 4, y - 4);
        }
      }
    });

    // Draw current P&L at spot indicator
    if (theoreticalData.length > 0) {
      // Find P&L at spot price
      let pnlAtSpot: number | null = null;
      for (let i = 1; i < theoreticalData.length; i++) {
        const prev = theoreticalData[i - 1];
        const curr = theoreticalData[i];
        if (spotDrawPrice >= prev.price && spotDrawPrice <= curr.price) {
          const t = (spotDrawPrice - prev.price) / (curr.price - prev.price);
          pnlAtSpot = prev.pnl + t * (curr.pnl - prev.pnl);
          break;
        }
      }

      if (pnlAtSpot !== null && spotX >= PADDING.left && spotX <= width - PADDING.right) {
        const pnlY = toCanvasY(pnlAtSpot, height);
        if (pnlY >= PADDING.top && pnlY <= height - PADDING.bottom) {
          // Draw marker
          ctx.fillStyle = pnlAtSpot >= 0 ? '#4ade80' : '#f87171';
          ctx.beginPath();
          ctx.arc(spotX, pnlY, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = chartBg;
          ctx.lineWidth = 2;
          ctx.stroke();

          // Draw P&L value label
          const labelText = `${pnlAtSpot >= 0 ? '+' : ''}$${pnlAtSpot.toFixed(0)}`;
          ctx.font = 'bold 11px monospace';
          const metrics = ctx.measureText(labelText);
          const labelPadding = 4;
          const labelX = spotX + 10;
          const labelY = pnlY;

          ctx.fillStyle = pnlAtSpot >= 0 ? '#166534' : '#991b1b';
          ctx.beginPath();
          ctx.roundRect(
            labelX - labelPadding,
            labelY - 8,
            metrics.width + labelPadding * 2,
            16,
            3
          );
          ctx.fill();

          ctx.fillStyle = '#fff';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, labelX, labelY);
        }
      }
    }

    // Draw legend (bottom-left corner, compact)
    ctx.font = '10px monospace';
    const legendX = PADDING.left + 10;
    const legendRows =
      1 +
      (theoreticalData.length > 1 ? 1 : 0) +
      (secondaryTheoreticalData.length > 1 ? 1 : 0);
    const legendY = height - PADDING.bottom - (legendRows * 12 + 6);
    let legendRow = 0;

    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(legendX, legendY + legendRow * 12, 16, 2);
    ctx.fillStyle = themeColors.legendText;
    ctx.textAlign = 'left';
    ctx.fillText('At Expiry', legendX + 20, legendY + legendRow * 12 + 3);
    legendRow++;

    if (secondaryTheoreticalData.length > 1) {
      ctx.fillStyle = secondaryTheoreticalStroke;
      ctx.fillRect(legendX, legendY + legendRow * 12, 16, 2);
      ctx.fillStyle = themeColors.legendText;
      ctx.fillText(secondaryTheoreticalLegendLabel, legendX + 20, legendY + legendRow * 12 + 3);
      legendRow++;
    }

    if (theoreticalData.length > 1) {
      ctx.fillStyle = theoreticalStroke;
      ctx.fillRect(legendX, legendY + legendRow * 12, 16, 2);
      ctx.fillStyle = themeColors.legendText;
      ctx.fillText(theoreticalLegendLabel, legendX + 20, legendY + legendRow * 12 + 3);
    }

  }, [expirationData, theoreticalData, secondaryTheoreticalData, theoreticalStroke, secondaryTheoreticalStroke, theoreticalLegendLabel, secondaryTheoreticalLegendLabel, spotPrice, spotIndicatorPrice, expirationBreakevens, theoreticalBreakevens, strikes, alertLines, pnlAlertZones, expiredExpirationData, expiredTheoreticalData, toCanvasX, toCanvasY, renderBackdrop]);

  // Keep drawRef in sync so scheduleDraw always calls the latest draw
  drawRef.current = draw;
  const scheduleDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      drawRef.current();
    });
  }, []);
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  // Redraw when P&L data changes (Time Machine slider movement, strategy edits, etc.)
  // spotIndicatorPrice and spotPrice are included so the spot line redraws when either
  // the indicator position or the axis-fit spot changes.
  useEffect(() => {
    scheduleDraw();
  }, [expirationData, theoreticalData, secondaryTheoreticalData, expiredExpirationData, expiredTheoreticalData, spotPrice, spotIndicatorPrice, theoreticalStroke, secondaryTheoreticalStroke, scheduleDraw]);

  // Animate expired curve opacity (500ms fade in/out)
  const hasExpired = expiredExpirationData.length > 0;
  useEffect(() => {
    // Ghost must stay readable — was 0.25 (too dim); ≥2× → 0.55
    const target = hasExpired ? 0.55 : 0;
    const start = expiredOpacityRef.current;
    if (Math.abs(start - target) < 0.005) {
      expiredOpacityRef.current = target;
      return;
    }
    const startTime = performance.now();
    const duration = 500;
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = t * (2 - t); // ease-out
      expiredOpacityRef.current = start + (target - start) * eased;
      draw();
      if (t < 1) {
        expiredAnimFrameRef.current = requestAnimationFrame(animate);
      }
    };
    expiredAnimFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(expiredAnimFrameRef.current);
  }, [hasExpired, draw]);

  // Redraw when alert lines change
  useEffect(() => { scheduleDraw(); }, [alertLines, scheduleDraw]);

  // Calculate nice step size for axis labels
  function calculateNiceStep(range: number, targetSteps: number): number {
    const roughStep = range / targetSteps;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;

    let niceStep;
    if (normalized <= 1) niceStep = 1;
    else if (normalized <= 2) niceStep = 2;
    else if (normalized <= 5) niceStep = 5;
    else niceStep = 10;

    return niceStep * magnitude;
  }

  // Mouse handlers for pan/zoom
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Check for strike tick hit (drag-to-reposition)
    const zeroY = toCanvasY(0, height);
    const sMap = strikeToStrategyIdRef.current;
    if (sMap && zeroY >= PADDING.top && zeroY <= height - PADDING.bottom) {
      for (const strike of strikesRef.current) {
        const stratId = sMap.get(strike);
        if (!stratId) continue; // Not draggable (e.g. open order)
        const sx = toCanvasX(strike, width);
        if (Math.abs(mouseX - sx) < 15 && Math.abs(mouseY - zeroY) < 15) {
          isStrikeDragging.current = true;
          strikeDragStartDataX.current = toDataX(mouseX, width);
          lastDragOffsetRef.current = 0;
          lastShiftKeyRef.current = e.shiftKey;
          dragStrategyIdRef.current = stratId;
          dragGrabbedStrikeRef.current = strike;
          setCursorStyle('grabbing');
          onStrikeDragRef.current?.({
            strategyId: stratId,
            grabbedStrike: strike,
            offset: 0,
            shiftKey: e.shiftKey,
          });
          return; // Don't start pan
        }
      }
    }

    // Check if clicking in X-axis zone (bottom area) or Y-axis zone (left area)
    isXAxisDrag.current = mouseY > height - PADDING.bottom;
    isYAxisDrag.current = mouseX < PADDING.left && mouseY < height - PADDING.bottom;

    if (isXAxisDrag.current) {
      setAxisZoomHint('x');
    } else if (isYAxisDrag.current) {
      setAxisZoomHint('y');
    } else {
      setAxisZoomHint(null);
    }

    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    viewAtDragStart.current = { ...viewState.current };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    // Handle strike drag (repositioning) — continuous, snaps only on release
    if (isStrikeDragging.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const w = containerRef.current.clientWidth;
      const currentDataX = toDataX(mouseX, w);
      const rawOffset = currentDataX - strikeDragStartDataX.current;
      // Round to nearest integer point for smooth 1-point movement
      const offset = Math.round(rawOffset);
      if (offset !== lastDragOffsetRef.current || e.shiftKey !== lastShiftKeyRef.current) {
        lastDragOffsetRef.current = offset;
        lastShiftKeyRef.current = e.shiftKey;
        onStrikeDragRef.current?.({
          strategyId: dragStrategyIdRef.current,
          grabbedStrike: dragGrabbedStrikeRef.current,
          offset,
          shiftKey: e.shiftKey,
        });
      }
      return;
    }

    if (!isDragging.current || !viewAtDragStart.current || !containerRef.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    const chartWidth = width - PADDING.left - PADDING.right;
    const chartHeight = height - PADDING.top - PADDING.bottom;

    const { xMin, xMax, yMin, yMax } = viewAtDragStart.current;
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    if (isXAxisDrag.current) {
      // Dragging on X-axis: zoom X
      // Drag right = wider (zoom out), drag left = narrower (zoom in)
      const zoomFactor = 1 - (dx / chartWidth) * 0.5;
      const xCenter = (xMin + xMax) / 2;
      const newXRange = xRange * zoomFactor;
      viewState.current = {
        ...viewAtDragStart.current,
        xMin: xCenter - newXRange / 2,
        xMax: xCenter + newXRange / 2,
      };
    } else if (isYAxisDrag.current) {
      // Dragging on Y-axis: zoom Y
      // Drag up = taller (expand), drag down = shorter (contract)
      const zoomFactor = 1 + (dy / chartHeight) * 0.5;
      const yCenter = (yMin + yMax) / 2;
      const newYRange = yRange * zoomFactor;
      viewState.current = {
        ...viewAtDragStart.current,
        yMin: yCenter - newYRange / 2,
        yMax: yCenter + newYRange / 2,
      };
    } else {
      // Normal drag: pan
      const xShift = -(dx / chartWidth) * xRange;
      const yShift = (dy / chartHeight) * yRange;

      viewState.current = {
        xMin: xMin + xShift,
        xMax: xMax + xShift,
        yMin: yMin + yShift,
        yMax: yMax + yShift,
      };
    }

    scheduleDraw();
  }, [scheduleDraw]);

  const handleMouseUp = useCallback(() => {
    // Commit strike drag — parent handles snap-to-nearest
    if (isStrikeDragging.current) {
      isStrikeDragging.current = false;
      onStrikeDragRef.current?.(null);
      setCursorStyle('grab');
      return;
    }

    isDragging.current = false;
    isXAxisDrag.current = false;
    isYAxisDrag.current = false;
    viewAtDragStart.current = null;
    setCursorStyle('grab');
    setAxisZoomHint(null);
  }, []);

  // Context menu handler — always shows threshold menu, detects curve proximity for extra option
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Only show context menu in chart area
    const inChartArea = mouseX >= PADDING.left && mouseX <= width - PADDING.right &&
                        mouseY >= PADDING.top && mouseY <= height - PADDING.bottom;

    if (!inChartArea) return;

    const price = toDataX(mouseX, width);

    // Check curve proximity for optional "position alert" item
    let nearCurve: { pnl: number; curveType: 'expiration' | 'theoretical' } | undefined;
    if (onCurveContextMenu) {
      const expPnL = findPnLAtPrice(expirationDataRef.current, price);
      const theoPnL = findPnLAtPrice(theoreticalDataRef.current, price);
      const expY = expPnL != null ? toCanvasY(expPnL, height) : null;
      const theoY = theoPnL != null ? toCanvasY(theoPnL, height) : null;
      const expDist = expY != null ? Math.abs(mouseY - expY) : Infinity;
      const theoDist = theoY != null ? Math.abs(mouseY - theoY) : Infinity;
      const minDist = Math.min(expDist, theoDist);
      if (minDist <= CURVE_HIT_DISTANCE) {
        const curveType = expDist <= theoDist ? 'expiration' : 'theoretical';
        const pnl = curveType === 'expiration' ? expPnL! : theoPnL!;
        nearCurve = { pnl, curveType };
      }
    }

    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, price, nearCurve });
    setCrosshair(null);
  }, [toDataX, toCanvasY, onCurveContextMenu]);

  // Close context menu
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // Handle alert creation from context menu - opens dialog
  const handleCreateAlert = useCallback((type: PriceAlertType) => {
    if (contextMenu && onOpenAlertDialog) {
      onOpenAlertDialog(contextMenu.price, type);
    }
    setContextMenu(null);
  }, [contextMenu, onOpenAlertDialog]);

  // Handle position alert from context menu — delegates to curve handler
  const handlePositionAlert = useCallback(() => {
    if (!contextMenu?.nearCurve || !onCurveContextMenu || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const syntheticEvent = { clientX: rect.left + contextMenu.x, clientY: rect.top + contextMenu.y } as React.MouseEvent;
    onCurveContextMenu(contextMenu.price, contextMenu.nearCurve.pnl, contextMenu.nearCurve.curveType, syntheticEvent);
    setContextMenu(null);
  }, [contextMenu, onCurveContextMenu]);

  // Track which strike tick is being hovered (for thickening effect)
  const hoveredStrikeRef = useRef<number | null>(null);

  // Update cursor and crosshair based on mouse position
  const handleMouseHover = useCallback((e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Check if in chart area for crosshair
    const inChartArea = mouseX >= PADDING.left && mouseX <= width - PADDING.right &&
                        mouseY >= PADDING.top && mouseY <= height - PADDING.bottom;

    if (inChartArea && !isDragging.current) {
      setCrosshair({ x: mouseX, y: mouseY });
    } else {
      setCrosshair(null);
    }

    if (isDragging.current) return;

    // During strike drag, update crosshair but skip cursor changes
    if (isStrikeDragging.current) return;

    // X-axis zone = bottom area
    if (mouseY > height - PADDING.bottom) {
      setCursorStyle('ew-resize');
      hoveredStrikeRef.current = null;
      scheduleDraw();
    // Y-axis zone = left area
    } else if (mouseX < PADDING.left) {
      setCursorStyle('ns-resize');
      hoveredStrikeRef.current = null;
      scheduleDraw();
    } else {
      // Check if near a draggable strike tick (drag handle for repositioning)
      const zeroY = toCanvasY(0, height);
      const sMap = strikeToStrategyIdRef.current;
      let foundStrike: number | null = null;
      if (sMap && zeroY >= PADDING.top && zeroY <= height - PADDING.bottom) {
        for (const strike of strikesRef.current) {
          if (!sMap.has(strike)) continue; // Not draggable
          const sx = toCanvasX(strike, width);
          if (Math.abs(mouseX - sx) < 15 && Math.abs(mouseY - zeroY) < 15) {
            foundStrike = strike;
            break;
          }
        }
      }
      if (hoveredStrikeRef.current !== foundStrike) {
        hoveredStrikeRef.current = foundStrike;
        scheduleDraw();
      }

      // Curve proximity for hover highlight (only when not near a strike handle)
      if (foundStrike === null) {
        const price = toDataX(mouseX, width);
        const expPnL = findPnLAtPrice(expirationDataRef.current, price);
        const theoPnL = findPnLAtPrice(theoreticalDataRef.current, price);
        const expY = expPnL != null ? toCanvasY(expPnL, height) : null;
        const theoY = theoPnL != null ? toCanvasY(theoPnL, height) : null;
        const expDist = expY != null ? Math.abs(mouseY - expY) : Infinity;
        const theoDist = theoY != null ? Math.abs(mouseY - theoY) : Infinity;
        const minDist = Math.min(expDist, theoDist);

        const newHover: 'expiration' | 'theoretical' | null =
          minDist <= CURVE_HIT_DISTANCE
            ? (expDist <= theoDist ? 'expiration' : 'theoretical')
            : null;

        if (hoveredCurveRef.current !== newHover) {
          hoveredCurveRef.current = newHover;
          scheduleDraw();
        }
        setCursorStyle(newHover ? 'pointer' : 'crosshair');
      } else {
        if (hoveredCurveRef.current !== null) {
          hoveredCurveRef.current = null;
          scheduleDraw();
        }
        setCursorStyle('grab');
      }
    }
  }, [toCanvasX, toCanvasY, toDataX, scheduleDraw]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Zoom factor
    const zoomFactor = e.deltaY > 0 ? 1.03 : 0.97;

    // Get mouse position in data coordinates
    const dataX = toDataX(mouseX, width);
    const dataY = toDataY(mouseY, height);

    const { xMin, xMax, yMin, yMax } = viewState.current;

    // Zoom around mouse position
    if (e.shiftKey) {
      // Shift+scroll: zoom Y only
      const newYMin = dataY - (dataY - yMin) * zoomFactor;
      const newYMax = dataY + (yMax - dataY) * zoomFactor;
      viewState.current.yMin = newYMin;
      viewState.current.yMax = newYMax;
    } else {
      // Normal scroll: zoom X only
      const newXMin = dataX - (dataX - xMin) * zoomFactor;
      const newXMax = dataX + (xMax - dataX) * zoomFactor;
      viewState.current.xMin = newXMin;
      viewState.current.xMax = newXMax;
    }

    scheduleDraw();
  }, [scheduleDraw, toDataX, toDataY]);

  // Auto-fit when strategies change (strikes array changes), not on every price tick
  const strategyHash = strikes.join(',');
  const prevStrategyHash = useRef<string | null>(null);

  useEffect(() => {
    if (strategyHash !== prevStrategyHash.current) {
      prevStrategyHash.current = strategyHash;
      if (isStrikeDragging.current) {
        // During drag, redraw without resetting view bounds
        draw();
      } else {
        autoFit();
        // Also trigger a delayed autoFit in case container wasn't measured yet
        const timer = setTimeout(() => autoFit(), 50);
        return () => clearTimeout(timer);
      }
    }
  }, [strategyHash, autoFit, draw]);

  // GEX-only auto-fit (priority 2): when GEX data arrives/changes and no positions
  // are loaded, re-fit so the full strike range fills the chart width.
  const gexHashRef = useRef('');
  const gexHash = gexByStrike ? Object.keys(gexByStrike).sort().join(',') : '';
  useEffect(() => {
    if (gexHash === gexHashRef.current) return;
    gexHashRef.current = gexHash;
    if (gexHash && expirationData.length === 0 && expiredExpirationData.length === 0) {
      autoFit();
    }
  }, [gexHash, expirationData.length, expiredExpirationData.length, autoFit]);

  // VP-only auto-fit (priority 3): when VP profile arrives/changes and no positions
  // or GEX are loaded, re-fit to the full VP price range.
  const vpBinCountRef = useRef(0);
  useEffect(() => {
    const binCount = vpProfile?.bins.length ?? 0;
    if (binCount === vpBinCountRef.current) return;
    vpBinCountRef.current = binCount;
    if (binCount > 0 && !gexHash && expirationData.length === 0 && expiredExpirationData.length === 0) {
      autoFit();
    }
  }, [vpProfile, gexHash, expirationData.length, expiredExpirationData.length, autoFit]);

  // Re-fit when spot price drifts significantly from the last fitted value.
  // On hard refresh, spotPrice defaults to 5950 until SSE delivers the real
  // value (~6740). The initial autoFit bakes the stale default into the
  // viewport, producing a 1200-point-wide X-axis that compresses the curve
  // into a thin spike. Once the real spot arrives we need one more autoFit.
  const lastFitSpotRef = useRef<number | null>(null);

  useEffect(() => {
    if (strikes.length === 0) return;
    const prev = lastFitSpotRef.current;
    lastFitSpotRef.current = spotPrice;

    if (prev === null) return; // first render — handled by mount/strategyHash effects
    const drift = Math.abs(spotPrice - prev);
    // Re-fit if spot moved more than 1% or 50 points (whichever is smaller)
    const threshold = Math.min(prev * 0.01, 50);
    if (drift > threshold && !isStrikeDragging.current) {
      autoFit();
    }
  }, [spotPrice, strikes, autoFit]);

  // Re-fit when expiration BEs arrive/change (OPF curves often land after
  // strikes — without this the ½-viewport BE cap never re-applies).
  const expBeHash = expirationBreakevens
    .filter(Number.isFinite)
    .map(b => b.toFixed(2))
    .join(',');
  const prevExpBeHash = useRef<string | null>(null);
  useEffect(() => {
    if (expBeHash === prevExpBeHash.current) return;
    const had = prevExpBeHash.current;
    prevExpBeHash.current = expBeHash;
    if (had === null && expBeHash === '') return; // initial empty — wait for data
    if (isStrikeDragging.current) return;
    autoFit();
  }, [expBeHash, autoFit]);

  // Handle resize - both window and container
  // Track if we've done the initial size setup - using ref to persist across re-renders
  const hasInitialSizeRef = useRef(false);

  useEffect(() => {
    const handleResize = () => scheduleDraw();
    window.addEventListener('resize', handleResize);

    // Also observe container resize - call autoFit on first resize to set proper bounds
    const container = containerRef.current;
    let resizeObserver: ResizeObserver | null = null;
    if (container) {
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry && entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          if (!hasInitialSizeRef.current) {
            // First time we have valid dimensions - do full autoFit
            hasInitialSizeRef.current = true;
            autoFit();
          } else {
            scheduleDraw();
          }
        }
      });
      resizeObserver.observe(container);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleDraw]); // Intentionally exclude autoFit - we only want to call it once on initial size

  // Initial draw - only on mount, with a small delay to ensure container is measured
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    autoFit();
    // Redraw after a short delay to ensure layout is complete
    const timer = setTimeout(() => autoFit(), 100);
    return () => clearTimeout(timer);
  }, []); // Intentionally empty - only run on mount

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: '300px', position: 'relative' }}
    >
      {/* Backdrop layer - renders behind the canvas */}
      {renderBackdrop && backdropProps && (
        <div
          style={{
            position: 'absolute',
            top: PADDING.top,
            left: PADDING.left,
            width: backdropProps.width,
            height: backdropProps.height,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          {renderBackdrop(backdropProps)}
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ display: 'block', cursor: cursorStyle, position: 'relative', zIndex: 1, background: 'transparent' }}
        onMouseDown={(e) => {
          closeContextMenu();
          if (e.button === 0) {
            // Left-click on highlighted curve → show position-only popup
            if (hoveredCurveRef.current) {
              const container = containerRef.current;
              if (container) {
                const rect = container.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                const width = container.clientWidth;
                const price = toDataX(mouseX, width);
                const curveType = hoveredCurveRef.current;
                const data = curveType === 'expiration' ? expirationDataRef.current : theoreticalDataRef.current;
                const pnl = findPnLAtPrice(data, price) ?? 0;
                setContextMenu({ x: mouseX, y: mouseY, price, nearCurve: { pnl, curveType } });
                return; // Don't start drag
              }
            }
            handleMouseDown(e); setCursorStyle('grabbing');
          }
        }}
        onMouseMove={(e) => { handleMouseMove(e); if (!isDragging.current) handleMouseHover(e); }}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setCrosshair(null); }}
        onWheel={handleWheel}
        onContextMenu={handleContextMenu}
      />
      {/* Temporary preview line when context menu is open */}
      {contextMenu && containerRef.current && (
        <div style={{
          position: 'absolute',
          left: contextMenu.x,
          top: PADDING.top,
          width: 2,
          height: containerRef.current.clientHeight - PADDING.top - PADDING.bottom,
          background: 'repeating-linear-gradient(to bottom, #f59e0b 0px, #f59e0b 4px, transparent 4px, transparent 8px)',
          pointerEvents: 'none',
          opacity: 0.8,
        }} />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--bg-elevated, #2c2c2e)',
            borderRadius: 8,
            padding: '4px 0',
            minWidth: 220,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            border: '1px solid var(--border-secondary, rgba(255,255,255,0.1))',
            zIndex: 50,
          }}
          onMouseLeave={closeContextMenu}
        >
          {/* Two menu modes: curve-click → position-only, blank-area → price alerts */}
          {contextMenu.nearCurve ? (
            <>
              {/* Position-only menu — shown when clicking on a highlighted curve */}
              <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-tertiary, #98989d)', borderBottom: '1px solid var(--border-secondary, rgba(255,255,255,0.08))', marginBottom: 2 }}>
                Position Alert
              </div>
              {positionLabels.length > 0 && onPositionAlertSelect ? (
                positionLabels.map(pl => (
                  <button
                    key={pl.id}
                    style={{ display: 'block', width: '100%', padding: '7px 12px', background: 'none', border: 'none', color: 'var(--text-primary, #f5f5f7)', fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: "'SF Mono', 'Fira Code', monospace", letterSpacing: 0.3 }}
                    onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg-hover, rgba(255,255,255,0.08))'; }}
                    onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
                    onClick={() => { onPositionAlertSelect(pl.id, contextMenu.price); closeContextMenu(); }}
                  >
                    {pl.strikesLabel}
                  </button>
                ))
              ) : onCurveContextMenu ? (
                <button
                  style={{ display: 'block', width: '100%', padding: '7px 12px', background: 'none', border: 'none', color: 'var(--accent, #0A84FF)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg-hover, rgba(255,255,255,0.08))'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
                  onClick={handlePositionAlert}
                >
                  Create position alert…
                </button>
              ) : null}
            </>
          ) : (
            <>
              {/* Price alert menu — shown when right-clicking on blank chart area */}
              <div style={{ padding: '6px 12px', fontSize: 11, color: 'var(--text-tertiary, #98989d)', borderBottom: '1px solid var(--border-secondary, rgba(255,255,255,0.08))', marginBottom: 2 }}>
                Price Alert at {contextMenu.price.toFixed(0)}
              </div>
              <button
                style={{ display: 'block', width: '100%', padding: '7px 12px', background: 'none', border: 'none', color: 'var(--text-primary, #f5f5f7)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg-hover, rgba(255,255,255,0.08))'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
                onClick={() => handleCreateAlert('price_above')}
              >
                Alert when price rises above
              </button>
              <button
                style={{ display: 'block', width: '100%', padding: '7px 12px', background: 'none', border: 'none', color: 'var(--text-primary, #f5f5f7)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg-hover, rgba(255,255,255,0.08))'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
                onClick={() => handleCreateAlert('price_below')}
              >
                Alert when price falls below
              </button>
              <button
                style={{ display: 'block', width: '100%', padding: '7px 12px', background: 'none', border: 'none', color: 'var(--text-primary, #f5f5f7)', fontSize: 13, textAlign: 'left', cursor: 'pointer' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.background = 'var(--bg-hover, rgba(255,255,255,0.08))'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.background = 'none'; }}
                onClick={() => handleCreateAlert('price_touch')}
              >
                Alert when price touches
              </button>
            </>
          )}
        </div>
      )}

      {axisZoomHint === 'x' && (
        <div style={{
          position: 'absolute',
          bottom: PADDING.bottom / 2,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(59, 130, 246, 0.9)',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>◀ Narrower</span>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          <span>Wider ▶</span>
        </div>
      )}
      {axisZoomHint === 'y' && (
        <div style={{
          position: 'absolute',
          left: PADDING.left / 2,
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(59, 130, 246, 0.9)',
          color: '#fff',
          padding: '8px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 'bold',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px',
          whiteSpace: 'nowrap',
        }}>
          <span>▲ Taller</span>
          <span style={{ color: 'var(--text-muted)' }}>—</span>
          <span>▼ Shorter</span>
        </div>
      )}
      {crosshair && containerRef.current && (() => {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        const price = toDataX(crosshair.x, width);

        // Find P&L values from curves at this price
        const findPnLAtPrice = (data: PnLPoint[], targetPrice: number): number | null => {
          if (data.length < 2) return null;
          for (let i = 1; i < data.length; i++) {
            const prev = data[i - 1];
            const curr = data[i];
            if (targetPrice >= prev.price && targetPrice <= curr.price) {
              // Linear interpolation
              const t = (targetPrice - prev.price) / (curr.price - prev.price);
              return prev.pnl + t * (curr.pnl - prev.pnl);
            }
          }
          return null;
        };

        // Snap P&L to $0 when cursor is within 8px of a breakeven marker
        const snapThresholdPx = 8;
        const snapToBreakeven = (breakevens: number[], rawPnL: number | null): number | null => {
          if (rawPnL === null) return null;
          for (const be of breakevens) {
            const beX = toCanvasX(be, width);
            if (Math.abs(crosshair.x - beX) <= snapThresholdPx) return 0;
          }
          return rawPnL;
        };

        const expirationPnL = snapToBreakeven(expirationBreakevens, findPnLAtPrice(expirationData, price));
        const theoreticalPnL = snapToBreakeven(theoreticalBreakevens, findPnLAtPrice(theoreticalData, price));

        const expirationY = expirationPnL !== null ? toCanvasY(expirationPnL, height) : null;
        const theoreticalY = theoreticalPnL !== null ? toCanvasY(theoreticalPnL, height) : null;

        return (
          <>
            {/* Vertical line */}
            <div style={{
              position: 'absolute',
              left: crosshair.x,
              top: PADDING.top,
              width: 1,
              height: height - PADDING.top - PADDING.bottom,
              borderLeft: '1px dashed rgba(150, 150, 150, 0.6)',
              pointerEvents: 'none',
            }} />
            {/* Horizontal crosshair — follows cursor Y */}
            {crosshair.y >= PADDING.top && crosshair.y <= height - PADDING.bottom && (
              <div style={{
                position: 'absolute',
                left: PADDING.left,
                top: crosshair.y,
                width: width - PADDING.left - PADDING.right,
                height: 1,
                borderTop: '1px dashed rgba(150, 150, 150, 0.6)',
                pointerEvents: 'none',
              }} />
            )}
            {/* Horizontal line at expiration P&L */}
            {expirationY !== null && (
              <div style={{
                position: 'absolute',
                left: PADDING.left,
                top: expirationY,
                width: width - PADDING.left - PADDING.right,
                height: 1,
                borderTop: '1px dashed rgba(59, 130, 246, 0.6)',
                pointerEvents: 'none',
              }} />
            )}
            {/* Horizontal line at theoretical P&L */}
            {theoreticalY !== null && (
              <div style={{
                position: 'absolute',
                left: PADDING.left,
                top: theoreticalY,
                width: width - PADDING.left - PADDING.right,
                height: 1,
                borderTop: '1px dashed rgba(232, 121, 249, 0.6)',
                pointerEvents: 'none',
              }} />
            )}
            {/* X-axis label (underlying price at vertical crosshair) */}
            <div style={{
              position: 'absolute',
              left: crosshair.x,
              top: height - PADDING.bottom + 4,
              transform: 'translateX(-50%)',
              background: '#d1d5db',
              color: '#000',
              padding: '2px 6px',
              borderRadius: '3px',
              fontSize: '15px',
              fontWeight: 'bold',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 10,
            }}>
              {price.toFixed(0)}
            </div>
            {/* Y-axis label at mouse Y position (raw P&L readout) */}
            {(() => {
              const mousePnL = toDataY(crosshair.y, height);
              if (crosshair.y >= PADDING.top && crosshair.y <= height - PADDING.bottom) {
                return (
                  <div style={{
                    position: 'absolute',
                    left: 2,
                    top: crosshair.y,
                    transform: 'translateY(-50%)',
                    background: 'rgba(100, 100, 100, 0.85)',
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    pointerEvents: 'none',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                  }}>
                    {mousePnL >= 0 ? '+' : ''}${Math.abs(mousePnL).toFixed(0)}
                  </div>
                );
              }
              return null;
            })()}
            {/* Y-axis label - Expiration P&L (blue) */}
            {expirationPnL !== null && expirationY !== null && (
              <div style={{
                position: 'absolute',
                left: 2,
                top: expirationY,
                transform: 'translateY(-50%)',
                background: '#3b82f6',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '15px',
                fontWeight: 'bold',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 1,
              }}>
                {expirationPnL >= 0 ? '+' : ''}{expirationPnL.toFixed(0)}
              </div>
            )}
            {/* Y-axis label - Theoretical P&L (magenta) - on top */}
            {theoreticalPnL !== null && theoreticalY !== null && (
              <div style={{
                position: 'absolute',
                left: 2,
                top: theoreticalY,
                transform: 'translateY(-50%)',
                background: '#e879f9',
                color: '#fff',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '15px',
                fontWeight: 'bold',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                zIndex: 2,
              }}>
                {theoreticalPnL >= 0 ? '+' : ''}{theoreticalPnL.toFixed(0)}
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
});

PnLChart.displayName = 'PnLChart';

export default PnLChart;
