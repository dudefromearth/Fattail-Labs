/** Cole's seven apply keys. Live AC ids 3–9 stay. Echo owns labels. */

export const APPLY_HUE = "#00B478";

export const APPLY_KEYS = [
  "HELL",
  "HEAVEN",
  "MONEY_TIMING",
  "COACHING_SKU",
  "ELEVEN_AM_ET",
  "TRIED",
  "PARTNER_SUPPORT",
] as const;

export type ApplyKey = (typeof APPLY_KEYS)[number];

export type ApplyStepId = "email" | ApplyKey;

export type ApplyControl = "email" | "text" | "textarea" | "yesno";

export type ApplyStep = {
  id: ApplyStepId;
  label: string;
  fieldId?: "3" | "4" | "5" | "6" | "7" | "8" | "9";
  control: ApplyControl;
};

/** Coach titles from the spec. Echo may replace wording; do not rename keys. */
export const APPLY_FIELDS: {
  key: ApplyKey;
  label: string;
  fieldId: "3" | "4" | "5" | "6" | "7" | "8" | "9";
}[] = [
  { key: "HELL", label: "Hell Island", fieldId: "3" },
  { key: "HEAVEN", label: "Heaven Island", fieldId: "4" },
  { key: "MONEY_TIMING", label: "Money/timing", fieldId: "5" },
  { key: "COACHING_SKU", label: "Coaching SKU", fieldId: "6" },
  { key: "ELEVEN_AM_ET", label: "Can make 11am ET", fieldId: "7" },
  { key: "TRIED", label: "What they tried", fieldId: "8" },
  { key: "PARTNER_SUPPORT", label: "Partner/support", fieldId: "9" },
];

/**
 * Invite order. Email is plumbing; then Cole's seven.
 * Fields 6 / 7 / 9: no invented dropdowns (empty AC option lists).
 * 7 is an honest yes/no for the Coach title. 6 and 9 stay free text.
 */
export const APPLY_STEPS: ApplyStep[] = [
  { id: "email", label: "Email", control: "email" },
  { id: "HELL", label: "Hell Island", fieldId: "3", control: "textarea" },
  { id: "HEAVEN", label: "Heaven Island", fieldId: "4", control: "textarea" },
  { id: "MONEY_TIMING", label: "Money/timing", fieldId: "5", control: "textarea" },
  {
    id: "COACHING_SKU",
    label: "Coaching SKU",
    fieldId: "6",
    control: "text",
  },
  {
    id: "ELEVEN_AM_ET",
    label: "Can make 11am ET",
    fieldId: "7",
    control: "yesno",
  },
  { id: "TRIED", label: "What they tried", fieldId: "8", control: "textarea" },
  {
    id: "PARTNER_SUPPORT",
    label: "Partner/support",
    fieldId: "9",
    control: "textarea",
  },
];

/**
 * Next step after an accepted answer. `accepted` is the seam so the path
 * can depend on the answer. Law: do not skip a Cole key — all seven still write.
 */
export function nextApplyStep(
  current: ApplyStepId,
  _accepted: Record<string, string>,
): ApplyStepId | "submit" {
  const i = APPLY_STEPS.findIndex((s) => s.id === current);
  if (i < 0) return "submit";
  const nxt = APPLY_STEPS[i + 1];
  return nxt ? nxt.id : "submit";
}

export function prevApplyStep(current: ApplyStepId): ApplyStepId | null {
  const i = APPLY_STEPS.findIndex((s) => s.id === current);
  if (i <= 0) return null;
  return APPLY_STEPS[i - 1].id;
}

export function stepById(id: ApplyStepId): ApplyStep {
  const step = APPLY_STEPS.find((s) => s.id === id);
  if (!step) throw new Error(`unknown apply step ${id}`);
  return step;
}

export function isEmailValid(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && v.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function stepValueValid(step: ApplyStep, value: string): boolean {
  const v = value.trim();
  if (step.control === "email") return isEmailValid(v);
  if (step.control === "yesno") return v === "yes" || v === "no";
  return v.length > 0;
}
