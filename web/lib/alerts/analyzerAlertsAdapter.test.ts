/**
 *   npx --yes tsx lib/alerts/analyzerAlertsAdapter.test.ts
 */

import {
  ALERTS_SEVERITY_DEFAULT,
  ALERTS_SOURCE_SYSTEM,
  ALERTS_SUITE,
  alertUnbound,
} from "./analyzerAlertsAdapter";

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

console.log("  adapter constants + unbound ok");
