/**
 * DLG0 — AT-DLG-15. Required `surface` prop; `data-surface` stamp.
 * Same component, two appearances, identical behaviour.
 *
 *   npx --yes tsx lib/options-lab/dlgSurface.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const controls = readFileSync(
  join(here, "../../components/options-lab/TosControls.tsx"),
  "utf8",
);
const list = readFileSync(
  join(here, "../../components/options-lab/AnalyzerPositionsList.tsx"),
  "utf8",
);
const builder = readFileSync(
  join(here, "../../components/options-lab/PositionBuilder.tsx"),
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

const SHARED = [
  "TosStepper",
  "TosQtyControl",
  "TosPadlock",
  "CardMenuField",
] as const;

function exportBlock(name: string): string {
  const start = controls.indexOf(`export function ${name}({`);
  assert.ok(start >= 0, `missing export ${name}`);
  const next = SHARED.map((other) =>
    other === name ? -1 : controls.indexOf(`export function ${other}({`, start + 1),
  )
    .filter((i) => i > start)
    .sort((a, b) => a - b)[0];
  const end = next ?? controls.length;
  return controls.slice(start, end);
}

test("AT-DLG-15 TosSurface is card | dialog", () => {
  assert.match(controls, /export type TosSurface = "card" \| "dialog"/);
});

test("AT-DLG-15 each shared export requires surface and stamps data-surface", () => {
  for (const name of SHARED) {
    const block = exportBlock(name);
    assert.match(block, /surface: TosSurface/);
    assert.match(block, /data-surface=\{surface\}/);
  }
});

test("AT-DLG-15 card call sites pass surface=\"card\"", () => {
  for (const name of SHARED) {
    assert.match(list, new RegExp(`<${name}[^>\\n]*surface="card"`));
  }
  assert.doesNotMatch(list, /surface="dialog"/);
});

test("AT-DLG-15 dialog call sites pass surface=\"dialog\"", () => {
  for (const name of SHARED) {
    assert.match(builder, new RegExp(`<${name}[^>\\n]*surface="dialog"`));
  }
  assert.doesNotMatch(builder, /surface="card"/);
});

test("AT-DLG-15 no shared-control JSX without surface=", () => {
  for (const src of [list, builder]) {
    const uses = [
      ...src.matchAll(
        /<(TosStepper|TosQtyControl|TosPadlock|CardMenuField)\b([^>]*?)>/g,
      ),
    ];
    assert.ok(uses.length > 0);
    for (const m of uses) {
      assert.match(
        m[0],
        /surface="(card|dialog)"/,
        `missing surface: ${m[0]}`,
      );
    }
  }
});

test("AT-DLG-15 one component — no forked stepper/padlock/triangle in the dialog", () => {
  assert.match(builder, /TosStepper/);
  assert.match(builder, /TosQtyControl/);
  assert.match(builder, /TosPadlock/);
  assert.match(builder, /CardMenuField/);
  assert.doesNotMatch(builder, /function TosStepper/);
  assert.doesNotMatch(builder, /function CardMenuField/);
  assert.doesNotMatch(builder, /data-menu-triangle/);
});

test("AT-DLG-15 behaviour still one implementation (step / lock callbacks unchanged)", () => {
  assert.match(controls, /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*onUp\(\);/);
  assert.match(controls, /onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*onDown\(\);/);
  assert.match(controls, /onToggle\(\)/);
  assert.match(controls, /onPick\(n\)/);
});

test("DLG0 card appearance unchanged — grow-on-hover still PC-HIG-8", () => {
  assert.match(controls, /group-hover\/step:min-h-\[var\(--hit-min\)\]/);
  assert.match(controls, /group-focus-within\/step:min-h-\[var\(--hit-min\)\]/);
  assert.match(controls, /data-resting-h="18"/);
  assert.match(list, /surface="card"/);
});

console.log(`${n} ok`);
