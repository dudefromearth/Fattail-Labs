/**
 * ConversationSurface — Echo CL-1-0 token lock.
 *
 * Normative still: docs/references/coach-lab-imessage-reference.jpg
 * Law: agents/p-coach-conversation-lab/gate-reports/CL-1-0-echo-token-lock.md
 *
 * Charlie implements ConversationSurface against these values.
 * Do not change numbers without Echo. This file is not a React surface.
 *
 * HIS-X-CS-1: the messaging pane may be pure iMessage white (#FFFFFF).
 * That exception is local to this token set. It is not a license for
 * Labs zinc/emerald chrome inside the pane.
 */

export const CS_COLUMN_MIN_PX = 375;
export const CS_COLUMN_MAX_PX = 420;
export const CS_COLUMN_PREFERRED_PX = 390;

/** Day/time separator when calendar day changes or this gap is reached. */
export const CS_SEPARATOR_GAP_MS = 60 * 60 * 1000;

export const CS = {
  threadBg: "#FFFFFF",
  outgoingBg: "#34C759",
  outgoingFg: "#FFFFFF",
  incomingBg: "#E9E9EB",
  incomingFg: "#000000",
  meta: "#8E8E93",
  composerFill: "#F2F2F7",
  composerPlaceholder: "#C7C7CC",
  plusRing: "#C7C7CC",
  plusGlyph: "#8E8E93",
  backRing: "#C7C7CC",
  backGlyph: "#8E8E93",
  avatarFill: "#7B8FB5",
  avatarFg: "#FFFFFF",
  namePillBg: "rgba(255, 255, 255, 0.92)",
  namePillFg: "#000000",
  namePillBorder: "rgba(0, 0, 0, 0.08)",
  namePillChevron: "#8E8E93",
  sendBg: "#34C759",
  sendFg: "#FFFFFF",
  focusRing: "rgba(0, 122, 255, 0.35)",
  hairline: "#E5E5EA",

  type:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif',
  weightMessage: 400,
  weightName: 600,
  weightMeta: 400,
  sizeMessagePx: 17,
  sizeMetaPx: 12,
  sizeNamePx: 13,
  sizeInitialsPx: 20,
  lineHeightMessage: 1.25,

  radiusBubblePx: 18,
  radiusPillPx: 999,
  radiusComposerPx: 999,

  headerAvatarPx: 56,
  namePillHeightPx: 24,
  namePillOverlapPx: 12,
  backVisualPx: 36,
  plusVisualPx: 36,
  sendVisualPx: 32,
  composerVisualPx: 36,
  hitPx: 44,
  ringStrokePx: 1.5,

  bubbleMaxWidthPct: 75,
  bubblePadYPx: 7,
  bubblePadXPx: 14,
  columnPadXPx: 16,
  sameRunGapPx: 6,
  runBreakGapPx: 12,
  threadPadTopPx: 20,
  composerPadYPx: 8,

  overlayAvatarTopPx: 8,
  overlayBackLeftPx: 16,
  overlayBackTopPx: 10,
  overlayStampTopPx: 80,

  tailWPx: 11,
  tailHPx: 13,
  tailOutsetPx: 5,

  motionEnterMs: 180,
  motionEnterFromYPx: 8,
  typingDotPx: 6,
  typingPeriodMs: 420,
  typingStaggerMs: 120,

  scrollStickPx: 40,
} as const;

export type CsAppearance = {
  incomingBg?: string;
  incomingText?: string;
  outgoingBg?: string;
  outgoingText?: string;
};

