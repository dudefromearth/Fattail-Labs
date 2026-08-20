/**
 *   npx --yes tsx lib/risk-graph/strikeHandleBind.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strikeHandleHot, type StrikeHandle } from "./strikeHandleBind";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("strikeHandleBind");

const a: StrikeHandle = { strike: 5000, positionId: "p1" };
const b: StrikeHandle = { strike: 5050, positionId: "p1" };
const other: StrikeHandle = { strike: 5000, positionId: "p2" };
const idle = { preview: null, hover: null, hoverShift: false };

test("idle — no hover, no drag — original size", () => {
  assert(!strikeHandleHot(a, idle), "a idle");
  assert(!strikeHandleHot(b, idle), "b idle");
});

test("proximity — only the hovered tick is hot", () => {
  const s = { preview: null, hover: a, hoverShift: false };
  assert(strikeHandleHot(a, s), "hovered tick hot");
  assert(!strikeHandleHot(b, s), "sibling tick idle");
  assert(!strikeHandleHot(other, s), "other position idle");
});

test("loss of proximity — hover null restores idle", () => {
  assert(
    !strikeHandleHot(a, { preview: null, hover: null, hoverShift: true }),
    "Shift leftover without hover is not hot",
  );
});

test("Shift in proximity — all ticks of that position hot", () => {
  const s = { preview: null, hover: a, hoverShift: true };
  assert(strikeHandleHot(a, s), "hovered hot");
  assert(strikeHandleHot(b, s), "sibling hot while Shift + proximity");
  assert(!strikeHandleHot(other, s), "other position idle");
});

test("single drag — only dest tick hot", () => {
  const s = {
    preview: {
      positionId: "p1",
      grabbedStrike: 5000,
      offset: 50,
      shiftAll: false,
    },
    hover: a,
    hoverShift: false,
  };
  assert(!strikeHandleHot(a, s), "origin not hot after detent");
  assert(strikeHandleHot(b, s), "dest hot");
  assert(!strikeHandleHot(other, s), "other idle");
});

test("Shift drag — all ticks of that position hot", () => {
  const s = {
    preview: {
      positionId: "p1",
      grabbedStrike: 5000,
      offset: 50,
      shiftAll: true,
    },
    hover: a,
    hoverShift: true,
  };
  assert(strikeHandleHot(a, s), "origin hot in group drag");
  assert(strikeHandleHot(b, s), "sibling hot in group drag");
  assert(!strikeHandleHot(other, s), "other idle");
});

test("after move — preview cleared, no hover → idle", () => {
  assert(!strikeHandleHot(a, idle), "a idle after drop off-handle");
  assert(!strikeHandleHot(b, idle), "b idle after drop off-handle");
});

test("after move still in proximity — only that tick hot", () => {
  const s = { preview: null, hover: b, hoverShift: false };
  assert(!strikeHandleHot(a, s), "origin idle");
  assert(strikeHandleHot(b, s), "still over dest");
});

test("HostPnLChart sizes from strikeHandleHot, not sticky group", () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const host = readFileSync(
    join(here, "../../components/options-lab/risk-graph/HostPnLChart.tsx"),
    "utf8",
  );
  const bind = readFileSync(join(here, "strikeHandleBind.ts"), "utf8");
  assert(host.includes("strikeHandleHot"), "draw uses proximity helper");
  assert(bind.includes("clearProximity"), "leave/up clear hover + group");
  assert(bind.includes("releasePointerCapture"), "drop releases capture");
  assert(bind.includes("pointerleave"), "leave host is loss of proximity");
  assert(
    bind.includes("wholePosition = (_positionId: string, shiftKey: boolean) => shiftKey"),
    "group move only while Shift is held — not sticky after drop",
  );
});

console.log(`\n${n} tests passed`);
