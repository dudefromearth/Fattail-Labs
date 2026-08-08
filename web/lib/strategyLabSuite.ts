/**
 * Strategy Lab suite — automated trading mode (life-cycle nav).
 * Board: Design · Curate · Deploy · Archive
 *
 * LifeCycle.pdf third major stage is **Live Campaign / Campaign Phase**.
 * Strategy Lab labels that **process step** as **Deploy** so members hear a verb
 * (put curated bots to work). Deploy means: deploy strategies **into** one or more
 * **campaigns** (containers with capital allocation, start/end, log, prune, retro —
 * PDF Campaign Phase).
 *
 * Phase keys stay development|curation|deployment (API/DB).
 * Practice has its own Campaign concept (human mode) under `/app/practice/campaign`.
 * No shared tables/chrome with Practice.
 *
 * Symbols hang under Design only.
 */

export type StrategyLabSuiteId =
  | "development"
  | "curation"
  | "deployment"
  | "archive";

export type StrategyLabSuiteItem = {
  id: StrategyLabSuiteId;
  label: string;
  href: string;
  /** Maps to strategy phase key (not for archive). */
  phase?: "development" | "curation" | "deployment";
};

export const STRATEGY_LAB_SUITE: StrategyLabSuiteItem[] = [
  {
    id: "development",
    label: "Design",
    href: "/app/strategy-lab?phase=development",
    phase: "development",
  },
  {
    id: "curation",
    label: "Curate",
    href: "/app/strategy-lab?phase=curation",
    phase: "curation",
  },
  {
    id: "deployment",
    label: "Deploy",
    href: "/app/strategy-lab?phase=deployment",
    phase: "deployment",
  },
  {
    id: "archive",
    label: "Archive",
    href: "/app/strategy-lab/archive",
  },
];

/** Sub-nav under Design only (not top suite). */
export type DesignSubNavId = "board" | "symbols";

export type DesignSubNavItem = {
  id: DesignSubNavId;
  label: string;
  href: string;
};

export const DESIGN_SUB_NAV: DesignSubNavItem[] = [
  {
    id: "board",
    label: "Board",
    href: "/app/strategy-lab?phase=development",
  },
  {
    id: "symbols",
    label: "Symbols",
    href: "/app/strategy-lab/symbols",
  },
];

export function suiteItem(id: StrategyLabSuiteId): StrategyLabSuiteItem {
  const item = STRATEGY_LAB_SUITE.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown strategy-lab suite id: ${id}`);
  return item;
}
