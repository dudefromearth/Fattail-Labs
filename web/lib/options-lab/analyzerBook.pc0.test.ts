/**
 * PC0 — AT-PC-02 · AT-PC-47 · AT-PC-60 plus as-built characterization.
 *
 *   npx --yes tsx lib/options-lab/analyzerBook.pc0.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyEditPatch,
  applyPackageQuote,
  loadPositions,
  positionFromInput,
  savePositions,
  shiftCardStrikes,
  type AnalyzerPosition,
} from "./analyzerBook";
import { analyzerPositionToOpenTrade } from "./analyzerToTradeLog";
import type { PositionInput } from "./positionTypes";

const here = dirname(fileURLToPath(import.meta.url));

const local = new Map<string, string>();
const sess = new Map<string, string>();

function mem(map: Map<string, string>) {
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: () => null,
    get length() {
      return map.size;
    },
  };
}

const g = globalThis as unknown as {
  window: { dispatchEvent: (e: Event) => boolean };
  localStorage: Storage;
  sessionStorage: Storage;
};
g.localStorage = mem(local) as Storage;
g.sessionStorage = mem(sess) as Storage;
g.window = {
  dispatchEvent: () => true,
};

function fly(): PositionInput {
  return {
    underlying: "XSP",
    expiration: "2026-09-11",
    contracts: 1,
    direction: "buy",
    net_debit_override: null,
    legs: [
      {
        strike: 763,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1.2,
      },
      {
        strike: 767,
        type: "call",
        quantity: 2,
        side: "short",
        entry_price: 5.5,
      },
      {
        strike: 771,
        type: "call",
        quantity: 1,
        side: "long",
        entry_price: 1.1,
      },
    ],
  };
}

let n = 0;
function test(name: string, fn: () => void) {
  local.clear();
  sess.clear();
  try {
    fn();
    n += 1;
    console.log(`  ok  ${name}`);
  } catch (e) {
    console.error(`  FAIL ${name}`);
    throw e;
  }
}

test("AT-PC-02 Edit patch preserves visible, rehearsal, clocks, tradeLogTradeId, bind", () => {
  const existing = positionFromInput(fly());
  existing.id = "keep-me";
  existing.visible = false;
  existing.rehearsal = true;
  existing.createdAt = 111;
  existing.entryAt = 222;
  existing.closedAt = null;
  existing.tradeLogTradeId = 99;
  existing.bind = {
    bindable: true,
    failedCount: 0,
    summary: "ok",
    assessedAt: 1,
    legs: [],
  };
  existing.lock = {
    mode: "locked",
    lockedAt: "2026-09-11T00:00:00Z",
    packageDebitPerShare: 0.67,
    lockSource: "user_limit",
    freezeIv: false,
    freezeMarks: false,
  };

  const patched = applyEditPatch(existing, fly(), "XSP fly", "763/767/771");
  assert.equal(patched.id, "keep-me");
  assert.equal(patched.visible, false);
  assert.equal(patched.rehearsal, true);
  assert.equal(patched.createdAt, 111);
  assert.equal(patched.entryAt, 222);
  assert.equal(patched.closedAt, null);
  assert.equal(patched.tradeLogTradeId, 99);
  assert.equal(patched.bind?.bindable, true);
  assert.equal(patched.lock.mode, "locked");
  assert.equal(patched.label, "XSP fly");
});

test("AT-PC-02 wire: handleBuilderSave edit branch calls applyEditPatch", () => {
  const src = readFileSync(
    join(here, "../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert.match(src, /applyEditPatch\(p, input, label, notation\)/);
  assert.doesNotMatch(
    src,
    /p\.id === editId\s*\n\s*\? \{\s*\n\s*\.\.\.positionFromInput/,
  );
});

test("AT-PC-47 rehearsal and visible survive a persistence round-trip", () => {
  const live = positionFromInput(fly());
  live.id = "live";
  const reh = positionFromInput(fly());
  reh.id = "reh";
  reh.rehearsal = true;
  reh.visible = false;
  savePositions([live, reh]);
  const loaded = loadPositions();
  assert.equal(loaded.length, 2);
  const gotReh = loaded.find((p) => p.id === "reh");
  const gotLive = loaded.find((p) => p.id === "live");
  assert.equal(gotReh?.rehearsal, true);
  assert.equal(gotReh?.visible, false);
  assert.equal(gotLive?.rehearsal, undefined);
  assert.equal(gotLive?.visible, true);
});

test("AT-PC-60 simulated restart: wipe sessionStorage, book still there with rehearsal", () => {
  const reh = positionFromInput(fly());
  reh.id = "tm-born";
  reh.rehearsal = true;
  reh.visible = true;
  savePositions([reh]);
  sess.clear();
  const loaded = loadPositions();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, "tm-born");
  assert.equal(loaded[0].rehearsal, true);
  assert.equal(loaded[0].visible, true);
});

test("AT-PC-60 persist is not session-only: dual-write localStorage", () => {
  const p = positionFromInput(fly());
  p.id = "dual";
  p.rehearsal = true;
  savePositions([p]);
  assert.ok(local.get("ft_options_lab_analyzer_positions_v2"));
  assert.ok(sess.get("ft_options_lab_analyzer_positions_v2"));
  const fromLocal = JSON.parse(
    local.get("ft_options_lab_analyzer_positions_v2")!,
  ) as AnalyzerPosition[];
  assert.equal(fromLocal[0].rehearsal, true);
});

test("characterization: applyPackageQuote incomplete currently nulls lastNatSigned", () => {
  let pos = positionFromInput(fly());
  pos.lastNatSigned = 0.67;
  pos.livePackagePerShare = 0.67;
  pos = applyPackageQuote(pos, { complete: false });
  assert.equal(pos.lastNatSigned, null);
  assert.equal(pos.liveState, "incomplete");
});

test("characterization: mapper currently always LMT", () => {
  const pos = positionFromInput(fly());
  const draft = analyzerPositionToOpenTrade(pos);
  assert.equal(draft.order_type, "LMT");
});

test("characterization: shiftCardStrikes without listed ladder is a no-op", () => {
  const pos = positionFromInput(fly());
  const next = shiftCardStrikes(pos, "up");
  assert.equal(next, pos);
});

console.log(`analyzerBook.pc0.test.ts ${n} ok`);
