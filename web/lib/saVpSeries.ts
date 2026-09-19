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
  hitProfile,
  panePriceWindow,
  sliceVisible,
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
};

export function paintProfile(
  ctx: CanvasRenderingContext2D,
  width: number,
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
  const maxBar = width * (paint.widthFrac || 0.62);
  const flushRight = paint.orientation === "rtl";
  ctx.fillStyle = PROFILE_BLUE;
  ctx.globalAlpha = paint.opacity || 0.42;
  for (let i = 0; i < rows.length; i++) {
    const b = rows[i];
    const y = yOf(b.price);
    const yNext =
      i + 1 < rows.length ? yOf(rows[i + 1].price) : y == null ? null : y + 2;
    if (y == null || yNext == null) continue;
    const bh = Math.max(1, Math.abs(yNext - y));
    const bw = b.volume > 0 ? Math.max(1, (b.volume / max) * maxBar) : 0;
    const x = flushRight ? width - bw : 0;
    const yTop = Math.min(y, yNext);
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
      paintProfile(ctx, mediaSize.width, this.paint, this.yOf);
    });
  }
}

class VpPaneView implements ISeriesPrimitivePaneView {
  private _yOf: (price: number) => number | null;

  constructor(
    private readonly paint: VpPaint,
    yOf: (price: number) => number | null,
  ) {
    this._yOf = yOf;
  }

  zOrder() {
    return "top" as const;
  }

  update(yOf: (price: number) => number | null): void {
    this._yOf = yOf;
  }

  renderer(): ISeriesPrimitivePaneRenderer | null {
    if (!this.paint.visible || !this.paint.bins.length) return null;
    return new VpRenderer(this.paint, this._yOf);
  }
}

export class VpHistogramPrimitive implements ISeriesPrimitive<Time> {
  private _series: ISeriesApi<"Candlestick"> | null = null;
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private readonly _view: VpPaneView;

  constructor(public readonly paint: VpPaint) {
    this._view = new VpPaneView(paint, (p) => this._series?.priceToCoordinate(p) ?? null);
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._series = param.series as ISeriesApi<"Candlestick">;
    this._chart = param.chart;
    this._requestUpdate = param.requestUpdate;
  }

  detached(): void {
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
    if (!y) return;
    this.paint.visibleLo = y.lo;
    this.paint.visibleHi = y.hi;
  }

  paneViews() {
    return [this._view];
  }

  requestUpdate(): void {
    this._requestUpdate?.();
  }

  clearBins(): void {
    clearPaint(this.paint);
    this.requestUpdate();
  }

  hitTest(x: number, y: number): PrimitiveHoveredItem | null {
    if (!hitProfile(this.paint.hitRects, x, y)) return null;
    return { externalId: "vp-histogram", zOrder: "top" };
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
