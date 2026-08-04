/**
 * PositionBoxPrimitive — LWC v5 series primitive.
 *
 * Every position is drawn with:
 *
 *   BREAKEVEN CURVES (primary)
 *     Upper and lower P&L=0 loci over time — same conceptual contour as the 3D
 *     risk-graph breakeven lines. Built from smoothEnvelope (theoretical decay)
 *     with barEnvelope as denser fallback. No filled "green field"; the zone is
 *     implied by the curves alone.
 *     - Left (t = entryTime):  real-time BS breakevens at full remaining life
 *     - Right (t = expiry):    converges to at-expiry intrinsic breakevens
 *
 *   AT-EXPIRY BE GUIDE (secondary)
 *     Thin horizontal segments at expLower / expUpper across entry→expiry when
 *     the envelope is missing (OTM / expired / legacy path).
 *
 *   WHITE STRIKE LINES — one per leg at its strike price, entryTime → expirationTime.
 *     Label: "{strike} {C/P} {DTE}D". Amber on hover / drag. Dashed when expired.
 *
 * Coordinate system:
 *   X-axis: time   via chart.timeScale().timeToCoordinate()
 *   Y-axis: price  via series.priceToCoordinate()
 */

import type {
  ISeriesPrimitive,
  ISeriesPrimitiveBase,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  SeriesType,
  ISeriesApi,
  IChartApiBase,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';
import type { BreakevenBounds } from '../../../lib/extractBreakevens';
import type { EnvelopeCrossSection } from '../../../lib/extractBreakevens';

// ─── Colors ───────────────────────────────────────────────────────────────────
//
// Breakeven curves only — no filled green field (matches 3D BE treatment).
// COL_BE_GREEN ≈ rgb(96, 191, 115) from RiskGraph3DView.

const BE_STROKE         = 'rgba(0, 255, 120, 0.95)';    // primary BE curve (match 3D green)
const BE_STROKE_GHOST   = 'rgba(0, 255, 120, 0.40)';    // expired
const BE_GUIDE_STROKE   = 'rgba(0, 255, 120, 0.55)';    // at-expiry guide (when no envelope)
const BE_GUIDE_GHOST    = 'rgba(0, 255, 120, 0.25)';

// Strike lines — thick white; grey+dashed for expired legs
const STRIKE_LINE       = 'rgba(255, 255, 255, 0.88)';  // white
const STRIKE_LINE_HOT   = 'rgba(251, 191, 36,  0.95)';  // amber when hovered/dragging
const STRIKE_LINE_GHOST = 'rgba(160, 160, 160, 0.55)';  // grey for expired
const LABEL_COLOR       = 'rgba(255, 255, 255, 0.85)';  // leg labels
const LABEL_COLOR_HOT   = 'rgba(251, 191, 36,  1.0)';   // amber label
const LABEL_COLOR_GHOST = 'rgba(160, 160, 160, 0.55)';  // grey label for expired

// ─── Public types ─────────────────────────────────────────────────────────────

/** Info emitted continuously during a strike drag on the price-time chart. */
export interface PriceTimeDragInfo {
  intentId: string;
  grabbedStrike: number;   // original strike value before drag
  offset: number;          // price offset in points (rounded)
  shiftKey: boolean;       // true = move all legs
}

export interface PositionBoxData {
  bounds: BreakevenBounds[];
  showLossBand: boolean; // retained for API compat — not used in new model
  /** Strike currently under the cursor (highlight) */
  highlightedStrike?: { intentId: string; strike: number } | null;
  /** Active drag — offset applied visually to leg positions */
  dragInfo?: PriceTimeDragInfo | null;
}

export interface PositionBoxOptions {
  showLossBand: boolean;
}

// ─── DTE helper (computed at draw time) ───────────────────────────────────────

function legDteLabel(expiration: string): string {
  const [y, m, d] = expiration.split('-').map(Number);
  // 4pm ET — approximate as 21:00 UTC (EST)
  const closeMs = Date.UTC(y, m - 1, d, 21, 0, 0);
  const dte = Math.max(0, Math.round((closeMs - Date.now()) / 86_400_000));
  return `${dte}D`;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

class PositionBoxRenderer implements IPrimitivePaneRenderer {
  private _data: PositionBoxData;
  private _series: ISeriesApi<SeriesType, Time> | null;
  private _chart:  IChartApiBase<Time> | null;

  constructor(
    data: PositionBoxData,
    series: ISeriesApi<SeriesType, Time> | null,
    chart:  IChartApiBase<Time> | null,
  ) {
    this._data   = data;
    this._series = series;
    this._chart  = chart;
  }

  draw(target: CanvasRenderingTarget2D): void {
    target.useBitmapCoordinateSpace(scope => {
      this._drawInScope(
        scope.context,
        scope.mediaSize.width  * scope.horizontalPixelRatio,
        scope.mediaSize.height * scope.verticalPixelRatio,
        scope.horizontalPixelRatio,
        scope.verticalPixelRatio,
      );
    });
  }

  private _drawInScope(
    ctx: CanvasRenderingContext2D,
    bitmapWidth: number,
    _bitmapHeight: number,
    hRatio: number,
    vRatio: number,
  ): void {
    const series = this._series;
    const chart  = this._chart;
    if (!series || !chart || this._data.bounds.length === 0) return;

    const ts = chart.timeScale();

    for (const b of this._data.bounds) {
      const expired = !!b.isExpired;

      // ── X coordinates ───────────────────────────────────────────────────
      // timeToCoordinate() returns null when the exact timestamp has no series
      // data point — can happen if the timestamp falls between whitespace bars.
      // Strategy: try exact → try nearest hourly whitespace entry → clamp to
      // left edge (bxEntry=0). Clamping is preferable to skipping: lines that
      // start at the left edge of the visible area are wrong but visible.
      const resolveX = (t: number): number | null => {
        const exact = ts.timeToCoordinate(t as UTCTimestamp);
        if (exact !== null) return exact;
        // Nearest hourly whitespace marker — always in the data
        const hourly = ts.timeToCoordinate(Math.round(t / 3600) * 3600 as UTCTimestamp);
        return hourly;
      };

      const xEntryRaw = resolveX(b.entryTime);
      const bxEntry   = xEntryRaw !== null ? Math.max(0, xEntryRaw * hRatio) : 0;

      const xExpRaw  = resolveX(b.expirationTime);
      const bxExpiry = xExpRaw !== null
        ? Math.min(bitmapWidth, xExpRaw * hRatio)
        : bitmapWidth;

      if (bxExpiry <= bxEntry) continue;
      const bw = bxExpiry - bxEntry;

      // ── BREAKEVEN CURVES (no filled green field) ─────────────────────────
      // Same idea as 3D RiskGraph3DView buildBreakevenCurve: upper/lower P&L=0
      // loci over time. Envelope data already carries those zeros per time slice;
      // we stroke the edges only (no polygon fill).
      //
      // Prefer smoothEnvelope (clean theoretical path); fall back to barEnvelope
      // when smooth is missing. When neither exists, draw flat at-expiry BE guides.
      const envelopeSrc =
        (b.smoothEnvelope?.length ?? 0) >= 2 ? b.smoothEnvelope
        : (b.barEnvelope?.length ?? 0) >= 2 ? b.barEnvelope
        : null;

      const drawEdgeLine = (pts: { bx: number; by: number }[]) => {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].bx, pts[0].by);
        for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].bx, pts[k].by);
        ctx.stroke();
      };

      if (envelopeSrc) {
        // Build screen-coordinate edges from envelope slices.
        // One top/bot pair per profitable segment group (e.g. long strangle = 2).
        const maxSeg = envelopeSrc.reduce((m, s) => Math.max(m, s.segments.length), 0);
        const groups: Array<{ top: { bx: number; by: number }[]; bot: { bx: number; by: number }[] }> = [];
        for (let si = 0; si < maxSeg; si++) {
          const top: { bx: number; by: number }[] = [];
          const bot: { bx: number; by: number }[] = [];
          for (const slice of envelopeSrc) {
            const seg = slice.segments[si];
            if (!seg) continue;
            // resolveX (with hourly fallback) — smoothEnvelope timestamps rarely
            // land on exact bar times; bare timeToCoordinate() would drop them.
            const xMedia = resolveX(slice.t);
            if (xMedia === null) continue;
            const bx = Math.max(0, Math.min(bitmapWidth, xMedia * hRatio));
            const yT = series.priceToCoordinate(seg[1]);
            const yB = series.priceToCoordinate(seg[0]);
            if (yT === null || yB === null) continue;
            top.push({ bx, by: yT * vRatio });
            bot.push({ bx, by: yB * vRatio });
          }
          groups.push({ top, bot });
        }

        ctx.strokeStyle = expired ? BE_STROKE_GHOST : BE_STROKE;
        ctx.lineWidth   = Math.max(2, 2.5 * hRatio);
        ctx.lineJoin    = 'round';
        ctx.lineCap     = 'round';
        if (expired) ctx.setLineDash([4 * hRatio, 4 * hRatio]);
        for (const { top, bot } of groups) {
          drawEdgeLine(top); // upper BE over time
          drawEdgeLine(bot); // lower BE over time
        }
        if (expired) ctx.setLineDash([]);
      } else if (b.expLower > 0 && b.expUpper > b.expLower) {
        // No envelope — at-expiry BE guide lines only (not a filled band)
        const yTop = series.priceToCoordinate(b.expUpper);
        const yBot = series.priceToCoordinate(b.expLower);
        if (yTop !== null && yBot !== null) {
          const byTop = yTop * vRatio;
          const byBot = yBot * vRatio;
          if (byBot > byTop) {
            ctx.strokeStyle = expired ? BE_GUIDE_GHOST : BE_GUIDE_STROKE;
            ctx.lineWidth = Math.max(1, 1.25 * hRatio);
            if (expired) ctx.setLineDash([4 * hRatio, 4 * hRatio]);
            ctx.beginPath();
            ctx.moveTo(bxEntry, byTop); ctx.lineTo(bxExpiry, byTop);
            ctx.moveTo(bxEntry, byBot); ctx.lineTo(bxExpiry, byBot);
            ctx.stroke();
            if (expired) ctx.setLineDash([]);
          }
        }
      } else if (!expired && b.theoSegments && b.theoSegments.length > 0) {
        // Legacy path — current-slice BEs as horizontal guides (no fill)
        ctx.strokeStyle = BE_STROKE;
        ctx.lineWidth   = Math.max(1.5, 2 * hRatio);
        for (const [segLo, segHi] of b.theoSegments) {
          const yTop = series.priceToCoordinate(segHi);
          const yBot = series.priceToCoordinate(segLo);
          if (yTop === null || yBot === null) continue;
          const byTop = yTop * vRatio;
          const byBot = yBot * vRatio;
          if (byBot - byTop <= 0) continue;
          ctx.beginPath();
          ctx.moveTo(bxEntry, byTop); ctx.lineTo(bxExpiry, byTop);
          ctx.moveTo(bxEntry, byBot); ctx.lineTo(bxExpiry, byBot);
          ctx.stroke();
        }
      }

      // ── WHITE strike lines + labels ─────────────────────────────────────
      if (!b.legs || b.legs.length === 0) continue;

      const highlight = this._data.highlightedStrike;
      const drag = this._data.dragInfo;

      // Label font — 11 CSS px scaled to bitmap resolution
      const fontPx = Math.round(11 * hRatio);
      ctx.font      = `${fontPx}px -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      for (const leg of b.legs) {
        // Apply drag offset if this leg is being dragged
        let drawStrike = leg.strike;
        if (drag && drag.intentId === b.intentId && drag.offset !== 0) {
          if (drag.shiftKey || leg.strike === drag.grabbedStrike) {
            drawStrike = leg.strike + drag.offset;
          }
        }

        const isHot = (highlight && highlight.intentId === b.intentId && highlight.strike === leg.strike)
          || (drag && drag.intentId === b.intentId &&
              (drag.shiftKey || leg.strike === drag.grabbedStrike));

        ctx.strokeStyle = isHot ? STRIKE_LINE_HOT : (expired ? STRIKE_LINE_GHOST : STRIKE_LINE);
        // Strike lines are thick (2px CSS) by default — hot bumps to 3px
        ctx.lineWidth   = isHot ? Math.max(3, 3 * hRatio) : Math.max(2, 2 * hRatio);
        ctx.fillStyle   = isHot ? LABEL_COLOR_HOT : (expired ? LABEL_COLOR_GHOST : LABEL_COLOR);

        const yMedia = series.priceToCoordinate(drawStrike);
        if (yMedia === null) continue;

        const by = yMedia * vRatio;

        // Horizontal line at strike — dashed for expired positions
        if (expired) ctx.setLineDash([5 * hRatio, 4 * hRatio]);
        ctx.beginPath();
        ctx.moveTo(bxEntry, by);
        ctx.lineTo(bxExpiry, by);
        ctx.stroke();
        if (expired) ctx.setLineDash([]);

        // Label: "{strike} C/P {DTE}D"  — right of the line, small gap
        const typeChar = leg.option_type === 'call' ? 'C' : 'P';
        const dte      = legDteLabel(leg.expiration);
        const label    = `${drawStrike} ${typeChar} ${dte}`;
        const labelX   = bxExpiry + 4 * hRatio;
        ctx.fillText(label, labelX, by);
      }

      // ── Drag offset badge ──────────────────────────────────────────────
      if (drag && drag.intentId === b.intentId && drag.offset !== 0) {
        const badgeLabel = `${drag.offset > 0 ? '+' : ''}${drag.offset}`;
        ctx.save();
        const badgeFontPx = Math.round(13 * hRatio);
        ctx.font = `bold ${badgeFontPx}px monospace`;
        const avgStrike = b.legs.reduce((s, l) => s + l.strike, 0) / b.legs.length + drag.offset;
        const badgeYMedia = series.priceToCoordinate(avgStrike);
        if (badgeYMedia !== null) {
          const badgeBy = badgeYMedia * vRatio;
          const badgeBx = (bxEntry + bxExpiry) / 2;
          const metrics = ctx.measureText(badgeLabel);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
          ctx.beginPath();
          ctx.roundRect(badgeBx - metrics.width / 2 - 6 * hRatio, badgeBy - 12 * vRatio,
            metrics.width + 12 * hRatio, 20 * vRatio, 4 * hRatio);
          ctx.fill();
          ctx.fillStyle = '#000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(badgeLabel, badgeBx, badgeBy - 2 * vRatio);
        }
        ctx.restore();
      }
    }
  }
}

// ─── Pane view ────────────────────────────────────────────────────────────────

class PositionBoxPaneView implements IPrimitivePaneView {
  private _renderer: PositionBoxRenderer;

  constructor(renderer: PositionBoxRenderer) {
    this._renderer = renderer;
  }

  renderer(): IPrimitivePaneRenderer {
    return this._renderer;
  }

  zOrder(): 'bottom' {
    return 'bottom';
  }
}

// ─── Primitive ────────────────────────────────────────────────────────────────

export class PositionBoxPrimitive
  implements ISeriesPrimitiveBase<SeriesAttachedParameter<Time, SeriesType>>
{
  private _data: PositionBoxData;
  private _series: ISeriesApi<SeriesType, Time> | null = null;
  private _chart:  IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void) | null = null;
  private _renderer: PositionBoxRenderer;
  private _paneView: PositionBoxPaneView;

  constructor(options?: Partial<PositionBoxOptions>) {
    this._data     = { bounds: [], showLossBand: options?.showLossBand ?? false };
    this._renderer = new PositionBoxRenderer(this._data, null, null);
    this._paneView = new PositionBoxPaneView(this._renderer);
  }

  attached(param: SeriesAttachedParameter<Time, SeriesType>): void {
    this._series = param.series as ISeriesApi<SeriesType, Time>;
    this._chart  = param.chart  as IChartApiBase<Time>;
    this._requestUpdate = param.requestUpdate;
    this._rebuildRenderer();
  }

  detached(): void {
    this._series = null;
    this._chart  = null;
    this._requestUpdate = null;
    this._rebuildRenderer();
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }

  updateAllViews(): void {
    this._rebuildRenderer();
  }

  updateData(bounds: BreakevenBounds[]): void {
    this._data = { ...this._data, bounds };
    this._rebuildRenderer();
    this._requestUpdate?.();
  }

  /** Set hovered strike for highlight rendering (ref-driven, no React re-render). */
  setHighlight(info: { intentId: string; strike: number } | null): void {
    this._data = { ...this._data, highlightedStrike: info };
    this._rebuildRenderer();
    this._requestUpdate?.();
  }

  /** Set drag info for real-time offset preview (ref-driven, no React re-render). */
  setDragInfo(info: PriceTimeDragInfo | null): void {
    this._data = { ...this._data, dragInfo: info };
    this._rebuildRenderer();
    this._requestUpdate?.();
  }

  updateOptions(options: Partial<PositionBoxOptions>): void {
    this._data = { ...this._data, ...options };
    this._rebuildRenderer();
    this._requestUpdate?.();
  }

  private _rebuildRenderer(): void {
    this._renderer = new PositionBoxRenderer(this._data, this._series, this._chart);
    this._paneView = new PositionBoxPaneView(this._renderer);
  }
}

export type { ISeriesPrimitive };
