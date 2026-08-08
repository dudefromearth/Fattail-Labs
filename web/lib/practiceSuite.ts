/**
 * Practice suite — human trading mode.
 * Designed around the daily Scientific Trading Protocol:
 *   Hypothesis → Experiment → Reflection
 * (pre-market IF/THEN · execute the trial · variance log — not PnL-as-worth).
 *
 * Nav: Trade Log · Reports · Journal · Retrospective · Playbook · Campaign
 * Campaign = optional North Star charter wrapping the day; never required.
 * Path: `/app/practice/campaign` (not `/app/campaigns`).
 * Strategy Lab Campaign is a separate product (automated). No shared chrome.
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
      "Experiment: execute the pre-registered plan — fills and structure, process first.",
    status: "live",
  },
  {
    id: "reports",
    label: "Reports",
    href: "/app/reports",
    slugs: ["reports", "statistics", "records"],
    blurb: "Book aggregates from experiments: path, drawdown, distributions.",
    status: "live",
  },
  {
    id: "journal",
    label: "Journal",
    href: "/app/journal",
    slugs: ["journal"],
    blurb:
      "Hypothesis and reflection: pre-market IF/THEN, EOD variance — not PnL as self-worth.",
    status: "live",
  },
  {
    id: "retrospective",
    label: "Retrospective",
    href: "/app/retrospective",
    slugs: ["retrospective", "retrospectives"],
    blurb:
      "Weekly pivot: variance across days, systemic adaptation — not mid-session rewrite.",
    status: "live",
  },
  {
    id: "playbook",
    label: "Playbook",
    href: "/app/playbook",
    slugs: ["playbook"],
    blurb:
      "Standing rules under risk — constrain daily IF/THEN; the rules you will not break.",
    status: "live",
  },
  {
    id: "campaign",
    label: "Campaigns",
    href: "/app/practice/campaign",
    slugs: ["campaign", "campaigns"],
    blurb:
      "Optional North Star charter — wraps the daily lab. Never required.",
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
