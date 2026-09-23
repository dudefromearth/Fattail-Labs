/**
 *   npx --yes tsx lib/options-lab/termMassChainKey.test.ts
 */
import { termMassExpFromChainKey } from "./termMassChainKey";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

assert(
  termMassExpFromChainKey("chain:SPX:2026-09-23:w50", "SPX", 50) ===
    "2026-09-23",
  "dual key",
);
assert(
  termMassExpFromChainKey("chain:SPY:2026-09-24:w25", "SPY", 25) ===
    "2026-09-24",
  "spy",
);
assert(
  termMassExpFromChainKey("chain:SPX:2026-09-23:w50", "SPY", 50) == null,
  "wrong symbol",
);
assert(
  termMassExpFromChainKey("chain:SPX:2026-09-23:w40", "SPX", 50) == null,
  "wrong wings",
);

console.log("ok  termMassChainKey");
