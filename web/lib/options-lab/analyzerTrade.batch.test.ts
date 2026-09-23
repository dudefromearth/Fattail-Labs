/**
 *   npx --yes tsx lib/options-lab/analyzerTrade.batch.test.ts
 */
import { saveAnalyzerTradeBatch } from "./analyzerTrade";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

const a = "BUY +1 BUTTERFLY SPX CALL @1.25 LMT";
const b = "BUY +1 BUTTERFLY SPX PUT @1.40 LMT";
const items = saveAnalyzerTradeBatch([a, b], "heatmap");
assert(items.length === 2, "two items");
assert(items[0].raw === a && items[1].raw === b, "order preserved");
assert(items[0].savedAt + 1 === items[1].savedAt, "distinct savedAt");
assert(items.every((x) => x.source === "heatmap"), "source");

console.log("ok  analyzerTrade.batch");
