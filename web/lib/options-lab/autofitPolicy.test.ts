/**
 * PC9a — Autofit. AT-PC-16: still-fits is a no-op.
 *
 *   npx --yes tsx lib/options-lab/autofitPolicy.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { positionFromInput } from "./analyzerBook";
import { structureKey } from "./structureSignal";
import {
  geometryEscapesWindow,
  shouldAutofit,
  visibleStructureFingerprint,
} from "./autofitPolicy";

const here = dirname(fileURLToPath(import.meta.url));

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

test("AT-PC-16 Autofit does not fire when the edited position still fits", () => {
  assert.equal(shouldAutofit("structure", false), false);
  assert.equal(shouldAutofit("structure", true), true);
  assert.equal(
    geometryEscapesWindow([760, 770, 780], { min: 700, max: 850 }),
    false,
  );
  assert.equal(
    geometryEscapesWindow([760, 770, 900], { min: 700, max: 850 }),
    true,
  );
});

test("PC-FIT-3 Create-Submit and first show always fit; overlay never", () => {
  assert.equal(shouldAutofit("create-submit", false), true);
  assert.equal(shouldAutofit("first-show", false), true);
  assert.equal(shouldAutofit("button", false), true);
  assert.equal(shouldAutofit("overlay", true), false);
  assert.equal(shouldAutofit("none", true), false);
});

test("PC-FIT-1 fingerprint follows structure, not POS or hide", () => {
  const a = positionFromInput({
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    legs: [
      { strike: 760, type: "call", quantity: 1, side: "long", entry_price: 1 },
      { strike: 770, type: "call", quantity: 2, side: "short", entry_price: 1 },
      { strike: 780, type: "call", quantity: 1, side: "long", entry_price: 1 },
    ],
  });
  const fp = visibleStructureFingerprint([
    { id: a.id, structureKey: structureKey(a), visible: true },
  ]);
  const hidden = visibleStructureFingerprint([
    { id: a.id, structureKey: structureKey(a), visible: false },
  ]);
  assert.equal(hidden, "");
  assert.ok(fp.includes(a.id));
});

test("host subscribes to structureKey, not strike-drop as always-fit", () => {
  const az = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert.match(az, /shouldAutofit/);
  assert.match(az, /structureKey/);
  assert.match(az, /pendingCreateFitRef/);
  const spec = readFileSync(
    join(
      here,
      "../../../Specs/FatTail-Labs-Options-Lab-Surface-Autofit-Spec-v0.1.md",
    ),
    "utf8",
  );
  assert.match(spec, /PC-FIT-3/);
  assert.match(spec, /structure-changed signal/);
});

console.log(`autofitPolicy.test.ts ${n} ok`);
