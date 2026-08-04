/**
 * GexPrimitive — live LWC v5 drawing implementation.
 * Renders per-strike GEX as horizontal bars from the right price-axis edge.
 * Call GEX: green bars. Put GEX: red bars. Net mode: single bar per strike.
 */

import type {
  ISeriesPrimitive,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  ISeriesApi,
  SeriesType,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

// ─── Public types (unchanged from stub) ──────────────────────────────────────

export type GexDataPoint = {
  strike: number;
  calls: number;
  puts: number;
};

export type GexPrimitiveOptions = {
  mode: 'combined' | 'net';
  maxGex: number;
  maxNetGex: number;
  barHeight: number;
  callColor: string;
  putColor: string;
  transparency: number;
};

// ─── Renderer ────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

class GexPaneRenderer implements IPrimitivePaneRenderer {
  private readonly _data: GexDataPoint[];
  private readonly _options: GexPrimitiveOptions;
  private readonly _series: ISeriesApi<SeriesType>;

  constructor(
    data: GexDataPoint[],
    options: GexPrimitiveOptions,
    series: ISeriesApi<SeriesType>,
  ) {
    this._data = data;
    this._options = options;
    this._series = series;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const { mediaSize, horizontalPixelRatio, verticalPixelRatio } = scope;
      const width = mediaSize.width * horizontalPixelRatio;
      const height = mediaSize.height * verticalPixelRatio;
      const { mode, maxGex, maxNetGex, barHeight, callColor, putColor, transparency } =
        this._options;
      const alpha = Math.max(0, Math.min(1, 1 - transparency / 100));
      const maxBarWidth = width * 0.25; // max 25% of pane width
      const halfBar = (barHeight * verticalPixelRatio) / 2;

      for (const point of this._data) {
        const yCoord = this._series.priceToCoordinate(point.strike);
        if (yCoord === null) continue;
        const y = yCoord * verticalPixelRatio;

        if (mode === 'net') {
          const net = point.calls - point.puts;
          const denom = maxNetGex > 0 ? maxNetGex : 1;
          const barW = (Math.abs(net) / denom) * maxBarWidth;
          ctx.fillStyle = hexToRgba(net >= 0 ? callColor : putColor, alpha);
          ctx.fillRect(width - barW, y - halfBar, barW, barHeight * verticalPixelRatio);
        } else {
          // combined — call bar + put bar stacked from right edge
          const callDenom = maxGex > 0 ? maxGex : 1;
          const callW = (Math.abs(point.calls) / callDenom) * maxBarWidth;
          const putW = (Math.abs(point.puts) / callDenom) * maxBarWidth;

          // call bar (closer to price axis)
          ctx.fillStyle = hexToRgba(callColor, alpha);
          ctx.fillRect(
            width - callW,
            y - halfBar,
            callW,
            halfBar,
          );

          // put bar (below call bar)
          ctx.fillStyle = hexToRgba(putColor, alpha);
          ctx.fillRect(
            width - putW,
            y,
            putW,
            halfBar,
          );
        }
      }
    });
  }
}

// ─── Pane view ───────────────────────────────────────────────────────────────

class GexPaneView implements IPrimitivePaneView {
  private _renderer: GexPaneRenderer | null = null;

  update(
    data: GexDataPoint[],
    options: GexPrimitiveOptions,
    series: ISeriesApi<SeriesType>,
  ): void {
    this._renderer = new GexPaneRenderer(data, options, series);
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this._renderer;
  }
}

// ─── Main primitive class ─────────────────────────────────────────────────────

export class GexPrimitive implements ISeriesPrimitive {
  private _options: GexPrimitiveOptions;
  private _data: GexDataPoint[] = [];
  private _paneView: GexPaneView = new GexPaneView();
  private _series: ISeriesApi<SeriesType> | null = null;
  private _requestUpdate: (() => void) | null = null;

  constructor(options?: Partial<GexPrimitiveOptions>) {
    this._options = {
      mode: 'combined',
      maxGex: 1,
      maxNetGex: 1,
      barHeight: 4,
      callColor: '#22c55e',
      putColor: '#ef4444',
      transparency: 0,
      ...options,
    };
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  attached(param: SeriesAttachedParameter): void {
    this._series = param.series as ISeriesApi<SeriesType>;
    this._requestUpdate = param.requestUpdate;
    this._invalidate();
  }

  detached(): void {
    this._series = null;
    this._requestUpdate = null;
  }

  // ── ISeriesPrimitive ───────────────────────────────────────────────────────

  updateAllViews(): void {
    this._invalidate();
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }

  // ── Public API (unchanged from stub) ──────────────────────────────────────

  updateData(data: GexDataPoint[]): void {
    this._data = data;

    // Auto-compute maxGex from data if not explicitly set by caller
    if (data.length > 0) {
      let maxGex = 0;
      let maxNet = 0;
      for (const d of data) {
        if (Math.abs(d.calls) > maxGex) maxGex = Math.abs(d.calls);
        if (Math.abs(d.puts) > maxGex) maxGex = Math.abs(d.puts);
        const net = Math.abs(d.calls - d.puts);
        if (net > maxNet) maxNet = net;
      }
      if (maxGex > 0) this._options = { ...this._options, maxGex };
      if (maxNet > 0) this._options = { ...this._options, maxNetGex: maxNet };
    }

    this._invalidate();
  }

  updateOptions(options: Partial<GexPrimitiveOptions>): void {
    this._options = { ...this._options, ...options };
    this._invalidate();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _invalidate(): void {
    if (this._series) {
      this._paneView.update(this._data, this._options, this._series);
    }
    if (this._requestUpdate) {
      this._requestUpdate();
    }
  }
}
