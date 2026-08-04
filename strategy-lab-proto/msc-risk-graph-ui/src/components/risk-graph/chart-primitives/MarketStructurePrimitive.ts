/**
 * MarketStructurePrimitive — LWC v5 overlay for dealer-gravity structural zones.
 * Draws volume wells (blue bands), crevasses (red bands), and volume nodes
 * (amber dashed horizontal lines) behind the candles.
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

// ─── Public types ─────────────────────────────────────────────────────────────

export interface MarketStructureData {
  volumeNodes: Array<{ price: number; weight: number; color?: string }>;
  crevasses: Array<[number, number]>;   // [low, high] — scarcity/resistance zones
  volumeWells: Array<[number, number]>; // [low, high] — support zones
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

class MSRenderer implements IPrimitivePaneRenderer {
  private _data: MarketStructureData;
  private _series: ISeriesApi<SeriesType>;

  constructor(data: MarketStructureData, series: ISeriesApi<SeriesType>) {
    this._data = data;
    this._series = series;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace((scope) => {
      const ctx = scope.context;
      const { mediaSize, horizontalPixelRatio, verticalPixelRatio } = scope;
      const width = mediaSize.width * horizontalPixelRatio;
      const height = mediaSize.height * verticalPixelRatio;

      const p2y = (price: number): number | null => {
        const coord = this._series.priceToCoordinate(price);
        return coord === null ? null : coord * verticalPixelRatio;
      };

      ctx.save();

      // ── Volume wells (support bands — blue tint) ─────────────────────────
      ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
      for (const [lo, hi] of this._data.volumeWells) {
        const y1 = p2y(hi);
        const y2 = p2y(lo);
        if (y1 === null || y2 === null) continue;
        const top = Math.min(y1, y2);
        const bot = Math.max(y1, y2);
        if (bot < 0 || top > height) continue;
        ctx.fillRect(0, top, width, bot - top);
      }

      // ── Crevasses (scarcity/resistance bands — red tint) ─────────────────
      ctx.fillStyle = 'rgba(239, 68, 68, 0.10)';
      for (const [lo, hi] of this._data.crevasses) {
        const y1 = p2y(hi);
        const y2 = p2y(lo);
        if (y1 === null || y2 === null) continue;
        const top = Math.min(y1, y2);
        const bot = Math.max(y1, y2);
        if (bot < 0 || top > height) continue;
        ctx.fillRect(0, top, width, bot - top);
      }

      // ── Volume nodes (dashed horizontal lines — amber) ───────────────────
      for (const node of this._data.volumeNodes) {
        const y = p2y(node.price);
        if (y === null || y < 0 || y > height) continue;
        const lw = Math.max(1, Math.min(3, node.weight)) * verticalPixelRatio;
        ctx.strokeStyle = node.color ?? '#f59e0b';
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = lw;
        ctx.setLineDash([6 * horizontalPixelRatio, 4 * horizontalPixelRatio]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  }
}

// ─── Pane view ────────────────────────────────────────────────────────────────

class MSPaneView implements IPrimitivePaneView {
  private _renderer: MSRenderer | null = null;

  update(data: MarketStructureData, series: ISeriesApi<SeriesType>): void {
    this._renderer = new MSRenderer(data, series);
  }

  zOrder(): 'bottom' { return 'bottom'; }
  renderer(): IPrimitivePaneRenderer | null { return this._renderer; }
}

// ─── Primitive ────────────────────────────────────────────────────────────────

export class MarketStructurePrimitive implements ISeriesPrimitive {
  private _data: MarketStructureData = { volumeNodes: [], crevasses: [], volumeWells: [] };
  private _paneView: MSPaneView = new MSPaneView();
  private _series: ISeriesApi<SeriesType> | null = null;
  private _requestUpdate: (() => void) | null = null;

  attached(params: SeriesAttachedParameter): void {
    this._series = params.series;
    this._requestUpdate = params.requestUpdate;
    this._paneView.update(this._data, this._series);
  }

  detached(): void {
    this._series = null;
    this._requestUpdate = null;
  }

  updateData(data: MarketStructureData): void {
    this._data = data;
    if (this._series) {
      this._paneView.update(this._data, this._series);
      this._requestUpdate?.();
    }
  }

  paneViews(): IPrimitivePaneView[] {
    return [this._paneView];
  }
}
