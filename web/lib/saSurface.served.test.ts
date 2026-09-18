/**
 *   npx --yes tsx lib/saSurface.served.test.ts
 */
import assert from "node:assert/strict";
import { servedFromHealth, targetForSource } from "./saSurface";

assert.deepEqual(servedFromHealth(null), []);
assert.deepEqual(
  servedFromHealth({
    coverage: {
      ES: { sessions_binned: 2, floor_session: "2026-09-17" },
      MES: { sessions_binned: 2, floor_session: "2026-09-17" },
      SPY: { sessions_binned: 0 },
    },
    collectors: { SPY: { live: true }, NQ: { live: false } },
  }).map((s) => s.source),
  ["ES", "MES", "SPY"],
);
assert.deepEqual(
  servedFromHealth({
    coverage: { CL: { sessions_binned: 1, floor_session: "2026-09-18" } },
  }).map((s) => s.id),
  ["CL"],
);
assert.equal(targetForSource("CL"), "CL");
assert.equal(targetForSource("NQ"), "NQ");
assert.equal(targetForSource("ES"), "SPX");
console.log("saSurface.served.test.ts ok");
