/**
 * Shared selected trade for Options Lab Analyzer.
 * Heatmap Option-click writes; Analyzer reads + can paste.
 */

import type { ParsedTosTrade } from "./tosParser";
import { parseTosScript } from "./tosParser";

export const ANALYZER_TRADE_KEY = "ft_options_lab_analyzer_trade_v1";

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
