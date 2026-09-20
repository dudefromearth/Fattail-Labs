/**
 * Phase B guest layer — L2 volume profile.
 * Primitive on the candle series (same price scale, no autoscale).
 * Layers ADD; never chart.applyOptions.
 */
import type {
  IChartApiBase,
  ISeriesApi,
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  PrimitiveHoveredItem,
  SeriesAttachedParameter,
  Time,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import {
  FORCE_VP_EVENT,
  RANGE_DEBOUNCE_MS,
  asUnixMs,
  candlesInMsRange,
  hitProfile,
  panePriceWindow,
  scheduleDebounced,
  sliceVisible,
  visibleCandleWindow,
  type VisibleCandleWindow,
  type VpBin,
  type VpHitRect,
} from "./saVpBand";

/** A13.2 / A3 — TV-benchmark profile blue. */
export const PROFILE_BLUE = "#2962ff";

export type VpPaint = {
  bins: VpBin[];
  visibleLo: number;
  visibleHi: number;
  orientation: "ltr" | "rtl";
  widthFrac: number;
  opacity: number;
  visible: boolean;
  hitRects: VpHitRect[];
  /** Price grain of each bin. Paint never stretches a bin across a gap. */
  row: number;
  color: string;
};

export function paintProfile(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  paint: VpPaint,
  yOf: (price: number) => number | null,
): void {
  paint.hitRects = [];
  if (!paint.visible) return;
  const ordered = [...paint.bins].sort((a, b) => a.price - b.price);
  let lo = paint.visibleLo;
  let hi = paint.visibleHi;
  if (!(hi > lo) && ordered.length) {
    lo = ordered[0].price;
    hi = ordered[ordered.length - 1].price;
  }
  let { rows, max } = sliceVisible(ordered, lo, hi);
  if (!rows.length) {
    rows = ordered;
    max = 0;
    for (const r of rows) if (r.volume > max) max = r.volume;
  }
  if (!max || !rows.length) return;
  const ySpan = hi - lo;
  const h = height > 0 ? height : 1;
  const yAt = (price: number): number => {
    const mapped = yOf(price);
    if (mapped != null) return mapped;
    if (!(ySpan > 0)) return h / 2;
    return ((hi - price) / ySpan) * h;
  };
  const maxBar = Math.max(8, width * (paint.widthFrac || 0.62));
  const flushRight = paint.orientation === "rtl";
  ctx.fillStyle = paint.color || PROFILE_BLUE;
  ctx.globalAlpha = paint.opacity || 0.42;
  const row = paint.row > 0 ? paint.row : 0.25;
  for (let i = 0; i < rows.length; i++) {
    const b = rows[i];
    const y = yAt(b.price);
    const yHi = yAt(b.price + row);
    const bh = Math.max(1, Math.abs(yHi - y));
    const bw = b.volume > 0 ? Math.max(2, (b.volume / max) * maxBar) : 2;
    const x = flushRight ? width - bw : 0;
    const yTop = Math.min(y, yHi);
    ctx.fillRect(x, yTop, bw, bh);
    paint.hitRects.push({ x0: x, y0: yTop, x1: x + bw, y1: yTop + bh });
  }
  ctx.globalAlpha = 1;
}

class VpRenderer implements ISeriesPrimitivePaneRenderer {
  constructor(
    private readonly paint: VpPaint,
    private readonly yOf: (price: number) => number | null,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      paintProfile(
        ctx,
        mediaSize.width,
        mediaSize.height,
        this.paint,
        this.yOf,
      );
    });
  }
}

class VpPaneView implements ISeriesPrimitivePaneView {
  private _yOf: (price: number) => number | null;
  private readonly _renderer: VpRenderer;

  constructor(
    private readonly paint: VpPaint,
    yOf: (price: number) => number | null,
  ) {
    this._yOf = yOf;
    this._renderer = new VpRenderer(paint, (p) => this._yOf(p));
  }

  zOrder() {
    return "top" as const;
  }

  update(yOf: (price: number) => number | null): void {
    this._yOf = yOf;
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    if (!this.paint.visible || !this.paint.bins.length) return null;
    return this._renderer;
  }
}

export class VpHistogramPrimitive implements ISeriesPrimitive<Time> {
  private _series: ISeriesApi<"Candlestick"> | null = null;
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private readonly _view: VpPaneView;
  private readonly _paneViews: ISeriesPrimitivePaneView[];
  private _times: () => number[] = () => [];
  private _tfMs = 300_000;
  private _onNeedWindow: ((w: VisibleCandleWindow) => void) | null = null;
  private _unsubs: Array<() => void> = [];
  private _debounce: { current: ReturnType<typeof setTimeout> | null } = {
    current: null,
  };

  constructor(public readonly paint: VpPaint) {
    this._view = new VpPaneView(paint, (p) => this._series?.priceToCoordinate(p) ?? null);
    this._paneViews = [this._view];
  }

  setTimeBase(times: () => number[], tfMs: number): void {
    this._times = times;
    this._tfMs = tfMs > 0 ? tfMs : 300_000;
  }

  onNeedWindow(fn: ((w: VisibleCandleWindow) => void) | null): void {
    this._onNeedWindow = fn;
  }

