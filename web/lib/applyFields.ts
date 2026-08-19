/** Apply questions + content checks. Live copy lives on the server. */

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

export type ApplyQType =
  | "continue"
  | "free_text"
  | "binary"
  | "radio"
  | "calendar";

export type ApplyQuestion = {
  id: number;
  slug: string;
  ask: string;
  hint: string;
  qtype: ApplyQType;
  options: string[];
  ac_key?: string | null;
  ac_field_id?: string | null;
  is_email: boolean;
  sort_order: number;
};

export type ApplyScreenId = string;

export const APPLY_TZ = "America/New_York";

export const APPLY_TYPE_OPTIONS: { value: ApplyQType; label: string }[] = [
  { value: "free_text", label: "Free text" },
  { value: "binary", label: "Binary choice" },
  { value: "radio", label: "Radio" },
  { value: "calendar", label: "Calendar date-times" },
  { value: "continue", label: "Continue" },
];

/** Seed copy — characterization / fallback docs. Runtime SoR is the server. */
export const SEED_QUESTIONS: ApplyQuestion[] = [
  {
    id: 1,
    slug: "intro",
    ask: "This is the FatTail application.",
    hint: "A few questions, one at a time, so we know if this is a fit. Not a dump of fields.",
    qtype: "continue",
    options: [],
    is_email: false,
    sort_order: 10,
  },
  {
    id: 2,
    slug: "email",
    ask: "Enter your email (we will never share it).",
    hint: "",
    qtype: "free_text",
    options: [],
    is_email: true,
    sort_order: 20,
  },
  {
    id: 3,
    slug: "HEAVEN",
    ask: "What do you consider your heaven island?",
    hint: "The life and trading state you want. For example: a defined-risk book you can compound. Calm in the chair. Not hunting win rate.",
    qtype: "free_text",
    options: [],
    ac_key: "HEAVEN",
    ac_field_id: "4",
    is_email: false,
    sort_order: 30,
  },
  {
    id: 4,
    slug: "HELL",
    ask: "What is your hell island?",
    hint: "The pain. For example: violent equity. Blow-ups. Solving for win rate.",
    qtype: "free_text",
    options: [],
    ac_key: "HELL",
    ac_field_id: "3",
    is_email: false,
    sort_order: 40,
  },
  {
    id: 5,
    slug: "MONEY_TIMING",
    ask: "Can you invest the time and money now?",
    hint: "An honest yes, a not-yet, or what has to move first.",
    qtype: "free_text",
    options: [],
    ac_key: "MONEY_TIMING",
    ac_field_id: "5",
    is_email: false,
    sort_order: 50,
  },
  {
    id: 6,
    slug: "COACHING_SKU",
    ask: "Which door do you think you want?",
    hint: "Say it in your words. Observer, Activator, or Navigator are examples — not a menu.",
    qtype: "free_text",
    options: [],
    ac_key: "COACHING_SKU",
    ac_field_id: "6",
    is_email: false,
    sort_order: 60,
  },
  {
    id: 7,
    slug: "ELEVEN_AM_ET",
    ask: "Pick a time for a live FatTail conversation. A calendar invite will be sent to the email you entered.",
    hint: "America/New_York. Thirty minutes. We'll send the link. Pick one listed time.",
    qtype: "calendar",
    options: [],
    ac_key: "ELEVEN_AM_ET",
    ac_field_id: "7",
    is_email: false,
    sort_order: 70,
  },
  {
    id: 8,
    slug: "TRIED",
    ask: "What have you already tried?",
    hint: "Courses, rooms, a firm, going it alone — whatever is true.",
    qtype: "free_text",
    options: [],
    ac_key: "TRIED",
    ac_field_id: "8",
    is_email: false,
    sort_order: 80,
  },
  {
    id: 9,
    slug: "PARTNER_SUPPORT",
    ask: "Is home on board?",
    hint: "Partner, family — whether they support you doing this.",
    qtype: "free_text",
    options: [],
    ac_key: "PARTNER_SUPPORT",
    ac_field_id: "9",
    is_email: false,
    sort_order: 90,
  },
];

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

