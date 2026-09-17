/**
 * Durable alerts survive tab/browser shutdown (localStorage).
 * Rehearsal alerts still never persist (TMI-80).
 *
 *   npx --yes tsx lib/options-lab/analyzerAlertsPersist.test.ts
 */
import assert from "node:assert/strict";
import {
  createPriceAlert,
  loadAlerts,
  saveAlerts,
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
  window: object;
  localStorage: Storage;
  sessionStorage: Storage;
};
g.localStorage = mem(local) as Storage;
g.sessionStorage = mem(sess) as Storage;
g.window = {};

const KEY = "ft_options_lab_analyzer_alerts_v1";

const live = createPriceAlert({
  type: "price_above",
  symbol: "SPX",
  targetPrice: 6400,
  id: "live-alert",
});
const reh = createPriceAlert({
  type: "price_below",
  symbol: "SPX",
  targetPrice: 6300,
  id: "reh-alert",
  rehearsal: true,
});

saveAlerts([live, reh]);
assert.ok(sess.get(KEY), "session write");
assert.ok(local.get(KEY), "localStorage dual-write");
const stored = JSON.parse(local.get(KEY)!) as { id: string; rehearsal?: boolean }[];
assert.equal(stored.length, 1);
assert.equal(stored[0].id, "live-alert");

sess.clear();
const afterShutdown = loadAlerts();
assert.equal(afterShutdown.length, 1, "survives wiped sessionStorage");
assert.equal(afterShutdown[0].id, "live-alert");
assert.ok(sess.get(KEY), "rehydrates session from local");

console.log("analyzerAlertsPersist.test.ts ok");
