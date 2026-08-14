/** ConversationSurface tokens — locked from docs/references/coach-lab-imessage-reference.jpg */

export const CS_TOKENS = {
  threadBg: "#FFFFFF",
  outgoingBg: "#34C759",
  outgoingFg: "#FFFFFF",
  incomingBg: "#E9E9EB",
  incomingFg: "#000000",
  meta: "#8E8E93",
  composerFill: "#F2F2F7",
  composerPlaceholder: "#C7C7CC",
  plusRing: "#C7C7CC",
  radiusBubble: 18,
  sizeMessage: 17,
  sizeMeta: 12,
  weightMessage: 400,
  weightName: 600,
  lineHeight: 1.25,
  threadColumnMin: 375,
  threadColumnMax: 420,
  headerAvatar: 56,
  composerHeight: 36,
  plusSize: 36,
  bubbleMaxPct: 75,
  separatorGapMs: 60 * 60 * 1000,
} as const;

export type ConversationAppearance = {
  incomingBg?: string;
  incomingText?: string;
  outgoingBg?: string;
  outgoingText?: string;
};

export function appearanceVars(a?: ConversationAppearance): Record<string, string> {
  return {
    "--cs-thread-bg": CS_TOKENS.threadBg,
    "--cs-outgoing-bg": a?.outgoingBg || CS_TOKENS.outgoingBg,
    "--cs-outgoing-fg": a?.outgoingText || CS_TOKENS.outgoingFg,
    "--cs-incoming-bg": a?.incomingBg || CS_TOKENS.incomingBg,
    "--cs-incoming-fg": a?.incomingText || CS_TOKENS.incomingFg,
    "--cs-meta": CS_TOKENS.meta,
    "--cs-composer-fill": CS_TOKENS.composerFill,
    "--cs-composer-placeholder": CS_TOKENS.composerPlaceholder,
    "--cs-plus-ring": CS_TOKENS.plusRing,
  };
}

export function hexLuminance(hex: string): number {
  const n = hex.replace("#", "").trim();
  if (n.length !== 6) return 0;
  const toLin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const r = toLin(parseInt(n.slice(0, 2), 16));
  const g = toLin(parseInt(n.slice(2, 4), 16));
  const b = toLin(parseInt(n.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const l1 = hexLuminance(a);
  const l2 = hexLuminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
