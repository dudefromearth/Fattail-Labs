/**
 *   npx --yes tsx lib/options-lab/positionQty.test.ts
 */
import assert from "node:assert/strict";
import {
  migrateLegContracts,
  posAndRatio,
  scaleLegPos,
  signedActualQty,
} from "./positionQty";
import {
  ANALYZER_POS_KEY,
  BOOK_BACKUP_KEY,
  backupAnalyzerBookOnce,
  loadPositions,
  restoreAnalyzerBookFromBackup,
} from "./analyzerBook";

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
g.window = { dispatchEvent: () => true };

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

test("signed actual qty", () => {
  assert.equal(signedActualQty({ quantity: 3, side: "long" }), "+3");
  assert.equal(signedActualQty({ quantity: 6, side: "short" }), "−6");
});

test("migrate contracts × ratio → actual counts; idempotent", () => {
  const old = {
    contracts: 3,
    legs: [
      { quantity: 1, side: "long" as const },
      { quantity: 2, side: "short" as const },
      { quantity: 1, side: "long" as const },
    ],
  };
  const once = migrateLegContracts(old);
  assert.equal(once.contracts, 1);
  assert.deepEqual(
    once.legs.map((l) => l.quantity),
    [3, 6, 3],
  );
  const twice = migrateLegContracts(once);
  assert.deepEqual(
    twice.legs.map((l) => l.quantity),
    [3, 6, 3],
  );
});

test("scaleLegPos 3-lot fly → 4-lot", () => {
  const next = scaleLegPos(
    [{ quantity: 3 }, { quantity: 6 }, { quantity: 3 }],
    4,
  );
  assert.deepEqual(
    next.map((l) => l.quantity),
    [4, 8, 4],
  );
  assert.equal(posAndRatio(next).pos, 4);
});

test("backup once, migrate on load, restore one step", () => {
  const oldBook = [
    {
      id: "p1",
      label: "old",
      notation: "",
      status: "ANALYSIS",
      livePackagePerShare: 0.67,
      lastNatSigned: 0.67,
      priceSide: "debit",
      visible: true,
      lock: { mode: "unlocked" },
      liveState: "not_live",
      displayAsOf: null,
      contentHashes: {},
      maxSkewMs: null,
      epochQuality: null,
      createdAt: 1,
      updatedAt: 1,
      position: {
        underlying: "XSP",
        expiration: "2026-09-11",
        contracts: 3,
        direction: "buy",
        template: "butterfly",
        legs: [
          {
            strike: 760,
            type: "call",
            quantity: 1,
            side: "long",
            entry_price: 1,
          },
          {
            strike: 770,
            type: "call",
            quantity: 2,
            side: "short",
            entry_price: 1,
          },
          {
            strike: 780,
            type: "call",
            quantity: 1,
            side: "long",
            entry_price: 1,
          },
        ],
      },
    },
  ];
  local.set(ANALYZER_POS_KEY, JSON.stringify(oldBook));
  const first = backupAnalyzerBookOnce(g.localStorage);
  assert.equal(first.key, BOOK_BACKUP_KEY);
  assert.equal(first.count, 1);
  assert.equal(first.wrote, true);
  const second = backupAnalyzerBookOnce(g.localStorage);
  assert.equal(second.wrote, false);
  assert.equal(second.count, 1);

  const loaded = loadPositions();
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].position.contracts, 1);
  assert.deepEqual(
    loaded[0].position.legs.map((l) => l.quantity),
    [3, 6, 3],
  );
  assert.equal(
    (loaded[0].position as { template?: unknown }).template,
    undefined,
  );

  restoreAnalyzerBookFromBackup(g.localStorage, g.sessionStorage);
  const rolled = JSON.parse(local.get(ANALYZER_POS_KEY)!) as typeof oldBook;
  assert.equal(rolled[0].position.contracts, 3);
  assert.equal(rolled[0].position.legs[0].quantity, 1);
});

console.log(`positionQty.test.ts ${n} ok`);
