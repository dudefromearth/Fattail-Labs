/**
 * Structure-changed signal (PC-REC-6).
 * In: symbol · per-leg expiry · strike · right · normalized ratio.
 * Out: raw counts · POS · marks · IV · basis · lock · visible · clocks · order · collapse · focus.
 */

import { normalizeStrike } from "@/lib/options-lab/listedStrikes";
import { posAndRatio } from "@/lib/options-lab/positionQty";
import type { AnalyzerPosition } from "@/lib/options-lab/analyzerBook";
import type { PositionInput } from "@/lib/options-lab/positionTypes";

export type StructureSignal = {
  id: string;
  structureKey: string;
  reason: "structure" | "repair";
};

export function structureKeyFromInput(position: PositionInput): string {
  const { ratio } = posAndRatio(position.legs || []);
  const legs = (position.legs || [])
    .map(
      (l, i) =>
        `${l.side}:${l.type}:${normalizeStrike(l.strike)}:${ratio[i]}:${String(l.expiration || position.expiration || "").slice(0, 10)}`,
    )
    .join("|");
  return [
    (position.underlying || "").toUpperCase(),
    String(position.expiration || "").slice(0, 10),
    position.direction || "buy",
    legs,
  ].join("::");
}

export function structureKey(pos: AnalyzerPosition): string {
  return structureKeyFromInput(pos.position);
}

export function structureChanged(
  prev: AnalyzerPosition,
  next: AnalyzerPosition,
): boolean {
  return structureKey(prev) !== structureKey(next);
}

export function makeStructureSignal(
  prev: AnalyzerPosition | null,
  next: AnalyzerPosition,
  reason: "structure" | "repair" = "structure",
): StructureSignal | null {
  if (prev && !structureChanged(prev, next)) return null;
  if (!prev) {
    return { id: next.id, structureKey: structureKey(next), reason };
  }
  return { id: next.id, structureKey: structureKey(next), reason };
}

export function shouldRegisterInterest(pos: AnalyzerPosition): boolean {
  return pos.visible === true;
}
