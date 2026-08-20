/**
 * Autofit X scale: underlier points per CSS inch of the plot.
 * Member default is 12. Admin slider (local) is for hunting a later
 * symbol × structure table — that table is not law yet.
 */

export const AUTOFIT_PPI_KEY = "ft_analyzer_autofit_pts_per_inch";
export const CSS_PX_PER_INCH = 96;
/** Crowd default — Coach 2026-08-20. */
export const AUTOFIT_PTS_PER_INCH_DEFAULT = 12;
export const AUTOFIT_PTS_PER_INCH_MIN = 8;
export const AUTOFIT_PTS_PER_INCH_MAX = 120;

export function clampAutofitPtsPerInch(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return AUTOFIT_PTS_PER_INCH_DEFAULT;
  return Math.min(
    AUTOFIT_PTS_PER_INCH_MAX,
    Math.max(AUTOFIT_PTS_PER_INCH_MIN, n),
  );
}

export function loadAutofitPtsPerInch(): number {
  if (typeof window === "undefined") return AUTOFIT_PTS_PER_INCH_DEFAULT;
  try {
    const raw = window.localStorage.getItem(AUTOFIT_PPI_KEY);
    if (raw == null || raw === "") return AUTOFIT_PTS_PER_INCH_DEFAULT;
    return clampAutofitPtsPerInch(raw);
  } catch {
    return AUTOFIT_PTS_PER_INCH_DEFAULT;
  }
}

export function saveAutofitPtsPerInch(n: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      AUTOFIT_PPI_KEY,
      String(clampAutofitPtsPerInch(n)),
    );
  } catch {
    /* private mode */
  }
}

export function plotInchesFromPx(plotWidthPx: number): number {
  const w = Number(plotWidthPx);
  if (!Number.isFinite(w) || !(w > 0)) return 1;
  return w / CSS_PX_PER_INCH;
}
