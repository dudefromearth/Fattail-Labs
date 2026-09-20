/**
 * REQ-002 — chart settings section registry.
 * Other Labs chart apps adopt the same ids; VP is the first wire.
 * Our settings only — no TV-only options.
 *
 * Icons are TV-model glyphs (pencil, candles, histogram, axis arrows) —
 * not HIG SF Symbols. Rendered at 20px per the measurement spec.
 */

import type { DialogPart } from "./saLayerStore";

export type SettingsSectionIcon =
  | "canvas"
  | "price"
  | "profile"
  | "analysis"
  | "axis"
  | "legend"
  | "range"
  | "sessions";

export type SettingsSection = {
  id: DialogPart;
  label: string;
  icon: SettingsSectionIcon;
};

/** Sidebar order. First section is the generic (gear) landing. */
export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: "L0", label: "Canvas", icon: "canvas" },
  { id: "L1", label: "Price", icon: "price" },
  { id: "L2", label: "Profile", icon: "profile" },
  { id: "L3", label: "Analysis", icon: "analysis" },
  { id: "axis", label: "Scales and lines", icon: "axis" },
  { id: "sessions", label: "Time zones and sessions", icon: "sessions" },
  { id: "legend", label: "Status line", icon: "legend" },
  { id: "range", label: "Range", icon: "range" },
];

export const SETTINGS_FIRST_SECTION: DialogPart = SETTINGS_SECTIONS[0].id;

/** Right-click / chip → sidebar section. */
export function sectionForPart(part: DialogPart): DialogPart {
  if (part === "grid") return "L0";
  if (part === "chips") return "legend";
  if (part === "sessions") return "sessions";
  if (part === "mode") return SETTINGS_FIRST_SECTION;
  if (SETTINGS_SECTIONS.some((s) => s.id === part)) return part;
  return SETTINGS_FIRST_SECTION;
}
