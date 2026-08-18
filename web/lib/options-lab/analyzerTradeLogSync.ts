/**
 * Optional Analyzer ↔ Trade Log link.
 * Sending to Trade Log connects the position. Closing that open in
 * Trade Log stamps the Options Lab close transaction.
 */

import type { Trade } from "@/lib/tradeLog";
import { findPairedClose } from "@/lib/tradeLog";
import { bookPnlSigned, closePosition, type AnalyzerPosition } from "./analyzerBook";

export function linkTradeLogId(
  pos: AnalyzerPosition,
  tradeId: number,
): AnalyzerPosition {
  if (!Number.isFinite(tradeId) || tradeId <= 0) return pos;
  return { ...pos, tradeLogTradeId: tradeId, updatedAt: Date.now() };
}

/**
 * If this position is linked and Trade Log has a TO_CLOSE on that open,
 * run the Options Lab close transaction (clock + frozen book mark).
 */
export function applyTradeLogCloseIfAny(
  pos: AnalyzerPosition,
  trades: Trade[],
): AnalyzerPosition {
  const id = pos.tradeLogTradeId;
  if (id == null || !Number.isFinite(id)) return pos;
  if (pos.closedAt != null) return pos;
  const close = findPairedClose(trades, id);
  if (!close) return pos;
  const at = close.exec_at ? Date.parse(close.exec_at) : Date.now();
  const stamped = closePosition(pos, Number.isFinite(at) ? at : Date.now());
  // Keep the book-mark P&L convention (per-share OPF), not Trade Log dollars.
  return {
    ...stamped,
    closedPnl: stamped.closedPnl ?? bookPnlSigned(pos),
  };
}

export function syncBookFromTradeLog(
  positions: AnalyzerPosition[],
  trades: Trade[],
): { next: AnalyzerPosition[]; changed: boolean } {
  let changed = false;
  const next = positions.map((p) => {
    const synced = applyTradeLogCloseIfAny(p, trades);
    if (synced !== p && synced.closedAt !== p.closedAt) changed = true;
    return synced;
  });
  return { next, changed };
}
