/** Vertical session open/close marks. Guest primitive; no autoscale. */
import type {
  IChartApiBase,
  ISeriesPrimitive,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  SeriesAttachedParameter,
  Time,
  UTCTimestamp,
} from "lightweight-charts";
import type { CanvasRenderingTarget2D } from "fancy-canvas";
import { hexToRgba } from "./saTheme";
import {
  SESSION_WIDTH_PX,
  type SessionLineStyle,
  type SessionLineWidth,
} from "./saSession";

export type SessionLinePaint = {
  visible: boolean;
  times: number[];
  color: string;
  opacity: number;
  width: SessionLineWidth;
  style: SessionLineStyle;
};

export function emptySessionPaint(): SessionLinePaint {
  return {
    visible: true,
    times: [],
    color: "#787b86",
    opacity: 0.45,
    width: "thin",
    style: "dashed",
  };
}

class SessionRenderer implements ISeriesPrimitivePaneRenderer {
  constructor(
    private readonly paint: SessionLinePaint,
    private readonly xOf: (t: number) => number | null,
  ) {}

  draw(target: CanvasRenderingTarget2D): void {
    if (!this.paint.visible || !this.paint.times.length) return;
    target.useMediaCoordinateSpace(({ context: ctx, mediaSize }) => {
      ctx.save();
      ctx.strokeStyle = hexToRgba(
        this.paint.color || "#787b86",
        this.paint.opacity ?? 0.45,
      );
      ctx.lineWidth = SESSION_WIDTH_PX[this.paint.width] || 1;
      if (this.paint.style === "dashed") ctx.setLineDash([6, 4]);
      else ctx.setLineDash([]);
      for (const t of this.paint.times) {
        const x = this.xOf(t);
        if (x == null) continue;
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, mediaSize.height);
        ctx.stroke();
      }
      ctx.restore();
    });
  }
}

class SessionPaneView implements ISeriesPrimitivePaneView {
  private _xOf: (t: number) => number | null = () => null;
  constructor(private readonly paint: SessionLinePaint) {}
  zOrder() {
    return "bottom" as const;
  }
  update(xOf: (t: number) => number | null) {
    this._xOf = xOf;
  }
  renderer() {
    if (!this.paint.visible) return null;
    return new SessionRenderer(this.paint, this._xOf);
  }
}

export class SessionLinesPrimitive implements ISeriesPrimitive<Time> {
  private _chart: IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private readonly _view: SessionPaneView;
  private readonly _paneViews: ISeriesPrimitivePaneView[];

  constructor(public readonly paint: SessionLinePaint) {
    this._view = new SessionPaneView(paint);
    this._paneViews = [this._view];
  }

  attached(param: SeriesAttachedParameter<Time>): void {
    this._chart = param.chart;
    this._requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this._chart = null;
    this._requestUpdate = null;
  }

  updateAllViews(): void {
    const ts = this._chart?.timeScale();
    this._view.update((t) => {
      const x = ts?.timeToCoordinate(t as UTCTimestamp);
      return typeof x === "number" ? x : null;
    });
  }

  paneViews() {
    return this._paneViews;
  }

  refresh(): void {
    this.updateAllViews();
    this._requestUpdate?.();
  }

  setTimes(times: number[]): void {
    this.paint.times = times;
    this.refresh();
  }
}
