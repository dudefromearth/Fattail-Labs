/**
 * SessionLinePrimitive — LWC v5 series primitive.
 *
 * Draws market session markers on the price-time chart:
 *   1. Vertical dashed blue lines in the main pane at session boundaries
 *      (9:30, 12:30, 2:30, 4:00 ET) for each trading day in the candle set.
 *   2. Colored session bands (background fill) in the time axis pane.
 *   3. Session name labels (Morning, Afternoon, Closing) at the bottom of
 *      the main chart pane, just above the time axis.
 *
 * Only active when `showSessionLines` is true AND the chart is in a sub-hour
 * timeframe — gating is handled by the caller (PriceTimeChart).
 *
 * Usage:
 *   const prim = new SessionLinePrimitive();
 *   candleSeries.attachPrimitive(prim);
 *   prim.update(buildSessionLineData(candle.map(c => c.time as number)));
 */

import type {
  ISeriesPrimitiveBase,
  IPrimitivePaneView,
  IPrimitivePaneRenderer,
  SeriesAttachedParameter,
  SeriesType,
  IChartApiBase,
  Time,
  UTCTimestamp,
} from 'lightweight-charts';
import type { CanvasRenderingTarget2D } from 'fancy-canvas';

// ─── Session definitions ──────────────────────────────────────────────────────

/** ET wall-clock times for the four session boundary ticks */
const ET_BOUNDARIES: Array<{ hour: number; min: number }> = [
  { hour: 9,  min: 30 },   // market open
  { hour: 12, min: 30 },   // morning → afternoon
  { hour: 14, min: 30 },   // afternoon → closing
  { hour: 16, min: 0  },   // market close
];

const SESSION_NAMES   = ['Morning', 'Afternoon', 'Closing'] as const;

/** Semi-transparent band fills: blue / indigo / violet */
const SESSION_BAND_COLORS = [
  'rgba(59,  130, 246, 0.20)',   // Morning   — blue-500
  'rgba(99,  102, 241, 0.20)',   // Afternoon — indigo-500
  'rgba(139,  92, 246, 0.20)',   // Closing   — violet-500
] as const;

const SESSION_LABEL_COLORS = [
  'rgba(147, 197, 253, 0.90)',   // blue-300
  'rgba(165, 180, 252, 0.90)',   // indigo-300
  'rgba(196, 181, 253, 0.90)',   // violet-300
] as const;

const BOUNDARY_LINE_COLOR = 'rgba(59, 130, 246, 0.55)';

// ─── DST / timezone helpers ───────────────────────────────────────────────────

/**
 * Returns the America/New_York UTC offset (4 or 5) in effect for the
 * given UTC unix second.
 */
function etOffsetHours(utcSec: number): number {
  const d = new Date(utcSec * 1000);
  const etHour = parseInt(
    d.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      hour12: false,
    }),
    10,
  );
  const utcHour = d.getUTCHours();
  return ((utcHour - etHour) + 24) % 24;   // 4 (EDT) or 5 (EST)
}

/**
 * Given any UTC second on a trading day, constructs the UTC second
 * corresponding to `etHour:etMin` on that same ET calendar date.
 */
function etTimeToUtcSec(anyUtcSecOnDay: number, etHour: number, etMin: number): number {
  const offset = etOffsetHours(anyUtcSecOnDay);

  const d = new Date(anyUtcSecOnDay * 1000);
  const etDateStr = d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour12: false,
  });
  // Format: "MM/DD/YYYY, ..."
  const datePart = etDateStr.split(',')[0].trim().split('/');
  const month = parseInt(datePart[0], 10);
  const day   = parseInt(datePart[1], 10);
  const year  = parseInt(datePart[2], 10);

  return Date.UTC(year, month - 1, day, etHour + offset, etMin, 0) / 1000;
}

// ─── Public data types ────────────────────────────────────────────────────────

export interface SessionBand {
  startUtcSec: number;
  endUtcSec:   number;
  name:        string;
  colorIndex:  number;
}

export interface SessionLineData {
  /** UTC-second timestamps for all boundary ticks, sorted ascending */
  boundaries: number[];
  /** Per-session band info covering each trading day */
  sessions:   SessionBand[];
}

/**
 * Derives SessionLineData from an array of candle UTC-second timestamps.
 * Call this in PriceTimeChart whenever the `candles` array changes.
 * The data is stable across re-renders when the candle set has not changed.
 *
 * SESSION RULE: Morning / Afternoon / Closing labels only appear on
 * Mon–Fri equity trading days. This is an explicit rule, not a side-effect
 * of candle availability. When futures (Sun–Fri) are added to the chart,
 * Sunday candles must NOT generate equity session markers.
 *
 * COORDINATE RESOLUTION: Each computed ET boundary time is snapped to the
 * nearest candle timestamp before being stored. All sub-hour timeframes divide
 * evenly into 30 minutes (the coarsest ET boundary offset), so the snap is
 * exact for every supported timeframe. This means timeToCoordinate() always
 * resolves — no whitespace series modifications required.
 */