  /** Candles currently intersecting the canvas. */
  visibleWindow(): VisibleCandleWindow | null {
    const ts = this._chart?.timeScale?.();
    const series = this._series as
      | { barsInLogicalRange?: (r: { from: number; to: number }) => { from?: unknown; to?: unknown } | null }
      | null;
    const logical = ts?.getVisibleLogicalRange?.() ?? null;
    const times = this._times();
    if (series?.barsInLogicalRange && logical) {
      const info = series.barsInLogicalRange(logical);
      if (info && info.from != null && info.to != null) {
        const fromT = asUnixMs(Number(info.from));
        const toT = asUnixMs(Number(info.to)) + this._tfMs;
        const fromBars = candlesInMsRange(times, fromT, toT, this._tfMs);
        if (fromBars) return fromBars;
      }
    }
    const fromLogical = visibleCandleWindow({
      logical,
      times,
      tfMs: this._tfMs,
    });
    if (fromLogical) return fromLogical;
    const vis = ts?.getVisibleRange?.();
    if (
      vis &&
      typeof vis.from === "number" &&
      typeof vis.to === "number"
    ) {
      return candlesInMsRange(
        times,
        asUnixMs(Number(vis.from)),
        asUnixMs(Number(vis.to)) + this._tfMs,
        this._tfMs,
      );
    }
    return null;
  }

  /** First paint / symbol-TF load / forced event. */
  initialize(hint?: { lo: number; hi: number }): void {
    this.refresh();
    if (this._debounce.current) clearTimeout(this._debounce.current);
    const w =
      this.visibleWindow() ||
      (hint
        ? candlesInMsRange(this._times(), hint.lo, hint.hi, this._tfMs)
        : null);
    if (w) this._onNeedWindow?.(w);
  }

  /** Redraw the primitive from current bins + current price scale. */
  refresh(): void {
    this.updateAllViews();
    this._requestUpdate?.();
  }

  applyBins(bins: VpBin[]): void {
    this.paint.visible = true;
    this.paint.bins = bins.filter((b) => b.volume > 0);
    this.refresh();
  }

  forceDraw(bins: VpBin[], lo: number, hi: number, row?: number): boolean {
    if (hi > lo) {
      this.paint.visibleLo = lo;
      this.paint.visibleHi = hi;
    }
    if (row && row > 0) this.paint.row = row;
    this.applyBins(bins);
    return this.paint.bins.length > 0;
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._series = param.series as ISeriesApi<"Candlestick">;
    this._chart = param.chart;
    this._requestUpdate = param.requestUpdate;
    this._bindChartEvents();
    this.initialize();
  }

  detached(): void {
    this._unbindChartEvents();
    this._series = null;
    this._chart = null;
    this._requestUpdate = null;
  }

  updateAllViews(): void {
    const series = this._series;
    this._view.update((p) => series?.priceToCoordinate(p) ?? null);
    const paneH = this._chart?.paneSize().height ?? 0;
    if (!series) return;
    const y = panePriceWindow((coord) => series.coordinateToPrice(coord), paneH);
    if (y && y.hi > y.lo) {
      this.paint.visibleLo = y.lo;
      this.paint.visibleHi = y.hi;
    }
  }

  paneViews() {
    return this._paneViews;
  }

  requestUpdate(): void {
    this.refresh();
  }

  clearBins(): void {
    clearPaint(this.paint);
    this.refresh();
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    if (!hitProfile(this.paint.hitRects, x, y)) return null;
    return { externalId: "vp-histogram", zOrder: "top" };
  }

  private _onChartOrTimeline = (): void => {
    this.refresh();
    scheduleDebounced(this._debounce, RANGE_DEBOUNCE_MS, () => {
      const w = this.visibleWindow();
      if (w) this._onNeedWindow?.(w);
    });
  };

  private _onForce = (): void => {
    this.initialize();
  };

  private _bindChartEvents(): void {
    this._unbindChartEvents();
    const ts = this._chart?.timeScale?.();
    if (ts?.subscribeVisibleTimeRangeChange) {
      ts.subscribeVisibleTimeRangeChange(this._onChartOrTimeline);
      this._unsubs.push(() =>
        ts.unsubscribeVisibleTimeRangeChange(this._onChartOrTimeline),
      );
    }
    if (ts?.subscribeVisibleLogicalRangeChange) {
      ts.subscribeVisibleLogicalRangeChange(this._onChartOrTimeline);
      this._unsubs.push(() =>
        ts.unsubscribeVisibleLogicalRangeChange(this._onChartOrTimeline),
      );
    }
    if (typeof window !== "undefined") {
      window.addEventListener(FORCE_VP_EVENT, this._onForce);
      this._unsubs.push(() =>
        window.removeEventListener(FORCE_VP_EVENT, this._onForce),
      );
    }
  }

  private _unbindChartEvents(): void {
    if (this._debounce.current) clearTimeout(this._debounce.current);
    for (const off of this._unsubs) off();
    this._unsubs = [];
  }
}

export function emptyPaint(): VpPaint {
  return {
    bins: [],
    visibleLo: 0,
    visibleHi: 0,
    orientation: "ltr",
    widthFrac: 0.62,
    opacity: 0.42,
    visible: true,
    hitRects: [],
    row: 0.25,
    color: PROFILE_BLUE,
  };
}

export function clearPaint(paint: VpPaint): void {
  paint.bins = [];
  paint.hitRects = [];
}

export function asVpBins(raw: unknown): VpBin[] {
  if (!Array.isArray(raw)) return [];
  const out: VpBin[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const price = Number(r.price ?? r.p ?? r.px);
    const volume = Number(r.volume ?? r.v ?? r.vol ?? 0);
    if (!Number.isFinite(price)) continue;
    out.push({ price, volume: Number.isFinite(volume) ? volume : 0 });
  }
  return out;
}
