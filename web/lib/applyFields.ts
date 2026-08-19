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

export type ApplyControl =
  | "continue"
  | "email"
  | "text"
  | "textarea"
  | "yesno"
  | "slot";

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
 * Fields 6 / 9: free text. Field 7: one listed America/New_York slot
 * (calendar invite). Observer / Activator / Navigator are examples only.
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
    ask: "Pick a time for a live FatTail conversation. A calendar invite will be sent to the email you entered.",
    hint: "America/New_York. Thirty minutes. We'll send the link. Pick one listed time.",
    fieldId: "7",
    control: "slot",
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

export const APPLY_TZ = "America/New_York";

export function isListedSlot(
  value: string,
  slots: ReadonlyArray<{ starts_et: string }>,
): boolean {
  const v = value.trim();
  return slots.some((s) => s.starts_et === v);
}

export function isDatetimeValid(value: string): boolean {
  const v = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  if (hour > 23 || minute > 59) return false;
  const probe = new Date(Date.UTC(year, month - 1, day, hour, minute));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

export function displayDatetime(value: string): string {
  const v = value.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return v;
  const wall = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])),
  );
  const stamp = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(wall);
  return `${stamp} ET`;
}

/**
 * Live path from answers. Picking a conversation time is the meet yes.
 * The old 11am No → drop PARTNER_SUPPORT branch is dead. Partner stays.
 */
export function computePath(_answers: Record<string, string>): ApplyStepId[] {
  return [
    "intro",
    "email",
    "HEAVEN",
    "HELL",
    "MONEY_TIMING",
    "COACHING_SKU",
    "ELEVEN_AM_ET",
    "TRIED",
    "PARTNER_SUPPORT",
  ];
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
  if (step.control === "slot") return displayDatetime(value);
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
  if (step.control === "slot") return isDatetimeValid(v);
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
