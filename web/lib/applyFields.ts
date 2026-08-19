/** Cole's seven apply keys. Live AC ids 3–9 stay. Ernie owns invite wording. */

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

export type ApplyStepId = "intro" | "email" | ApplyKey;

export type ApplyControl = "continue" | "email" | "text" | "textarea" | "yesno";

export type ApplyStep = {
  id: ApplyStepId;
  ask: string;
  hint: string;
  fieldId?: "3" | "4" | "5" | "6" | "7" | "8" | "9";
  control: ApplyControl;
};

/** AC key → live id. Do not rename keys. Do not invent ids. */
export const APPLY_FIELDS: {
  key: ApplyKey;
  fieldId: "3" | "4" | "5" | "6" | "7" | "8" | "9";
}[] = [
  { key: "HELL", fieldId: "3" },
  { key: "HEAVEN", fieldId: "4" },
  { key: "MONEY_TIMING", fieldId: "5" },
  { key: "COACHING_SKU", fieldId: "6" },
  { key: "ELEVEN_AM_ET", fieldId: "7" },
  { key: "TRIED", fieldId: "8" },
  { key: "PARTNER_SUPPORT", fieldId: "9" },
];

/**
 * Invite order (Ernie 2026-08-19): intro → email → HEAVEN → HELL → the rest.
 * Fields 6 / 9: free text. Field 7: honest yes/no. No invented dropdowns.
 * Observer / Activator / Navigator are examples only.
 */
export const APPLY_STEPS: ApplyStep[] = [
  {
    id: "intro",
    ask: "This is the FatTail application.",
    hint: "A few questions, one at a time, so we know if this is a fit. Not a dump of fields.",
    control: "continue",
  },
  {
    id: "email",
    ask: "Enter your email (we will never share it).",
    hint: "",
    control: "email",
  },
  {
    id: "HEAVEN",
    ask: "What do you consider your heaven island?",
    hint: "The life and trading state you want. For example: a defined-risk book you can compound. Calm in the chair. Not hunting win rate.",
    fieldId: "4",
    control: "textarea",
  },
  {
    id: "HELL",
    ask: "What is your hell island?",
    hint: "The pain. For example: violent equity. Blow-ups. Solving for win rate.",
    fieldId: "3",
    control: "textarea",
  },
  {
    id: "MONEY_TIMING",
    ask: "Can you invest the time and money now?",
    hint: "An honest yes, a not-yet, or what has to move first.",
    fieldId: "5",
    control: "textarea",
  },
  {
    id: "COACHING_SKU",
    ask: "Which door do you think you want?",
    hint: "Say it in your words. Observer, Activator, or Navigator are examples — not a menu.",
    fieldId: "6",
    control: "text",
  },
  {
    id: "ELEVEN_AM_ET",
    ask: "Can you make an 11am ET call?",
    hint: "A live conversation at that hour.",
    fieldId: "7",
    control: "yesno",
  },
  {
    id: "TRIED",
    ask: "What have you already tried?",
    hint: "Courses, rooms, a firm, going it alone — whatever is true.",
    fieldId: "8",
    control: "textarea",
  },
  {
    id: "PARTNER_SUPPORT",
    ask: "Is home on board?",
    hint: "Partner, family — whether they support you doing this.",
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
  if (step.control === "continue") return true;
  const v = value.trim();
  if (step.control === "email") return isEmailValid(v);
  if (step.control === "yesno") return v === "yes" || v === "no";
  return v.length > 0;
}

export function nextLabel(step: ApplyStep, isLast: boolean): string {
  if (step.control === "continue") return "Continue";
  if (isLast) return "Submit";
  return "OK";
}
