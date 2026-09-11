/**
 * PC5 — bind split. CI, not a screenshot.
 *
 *   npx --yes tsx lib/options-lab/positionBuilder.pc5.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createUndoStack } from "./undoStack";
import type { PositionInput } from "./positionTypes";

const here = dirname(fileURLToPath(import.meta.url));
const builder = readFileSync(
  join(here, "../../components/options-lab/PositionBuilder.tsx"),
  "utf8",
);
const host = readFileSync(
  join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
  "utf8",
);

let n = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

const editSeed = builder.slice(
  builder.indexOf('mode === "edit" && initial?.legs.length'),
  builder.indexOf("if (mode === \"create\" && initial?.legs.length"),
);

test("AT-PC-04 Opening Edit writes zero fields — no snap, no reprice, no write", () => {
  assert.match(editSeed, /Live bind: chrome only/);
  assert.doesNotMatch(editSeed, /snapToListed/);
  assert.doesNotMatch(editSeed, /priceLegs/);
  assert.doesNotMatch(editSeed, /setPosition/);
  assert.match(builder, /if \(mode === "edit"\) return;/);
});

test("AT-PC-23 Edit Close / Esc; no Submit", () => {
  assert.match(builder, /data-testid="position-builder-close"/);
  assert.match(builder, /e\.key !== "Escape"/);
  assert.doesNotMatch(builder, /position-builder-analyze/);
  assert.doesNotMatch(builder, />Update</);
  assert.match(builder, /data-testid="position-builder-submit"/);
});

test("AT-PC-21 Create Cancel does not insert; Submit does", () => {
  assert.match(builder, /data-testid="position-builder-cancel"/);
  assert.match(host, /onSave=\{handleBuilderSave\}/);
  assert.match(host, /setCreateReopen\(null\)/);
});

test("AT-PC-22 Create draft is off-book until Submit", () => {
  assert.match(host, /commitBook\("create-submit"/);
  assert.match(builder, /const \[draft, setDraft\]/);
  assert.match(builder, /mode === "edit" && initial/);
});

test("AT-PC-56 Create opens on Butterfly, unlocked, no seeded basis", () => {
  assert.match(builder, /template: "butterfly" as TemplateType/);
  assert.match(builder, /net_debit_override: null/);
});

test("AT-PC-32 dialog picker rebuilds legs", () => {
  assert.match(builder, /data-testid="builder-template"/);
  assert.match(builder, /handleTemplate/);
  assert.match(builder, /regenerate\(/);
});

test("§5.1 removals: Preview, Analyze, defaults, retry, spot override", () => {
  assert.doesNotMatch(builder, /sectionLabel\}>Preview</);
  assert.doesNotMatch(builder, /builder-defaults-menu/);
  assert.doesNotMatch(builder, /builder-retry-opf/);
  assert.doesNotMatch(builder, /data-testid="builder-spot"/);
});

test("AT-PC-50 Create-reopen half: undo restores draft and host reopens Create", () => {
  const stack = createUndoStack();
  const draft: PositionInput = {
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: [
      {
        strike: 770,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1,
      },
    ],
  };
  stack.push("create-submit", [], { createdId: "new-1", draft });
  const entry = stack.undo();
  assert.equal(entry?.kind, "create-submit");
  assert.equal(entry?.draft?.underlying, "XSP");
  assert.equal(entry?.book.length, 0);
  assert.match(host, /entry\.kind === "create-submit" && entry\.draft/);
  assert.match(host, /setCreateReopen\(entry\.draft\)/);
  assert.match(host, /onLivePatch=/);
});

test("AT-PC-01 live bind: card writes go through onLivePatch while dialog is open", () => {
  assert.match(host, /onLivePatch=\{\(input, label, notation\) =>/);
  assert.match(host, /applyEditPatch\(p, input, label, notation\)/);
});

console.log(`positionBuilder.pc5.test.ts ${n} ok`);
