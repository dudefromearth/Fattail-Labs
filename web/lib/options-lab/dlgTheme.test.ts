/**
 * DLG1 — AT-DLG-3 · 4 · 5. Theme tokens, no card tokens, no hex, no palette.
 *
 *   npx --yes tsx lib/options-lab/dlgTheme.test.ts
 */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const webRoot = join(here, "../..");
const builder = readFileSync(
  join(here, "../../components/options-lab/PositionBuilder.tsx"),
  "utf8",
);
const tokens = readFileSync(join(here, "../../styles/tokens.css"), "utf8");
const controls = readFileSync(
  join(here, "../../components/options-lab/TosControls.tsx"),
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

function grep(pattern: string, file: string): string {
  try {
    return execFileSync(
      "grep",
      ["-nE", pattern, join(webRoot, file)],
      { encoding: "utf8" },
    );
  } catch (e) {
    const err = e as { status?: number; stdout?: string };
    if (err.status === 1) return "";
    throw e;
  }
}

test("Echo named --color-code-surface; stays dark (not overridden by data-theme)", () => {
  assert.match(tokens, /--color-code-surface:\s*#1c1c1e/);
  assert.equal([...tokens.matchAll(/--color-code-surface:/g)].length, 1);
});

test("AT-DLG-4 zero card tokens, zero hex, zero palette in PositionBuilder", () => {
  assert.equal(
    grep(
      String.raw`FIELD_FILL|OL_DATA|OL_CHROME|cardSelect|h-\[18px\]`,
      "components/options-lab/PositionBuilder.tsx",
    ),
    "",
  );
  assert.equal(
    grep(
      String.raw`#[0-9A-Fa-f]{3,8}`,
      "components/options-lab/PositionBuilder.tsx",
    ),
    "",
  );
  assert.equal(
    grep(
      String.raw`(bg|text|border|from|to|stroke|fill|ring|outline)-(emerald|red|green|blue|orange|yellow|zinc|slate|neutral|stone|gray|black|white|rose|lime|teal|cyan|sky|indigo|violet|purple|fuchsia|pink|amber)(-[0-9]{2,3})?`,
      "components/options-lab/PositionBuilder.tsx",
    ),
    "",
  );
  assert.match(builder, /var\(--color-code-surface\)/);
});

test("AT-DLG-3 dialog follows document theme — no hardcoded dark scheme", () => {
  assert.doesNotMatch(builder, /\[color-scheme:dark\]/);
  assert.doesNotMatch(builder, /color-scheme:\s*dark/);
  assert.match(builder, /var\(--color-surface\)/);
  assert.match(builder, /var\(--color-label\)/);
});

test("AT-DLG-5 type and density tokens — rem scale and --hit-min", () => {
  assert.match(builder, /var\(--text-title-3\)/);
  assert.match(builder, /var\(--text-body\)/);
  assert.match(builder, /var\(--hit-min\)/);
  assert.match(builder, /var\(--radius-lg\)/);
  assert.match(builder, /var\(--color-tint\)/);
});

test("AT-DLG-4 dialog branch of TosControls uses tokens, not card floor", () => {
  const start = controls.indexOf("export function TosStepper");
  const end = controls.indexOf("export function TosQtyControl");
  const stepper = controls.slice(start, end);
  const dlgInner = stepper.slice(stepper.lastIndexOf(") : ("));
  assert.doesNotMatch(dlgInner, /h-\[18px\]/);
  assert.match(controls, /minHeight: "var\(--hit-min\)"/);
  assert.match(controls, /bg-\[var\(--color-fill\)\]/);
});

test("Buy/Sell and payoff use success/destructive tokens", () => {
  assert.match(builder, /var\(--color-success\)/);
  assert.match(builder, /var\(--color-destructive\)/);
  assert.doesNotMatch(builder, /#22c55e|#ef4444|bg-emerald-600|bg-red-600/);
});

console.log(`${n} ok`);
