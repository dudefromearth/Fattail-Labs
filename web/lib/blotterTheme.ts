/**
 * Shared blotter / position-card color scheme (Trade Log SoR).
 * Analyzer position cards reuse these so open/close/select read the same.
 */

import type { CSSProperties } from "react";

/** Hex fills — same as Trade Log blotter (open green / close red / select blue). */
export const BLOTTER_HEX = {
  openBg: "#0B4A1F", // green — Trade Log TO_OPEN / long debit packages
  closeBg: "#8B1A1A", // red — Trade Log TO_CLOSE / short credit packages
  selectBg: "#2A7AB8",
  borderOpen: "#062E12",
  borderClose: "#4A0C0C",
  positionRule: "rgba(0,0,0,0.55)",
} as const;

/** CSS custom properties applied on a blotter or card list root. */
export const BLOTTER_CSS_VARS: CSSProperties = {
  ["--blotter-open-bg" as string]: BLOTTER_HEX.openBg,
  ["--blotter-close-bg" as string]: BLOTTER_HEX.closeBg,
  ["--blotter-border-open" as string]: BLOTTER_HEX.borderOpen,
  ["--blotter-border-close" as string]: BLOTTER_HEX.borderClose,
  ["--blotter-position-rule" as string]: BLOTTER_HEX.positionRule,
  ["--blotter-select-bg" as string]: BLOTTER_HEX.selectBg,
  ["--blotter-open-badge" as string]: "rgb(16 185 129 / 0.9)", // emerald-500/90
};

export type BlotterBlockKind = "open" | "close" | "neutral";

/**
 * Map package economics → Trade Log open/close fills.
 *
 * Trade Log greens TO_OPEN rows and reds TO_CLOSE — not “debit=red”.
 * Analysis packages: long/debit (you pay to open) → **open green**;
 * short/credit (you receive) → **close red**. Matches MSC Risk Graph card tint
 * and how a long call debit would look when opened on the Trade Log.
 */
export function blotterKindFromPackageSide(
  side: "debit" | "credit" | null | undefined,
): BlotterBlockKind {
  if (side === "debit") return "open"; // green
  if (side === "credit") return "close"; // red
  return "neutral";
}

export function blotterCardBackground(
  kind: BlotterBlockKind,
  selected: boolean,
): string {
  // Prefer hex so nested table cells always paint (vars can fail if root scope lost)
  if (selected) return BLOTTER_HEX.selectBg;
  if (kind === "close") return BLOTTER_HEX.closeBg;
  if (kind === "open") return BLOTTER_HEX.openBg;
  return "var(--color-surface)";
}

/**
 * Resolve debit/credit for blotter fill.
 * Prefer explicit priceSide; else OPF lastNatSigned (+debit / −credit); else direction.
 */
export function resolvePackageSide(pos: {
  priceSide?: "debit" | "credit" | null;
  lastNatSigned?: number | null;
  position?: { direction?: "buy" | "sell" | null };
}): "debit" | "credit" | null {
  if (pos.priceSide === "debit" || pos.priceSide === "credit") {
    return pos.priceSide;
  }
  const n = pos.lastNatSigned;
  if (n != null && Number.isFinite(n)) {
    if (n > 0) return "debit";
    if (n < 0) return "credit";
  }
  const dir = pos.position?.direction;
  if (dir === "sell") return "credit";
  if (dir === "buy") return "debit";
  return null;
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
