/**
 * Shared selected trade for Options Lab Analyzer.
 * Heatmap Option-click writes; Analyzer reads + can paste.
 */

import type { ParsedTosTrade } from "./tosParser";
import { parseTosScript } from "./tosParser";

export const ANALYZER_TRADE_KEY = "ft_options_lab_analyzer_trade_v1";
/** Batman: two (or more) TOS scripts → two Analyzer cards. */
export const ANALYZER_TRADE_BATCH_KEY = "ft_options_lab_analyzer_trade_batch_v1";

export type StoredAnalyzerTrade = {
  raw: string;
  savedAt: number;
  source: "heatmap" | "paste" | "manual" | "builder";
};

export function saveAnalyzerTrade(
  raw: string,
  source: StoredAnalyzerTrade["source"] = "heatmap",
): void {
  if (typeof window === "undefined") return;
  const payload: StoredAnalyzerTrade = {
    raw: String(raw).trim(),
    savedAt: Date.now(),
    source,
  };
  try {
    sessionStorage.setItem(ANALYZER_TRADE_KEY, JSON.stringify(payload));
    window.dispatchEvent(
      new CustomEvent("ft-analyzer-trade", { detail: payload }),
    );
  } catch {
    /* ignore quota */
  }
}

export function loadAnalyzerTrade(): StoredAnalyzerTrade | null {
  if (typeof window === "undefined") return null;
  try {
    const s = sessionStorage.getItem(ANALYZER_TRADE_KEY);
    if (!s) return null;
    const j = JSON.parse(s) as StoredAnalyzerTrade;
    if (!j?.raw) return null;
    return j;
  } catch {
    return null;
  }
}

export function loadParsedAnalyzerTrade(): ParsedTosTrade | null {
  const st = loadAnalyzerTrade();
  if (!st) return null;
  return parseTosScript(st.raw);
}

export function clearAnalyzerTrade(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ANALYZER_TRADE_KEY);
    window.dispatchEvent(new CustomEvent("ft-analyzer-trade", { detail: null }));
  } catch {
    /* ignore */
  }
}

export function saveAnalyzerTradeBatch(
  raws: string[],
  source: StoredAnalyzerTrade["source"] = "heatmap",
): StoredAnalyzerTrade[] {
  const t0 = Date.now();
  const items: StoredAnalyzerTrade[] = raws
    .map((raw) => String(raw).trim())
    .filter(Boolean)
    .map((raw, i) => ({ raw, savedAt: t0 + i, source }));
  if (typeof window === "undefined") return items;
  try {
    sessionStorage.setItem(ANALYZER_TRADE_BATCH_KEY, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent("ft-analyzer-trade-batch", { detail: items }),
    );
  } catch {
    /* ignore quota */
  }
  return items;
}

export function loadAnalyzerTradeBatch(): StoredAnalyzerTrade[] {
  if (typeof window === "undefined") return [];
  try {
    const s = sessionStorage.getItem(ANALYZER_TRADE_BATCH_KEY);
    if (!s) return [];
    const j = JSON.parse(s) as unknown;
    if (!Array.isArray(j)) return [];
    return j.filter(
      (x): x is StoredAnalyzerTrade =>
        !!x && typeof x === "object" && typeof (x as StoredAnalyzerTrade).raw === "string",
    );
  } catch {
    return [];
  }
}

export function clearAnalyzerTradeBatch(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ANALYZER_TRADE_BATCH_KEY);
    window.dispatchEvent(
      new CustomEvent("ft-analyzer-trade-batch", { detail: [] }),
    );
  } catch {
    /* ignore */
  }
}
