/**
 *   npx --yes tsx lib/alerts/analyzerAlertsAdapter.test.ts
 */

import {
  ALERTS_SEVERITY_DEFAULT,
  ALERTS_SOURCE_SYSTEM,
  ALERTS_SUITE,
  alertUnbound,
} from "./analyzerAlertsAdapter";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyAlertRunState,
  createPriceAlert,
  evaluateAlerts,
  formatAlertTouchedContext,
  toggleAlertRunState,
} from "../options-lab/analyzerBook";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

console.log("analyzerAlertsAdapter");

assert(ALERTS_SOURCE_SYSTEM === "analyzer_risk_graph", "source_system");
assert(ALERTS_SUITE === "options_lab", "suite");
assert(ALERTS_SEVERITY_DEFAULT === "medium", "severity default");

assert(
  alertUnbound("canvas", undefined, new Set(["a"])) === false,
  "canvas never unbound",
);
assert(
  alertUnbound("position", "gone", new Set(["a"])) === true,
  "missing card unbound",
);
assert(
  alertUnbound("position", "a", new Set(["a"])) === false,
  "present card bound",
);
assert(
  alertUnbound("position", "hidden", new Set(["hidden"])) === false,
  "hidden still bound",
);

assert(toggleAlertRunState("live") === "idle", "live → idle");
assert(toggleAlertRunState("idle") === "live", "idle → live");
assert(toggleAlertRunState("touched") === "live", "touched → live (reset)");

const live = createPriceAlert({
  type: "price_above",
  symbol: "SPX",
  targetPrice: 6700,
  runState: "live",
});
const tripped = evaluateAlerts([live], 6701, "SPX")[0];
assert(tripped.runState === "touched", "Live meeting the print becomes Touched");
assert(!!tripped.triggeredAt, "Touched stamps when");
assert(tripped.triggeredSpot === 6701, "Touched stamps the print");

const reset = applyAlertRunState(tripped, "live");
assert(reset.runState === "live", "reset is Live");
assert(reset.triggeredAt == null, "reset clears when");
assert(reset.triggeredSpot == null, "reset clears the print");

const at = "2026-08-20T14:42:00.000Z";
assert(
  formatAlertTouchedContext({
    at,
    spot: 6724.4,
    nowMs: Date.parse("2026-08-20T18:00:00.000Z"),
  }) === "10:42 AM ET at 6724",
  "same-day touch is clock + print",
);
assert(
  formatAlertTouchedContext({
    at,
    nowMs: Date.parse("2026-08-21T14:00:00.000Z"),
  }) === "Aug 20, 10:42 AM ET",
  "other-day touch includes the date",
);

const here = dirname(fileURLToPath(import.meta.url));
const builder = readFileSync(
  join(here, "../../components/options-lab/AlertBuilderDialog.tsx"),
  "utf8",
);
assert(
  !builder.includes('{ id: "touched" as const, label: "Touched" }'),
  "Touched is not a settable Builder state",
);
assert(builder.includes("Reset to Live"), "Builder resets Touched, does not set it");

console.log("  adapter constants + unbound + run-state ok");
