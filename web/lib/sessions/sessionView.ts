/**
 * Calendar × exchange row → banner, per-row state, RTH band.
 * Plan §7 GSC2-2 · review B2. Zero React.
 */

import {
  statusFor,
  upcomingClosures,
  type DayStatus,
} from "../marketCalendar";
import { EXCHANGES, type ExchangeRow } from "./exchanges";
import {
  currentSegmentId,
  etMinutesNow,
  segmentsFor,
  todayEtIso,
  type SegmentId,
  type SegmentPaint,
} from "./segments";
import {
  ANCHOR_INDEX_DEFAULT,
  DAY_MINUTES,
  WINDOW_DAYS_DEFAULT,
  windowSpan,
  etRangeLabel,
  formatEtClock,
} from "./timeAxis";

export type BannerKind = "open" | "early" | "closed" | "weekend";

export type RowPaint =
  | { kind: "open"; etLabel: string }
  | { kind: "closed"; label: "closed" }
  | { kind: "modified"; label: "modified" }
  | { kind: "early"; etLabel: string };

export type SessionView = {
  isoDate: string;
  status: DayStatus;
  banner: BannerKind;
  holidayName: string | null;
  rows: Array<{ id: string; paint: RowPaint }>;
  /** Minutes from midnight ET; null if band absent (full close / weekend). */
  bandEndEtMin: number | null;
  globexSundayNamed: boolean;
  torontoNormalOpen: boolean;
  /** Spec §12 teaching-frame ribbon. Empty when the RTH band is absent. */
  segments: SegmentPaint[];
  currentSegment: SegmentId | null;
  /** Upcoming US closures from the calendar, for ClosuresList. */
  closures: Array<{ date: string; kind: "closed" | "early"; name: string }>;
};

export type AxisSeam = {
  afterIndex: number;
  skipped: string[];
  kind: "weekend" | "cme-closed";
};

export type SessionDayView = SessionView & {
  dayIndex: number;
  axisOrigin: number;
};

export type SessionWindow = {
  days: SessionDayView[];
  isoDates: string[];
  anchorIndex: number;
  span: number;
  seams: AxisSeam[];
  count: number;
};

export type { SegmentId, SegmentPaint };

export type SessionViewOpts = {
  /** Injected clock. Defaults to `new Date()`. Tests pass a fixed instant. */
  now?: Date;
};

const US_CASH_IDS = new Set(["us-pre", "nyse", "us-ah", "spx-gth", "spx-reg"]);

function envelopeLabel(row: ExchangeRow, isoDate: string): string {
  const first = row.segments[0];
  const last = row.segments[row.segments.length - 1];
  return etRangeLabel(isoDate, row.tz, first.startMin, last.endMin);
}

function earlyLabel(row: ExchangeRow, isoDate: string): string {
  if (row.id === "nyse") {
    return etRangeLabel(isoDate, row.tz, 9 * 60 + 30, 13 * 60);
  }
  if (row.id === "spx-reg") {
    return etRangeLabel(isoDate, row.tz, 9 * 60 + 30, 13 * 60 + 15);
  }
  if (row.id === "es") {
    return `${formatEtClock(18 * 60)} – ${formatEtClock(13 * 60 + 15)}`;
  }
  return envelopeLabel(row, isoDate);
}

function attachFrame(
  isoDate: string,
  base: Omit<SessionView, "isoDate" | "segments" | "currentSegment" | "closures">,
  now: Date,
): SessionView {
  const segments = segmentsFor(isoDate, base.status);
  return {
    ...base,
    isoDate,
    segments,
    currentSegment: currentSegmentId(isoDate, base.status, segments, now),
    closures: upcomingClosures(isoDate, 6),
  };
}

export function addCalendarDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}

/** Occupies axis space if any tracked venue trades. Weekends and full CME closures do not. */
export function occupiesAxis(isoDate: string): boolean {
  const st = statusFor(isoDate);
  if (st.kind === "weekend") return false;
  if (st.kind === "closed") {
    return st.name !== "Christmas" && st.name !== "Good Friday";
  }
  return true;
}

export function nextOccupyingDay(fromIso: string): string {
  let d = fromIso;
  for (let i = 0; i < 40; i++) {
    if (occupiesAxis(d)) return d;
    d = addCalendarDays(d, 1);
  }
  return fromIso;
}

export function prevOccupyingDay(fromIso: string): string {
  let d = fromIso;
  for (let i = 0; i < 40; i++) {
    if (occupiesAxis(d)) return d;
    d = addCalendarDays(d, -1);
  }
  return fromIso;
}

/** GSC4.3 — CME trading day in progress (Sun 18:00 is already Monday's session). */
export function tradingDayInProgress(now: Date): string {
  const cal = todayEtIso(now);
  const min = etMinutesNow(now);
  if (min >= 18 * 60) {
    return nextOccupyingDay(addCalendarDays(cal, 1));
  }
  if (occupiesAxis(cal)) return cal;
  return nextOccupyingDay(addCalendarDays(cal, 1));
}

