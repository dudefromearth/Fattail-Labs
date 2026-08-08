/**
 * Practice suite — human trading mode (manual fills, process suite).
 * Nav: Trade Log · Reports · Journal · Retrospective · Playbook · Campaign
 *
 * Campaign lives under Practice: `/app/practice/campaign` (not `/app/campaigns`).
 * Strategy Lab has its own Campaign under `/app/strategy-lab/campaign`.
 * Same *concept* (capital book / goals / group of work); two separate products —
 * human vs automated. No shared app, tables, or chrome.
 */

export type PracticeSuiteId =
  | "trade-log"
  | "reports"
  | "journal"
  | "retrospective"
  | "playbook"
  | "campaign";

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
    blurb: "Book aggregates from Trade Log: path, drawdown, distributions.",
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
      "Start from Journal type Retrospective — gather since last (or maiden journey), dual report, integrity.",
    status: "live",
  },
  {
    id: "playbook",
    label: "Playbook",
    href: "/app/playbook",
    slugs: ["playbook"],
    blurb:
      "Who you are under risk — the rules you will not break.",
    status: "live",
  },
  {
    id: "campaign",
    label: "Campaign",
    href: "/app/practice/campaign",
    slugs: ["campaign", "campaigns", "seasons"],
    blurb:
      "Optional work context (capital, goals, multi per account). Never required.",
    status: "live",
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