/** CSS custom properties for the surface root. Appearance may retint bubbles only. */
export function csStyleVars(
  appearance?: CsAppearance,
): Record<`--cs-${string}`, string> {
  return {
    "--cs-thread-bg": CS.threadBg,
    "--cs-outgoing-bg": appearance?.outgoingBg ?? CS.outgoingBg,
    "--cs-outgoing-fg": appearance?.outgoingText ?? CS.outgoingFg,
    "--cs-incoming-bg": appearance?.incomingBg ?? CS.incomingBg,
    "--cs-incoming-fg": appearance?.incomingText ?? CS.incomingFg,
    "--cs-meta": CS.meta,
    "--cs-composer-fill": CS.composerFill,
    "--cs-composer-placeholder": CS.composerPlaceholder,
    "--cs-plus-ring": CS.plusRing,
    "--cs-plus-glyph": CS.plusGlyph,
    "--cs-back-ring": CS.backRing,
    "--cs-back-glyph": CS.backGlyph,
    "--cs-avatar-fill": CS.avatarFill,
    "--cs-avatar-fg": CS.avatarFg,
    "--cs-name-pill-bg": CS.namePillBg,
    "--cs-name-pill-fg": CS.namePillFg,
    "--cs-name-pill-border": CS.namePillBorder,
    "--cs-name-pill-chevron": CS.namePillChevron,
    "--cs-send-bg": CS.sendBg,
    "--cs-send-fg": CS.sendFg,
    "--cs-focus-ring": CS.focusRing,
    "--cs-hairline": CS.hairline,
    "--cs-type": CS.type,
    "--cs-weight-message": String(CS.weightMessage),
    "--cs-weight-name": String(CS.weightName),
    "--cs-weight-meta": String(CS.weightMeta),
    "--cs-size-message": `${CS.sizeMessagePx}px`,
    "--cs-size-meta": `${CS.sizeMetaPx}px`,
    "--cs-size-name": `${CS.sizeNamePx}px`,
    "--cs-size-initials": `${CS.sizeInitialsPx}px`,
    "--cs-line-height-message": String(CS.lineHeightMessage),
    "--cs-radius-bubble": `${CS.radiusBubblePx}px`,
    "--cs-radius-pill": `${CS.radiusPillPx}px`,
    "--cs-header-avatar": `${CS.headerAvatarPx}px`,
    "--cs-name-pill-height": `${CS.namePillHeightPx}px`,
    "--cs-back": `${CS.backVisualPx}px`,
    "--cs-plus": `${CS.plusVisualPx}px`,
    "--cs-send": `${CS.sendVisualPx}px`,
    "--cs-composer-height": `${CS.composerVisualPx}px`,
    "--cs-hit": `${CS.hitPx}px`,
    "--cs-ring-stroke": `${CS.ringStrokePx}px`,
    "--cs-bubble-max": `${CS.bubbleMaxWidthPct}%`,
    "--cs-column-max": `${CS_COLUMN_MAX_PX}px`,
    "--cs-column-min": `${CS_COLUMN_MIN_PX}px`,
    "--cs-column-preferred": `${CS_COLUMN_PREFERRED_PX}px`,
  };
}

/**
 * iMessage notch — not a CSS border-triangle.
 * viewBox 0 0 11 13 · fill = the bubble background.
 */
export const CS_TAIL_VIEWBOX = "0 0 11 13";
export const CS_TAIL_OUT_PATH =
  "M0 0 C0.5 7 3.5 11 11 13 C5.5 11.5 1.5 8 0 0 Z";
export const CS_TAIL_IN_PATH =
  "M11 0 C10.5 7 7.5 11 0 13 C5.5 11.5 9.5 8 11 0 Z";

export function csInitials(name: string): string {
  const parts = name.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function csSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** `5:27 PM` — still idiom. Locale locked so the thread does not drift. */
export function csFormatClock(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function csFormatRelativeDay(d: Date, now: Date = new Date()): string {
  const diffDays = Math.round(
    (startOfLocalDay(now).getTime() - startOfLocalDay(d).getTime()) / 86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) {
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Centered separator: `Yesterday 5:27 PM`. Not small-caps. */
export function csFormatDayTimeSeparator(
  d: Date,
  now: Date = new Date(),
): string {
  return `${csFormatRelativeDay(d, now)} ${csFormatClock(d)}`;
}

/** Trailing receipt under latest outgoing: `Read Yesterday`. */
export function csFormatReadReceipt(at: Date, now: Date = new Date()): string {
  return `Read ${csFormatRelativeDay(at, now)}`;
}

/** Overlay stamp: `Conversation started Aug 13, 2026 · 9:58 PM`. */
export function csFormatConversationStamp(d: Date): string {
  const day = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Conversation started ${day} · ${csFormatClock(d)}`;
}

/**
 * Insert a day/time separator between prev and next when the local calendar
 * day changes or the gap is ≥ 60 minutes. No separator before the first
 * message — the conversation stamp is the start.
 */
export function csNeedsSeparator(prevAt: Date | null, at: Date): boolean {
  if (!prevAt) return false;
  if (!csSameLocalDay(prevAt, at)) return true;
  return at.getTime() - prevAt.getTime() >= CS_SEPARATOR_GAP_MS;
}
