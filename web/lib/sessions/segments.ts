/**
 * FatTail teaching-frame segments on US cash. Spec §12.
 * Wall-clock ET. Truncate on early close. Zero React.
 */

import type { DayStatus } from "../marketCalendar";
import { segmentOnAxis } from "./timeAxis";

export type SegmentId = "morning" | "afternoon" | "closing";

export type SegmentPaint = {
  id: SegmentId;
  label: "Morning" | "Afternoon" | "Closing";
  startEtMin: number;
  endEtMin: number;
  axisStart: number;
  axisEnd: number;
  truncated: boolean;
};

const MORNING_START = 9 * 60 + 30;
const MORNING_END = 12 * 60 + 30;
const AFTERNOON_END = 14 * 60 + 30;
const CLOSING_END = 16 * 60;
const EARLY_CASH_END = 13 * 60;

export function todayEtIso(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

export function etMinutesNow(now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const min = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + min;
}

function axisPair(
  isoDate: string,
  startEtMin: number,
  endEtMin: number,
): { axisStart: number; axisEnd: number } {
  const { a, b } = segmentOnAxis(
    isoDate,
    "America/New_York",
    startEtMin,
    endEtMin,
  );
  return { axisStart: a, axisEnd: b };
}

/** Ordered segments actually rendered for this calendar status. */
export function segmentsFor(
  isoDate: string,
  status: DayStatus,
): SegmentPaint[] {
  if (status.kind === "weekend" || status.kind === "closed") return [];

  if (status.kind === "early") {
    return [
      {
        id: "morning",
        label: "Morning",
        startEtMin: MORNING_START,
        endEtMin: MORNING_END,
        truncated: false,
        ...axisPair(isoDate, MORNING_START, MORNING_END),
      },
      {
        id: "afternoon",
        label: "Afternoon",
        startEtMin: MORNING_END,
        endEtMin: EARLY_CASH_END,
        truncated: true,
        ...axisPair(isoDate, MORNING_END, EARLY_CASH_END),
      },
    ];
  }

  return [
    {
      id: "morning",
      label: "Morning",
      startEtMin: MORNING_START,
      endEtMin: MORNING_END,
      truncated: false,
      ...axisPair(isoDate, MORNING_START, MORNING_END),
    },
    {
      id: "afternoon",
      label: "Afternoon",
      startEtMin: MORNING_END,
      endEtMin: AFTERNOON_END,
      truncated: false,
      ...axisPair(isoDate, MORNING_END, AFTERNOON_END),
    },
    {
      id: "closing",
      label: "Closing",
      startEtMin: AFTERNOON_END,
      endEtMin: CLOSING_END,
      truncated: false,
      ...axisPair(isoDate, AFTERNOON_END, CLOSING_END),
    },
  ];
}

/**
 * Which teaching-frame segment contains "now".
 * Null unless selected date is today AND US cash is open AND now is inside a
 * rendered segment.
 */
export function currentSegmentId(
  isoDate: string,
  status: DayStatus,
  segments: SegmentPaint[],
  now: Date,
): SegmentId | null {
  if (isoDate !== todayEtIso(now)) return null;
  if (status.kind !== "open" && status.kind !== "early") return null;
  const nowMin = etMinutesNow(now);
  const cashEnd = status.kind === "early" ? EARLY_CASH_END : CLOSING_END;
  if (nowMin < MORNING_START || nowMin >= cashEnd) return null;
  const hit = segments.find(
    (s) => nowMin >= s.startEtMin && nowMin < s.endEtMin,
  );
  return hit?.id ?? null;
}
