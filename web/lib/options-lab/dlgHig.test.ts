/**
 * DLG2 v0.13 — AT-DLG-6 · 11 · 16–32 (chrome, fields, widths, precision).
 *
 *   npx --yes tsx lib/options-lab/dlgHig.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatHumanExpiration } from "./tosGenerator";
import {
  formatStrikeOnGrid,
  strikeGridDecimals,
} from "./listedStrikes";

const here = dirname(fileURLToPath(import.meta.url));
const builderPath = join(
  here,
  "../../components/options-lab/PositionBuilder.tsx",
);
const builder = readFileSync(builderPath, "utf8");
const controls = readFileSync(
  join(here, "../../components/options-lab/TosControls.tsx"),
  "utf8",
);
const tokens = readFileSync(
  join(here, "../../styles/tokens.css"),
  "utf8",
);
const globals = readFileSync(
  join(here, "../../app/globals.css"),
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

function grep(pattern: string): string {
  try {
    return execFileSync("grep", ["-nE", pattern, builderPath], {
      encoding: "utf8",
    });
  } catch (e) {
    const err = e as { status?: number };
    if (err.status === 1) return "";
    throw e;
  }
}

test("AT-DLG-6 element order: title · SYMBOL/STRATEGY · direction · LEGS · Add Leg · TOS SCRIPT · actions", () => {
  const title = builder.indexOf('"Create Position"');
  const symbol = builder.indexOf("{sectionLabel}>Symbol<");
  const strategy = builder.indexOf("{sectionLabel}>Strategy<");
  const direction = builder.indexOf('data-testid="builder-direction-row"');
  const legs = builder.indexOf("{sectionLabel}>Legs<");
  const addLeg = builder.indexOf("+ Add Leg");
  const script = builder.indexOf("{sectionLabel}>Tos Script<");
  const analyze = builder.indexOf('data-testid="builder-analyze"');
  const cancel = builder.indexOf('data-testid="position-builder-cancel"');
  assert.match(builder, /data-testid="builder-window-close"/);
  assert.ok(title > 0 && symbol > title, "SYMBOL after title");
  assert.ok(strategy > symbol, "STRATEGY after SYMBOL");
  assert.ok(direction > strategy, "direction row after STRATEGY");
  assert.ok(legs > direction, "LEGS after direction");
  assert.ok(addLeg > legs, "Add Leg after LEGS");
  assert.ok(script > addLeg, "TOS SCRIPT after Add Leg");
  assert.ok(analyze > script, "Analyze after script");
  assert.ok(cancel > analyze, "Cancel after Analyze (stacked)");
  assert.match(builder, /grid-cols-2/);
  assert.match(builder, /Debit/);
  assert.match(builder, /Pos/);
  assert.match(builder, /isTop/);
});

test("AT-DLG-6 no headings that are not in the image", () => {
  assert.doesNotMatch(builder, /sectionLabel\}>Structure</);
  assert.doesNotMatch(builder, /sectionLabel\}>Shape</);
  assert.doesNotMatch(builder, /sectionLabel\}>Position</);
  assert.doesNotMatch(builder, /aria-label="Structure"/);
  assert.doesNotMatch(builder, /aria-label="Shape"/);
  assert.doesNotMatch(builder, /aria-label="Position"/);
});

test("AT-DLG-11 no Submit, Preview, entry time, Done", () => {
  assert.equal(grep("position-builder-submit"), "");
  assert.equal(grep("builder-entry-at"), "");
  assert.equal(grep("position-builder-close"), "");
  assert.doesNotMatch(builder, /Preview:/);
});

test("AT-DLG-16 panel width is one constant; not window-responsive", () => {
  assert.match(builder, /const PANEL_W = \d+/);
  assert.match(builder, /data-panel-width=\{String\(PANEL_W\)\}/);
  assert.match(builder, /data-content-inset=\{String\(PANEL_INSET\)\}/);
  assert.doesNotMatch(builder, /100vw/);
  assert.doesNotMatch(builder, /min\(1100px/);
  assert.doesNotMatch(builder, /w - PANEL_W - 40/);
  assert.match(builder, /analyzer-risk-viewport/);
  assert.match(builder, /placedOnOpen/);
  const hits = grep(
    String.raw`(^|[^a-z-])(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(0\.5|1\.5|2\.5|3\.5|7|8|9|10|11|12|14|16)\b`,
  );
  assert.equal(hits, "", hits);
});

test("AT-DLG-17 type ladder, segmented Buy/Sell, pop-up menus, focus ring", () => {
  assert.match(builder, /--text-title-3/);
  assert.match(builder, /--text-caption/);
  assert.match(builder, /--text-subheadline/);
  assert.match(builder, /--text-body/);
  assert.match(builder, /tabular-nums/);
  assert.match(builder, /role="radiogroup"/);
  assert.match(builder, /aria-label="Buy or Sell"/);
  assert.match(builder, /<select/);
  assert.match(builder, /focus-visible:outline-\[var\(--color-tint\)\]/);
  assert.match(builder, /e\.key !== "Enter"/);
  assert.match(builder, /data-value-field/);
});

test("AT-DLG-17 accessibility labels", () => {
  assert.match(builder, /aria-label="Symbol"/);
  assert.match(builder, /aria-label="Strategy"/);
  assert.match(builder, /aria-label="Expiration"/);
  assert.match(builder, /aria-label="Add leg"/);
  assert.match(builder, /aria-label="ToS script"/);
  assert.match(builder, /aria-label="Remove leg"/);
});

test("AT-DLG-18 TOS SCRIPT block present", () => {
  assert.match(builder, /sectionLabel\}>Tos Script</);
  assert.match(builder, /data-testid="builder-tos-script"/);
  assert.match(builder, /data-code-surface="1"/);
  assert.match(builder, /click to copy/);
  assert.match(builder, /var\(--color-code-surface\)/);
});

test("AT-DLG-19 legs panel is the position card", () => {
  assert.match(builder, /data-testid="builder-legs-surface"/);
  assert.match(builder, /blotterCardBackground/);
  assert.match(builder, /CARD_COLUMNS/);
  assert.match(builder, /CARD_TH/);
  assert.match(builder, /CARD_TD/);
  assert.match(builder, /CARD_THEAD/);
  assert.match(builder, /cardSelect/);
  assert.match(builder, /<option value="call">CALL<\/option>/);
  assert.match(builder, /<option value="put">PUT<\/option>/);
  assert.doesNotMatch(builder, />EXPIRATION</);
  assert.doesNotMatch(builder, />Call</);
  assert.doesNotMatch(builder, />Put</);
  const legs = builder.slice(builder.indexOf('data-testid="builder-legs-surface"'));
  assert.match(legs, /c !== "VOL"/);
  assert.match(legs, /c !== "DELTA"/);
});

test("AT-DLG-20 payoff is success on buy, destructive on sell", () => {
  assert.match(
    builder,
    /direction === "buy"[\s\S]*?var\(--color-success\)[\s\S]*?var\(--color-destructive\)/,
  );
  assert.match(builder, /bg-\[var\(--color-success\)\]/);
  assert.doesNotMatch(builder, /#22c55e|#ef4444|bg-emerald-600/);
});

test("AT-DLG-21 legs table sizes to content; no auto-distribution", () => {
  assert.match(builder, /data-testid="builder-legs-table"/);
  assert.match(builder, /whitespace-nowrap/);
  assert.match(builder, /width: "max-content"/);
  assert.doesNotMatch(builder, /w-full table-fixed/);
  assert.doesNotMatch(builder, /const COLS/);
  assert.match(builder, /LEGS_PAD = 15/);
  assert.match(builder, /LEGS_ROW_GAP = 8/);
  assert.match(builder, /LEGS_GROUP_GAP = 32/);
  const surface = builder.slice(
    builder.indexOf("data-testid=\"builder-legs-surface\""),
    builder.indexOf("data-testid=\"builder-legs-table\""),
  );
  assert.doesNotMatch(surface, /padding: LEGS_PAD/);
  assert.match(builder, /above: isTop/);
  assert.match(builder, /textAlign: "center"/);
});

test("AT-DLG-22 five additions absent", () => {
  assert.doesNotMatch(builder, /data-testid="builder-held-shape"/);
  assert.doesNotMatch(builder, /data-testid="builder-center"/);
  assert.doesNotMatch(builder, /data-testid="builder-width"/);
  assert.doesNotMatch(builder, /data-testid="builder-expiration"/);
  assert.doesNotMatch(builder, /aria-label="Call or Put"/);
  assert.doesNotMatch(builder, /ariaLabel="Call or Put"/);
  assert.doesNotMatch(builder, /derivedName/);
  assert.doesNotMatch(builder, /Buy Butterfly/);
  assert.doesNotMatch(builder, /<FormRow/);
  assert.doesNotMatch(builder, /SegmentedControl/);
});

test("AT-DLG-29 menu marker: CardMenuField, not a hit target, token fill on dialog", () => {
  assert.match(controls, /export function CardMenuField/);
  assert.match(controls, /data-menu-triangle="1"/);
  assert.match(controls, /pointer-events-none absolute bottom-0 right-0/);
  assert.match(controls, /points="6,6 0,6 6,0"/);
  assert.match(controls, /fill=\{card \? "#ffffff" : "var\(--color-menu-marker\)"\}/);
  assert.match(tokens, /--color-menu-marker:\s*var\(--color-label\)/);
  assert.doesNotMatch(builder, /data-menu-triangle/);
  assert.doesNotMatch(globals, /--builder-chevron:/);
});

test("AT-DLG-23 expiration is Sep 14 26, every value is a field", () => {
  assert.match(builder, /formatHumanExpiration/);
  assert.match(builder, /data-field="qty"/);
  assert.match(builder, /data-field="strike"/);
  assert.match(builder, /data-field="debit"/);
  assert.match(builder, /data-field="pos"/);
  assert.match(builder, /data-field="expiration"/);
  assert.equal(formatHumanExpiration("2026-09-14"), "Sep 14 26");
  assert.doesNotMatch(builder, /e\.slice\(5\)/);
});

test("AT-DLG-24 header is CARD_COLUMNS language, card chrome", () => {
  assert.match(builder, /data-testid="builder-legs-header"/);
  assert.match(builder, /CARD_COLUMNS\.filter/);
  assert.match(builder, /CARD_TH/);
  assert.match(builder, /CARD_THEAD/);
  const legs = builder.slice(builder.indexOf('data-testid="builder-legs-surface"'));
  assert.match(legs, /<option value="buy">BUY</);
  assert.match(legs, /<option value="sell">SELL</);
  assert.match(legs, /CardMenuField surface="card"/);
  assert.doesNotMatch(legs, /fmtPackageDelta/);
});

test("AT-DLG-25 elevation on dialog controls", () => {
  assert.match(builder, /shadow-\[var\(--elevation-1\)\]/);
  assert.match(controls, /shadow-\[var\(--elevation-1\)\]/);
});

test("AT-DLG-26 large Analyze/Cancel", () => {
  assert.match(builder, /const dlgAction/);
  assert.match(builder, /px-6 py-3/);
});

test("AT-DLG-27 close is window chrome, not Done", () => {
  assert.match(builder, /data-testid="builder-window-close"/);
  assert.match(builder, /aria-label="Close"/);
  assert.match(builder, /WINDOW_CLOSE_DOT/);
  assert.equal(grep("position-builder-close"), "");
});

test("AT-DLG-28 legs controls are the card's 18px controls", () => {
  const legs = builder.slice(builder.indexOf('data-testid="builder-legs-surface"'));
  assert.match(legs, /TosStepper surface="card"/);
  assert.match(legs, /TosQtyControl surface="card"/);
  assert.match(legs, /TosPadlock surface="card"/);
  assert.match(legs, /CardMenuField surface="card"/);
  assert.doesNotMatch(legs, /surface="dialog"/);
  assert.match(controls, /export function TosStepper/);
  assert.match(controls, /data-resting-h="18"/);
  const stepper = controls.slice(controls.indexOf("export function TosStepper"));
  assert.match(stepper, /shadow-\[var\(--elevation-1\)\]/);
  const dlgInner = stepper.slice(stepper.lastIndexOf(") : ("));
  assert.doesNotMatch(dlgInner.slice(0, 800), /growBox/);
});

test("AT-DLG-30/32 field widths EXP > STRIKE > DEBIT POS QTY", () => {
  assert.match(builder, /const W_QTY = "w-\[5ch\]"/);
  assert.match(builder, /const W_STRIKE = "w-\[8ch\]"/);
  assert.match(builder, /const W_EXP = "w-\[12ch\]"/);
  assert.match(builder, /const W_DEBIT = "w-\[7ch\]"/);
  assert.match(builder, /const W_POS = "w-\[4ch\]"/);
  assert.ok(12 > 8 && 8 > 7 && 7 > 5 && 5 > 4);
});

test("AT-DLG-31 strike precision from listed grid", () => {
  assert.equal(strikeGridDecimals([7635, 7640, 7645]), 0);
  assert.equal(strikeGridDecimals([7635, 7635.25, 7635.5]), 2);
  assert.equal(formatStrikeOnGrid(7635.25, 2), "7635.25");
  assert.equal(formatStrikeOnGrid(7635, 2), "7635.00");
  assert.equal(formatStrikeOnGrid(7635, 0), "7635");
  assert.match(builder, /strikeGridDecimals/);
  assert.match(builder, /strikeDecimals/);
});

test("AT-DLG-29 marker only on menu fields", () => {
  function wrappedByMenu(needle: string) {
    const i = builder.indexOf(needle);
    assert.ok(i > 0, `missing ${needle}`);
    const open = builder.lastIndexOf("<CardMenuField", i);
    const close = builder.lastIndexOf("</CardMenuField>", i);
    return open > close;
  }
  assert.equal(wrappedByMenu('data-testid="builder-symbol"'), true);
  assert.equal(wrappedByMenu('data-testid="builder-template"'), true);
  assert.equal(wrappedByMenu("builder-leg-strike-"), true);
  assert.equal(wrappedByMenu("builder-leg-type-"), true);
  assert.equal(wrappedByMenu("builder-leg-exp-"), true);
  assert.equal(wrappedByMenu("builder-leg-qty-${i}"), false);
  assert.equal(wrappedByMenu('data-testid="builder-live-package-price"'), false);
  assert.equal(wrappedByMenu('data-testid="builder-pos"'), false);
});

console.log(`${n} ok`);
