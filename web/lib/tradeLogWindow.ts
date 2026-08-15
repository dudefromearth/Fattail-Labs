/**
 * Blotter display window — how many contract rows are visible at once.
 * Does not change lazy-load page size (server still decides that).
 */

export const BLOTTER_WINDOW_STEPS = [20, 30, 40, 50] as const;
export type BlotterWindowRows = (typeof BLOTTER_WINDOW_STEPS)[number];

export const BLOTTER_WINDOW_DEFAULT: BlotterWindowRows = 20;

const KEY = "ft.tradeLog.blotterWindow.v1";

export function clampBlotterWindow(n: number): BlotterWindowRows {
  if (BLOTTER_WINDOW_STEPS.includes(n as BlotterWindowRows)) {
    return n as BlotterWindowRows;
  }
  return BLOTTER_WINDOW_DEFAULT;
}

export function loadBlotterWindowRows(): BlotterWindowRows {
  if (typeof window === "undefined") return BLOTTER_WINDOW_DEFAULT;
  try {
    const raw = Number(localStorage.getItem(KEY));
    return clampBlotterWindow(raw);
  } catch {
    return BLOTTER_WINDOW_DEFAULT;
  }
}

export function saveBlotterWindowRows(n: BlotterWindowRows): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, String(n));
  } catch {
    /* quota */
  }
}
