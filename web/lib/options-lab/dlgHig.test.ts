/**
 * DLG2 — AT-DLG-11 · 16 · 17 greps. Layout + HIG itemised.
 *
 *   npx --yes tsx lib/options-lab/dlgHig.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const builderPath = join(
  here,
  "../../components/options-lab/PositionBuilder.tsx",
);
const builder = readFileSync(builderPath, "utf8");

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

test("AT-DLG-11 no Submit, Preview, entry time, Done/Close header", () => {
  assert.equal(grep("position-builder-submit"), "");
  assert.equal(grep("builder-entry-at"), "");
  assert.equal(grep("position-builder-close"), "");
  assert.doesNotMatch(builder, /Preview:/);
  assert.match(builder, /data-testid="builder-analyze"/);
  assert.match(builder, /data-testid="builder-update"/);
  assert.match(builder, /data-testid="position-builder-cancel"/);
});

test("AT-DLG-16 panel 820, inset 20, content 780", () => {
  assert.match(builder, /const PANEL_W = 820/);
  assert.match(builder, /data-panel-width="820"/);
  assert.match(builder, /data-content-inset="20"/);
  assert.match(builder, /px-5/);
  assert.match(builder, /pt-5/);
  assert.match(builder, /py-5/);
});

test("AT-DLG-16 off-grid spacing classes return nothing", () => {
  const hits = grep(
    String.raw`(^|[^a-z-])(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y)-(0\.5|1\.5|2\.5|3\.5|7|8|9|10|11|12|14|16)\b`,
  );
  assert.equal(hits, "", hits);
});

test("AT-DLG-17 type ladder distinct steps", () => {
  assert.match(builder, /--text-title-3/);
  assert.match(builder, /--text-caption/);
  assert.match(builder, /--text-subheadline/);
  assert.match(builder, /--text-body/);
  assert.match(builder, /tabular-nums/);
});

test("AT-DLG-17 Buy/Sell is SegmentedControl; menus are pop-up selects", () => {
  assert.match(builder, /SegmentedControl/);
  assert.match(builder, /ariaLabel="Buy or Sell"/);
  assert.match(builder, /<select/);
  assert.doesNotMatch(builder, /bg-emerald-600|bg-red-600/);
  assert.doesNotMatch(builder, /handleDirection\("buy"\)/);
  assert.match(builder, /id: "buy", label: "Buy"/);
});

test("AT-DLG-17 alignment axis, default button last, Return-bound", () => {
  assert.match(builder, /grid-cols-\[7rem_minmax\(0,1fr\)\]/);
  assert.match(builder, /justify-end/);
  assert.match(builder, /data-testid="builder-analyze"/);
  assert.match(builder, /e\.key !== "Enter"/);
  assert.match(builder, /data-value-field/);
});

test("AT-DLG-17 hairline separators, one elevation, one radius, focus ring", () => {
  assert.match(builder, /border-\[var\(--color-separator\)\]/);
  assert.match(builder, /shadow-\[var\(--elevation-3\)\]/);
  assert.match(builder, /rounded-\[var\(--radius-lg\)\]/);
  assert.match(builder, /focus-visible:outline-\[var\(--color-tint\)\]/);
});

test("AT-DLG-17 accessibility labels on controls", () => {
  assert.match(builder, /aria-label="Symbol"/);
  assert.match(builder, /aria-label="Strategy"/);
  assert.match(builder, /aria-label="Centre"/);
  assert.match(builder, /aria-label="Width"/);
  assert.match(builder, /aria-label="Expiration"/);
  assert.match(builder, /aria-label="Add leg"/);
  assert.match(builder, /aria-label="Copy ToS script"/);
  assert.match(builder, /aria-label="Remove leg"/);
});

test("AT-DLG-6 layout sections present; PNG overrides absent", () => {
  assert.match(builder, /aria-label="Structure"/);
  assert.match(builder, /aria-label="Shape"/);
  assert.match(builder, /aria-label="Position"/);
  assert.match(builder, /TEMPLATE_HAS_SIDE\[template\]/);
  assert.doesNotMatch(builder, /aria-modal="true"/);
});

console.log(`${n} ok`);
