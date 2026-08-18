/**
 * T Ortho tape prefs — session clocks, label seat, candle kind.
 * Local to the member browser. Defaults are the 0DTE day map.
 */

export type SessionLabelAlign = "top" | "middle" | "bottom";

/** First-class tape styles. Default is HLOC with bodies and wicks. */
export type TapeCandleKind = "hloc" | "ohlc" | "line_close" | "area_close";

export type TapeAxisSide = "left" | "right" | "both";
export type TapeAxisContent = "ticker" | "strikes" | "both";

export type TapePrefs = {
  labelAlign: SessionLabelAlign;
  /** Afternoon starts here (minutes from midnight ET). Default noon. */
  noonMin: number;
  /** Closing starts here (minutes from midnight ET). Default 14:30. */
  closeSplitMin: number;
  candleKind: TapeCandleKind;
  /** Which plot edges get a price spine. */
  axisSide: TapeAxisSide;
  /** Ticker, listed strikes, or both flanking the spine. */
  axisContent: TapeAxisContent;
};

export const DEFAULT_TAPE_PREFS: TapePrefs = {
  labelAlign: "middle",
  noonMin: 12 * 60,
  closeSplitMin: 14 * 60 + 30,
  candleKind: "hloc",
  axisSide: "right",
  axisContent: "both",
};

const KEY = "ft_options_lab_tape_prefs_v1";
export const TAPE_PREFS_EVENT = "ftl-tape-prefs";

export const TAPE_CANDLE_KINDS: Array<{ id: TapeCandleKind; label: string }> = [
  { id: "hloc", label: "HLOC" },
  { id: "ohlc", label: "OHLC bars" },
  { id: "line_close", label: "Line at close" },
  { id: "area_close", label: "Area at close" },
];

export function hmToMin(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function minToHm(min: number): { hour: number; minute: number } {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return { hour: Math.floor(m / 60), minute: m % 60 };
}

export function minToTimeValue(min: number): string {
  const { hour, minute } = minToHm(min);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function timeValueToMin(raw: string): number | null {
  const parts = raw.split(":");
  const hour = Number(parts[0]);
  const minute = Number(parts[1]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hmToMin(hour, minute);
}

export function parseTapePrefs(raw: unknown): TapePrefs {
  const p = raw && typeof raw === "object" ? (raw as Partial<TapePrefs>) : {};
  const labelAlign =
    p.labelAlign === "top" || p.labelAlign === "bottom" || p.labelAlign === "middle"
      ? p.labelAlign
      : DEFAULT_TAPE_PREFS.labelAlign;
  const candleKind =
    p.candleKind === "ohlc" ||
    p.candleKind === "line_close" ||
    p.candleKind === "area_close" ||
    p.candleKind === "hloc"
      ? p.candleKind
      : DEFAULT_TAPE_PREFS.candleKind;
  const noonMin =
    typeof p.noonMin === "number" && Number.isFinite(p.noonMin)
      ? p.noonMin
      : DEFAULT_TAPE_PREFS.noonMin;
  const closeSplitMin =
    typeof p.closeSplitMin === "number" && Number.isFinite(p.closeSplitMin)
      ? p.closeSplitMin
      : DEFAULT_TAPE_PREFS.closeSplitMin;
  const axisSide =
    p.axisSide === "left" || p.axisSide === "right" || p.axisSide === "both"
      ? p.axisSide
      : DEFAULT_TAPE_PREFS.axisSide;
  const axisContent =
    p.axisContent === "ticker" ||
    p.axisContent === "strikes" ||
    p.axisContent === "both"
      ? p.axisContent
      : DEFAULT_TAPE_PREFS.axisContent;
  return {
    labelAlign,
    candleKind,
    noonMin: Math.max(9 * 60 + 35, Math.min(15 * 60, noonMin)),
    closeSplitMin: Math.max(noonMin + 5, Math.min(15 * 60 + 55, closeSplitMin)),
    axisSide,
    axisContent,
  };
}

export function loadTapePrefs(): TapePrefs {
  if (typeof window === "undefined") return { ...DEFAULT_TAPE_PREFS };
  try {
    const s = localStorage.getItem(KEY);
    if (!s) return { ...DEFAULT_TAPE_PREFS };
    return parseTapePrefs(JSON.parse(s));
  } catch {
    return { ...DEFAULT_TAPE_PREFS };
  }
}

export function saveTapePrefs(prefs: TapePrefs): void {
  if (typeof window === "undefined") return;
  const next = parseTapePrefs(prefs);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* quota */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TAPE_PREFS_EVENT));
  }
}

export function labelAlignY(
  align: SessionLabelAlign,
  plotY: number,
  plotH: number,
): number {
  if (align === "top") return plotY + 22;
  if (align === "bottom") return plotY + plotH - 22;
  return plotY + plotH * 0.45;
}
