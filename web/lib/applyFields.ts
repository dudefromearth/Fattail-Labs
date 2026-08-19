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

export type ApplyScreenId = ApplyStepId | "review";

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

/** Field ids 6 / 7 / 9 — a change recomputes the remaining path. */
export const BRANCH_KEYS: ApplyKey[] = [
  "COACHING_SKU",
  "ELEVEN_AM_ET",
  "PARTNER_SUPPORT",
];

export function isBranchKey(id: ApplyStepId): boolean {
  return (BRANCH_KEYS as string[]).includes(id);
}

export function isElevenNo(value: string): boolean {
  return value.trim().toLowerCase() === "no";
}

/**
 * Live path from answers. Branch keys 6/7/9 are the SoR for what stays
 * on the path. Steps not returned are dead — Review skips them and
 * recompute drops their answers.
 *
 * - 6 (COACHING_SKU): consulted on every accept. Free text — we do not
 *   parse Observer / Activator / Navigator as a menu, so 6 does not
 *   skip later questions by itself.
 * - 7 (ELEVEN_AM_ET): No → PARTNER_SUPPORT is a dead branch. Yes or
 *   unanswered → home/partner stays on the path.
 * - 9 (PARTNER_SUPPORT): last live field; recompute still runs.
 */
export function computePath(answers: Record<string, string>): ApplyStepId[] {
  // Branch SoR is always 6 / 7 / 9. 6 is free text (no invented menu skip).
  // 9 is last. 7 No drops PARTNER_SUPPORT.
  const sku = (answers.COACHING_SKU || "").trim();
  const eleven = (answers.ELEVEN_AM_ET || "").trim();
  const partner = (answers.PARTNER_SUPPORT || "").trim();

  const path: ApplyStepId[] = [
    "intro",
    "email",
    "HEAVEN",
    "HELL",
    "MONEY_TIMING",
    "COACHING_SKU",
    "ELEVEN_AM_ET",
    "TRIED",
  ];

  if (sku !== undefined && partner !== undefined && !isElevenNo(eleven)) {
    path.push("PARTNER_SUPPORT");
  }
  return path;
}

export function liveSteps(answers: Record<string, string>): ApplyStepId[] {
  return computePath(answers).filter((id) => id !== "intro");
}

export function emptyAnswers(): Record<ApplyKey, string> {
  return {
    HELL: "",
    HEAVEN: "",
    MONEY_TIMING: "",
    COACHING_SKU: "",
    ELEVEN_AM_ET: "",
    TRIED: "",
    PARTNER_SUPPORT: "",
  };
}

/** Recompute path; drop answers that no longer apply. */
export function recomputePath(
  email: string,
  answers: Record<ApplyKey, string>,
): {
  email: string;
  answers: Record<ApplyKey, string>;
  path: ApplyStepId[];
} {
  const path = computePath({ email, ...answers });
  const next = emptyAnswers();
  for (const key of APPLY_KEYS) {
    if (path.includes(key)) next[key] = answers[key];
  }
  return { email, answers: next, path };
}

export function pruneAsked(
  asked: ApplyStepId[],
  path: ApplyStepId[],
): ApplyStepId[] {
  return asked.filter((id) => path.includes(id));
}

export function unansweredOnPath(
  email: string,
  answers: Record<ApplyKey, string>,
): ApplyStepId[] {
  const path = computePath({ email, ...answers });
  return path.filter((id) => {
    if (id === "intro") return false;
    const step = stepById(id);
    const value = id === "email" ? email : answers[id];
    return !stepValueValid(step, value || "");
  });
}

/** Next live question after `current`, or Review. Never auto-submits. */
export function nextApplyStep(
  current: ApplyStepId,
  accepted: Record<string, string>,
): ApplyStepId | "review" {
  const path = computePath(accepted);
  const i = path.indexOf(current);
  if (i < 0 || i >= path.length - 1) return "review";
  return path[i + 1];
}

export function prevApplyStep(
  current: ApplyStepId,
  accepted: Record<string, string>,
): ApplyStepId | null {
  const path = computePath(accepted);
  const i = path.indexOf(current);
  if (i <= 0) return null;
  return path[i - 1];
}

export function reviewRows(
  asked: ApplyStepId[],
  accepted: Record<string, string>,
): ApplyStep[] {
  const path = computePath(accepted);
  return path
    .filter((id) => id !== "intro" && asked.includes(id))
    .map((id) => stepById(id));
}

export function displayAnswer(step: ApplyStep, value: string): string {
  if (step.control === "yesno") {
    if (value === "yes") return "Yes";
    if (value === "no") return "No";
  }
  return value.trim();
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

/** Question accept label. Submit lives on Review only. */
export function nextLabel(step: ApplyStep): string {
  if (step.control === "continue") return "Continue";
  return "OK";
}

export function submitPayload(
  email: string,
  answers: Record<ApplyKey, string>,
): Record<string, string> {
  const { answers: next } = recomputePath(email, answers);
  const body: Record<string, string> = { email: email.trim() };
  for (const key of APPLY_KEYS) body[key] = next[key].trim();
  return body;
}
