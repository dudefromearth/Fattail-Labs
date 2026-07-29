/**
 * Practice suite — tightly coupled Family B tools.
 * Nav: Trade Log · Reports · Journal · Retrospective · Playbook
 * (Coach 2026-07-28: Reports; 2026-07-29: Retrospective first-class.)
 */

export type PracticeSuiteId =
  | "trade-log"
  | "reports"
  | "journal"
  | "retrospective"
  | "playbook";

export type PracticeSuiteItem = {
  id: PracticeSuiteId;
  label: string;
  href: string;
  /** Catalog/API slug (reports may alias legacy statistics). */
  slugs: string[];
  blurb: string;
  status: "live" | "soon";
};

export const PRACTICE_SUITE: PracticeSuiteItem[] = [
  {
    id: "trade-log",
    label: "Trade Log",
    href: "/app/trade-log",
    slugs: ["trade-log"],
    blurb:
      "Record fills and structure outcomes — process first, not P&L theater.",
    status: "live",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/app/reports",
    slugs: ["reports", "statistics", "records"],
    blurb:
      "Equity path, drawdown, and process snapshot — from Trade Log across accounts.",
    status: "live",
  },
  {
    id: "journal",
    label: "Journal",
    href: "/app/journal",
    slugs: ["journal"],
    blurb:
      "Calendar-structured process notes: preparation, selection, and review.",
    status: "live",
  },
  {
    id: "retrospective",
    label: "Retrospective",
    href: "/app/retrospective",
    slugs: ["retrospective", "retrospectives"],
    blurb:
      "End-of-week process review — roll up the week’s notes and track your journey.",
    status: "live",
  },
  {
    id: "playbook",
    label: "Playbook",
    href: "/app/playbook",
    slugs: ["playbook"],
    blurb:
      "Your defined-risk setups and rules — the book you actually trade from.",
    status: "soon",
  },
];

/** Slugs nested under Practice (hidden from the top-level Apps grid). */
export const PRACTICE_NESTED_SLUGS = new Set(
  PRACTICE_SUITE.flatMap((i) => i.slugs),
);

export function suiteItem(id: PracticeSuiteId): PracticeSuiteItem {
  const item = PRACTICE_SUITE.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown practice suite id: ${id}`);
  return item;
}
