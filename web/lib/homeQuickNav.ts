/**
 * Home page quick nav — profile preference keys + resolved links.
 * Journal is always first and required; optional chips from profile.
 */

export type HomeQuickNavId =
  | "journal"
  | "wiki"
  | "strategy_lab"
  | "fattail_hard"
  | "courses";

export type HomeQuickNavOption = {
  id: HomeQuickNavId;
  label: string;
  required: boolean;
  description: string;
};

export const HOME_QUICK_NAV_OPTIONS: HomeQuickNavOption[] = [
  {
    id: "journal",
    label: "Journal",
    required: true,
    description: "Opens today’s journal day view.",
  },
  {
    id: "wiki",
    label: "Wiki",
    required: false,
    description: "Compiled teaching map.",
  },
  {
    id: "strategy_lab",
    label: "Strategy Lab",
    required: false,
    description: "Design → Curation → Deployment.",
  },
  {
    id: "fattail_hard",
    label: "FatTail Hard",
    required: false,
    description: "Mental toughness challenge.",
  },
  {
    id: "courses",
    label: "Courses",
    required: false,
    description: "Course catalog.",
  },
];

export const HOME_QUICK_NAV_DEFAULT: HomeQuickNavId[] = ["journal"];

const ALLOWED = new Set(HOME_QUICK_NAV_OPTIONS.map((o) => o.id));

export function normalizeHomeQuickNav(
  raw: unknown,
): HomeQuickNavId[] {
  const out: HomeQuickNavId[] = ["journal"];
  const seen = new Set<string>(["journal"]);
  if (!Array.isArray(raw)) return out;
  for (const item of raw) {
    let key = String(item || "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    if (key === "strategy-lab") key = "strategy_lab";
    if (key === "fattail-hard") key = "fattail_hard";
    if (!ALLOWED.has(key as HomeQuickNavId) || seen.has(key)) continue;
    out.push(key as HomeQuickNavId);
    seen.add(key);
  }
  return out;
}

/** Local YYYY-MM-DD for “today” journal deep link. */
export function todayYmdLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function hrefForQuickNav(id: HomeQuickNavId): string {
  switch (id) {
    case "journal":
      // Practice context reads date=today|YYYY-MM-DD and view=day.
      return `/app/journal?date=today&view=day`;
    case "wiki":
      return "/app/wiki";
    case "strategy_lab":
      return "/app/strategy-lab";
    case "fattail_hard":
      return "/app/toughness/fattail-hard";
    case "courses":
      return "/course";
    default:
      return "/home";
  }
}

export function labelForQuickNav(id: HomeQuickNavId): string {
  return HOME_QUICK_NAV_OPTIONS.find((o) => o.id === id)?.label ?? id;
}
