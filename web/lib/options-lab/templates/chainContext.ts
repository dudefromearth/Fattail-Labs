/**
 * Dual-side ladder → heatmap template ChainContext.
 * Analyzer GEX and Heatmap templates share this map — one source.
 */

import {
  contractKey,
  type LadderFull,
} from "@/lib/chainLadderApi";
import type { ChainContext } from "./types";

export function chainContextFromLadder(
  symbol: string,
  ladder: LadderFull,
  viewSide: "call" | "put" = "call",
): ChainContext {
  const contracts = new Map<string, LadderFull["rows"][number]>();
  for (const r of ladder.rows || []) {
    contracts.set(contractKey(r.side, Number(r.strike)), r);
  }
  return {
    symbol,
    viewSide,
    spot: ladder.spot > 0 ? ladder.spot : null,
    strikeStep: ladder.strike_step ?? null,
    wings: Number(ladder.wings) > 0 ? Number(ladder.wings) : 50,
    contracts,
    asOf: ladder.as_of ?? null,
    contentHash: ladder.content_hash ?? null,
  };
}
