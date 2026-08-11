/**
 * Shared blotter / position-card color scheme (Trade Log SoR).
 * Analyzer position cards reuse these so open/close/select read the same.
 */

import type { CSSProperties } from "react";

/** CSS custom properties applied on a blotter or card list root. */
export const BLOTTER_CSS_VARS: CSSProperties = {
  ["--blotter-open-bg" as string]: "#0B4A1F",
  ["--blotter-close-bg" as string]: "#8B1A1A",
  ["--blotter-border-open" as string]: "#062E12",
  ["--blotter-border-close" as string]: "#4A0C0C",
  ["--blotter-position-rule" as string]: "rgba(0,0,0,0.55)",
  ["--blotter-select-bg" as string]: "#2A7AB8",
  ["--blotter-open-badge" as string]: "rgb(16 185 129 / 0.9)", // emerald-500/90
};

export type BlotterBlockKind = "open" | "close" | "neutral";

/** Map package side to blotter open (credit/receive) vs close (debit/pay) family. */
export function blotterKindFromPackageSide(
  side: "debit" | "credit" | null | undefined,
): BlotterBlockKind {
  if (side === "credit") return "open";
  if (side === "debit") return "close";
  return "neutral";
}

export function blotterCardBackground(
  kind: BlotterBlockKind,
  selected: boolean,
): string {
  if (selected) return "var(--blotter-select-bg)";
  if (kind === "close") return "var(--blotter-close-bg)";
  if (kind === "open") return "var(--blotter-open-bg)";
  return "var(--color-surface)";
}

export function blotterCardBorder(
  kind: BlotterBlockKind,
  selected: boolean,
): string {
  if (selected) return "rgba(255,255,255,0.35)";
  if (kind === "close") return "var(--blotter-border-close)";
  if (kind === "open") return "var(--blotter-border-open)";
  return "var(--color-separator)";
}

/** Text on saturated blotter fills is light (Trade Log row convention). */
export function blotterOnFillText(selected: boolean, kind: BlotterBlockKind): {
  primary: string;
  secondary: string;
  tertiary: string;
} {
  if (selected || kind === "open" || kind === "close") {
    return {
      primary: "text-white/95",
      secondary: "text-white/75",
      tertiary: "text-white/55",
    };
  }
  return {
    primary: "text-[var(--color-label)]",
    secondary: "text-[var(--color-label-secondary)]",
    tertiary: "text-[var(--color-label-tertiary)]",
  };
}
