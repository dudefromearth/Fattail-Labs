/**
 * VolumeProfilePrimitive — live LWC v5 drawing implementation.
 * Renders volume profile as horizontal bars from the left edge of the pane.
 * POC bucket is highlighted. VAH/VAL are drawn as reference lines.
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

export type VolumeProfileDataPoint = {
  price: number;
  volume: number;
};

export type VolumeProfilePrimitiveOptions = {
  maxVolume: number;
  barHeight: number;
  maxBarWidthPercent: number;
  color: string;
  alpha?: number;          // bar fill opacity 0–1 (default 0.65)
  pocColor?: string;
  vahValColor?: string;
  poc?: number;
  vah?: number;
  val?: number;
  binSize?: number;
  numRows?: number;
};

// ─── Renderer ────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

class VolumeProfilePaneRenderer implements IPrimitivePaneRenderer {
  private readonly _data: VolumeProfileDataPoint[];
  private readonly _options: VolumeProfilePrimitiveOptions;
  private readonly _series: ISeriesApi<SeriesType>;

  constructor(
    data: VolumeProfileDataPoint[],
    options: VolumeProfilePrimitiveOptions,
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
      const {
        maxVolume,
        barHeight,
        maxBarWidthPercent,
        color,
        alpha = 0.65,
        poc,
        vah,
        val,
        pocColor = '#f59e0b',
        vahValColor = '#6366f1',
      } = this._options;

      const maxBarWidth = width * (maxBarWidthPercent / 100);
      const volDenom = maxVolume > 0 ? maxVolume : 1;
      const halfBar = (barHeight * verticalPixelRatio) / 2;

      // Draw volume bars
      for (const bucket of this._data) {
        const yCoord = this._series.priceToCoordinate(bucket.price);
        if (yCoord === null) continue;
        const y = yCoord * verticalPixelRatio;
        const barW = (bucket.volume / volDenom) * maxBarWidth;

        const isPoc = poc !== undefined && Math.abs(bucket.price - poc) < 1e-6;
        ctx.fillStyle = isPoc ? pocColor : hexToRgba(color, alpha);
        ctx.fillRect(0, y - halfBar, barW, barHeight * verticalPixelRatio);

        // POC: add a bright border on the bar
        if (isPoc) {
          ctx.strokeStyle = pocColor;
          ctx.lineWidth = 1 * horizontalPixelRatio;
          ctx.strokeRect(0, y - halfBar, barW, barHeight * verticalPixelRatio);
        }
      }

      // VAH reference line
      if (vah !== undefined) {
        const vahY = this._series.priceToCoordinate(vah);
        if (vahY !== null) {
          const y = vahY * verticalPixelRatio;
          ctx.strokeStyle = hexToRgba(vahValColor, 0.7);
          ctx.lineWidth = 1 * verticalPixelRatio;
          ctx.setLineDash([4 * horizontalPixelRatio, 4 * horizontalPixelRatio]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(maxBarWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // VAL reference line
      if (val !== undefined) {
        const valY = this._series.priceToCoordinate(val);
        if (valY !== null) {
          const y = valY * verticalPixelRatio;
          ctx.strokeStyle = hexToRgba(vahValColor, 0.7);
          ctx.lineWidth = 1 * verticalPixelRatio;
          ctx.setLineDash([4 * horizontalPixelRatio, 4 * horizontalPixelRatio]);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(maxBarWidth, y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
    });
  }
}

// ─── Pane view ───────────────────────────────────────────────────────────────

class VolumeProfilePaneView implements IPrimitivePaneView {
  private _renderer: VolumeProfilePaneRenderer | null = null;

  update(
    data: VolumeProfileDataPoint[],
    options: VolumeProfilePrimitiveOptions,
    series: ISeriesApi<SeriesType>,
  ): void {
    this._renderer = new VolumeProfilePaneRenderer(data, options, series);
  }

  renderer(): IPrimitivePaneRenderer | null {
    return this._renderer;
  }
}

// ─── Main primitive class ─────────────────────────────────────────────────────

export class VolumeProfilePrimitive implements ISeriesPrimitive {
  private _options: VolumeProfilePrimitiveOptions;
  private _data: VolumeProfileDataPoint[] = [];
  private _paneView: VolumeProfilePaneView = new VolumeProfilePaneView();
  private _series: ISeriesApi<SeriesType> | null = null;
  private _requestUpdate: (() => void) | null = null;

  constructor(options?: Partial<VolumeProfilePrimitiveOptions>) {
    this._options = {
      maxVolume: 1,
      barHeight: 4,
      maxBarWidthPercent: 30,
      color: '#9333ea',
      pocColor: '#f59e0b',
      vahValColor: '#6366f1',
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

  updateData(data: VolumeProfileDataPoint[]): void {
    this._data = data;

    // Auto-compute maxVolume from data
    if (data.length > 0) {
      let maxVol = 0;
      for (const d of data) {
        if (d.volume > maxVol) maxVol = d.volume;
      }
      if (maxVol > 0) this._options = { ...this._options, maxVolume: maxVol };
    }

    this._invalidate();
  }

  updateOptions(options: Partial<VolumeProfilePrimitiveOptions>): void {
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