export function isEmailValid(value: string): boolean {
  const v = value.trim();
  return v.length > 0 && v.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export type ContentCheck =
  | { ok: true }
  | { ok: false; miss: string };

export function contentCheck(
  question: ApplyQuestion,
  value: string,
  slots: ReadonlyArray<{ starts_et: string }> = [],
): ContentCheck {
  if (question.qtype === "continue") return { ok: true };
  const v = value.trim();
  if (question.qtype === "free_text") {
    if (question.is_email) {
      return isEmailValid(v)
        ? { ok: true }
        : { ok: false, miss: "A valid email is required." };
    }
    return v.length > 0
      ? { ok: true }
      : { ok: false, miss: "This answer is required." };
  }
  if (question.qtype === "binary") {
    if (question.options.length !== 2) {
      return { ok: false, miss: "This question is missing its two choices." };
    }
    return question.options.includes(value)
      ? { ok: true }
      : { ok: false, miss: "Pick one of the two choices." };
  }
  if (question.qtype === "radio") {
    if (question.options.length < 2) {
      return { ok: false, miss: "This question needs two or more choices." };
    }
    return question.options.includes(value)
      ? { ok: true }
      : { ok: false, miss: "Pick one of the listed choices." };
  }
  if (question.qtype === "calendar") {
    if (slots.length === 0) {
      return {
        ok: false,
        miss: "No live conversation times are configured.",
      };
    }
    return isListedSlot(v, slots)
      ? { ok: true }
      : { ok: false, miss: "Pick one of the listed times." };
  }
  return { ok: false, miss: "This question cannot be answered." };
}

export function pathOf(questions: ApplyQuestion[]): string[] {
  return questions.map((q) => q.slug);
}

export function liveSteps(questions: ApplyQuestion[]): string[] {
  return questions.filter((q) => q.qtype !== "continue").map((q) => q.slug);
}

export function emptyAnswers(questions: ApplyQuestion[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of questions) out[q.slug] = "";
  return out;
}

export function questionBySlug(
  questions: ApplyQuestion[],
  slug: string,
): ApplyQuestion {
  const q = questions.find((row) => row.slug === slug);
  if (!q) throw new Error(`unknown apply question ${slug}`);
  return q;
}

export function emailFromAnswers(
  questions: ApplyQuestion[],
  answers: Record<string, string>,
): string {
  const q = questions.find((row) => row.is_email);
  if (q) return (answers[q.slug] || "").trim();
  return (answers.email || "").trim();
}

export function unansweredOnPath(
  questions: ApplyQuestion[],
  answers: Record<string, string>,
  slots: ReadonlyArray<{ starts_et: string }>,
): string[] {
  return questions
    .filter((q) => q.qtype !== "continue")
    .filter((q) => !contentCheck(q, answers[q.slug] || "", slots).ok)
    .map((q) => q.slug);
}

export function nextApplyStep(
  questions: ApplyQuestion[],
  current: string,
): string | "review" {
  const path = pathOf(questions);
  const i = path.indexOf(current);
  if (i < 0 || i >= path.length - 1) return "review";
  return path[i + 1];
}

export function prevApplyStep(
  questions: ApplyQuestion[],
  current: string,
): string | null {
  const path = pathOf(questions);
  const i = path.indexOf(current);
  if (i <= 0) return null;
  return path[i - 1];
}

export function reviewRows(
  questions: ApplyQuestion[],
  asked: string[],
): ApplyQuestion[] {
  return questions.filter(
    (q) => q.qtype !== "continue" && asked.includes(q.slug),
  );
}

export function displayAnswer(question: ApplyQuestion, value: string): string {
  if (question.qtype === "calendar") return displayDatetime(value);
  return value.trim();
}

export function nextLabel(question: ApplyQuestion): string {
  if (question.qtype === "continue") return "Continue";
  return "OK";
}

export function submitPayload(
  questions: ApplyQuestion[],
  answers: Record<string, string>,
): Record<string, string | Record<string, string>> {
  const trimmed: Record<string, string> = {};
  for (const q of questions) {
    if (q.qtype === "continue") continue;
    trimmed[q.slug] = (answers[q.slug] || "").trim();
  }
  const email = emailFromAnswers(questions, trimmed);
  const body: Record<string, string | Record<string, string>> = {
    email,
    answers: trimmed,
  };
  for (const q of questions) {
    if (q.ac_key && (APPLY_KEYS as readonly string[]).includes(q.ac_key)) {
      body[q.ac_key] = trimmed[q.slug] || "";
    }
  }
  return body;
}

export function isQuestionScreen(
  screen: ApplyScreenId,
  questions: ApplyQuestion[],
): boolean {
  return screen !== "review" && questions.some((q) => q.slug === screen);
}
