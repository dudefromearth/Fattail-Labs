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
  builder.indexOf("if (mode === \"edit\") {"),
  builder.indexOf("// —— Create: wait for OPF"),
);

test("AT-PC-04 Opening Edit copies into draft once; no snap, no reprice, no book write", () => {
  assert.match(editSeed, /copyAnalyzerPosition\(initial\)/);
  assert.match(editSeed, /seedOpenKey/);
  assert.doesNotMatch(editSeed, /snapToListed/);
  assert.doesNotMatch(editSeed, /priceLegs/);
  assert.doesNotMatch(editSeed, /onLivePatch/);
  assert.match(builder, /if \(mode === "edit"\) return;/);
});

test("AT-PC-23 Escape dismisses; Create Analyze+Cancel; Edit Update+Cancel", () => {
  assert.match(builder, /e\.key !== "Escape"/);
  assert.doesNotMatch(builder, /position-builder-analyze/);
  assert.doesNotMatch(builder, /position-builder-submit/);
  assert.doesNotMatch(builder, /position-builder-close/);
  assert.match(builder, /data-testid="builder-analyze"/);
  assert.match(builder, /data-testid="builder-update"/);
  assert.match(builder, /data-testid="position-builder-cancel"/);
});

test("AT-PC-21 Create Cancel does not insert; Submit does", () => {
  assert.match(builder, /data-testid="position-builder-cancel"/);
  assert.match(host, /onSave=\{handleBuilderSave\}/);
  assert.match(host, /setCreateReopen\(null\)/);
});

test("AT-PC-22 Create and Edit drafts are off-book until Analyze/Update", () => {
  assert.match(host, /commitBook\("create-submit"/);
  assert.match(builder, /const \[draft, setDraft\]/);
  assert.match(builder, /const record: AnalyzerPosition = draft/);
  assert.doesNotMatch(builder, /onLivePatch/);
  assert.doesNotMatch(host, /onLivePatch=/);
});

test("AT-PC-56 Create opens on Butterfly, unlocked, no seeded basis", () => {
  assert.match(builder, /template: "butterfly" as TemplateType/);
  assert.match(builder, /positionFromInput/);
  assert.match(builder, /record\.lock\.mode === "locked"/);
  assert.match(builder, /lockNatural|unlockCard/);
});

test("AT-PC-32 dialog picker rebuilds legs", () => {
  assert.match(builder, /data-testid="builder-template"/);
  assert.match(builder, /handleTemplate/);
  assert.match(builder, /regenerate\(/);
});

test("§5.1 / AT-DLG-11 removals: Preview, entry time, Submit, Done", () => {
  assert.doesNotMatch(builder, /Preview:/);
  assert.doesNotMatch(builder, /builder-entry-at/);
  assert.doesNotMatch(builder, /position-builder-submit/);
  assert.doesNotMatch(builder, /position-builder-close/);
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
  assert.doesNotMatch(host, /onLivePatch=/);
});

test("AT-PC-01 Edit is transactional — no live patch while the dialog is open", () => {
  assert.doesNotMatch(host, /onLivePatch=/);
  assert.doesNotMatch(builder, /onLivePatch/);
  assert.match(host, /applyEditPatch\(/);
  assert.match(host, /\{ lock: record\.lock \}/);
  assert.match(builder, /const record: AnalyzerPosition = draft/);
});

test("DLGM M1 draft is AnalyzerPosition", () => {
  assert.match(builder, /useState<AnalyzerPosition>/);
  assert.match(builder, /positionFromInput/);
  assert.match(builder, /const record: AnalyzerPosition/);
  assert.match(builder, /const position = record\.position/);
});

test("DLGM M2/M3 no direction or optionSide hooks", () => {
  assert.doesNotMatch(builder, /useState<TradeDirection>/);
  assert.doesNotMatch(builder, /useState<OptionRight>/);
  assert.doesNotMatch(builder, /setDirection/);
  assert.doesNotMatch(builder, /setOptionSide/);
  assert.match(builder, /catalogToTemplate\(detectFamily/);
  assert.match(builder, /chromeFromLegs/);
});

test("DLGM M4/M5 lock + shared helpers", () => {
  assert.match(builder, /record\.lock\.mode === "locked"/);
  assert.match(builder, /resolvePackageSide/);
  assert.match(builder, /packageSideFromStructure/);
  assert.match(builder, /blotterKindFromPackageSide/);
  assert.match(builder, /packageDelta/);
  assert.match(builder, /fmtIv/);
  const debitBlock = builder.slice(
    builder.indexOf("const debitShown"),
    builder.indexOf("const dte ="),
  );
  assert.doesNotMatch(debitBlock, /net_debit_override/);
});

test("Sell restamps priceSide from structure; handleDirection reads regenerate", () => {
  assert.match(builder, /structureKeyFromInput/);
  assert.match(builder, /priceSide: packageSideFromStructure/);
  const dirFn = builder.slice(builder.indexOf("const handleDirection"));
  assert.match(dirFn, /const built = regenerate\(/);
  assert.match(dirFn, /if \(built\) return;/);
});

test("DLGM M6 seam hands and receives a record; undo stores PositionInput", () => {
  assert.match(host, /record: AnalyzerPosition/);
  assert.match(host, /createInitial/);
  assert.match(host, /positionFromInput\(createReopen\)/);
  assert.match(host, /draft: \{\s*\n\s*\.\.\.pos\.position/);
  assert.match(host, /setCreateReopen\(entry\.draft\)/);
});

console.log(`positionBuilder.pc5.test.ts ${n} ok`);