export function buildSessionLineData(candleTimestamps: number[]): SessionLineData {
  if (candleTimestamps.length === 0) return { boundaries: [], sessions: [] };

  // Sorted copy used for O(log n) binary-search snapping of ET boundary times
  // to the nearest actual candle so timeToCoordinate() always resolves.
  const sorted = [...candleTimestamps].sort((a, b) => a - b);

  function snapToCandle(target: number): number {
    let lo = 0;
    let hi = sorted.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    if (lo === 0) return sorted[0];
    const prev = sorted[lo - 1];
    const curr = sorted[lo] ?? prev;
    return (target - prev <= curr - target) ? prev : curr;
  }

  // Identify unique ET calendar days present in the candle data.
  // Equity sessions only — Mon–Fri. Sunday is explicitly excluded so that
  // futures candles (Sun 6 PM ET open) never produce Morning/Afternoon/Closing
  // markers on a Sunday.
  const seenDays  = new Set<string>();
  const dayAnchors: number[] = []; // one representative UTC sec per ET day

  for (const ts of candleTimestamps) {
    const d      = new Date(ts * 1000);
    const wd     = d.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short' });
    // Equity trading days only — skip Saturday and Sunday
    if (wd === 'Sat' || wd === 'Sun') continue;
    const dayKey = d.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
    if (!seenDays.has(dayKey)) {
      seenDays.add(dayKey);
      dayAnchors.push(ts);
    }
  }

  const boundaries: number[] = [];
  const sessions:   SessionBand[] = [];

  for (const anchor of dayAnchors) {
    // Compute exact ET boundary times then snap each to the nearest candle so
    // timeToCoordinate() resolves without any whitespace series changes.
    const times = ET_BOUNDARIES.map(b => snapToCandle(etTimeToUtcSec(anchor, b.hour, b.min)));
    boundaries.push(...times);

    for (let i = 0; i < SESSION_NAMES.length; i++) {
      sessions.push({
        startUtcSec: times[i],
        endUtcSec:   times[i + 1],
        name:        SESSION_NAMES[i],
        colorIndex:  i,
      });
    }
  }

  return { boundaries, sessions };
}

// ─── Renderers ────────────────────────────────────────────────────────────────

/**
 * Main-pane renderer:
 *   • Vertical dashed blue lines at every boundary timestamp.
 *   • Thin colored highlight strip at the bottom of the pane for the
 *     current active session only (does not touch the LWC time axis).
 *   • Session name labels just above the strip.
 *
 * No timeAxisPaneViews() — LWC's time axis format is left completely
 * untouched so the default TradingView-style labels are preserved.
 */
class SessionMainPaneRenderer implements IPrimitivePaneRenderer {
  private readonly _data:  SessionLineData;
  private readonly _chart: IChartApiBase<Time> | null;

  constructor(data: SessionLineData, chart: IChartApiBase<Time> | null) {
    this._data  = data;
    this._chart = chart;
  }

