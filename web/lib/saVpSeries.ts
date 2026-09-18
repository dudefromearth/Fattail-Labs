/**
 * Phase B guest layer — L2 volume profile.
 * Adds a custom series. Never calls chart.applyOptions.
 * Non-defaults (A17): lastValueVisible=false, priceLineVisible=false (A12:
 * profile is not a price series and must not own last-value chrome);
 * priceValueBuilder returns [] so autoscale stays with L1 (A12.3).
 */
import {
  customSeriesDefaultOptions,
  type CustomData,
  type CustomSeriesOptions,
  type CustomSeriesWhitespaceData,
  type ICustomSeriesPaneRenderer,
  type ICustomSeriesPaneView,
  type PaneRendererCustomData,
  type PriceToCoordinateConverter,
  type Time,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import { sliceVisible, type VpBin, type VpHitRect } from "./saVpBand";

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

class VpRenderer implements ICustomSeriesPaneRenderer {
  constructor(private readonly paint: VpPaint) {}

  draw(
    target: CanvasRenderingTarget2D,
    priceToCoordinate: PriceToCoordinateConverter,
  ): void {
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      this.paint.hitRects = [];
      if (!this.paint.visible) return;
      const { rows, max } = sliceVisible(
        this.paint.bins,
        this.paint.visibleLo,
        this.paint.visibleHi,
      );
      if (!max || !rows.length) return;
      const W = mediaSize.width;
      const maxBar = W * this.paint.widthFrac;
      const flushRight = this.paint.orientation === "rtl";
      ctx.fillStyle = PROFILE_BLUE;
      ctx.globalAlpha = this.paint.opacity;
      for (let i = 0; i < rows.length; i++) {
        const b = rows[i];
        const y = priceToCoordinate(b.price);
        const yNext =
          i + 1 < rows.length
            ? priceToCoordinate(rows[i + 1].price)
            : y == null
              ? null
              : y + 2;
        if (y == null || yNext == null) continue;
        const bh = Math.max(1, Math.abs(yNext - y));
        const raw = b.volume > 0 ? (b.volume / max) * maxBar : 0;
        const bw = b.volume > 0 ? Math.max(1, raw) : 0;
        const x = flushRight ? W - bw : 0;
        const yTop = Math.min(y, yNext);
        ctx.fillRect(x, yTop, bw, bh);
        this.paint.hitRects.push({ x0: x, y0: yTop, x1: x + bw, y1: yTop + bh });
      }
      ctx.globalAlpha = 1;
    });
  }
}

export class VpHistogramSeries
  implements ICustomSeriesPaneView<Time, CustomData<Time>, CustomSeriesOptions>
{
  private readonly _renderer: VpRenderer;

  constructor(public readonly paint: VpPaint) {
    this._renderer = new VpRenderer(paint);
  }

  renderer(): ICustomSeriesPaneRenderer {
    return this._renderer;
  }

  update(
    _data: PaneRendererCustomData<Time, CustomData<Time>>,
    _options: CustomSeriesOptions,
  ): void {
    /* paint is mutated in place; x-invariant so bar data is ignored (A12.2) */
  }

  priceValueBuilder(_plotRow: CustomData<Time>): number[] {
    return [];
  }

  isWhitespace(
    data: CustomData<Time> | CustomSeriesWhitespaceData<Time>,
  ): data is CustomSeriesWhitespaceData<Time> {
    return !("color" in data);
  }

  defaultOptions(): CustomSeriesOptions {
    return {
      ...customSeriesDefaultOptions,
      lastValueVisible: false,
      priceLineVisible: false,
    };
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
