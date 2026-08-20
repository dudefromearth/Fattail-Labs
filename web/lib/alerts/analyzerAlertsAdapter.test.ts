/**
 *   npx --yes tsx lib/alerts/analyzerAlertsAdapter.test.ts
 */

import {
  ALERTS_SEVERITY_DEFAULT,
  ALERTS_SOURCE_SYSTEM,
  ALERTS_SUITE,
  alertUnbound,
} from "./analyzerAlertsAdapter";
import { toggleAlertRunState } from "../options-lab/analyzerBook";

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

assert(toggleAlertRunState("running") === "idle", "running → idle");
assert(toggleAlertRunState("idle") === "running", "idle → running");
assert(toggleAlertRunState("paused") === "running", "paused → running");
assert(toggleAlertRunState("tripped") === "running", "tripped → running");

console.log("  adapter constants + unbound + run-state ok");
