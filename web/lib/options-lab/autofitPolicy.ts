/**
 * Analyzer Autofit policy (PC-FIT-1…3).
 * Structure signal in; overlay never; fit-if-needed after first show.
 */

export type AutofitKind =
  | "none"
  | "overlay"
  | "button"
  | "first-show"
  | "create-submit"
  | "structure";

export function shouldAutofit(
  kind: AutofitKind,
  geometryEscapes: boolean,
): boolean {
  if (kind === "none" || kind === "overlay") return false;
  if (
    kind === "button" ||
    kind === "first-show" ||
    kind === "create-submit"
  ) {
    return true;
  }
  if (kind === "structure") return geometryEscapes;
  return false;
}

export function geometryEscapesWindow(
  content: readonly number[],
  win: { min: number; max: number },
): boolean {
  const nums = content.filter((n) => Number.isFinite(n));
  if (!nums.length) return false;
  const lo = Math.min(...nums);
  const hi = Math.max(...nums);
  return lo < win.min - 1e-9 || hi > win.max + 1e-9;
}

export function visibleStructureFingerprint(
  rows: readonly { id: string; structureKey: string; visible: boolean }[],
): string {
  return rows
    .filter((r) => r.visible)
    .map((r) => `${r.id}:${r.structureKey}`)
    .sort()
    .join("\n");
}
