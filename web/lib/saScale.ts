/** One canvas, one price scale, one space (A8.4 · A12.4 · A13). */

export type CanvasSpace = "source" | "target";

export type MappingPayload = {
  ratio?: number;
  offset_published?: number;
} | null | undefined;

export function canvasSpace(mappingFlag?: string | null): CanvasSpace {
  return mappingFlag === "OK" ? "target" : "source";
}

export function mappingBadge(mappingFlag?: string | null): string {
  const flag = mappingFlag || "FAILED";
  const space = canvasSpace(flag);
  return `${space} space · map ${flag}`;
}

/** Map a SOURCE-space price onto the canvas space. Identity when mapping is not OK. */
export function toCanvasPrice(
  sourcePrice: number,
  mapping: MappingPayload,
  space: CanvasSpace,
): number {
  if (space === "source") return sourcePrice;
  const ratio = mapping?.ratio ?? 1;
  const offset = mapping?.offset_published ?? 0;
  return sourcePrice * ratio + offset;
}

export function fromCanvasPrice(
  canvasPrice: number,
  mapping: MappingPayload,
  space: CanvasSpace,
): number {
  if (space === "source") return canvasPrice;
  const ratio = mapping?.ratio ?? 1;
  const offset = mapping?.offset_published ?? 0;
  if (ratio === 0) return canvasPrice;
  return (canvasPrice - offset) / ratio;
}

export function yFor(
  price: number,
  lo: number,
  hi: number,
  h: number,
  pad: number,
): number {
  if (hi === lo) return h / 2;
  return pad + ((hi - price) / (hi - lo)) * (h - pad * 2);
}

export function autoFitY(
  prices: number[],
  margin = 0,
): { lo: number; hi: number } | null {
  if (!prices.length) return null;
  const lo0 = Math.min(...prices);
  const hi0 = Math.max(...prices);
  if (hi0 === lo0) return { lo: lo0, hi: hi0 };
  const pad = (hi0 - lo0) * margin;
  return { lo: lo0 - pad, hi: hi0 + pad };
}

export function alignmentDelta(
  profileY: number,
  candleY: number,
  lineY: number,
): number {
  return Math.max(
    Math.abs(profileY - candleY),
    Math.abs(profileY - lineY),
    Math.abs(candleY - lineY),
  );
}

export function assertAligned(
  profileY: number,
  candleY: number,
  lineY: number,
  tol = 1,
): boolean {
  return alignmentDelta(profileY, candleY, lineY) <= tol;
}
