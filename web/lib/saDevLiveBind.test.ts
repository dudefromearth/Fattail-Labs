/**
 * Live-tab bind: payload date, not the clock.
 *
 *   npx --yes tsx lib/saDevLiveBind.test.ts
 */
import assert from "node:assert/strict";
import { resolveLiveBind } from "./saDevLiveBind";

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

test("developing payload on trading date stays developing", () => {
  const b = resolveLiveBind({
    tradingDate: "2026-09-18",
    ceilingSession: "2026-09-18",
    developing: {
      session_date: "2026-09-18",
      status: "COMPLETE",
      bin_count: 10,
    },
  });
  assert.equal(b.kind, "developing");
  assert.equal(b.label, "Developing — 09-18");
});

test("stale developing date falls back to closed session", () => {
  const b = resolveLiveBind({
    tradingDate: "2026-09-18",
    ceilingSession: "2026-09-17",
    developing: {
      session_date: "2026-09-17",
      status: "COMPLETE",
      bin_count: 433,
    },
  });
  assert.equal(b.kind, "session");
  assert.equal(b.sessionDate, "2026-09-17");
  assert.equal(b.label, "Session — 09-17 (closed)");
});

test("UNAVAILABLE developing with no ceiling is no coverage", () => {
  const b = resolveLiveBind({
    tradingDate: "2026-09-18",
    ceilingSession: null,
    developing: { named_state: "NO COVERAGE", status: "UNAVAILABLE" },
  });
  assert.equal(b.reason, "no-coverage");
  assert.equal(b.label, "No coverage");
});

console.log(`saDevLiveBind.test.ts ${n} ok`);
