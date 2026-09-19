/**
 * REQ-002 — chart settings section registry.
 * Other Labs chart apps adopt the same ids; VP is the first wire.
 * Our settings only — no TV-only options.
 */

import type { DialogPart } from "./saLayerStore";

export type SettingsSection = {
  id: DialogPart;
  label: string;
};

/** Sidebar order. First section is the generic (gear) landing. */
export const SETTINGS_SECTIONS: readonly SettingsSection[] = [
  { id: "L0", label: "Canvas" },
  { id: "L1", label: "Price" },
  { id: "L2", label: "Profile" },
  { id: "L3", label: "Analysis" },
  { id: "axis", label: "Scales and lines" },
  { id: "legend", label: "Status line" },
  { id: "range", label: "Range" },
];

export const SETTINGS_FIRST_SECTION: DialogPart = SETTINGS_SECTIONS[0].id;

/** Right-click / chip → sidebar section. */
export function sectionForPart(part: DialogPart): DialogPart {
  if (part === "grid") return "L0";
  if (part === "chips") return "legend";
  if (part === "mode") return SETTINGS_FIRST_SECTION;
  if (SETTINGS_SECTIONS.some((s) => s.id === part)) return part;
  return SETTINGS_FIRST_SECTION;
}
