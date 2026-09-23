/** Matrix orientation for fly / vertical / broken-wing heatmaps. */

export type MatrixView = "vertical" | "horizontal";

/** Templates whose grid is strike × width and can transpose. */
export const MATRIX_VIEW_TEMPLATE_IDS = [
  "sym-fly",
  "bw-fly",
  "vertical",
] as const;

export type MatrixViewTemplateId = (typeof MATRIX_VIEW_TEMPLATE_IDS)[number];

export function supportsMatrixView(templateId: string): boolean {
  return (MATRIX_VIEW_TEMPLATE_IDS as readonly string[]).includes(templateId);
}

export function parseMatrixView(raw: unknown): MatrixView {
  return raw === "horizontal" ? "horizontal" : "vertical";
}

/** Horizontal body axis: strikes increase left → right. */
export function strikesLeftToRight<T extends { strike: number }>(
  rows: readonly T[],
): T[] {
  return [...rows].sort((a, b) => a.strike - b.strike);
}

/** Horizontal-mode strike column: slight scale + full-column outline. */
export function horizontalColumnHoverClass(active: boolean, edge: "head" | "cell"): string {
  const base =
    "origin-center motion-safe:transition-[transform,box-shadow,font-size,padding,min-width] motion-safe:duration-75";
  if (!active) return `${base} px-0.5`;
  const outline =
    edge === "head"
      ? "shadow-[inset_0_2px_0_rgba(255,255,255,0.85),inset_2px_0_0_rgba(255,255,255,0.85),inset_-2px_0_0_rgba(255,255,255,0.85)]"
      : "shadow-[inset_2px_0_0_rgba(255,255,255,0.8),inset_-2px_0_0_rgba(255,255,255,0.8)]";
  return [
    base,
    // Box is sized to the strike (widest glyph) plus 5px each side.
    "relative z-[6] box-border overflow-visible whitespace-nowrap",
    "min-w-[calc(5ch+10px)] w-[calc(5ch+10px)] px-[5px] scale-[1.08] text-[13px] leading-tight",
    outline,
  ].join(" ");
}