function listOccupyingDays(
  anchorIso: string,
  count: number,
  anchorIndex: number,
): { isoDates: string[]; seams: AxisSeam[] } {
  const anchor = occupiesAxis(anchorIso)
    ? anchorIso
    : nextOccupyingDay(anchorIso);
  const isoDates: string[] = [anchor];
  let cur = anchor;
  for (let i = 0; i < anchorIndex; i++) {
    cur = prevOccupyingDay(addCalendarDays(cur, -1));
    isoDates.unshift(cur);
  }
  while (isoDates.length < count) {
    const last = isoDates[isoDates.length - 1];
    isoDates.push(nextOccupyingDay(addCalendarDays(last, 1)));
  }
  const seams: AxisSeam[] = [];
  for (let i = 0; i < isoDates.length - 1; i++) {
    const skipped: string[] = [];
    let s = addCalendarDays(isoDates[i], 1);
    while (s !== isoDates[i + 1]) {
      skipped.push(s);
      s = addCalendarDays(s, 1);
    }
    if (skipped.length === 0) continue;
    const kind = skipped.some((x) => {
      const st = statusFor(x);
      return (
        st.kind === "closed" &&
        (st.name === "Christmas" || st.name === "Good Friday")
      );
    })
      ? "cme-closed"
      : "weekend";
    seams.push({ afterIndex: i, skipped, kind });
  }
  return { isoDates, seams };
}

function offsetSegments(
  segments: SegmentPaint[],
  dayIndex: number,
): SegmentPaint[] {
  const o = dayIndex * DAY_MINUTES;
  return segments.map((s) => ({
    ...s,
    axisStart: s.axisStart + o,
    axisEnd: s.axisEnd + o,
  }));
}

export function sessionWindow(
  anchorIso: string,
  opts: SessionViewOpts & {
    count?: number;
    anchorIndex?: number;
  } = {},
): SessionWindow {
  const count = opts.count ?? WINDOW_DAYS_DEFAULT;
  const anchorIndex = opts.anchorIndex ?? ANCHOR_INDEX_DEFAULT;
  const now = opts.now ?? new Date();
  const { isoDates, seams } = listOccupyingDays(anchorIso, count, anchorIndex);
  const days: SessionDayView[] = isoDates.map((iso, dayIndex) => {
    const one = sessionView(iso, { now });
    return {
      ...one,
      segments: offsetSegments(one.segments, dayIndex),
      dayIndex,
      axisOrigin: dayIndex * DAY_MINUTES,
    };
  });
  return {
    days,
    isoDates,
    anchorIndex: isoDates.indexOf(
      occupiesAxis(anchorIso) ? anchorIso : nextOccupyingDay(anchorIso),
    ),
    span: windowSpan(isoDates.length),
    seams,
    count: isoDates.length,
  };
}

export function sessionView(
  isoDate: string,
  opts: SessionViewOpts = {},
): SessionView {
  const now = opts.now ?? new Date();
  const status = statusFor(isoDate);
  const torontoNormalOpen = true; // never closed by US calendar (L7)

  if (status.kind === "weekend") {
    return attachFrame(
      isoDate,
      {
        status,
        banner: "weekend",
        holidayName: status.name,
        globexSundayNamed: true,
        torontoNormalOpen,
        bandEndEtMin: null,
        rows: EXCHANGES.map((row) => ({
          id: row.id,
          paint:
            US_CASH_IDS.has(row.id) || row.id === "es"
              ? ({ kind: "closed", label: "closed" } as const)
              : ({ kind: "open", etLabel: envelopeLabel(row, isoDate) } as const),
        })),
      },
      now,
    );
  }

  if (status.kind === "closed") {
    return attachFrame(
      isoDate,
      {
        status,
        banner: "closed",
        holidayName: status.name,
        globexSundayNamed: false,
        torontoNormalOpen,
        bandEndEtMin: null,
        rows: EXCHANGES.map((row) => ({
          id: row.id,
          paint: US_CASH_IDS.has(row.id)
            ? ({ kind: "closed", label: "closed" } as const)
            : row.id === "es"
              ? ({ kind: "modified", label: "modified" } as const)
              : ({ kind: "open", etLabel: envelopeLabel(row, isoDate) } as const),
        })),
      },
      now,
    );
  }

  if (status.kind === "early") {
    return attachFrame(
      isoDate,
      {
        status,
        banner: "early",
        holidayName: status.name,
        globexSundayNamed: false,
        torontoNormalOpen,
        bandEndEtMin: 13 * 60,
        rows: EXCHANGES.map((row) => ({
          id: row.id,
          paint:
            row.earlyCloseEndMinEt != null
              ? ({ kind: "early", etLabel: earlyLabel(row, isoDate) } as const)
              : ({ kind: "open", etLabel: envelopeLabel(row, isoDate) } as const),
        })),
      },
      now,
    );
  }

  return attachFrame(
    isoDate,
    {
      status,
      banner: "open",
      holidayName: null,
      globexSundayNamed: false,
      torontoNormalOpen,
      bandEndEtMin: 16 * 60,
      rows: EXCHANGES.map((row) => ({
        id: row.id,
        paint: { kind: "open", etLabel: envelopeLabel(row, isoDate) },
      })),
    },
    now,
  );
}

export function paintFor(
  view: SessionView,
  id: string,
): RowPaint {
  const row = view.rows.find((r) => r.id === id);
  if (!row) throw new Error(`unknown row ${id}`);
  return row.paint;
}
