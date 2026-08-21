/**
 * AT-ALB-14 — C1 chrome must not use raw hex / zinc / close-dot.
 *   npx --yes tsx lib/alerts/higChromeLint.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");

const FILES = [
  "components/options-lab/AlertBuilderDialog.tsx",
  "components/options-lab/AnalyzerControlsColumn.tsx",
  "components/ui/Modal.tsx",
  "components/ui/SegmentedControl.tsx",
  "app/app/alerts/page.tsx",
  "components/settings/AlertsPane.tsx",
];

const BANNED = [
  /bg-zinc-/,
  /text-zinc-/,
  /bg-\[#/,
  /text-\[#/,
  /from-\[#/,
  /h-3 w-3/,
];

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

console.log("higChromeLint C1");

for (const rel of FILES) {
  const src = readFileSync(join(root, rel), "utf8");
  for (const re of BANNED) {
    assert(!re.test(src), `${rel} hits ${re}`);
  }
  if (rel.endsWith("AlertBuilderDialog.tsx")) {
    assert(src.includes("Modal"), "Builder uses Modal");
    assert(src.includes("floatable"), "Builder is floatable");
    assert(src.includes("SegmentedControl"), "Builder uses SegmentedControl");
    assert(src.includes("IconXMark") || src.includes("IconButton"), "close kit");
    assert(!src.includes("Coming soon") || src.includes("Save is off"), "placeholder");
    assert(!/EmptyState/.test(src), "no EmptyState in Builder");
    assert(src.includes("seed?.demo === true"), "TM create defaults Demo");
    assert(src.includes('demoClock === "timemachine"'), "TM Demo copy");
  }
}

const holder = readFileSync(
  join(root, "components/options-lab/AnalyzerControlsColumn.tsx"),
  "utf8",
);
assert(!/EmptyState/.test(holder), "holder has no EmptyState");
assert(holder.includes("Create alert"), "44pt create control");
assert(holder.includes("Unbound"), "unbound state");
assert(holder.includes("IconTrash"), "holder Delete uses kit trash");
assert(holder.includes("analyzer-alert-delete-"), "Delete test id on each card");
assert(holder.includes("onDeleteAlert"), "Delete is wired");

const modal = readFileSync(join(root, "components/ui/Modal.tsx"), "utf8");
assert(modal.includes("floatable"), "Modal supports floatable");
assert(modal.includes("modal-drag-handle"), "floatable header is the drag handle");
assert(modal.includes('aria-modal="false"'), "floatable is not a blocking scrim");
assert(
  !modal.includes("w - FLOAT_W - 40"),
  "Alert Builder default is not the far right",
);
assert(
  modal.includes("pnl-chart-host"),
  "Alert Builder default is left of the canvas",
);

console.log("  C1 chrome lint ok");
