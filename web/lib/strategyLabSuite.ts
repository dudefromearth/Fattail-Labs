/**
 * Strategy Lab suite — life-cycle nav (Practice suite chrome pattern).
 * Board: Development · Curation · Deployment
 * Archive: retired/trashed + reports/logs (off-ramp page)
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
    label: "Development",
    href: "/app/strategy-lab?phase=development",
    phase: "development",
  },
  {
    id: "curation",
    label: "Curation",
    href: "/app/strategy-lab?phase=curation",
    phase: "curation",
  },
  {
    id: "deployment",
    label: "Deployment",
    href: "/app/strategy-lab?phase=deployment",
    phase: "deployment",
  },
  {
    id: "archive",
    label: "Archive",
    href: "/app/strategy-lab/archive",
  },
];

export function suiteItem(id: StrategyLabSuiteId): StrategyLabSuiteItem {
  const item = STRATEGY_LAB_SUITE.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown strategy-lab suite id: ${id}`);
  return item;
}
