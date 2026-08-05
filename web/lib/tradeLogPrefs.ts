/**
 * Last-used Trade Log entry defaults (per browser).
 * Speeds manual entry — not product SoR.
 */

export type TradeLogLastUsed = {
  account_id?: number;
  underlier?: string;
  right?: "PUT" | "CALL";
  width?: string;
  strategy?: string;
  units?: string;
};

const KEY = "ft.tradeLog.lastUsed.v1";

export function loadTradeLogLastUsed(): TradeLogLastUsed {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TradeLogLastUsed;
  } catch {
    return {};
  }
}

export function saveTradeLogLastUsed(patch: TradeLogLastUsed): void {
  if (typeof window === "undefined") return;
  try {
    const prev = loadTradeLogLastUsed();
    localStorage.setItem(KEY, JSON.stringify({ ...prev, ...patch }));
  } catch {
    // ignore quota
  }
}
