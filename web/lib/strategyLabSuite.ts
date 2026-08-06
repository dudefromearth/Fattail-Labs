/**
 * Strategy Lab suite — life-cycle nav (Practice suite chrome pattern).
 * Board: Design · Curate · Deploy
 * Archive: retired/trashed + reports/logs (off-ramp page)
 * Phase keys stay development|curation|deployment (API/DB).
 *
 * Symbols are not a top-level suite item — they hang under Design
 * (catalog + assign to bot for back test / forward walk) and are
 * selected again in Curate for sim runs. Deploy only receives curated bots.
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