  draw(target: CanvasRenderingTarget2D): void {
    if (!this._chart) return;
    const { boundaries, sessions } = this._data;
    if (boundaries.length === 0) return;

    const ts     = this._chart.timeScale();
    const nowSec = Date.now() / 1000;

    target.useBitmapCoordinateSpace(scope => {
      const ctx    = scope.context;
      const bW     = scope.mediaSize.width  * scope.horizontalPixelRatio;
      const bH     = scope.mediaSize.height * scope.verticalPixelRatio;
      const hRatio = scope.horizontalPixelRatio;
      const vRatio = scope.verticalPixelRatio;

      // ── Current-session highlight strip (bottom of main pane) ─────────────
      // Drawn first so the dashed lines render on top of it.
      const STRIP_H = 5 * vRatio;   // 5 CSS px tall
      const stripY  = bH - STRIP_H;

      for (const s of sessions) {
        // Only the band containing now
        if (nowSec < s.startUtcSec || nowSec >= s.endUtcSec) continue;

        const x1Media = ts.timeToCoordinate(s.startUtcSec as UTCTimestamp);
        const x2Media = ts.timeToCoordinate(s.endUtcSec   as UTCTimestamp);
        if (x1Media === null || x2Media === null) continue;

        const x1 = x1Media * hRatio;
        const x2 = x2Media * hRatio;
        if (x2 <= x1) continue;

        ctx.fillStyle = SESSION_BAND_COLORS[s.colorIndex] ?? SESSION_BAND_COLORS[0];
        ctx.fillRect(x1, stripY, x2 - x1, STRIP_H);
      }

      // ── Vertical dashed boundary lines ────────────────────────────────────
      ctx.save();
      ctx.strokeStyle = BOUNDARY_LINE_COLOR;
      ctx.lineWidth   = Math.max(1, hRatio);
      ctx.setLineDash([4 * hRatio, 4 * hRatio]);

      for (const b of boundaries) {
        const xMedia = ts.timeToCoordinate(b as UTCTimestamp);
        if (xMedia === null) continue;
        const x = Math.round(xMedia * hRatio) + 0.5;
        if (x < 0 || x > bW) continue;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, bH);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.restore();

      // ── Session name labels (just above the strip) ────────────────────────
      // One label per session occurrence per visible day. Both x1 and x2 must
      // resolve — the PriceTimeChart whitespace series now includes explicit
      // entries at every boundary time (9:30, 12:30, 14:30, 16:00 ET) so null
      // coordinates no longer occur for any complete session in the chart range.
      // Coordinates are clipped to the canvas before computing the centre so a
      // partially off-screen band still places its label in the visible portion.
      const LABEL_FONT_PX  = Math.round(9 * vRatio);
      const LABEL_BOTTOM_Y = stripY - 2 * vRatio;   // 2px gap above strip

      ctx.save();
      ctx.font         = `500 ${LABEL_FONT_PX}px -apple-system, BlinkMacSystemFont, sans-serif`;
      ctx.textBaseline = 'bottom';
      ctx.textAlign    = 'center';

      for (const s of sessions) {
        const x1Media = ts.timeToCoordinate(s.startUtcSec as UTCTimestamp);
        const x2Media = ts.timeToCoordinate(s.endUtcSec   as UTCTimestamp);
        // Both boundaries must resolve — a null means the session is entirely
        // outside the current data range; skip it rather than drifting to bW.
        if (x1Media === null || x2Media === null) continue;

        const x1Raw = x1Media * hRatio;
        const x2Raw = x2Media * hRatio;
        // Skip sessions entirely off-screen.
        if (x2Raw <= 0 || x1Raw >= bW) continue;

        // Clip to canvas so a partially visible band still gets a centred label.
        const x1 = Math.max(0, x1Raw);
        const x2 = Math.min(bW, x2Raw);
        const bandWidth = x2 - x1;
        if (bandWidth < 32 * hRatio) continue;   // too narrow to label

        const centerX = x1 + bandWidth / 2;
        ctx.fillStyle = SESSION_LABEL_COLORS[s.colorIndex] ?? SESSION_LABEL_COLORS[0];
        ctx.fillText(s.name, centerX, LABEL_BOTTOM_Y, bandWidth - 4 * hRatio);
      }
      ctx.restore();
    });
  }
}

// ─── Pane view ────────────────────────────────────────────────────────────────

class SessionMainPaneView implements IPrimitivePaneView {
  private _primitive: SessionLinePrimitive;
  constructor(p: SessionLinePrimitive) { this._primitive = p; }
  renderer(): IPrimitivePaneRenderer {
    return new SessionMainPaneRenderer(this._primitive.getData(), this._primitive.getChart());
  }
}

// ─── Primitive ────────────────────────────────────────────────────────────────

export class SessionLinePrimitive
  implements ISeriesPrimitiveBase<SeriesAttachedParameter<Time, SeriesType>>
{
  private _chart:         IChartApiBase<Time> | null = null;
  private _requestUpdate: (() => void)        | null = null;
  private _data:          SessionLineData = { boundaries: [], sessions: [] };

  private readonly _paneView: SessionMainPaneView;

  constructor() {
    this._paneView = new SessionMainPaneView(this);
  }

  attached(param: SeriesAttachedParameter<Time, SeriesType>): void {
    this._chart         = param.chart  as IChartApiBase<Time>;
    this._requestUpdate = param.requestUpdate;
  }

  detached(): void {
    this._chart         = null;
    this._requestUpdate = null;
  }

  updateAllViews(): void {
    // Renderers read current state via getData()/getChart() — nothing to rebuild.
  }

  /** Replace the session data and trigger a chart redraw. */
  update(data: SessionLineData): void {
    this._data = data;
    this._requestUpdate?.();
  }

  paneViews(): readonly IPrimitivePaneView[] {
    return [this._paneView];
  }

  // ── Internal accessors for view/renderer ─────────────────────────────────

  getData():  SessionLineData            { return this._data;  }
  getChart(): IChartApiBase<Time> | null { return this._chart; }
}
