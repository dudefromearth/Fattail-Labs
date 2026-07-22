// Shared types + constants for the /live surface (split from LiveSessions.tsx,
// refactor step 4/4 — Live Sessions specs v1.1–v1.5).

export type Session = {
  id: number | string;
  recurring: boolean;
  recurrence_id?: number;
  occurrence_date?: string;
  modified?: boolean;
  title: string;
  kind: "trading_room" | "workshop" | "show";
  starts_at: string;
  category: "public" | "members" | "coaching";
  join_url?: string | null;
  join_locked?: "sign_in" | "role" | "too_early" | "ended" | null;
  replay_course_slug: string | null;
  replay_course_title: string | null;
};

export type Recurrence = {
  id: number;
  title: string;
  kind: Session["kind"];
  days: string[];
  start_time: string;
  duration_minutes: number;
  join_url: string | null;
  category: Session["category"];
  active: boolean;
  start_date: string | null;
  until_date: string | null;
};

export const KIND_LABELS = {
  trading_room: "Live Trading Room",
  workshop: "Workshop",
  show: "Live Show",
};

export const KIND_CHIP = {
  trading_room:
    "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900",
  workshop:
    "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900",
  show: "bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900",
};

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export const DAY_LABELS: Record<string, string> = {
  mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun",
};

export const CATEGORY_OPTIONS = [
  ["coaching", "Coaching — Observer & Navigator"],
  ["members", "All members — Observer, Activator, Navigator"],
  ["public", "Public — no sign-in"],
] as const;

export const SCOPE_OPTIONS = [
  ["one", "This event only"],
  ["future", "This event, and all future events"],
  ["all", "All events in this sequence"],
] as const;
export type Scope = (typeof SCOPE_OPTIONS)[number][0];

export const ENDED_AFTER_MS = 4 * 3_600_000; // mirrors server JOIN_CLOSES_AFTER

export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function shortTime(iso: string): string {
  return new Date(iso)
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(" ", " ");
}

export function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
