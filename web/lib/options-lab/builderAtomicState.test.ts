/**
 *   npx --yes tsx lib/options-lab/builderAtomicState.test.ts
 */

import {
  builderDefinitionKey,
  resolveBuilderPlaneState,
} from "./builderAtomicState";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

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

console.log("builderAtomicState");

test("definition key stable for same shape", () => {
  const a = builderDefinitionKey({
    mode: "create",
    symbol: "SPX",
    template: "butterfly",
    direction: "buy",
    optionSide: "call",
    center: 7730,
    width: 20,
    expiration: "2026-08-12",
    spot: 7728.2,
    contracts: 1,
  });
  const b = builderDefinitionKey({
    mode: "create",
    symbol: "SPX",
    template: "butterfly",
    direction: "buy",
    optionSide: "call",
    center: 7730,
    width: 20,
    expiration: "2026-08-12",
    spot: 7728.2,
    contracts: 1,
  });
  assert(a === b, "stable");
});

test("plane unavailable only when error + no strikes", () => {
  const s = resolveBuilderPlaneState({
    open: true,
    hasListedStrikes: false,
    hasLegs: false,
    packageComplete: false,
    chainError: "network down",
    chainLoading: false,
    resolving: false,
    unplaceable: false,
  });
  assert(s.kind === "plane_unavailable", "kind");
  assert(/shortly/i.test(s.detail), "calm detail");
  assert(s.expected === true, "expected");
});

test("updating while resolving", () => {
  const s = resolveBuilderPlaneState({
    open: true,
    hasListedStrikes: false,
    hasLegs: false,
    packageComplete: false,
    chainError: null,
    chainLoading: true,
    resolving: true,
    unplaceable: false,
  });
  assert(s.kind === "updating", "updating");
  assert(s.title === "UPDATING", "title");
});

test("ready when listed + legs + package", () => {
  const s = resolveBuilderPlaneState({
    open: true,
    hasListedStrikes: true,
    hasLegs: true,
    packageComplete: true,
    chainError: null,
    chainLoading: false,
    resolving: false,
    unplaceable: false,
  });
  assert(s.kind === "ready", "ready");
});

test("unplaceable is named not crash", () => {
  const s = resolveBuilderPlaneState({
    open: true,
    hasListedStrikes: true,
    hasLegs: false,
    packageComplete: false,
    chainError: null,
    chainLoading: false,
    resolving: false,
    unplaceable: true,
    unplaceableDetail: "not enough strikes",
  });
  assert(s.kind === "unplaceable", "kind");
  assert(s.expected === true, "expected");
});

console.log(`\n${n} tests passed`);
