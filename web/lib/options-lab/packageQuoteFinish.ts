/**
 * Quote-merge leaf (PC-REC-4). Payload onto `cur`. Structure identity guard.
 * Session fields on `cur` always win. Drop if structure moved in flight.
 */

import type { AnalyzerPosition } from "@/lib/options-lab/analyzerBook";
import { applyPackageQuote } from "@/lib/options-lab/analyzerBook";
import { structureKey } from "@/lib/options-lab/structureSignal";

export type PackageQuotePayload = {
  complete?: boolean;
  package_debit_per_share?: number | null;
  max_skew_ms?: number | null;
  epoch_quality?: string | null;
  generations_used?: Record<string, { content_hash?: string; as_of?: string }>;
  as_of?: string | null;
  error?: string | null;
  skew_fail?: boolean;
  mark_mode?: string | null;
  mark_disclaimer?: string | null;
  basis_source?: string | null;
};

export function finishPackageQuote(
  cur: AnalyzerPosition,
  quote: PackageQuotePayload,
  opts?: {
    sessionHeld?: boolean;
    interestOk?: boolean;
    /** When the resolve started. Mismatch → drop (AT-PC-03). */
    expectedStructureKey?: string;
  },
): AnalyzerPosition {
  if (
    opts?.expectedStructureKey != null &&
    structureKey(cur) !== opts.expectedStructureKey
  ) {
    return cur;
  }
  const next = applyPackageQuote(cur, quote, {
    sessionHeld: opts?.sessionHeld,
    interestOk: opts?.interestOk,
  });
  if (next === cur) return cur;
  return {
    ...next,
    id: cur.id,
    position: cur.position,
    lock: cur.lock,
    visible: cur.visible,
    rehearsal: cur.rehearsal,
    createdAt: cur.createdAt,
    entryAt: cur.entryAt,
    closedAt: cur.closedAt,
    closedPnl: cur.closedPnl,
    tradeLogTradeId: cur.tradeLogTradeId,
    label: cur.label,
    notation: cur.notation,
  };
}
