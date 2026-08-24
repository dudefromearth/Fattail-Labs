/**
 *   npx --yes tsx lib/options-lab/widthFitRanking.test.ts
 */
import {
  confidenceLabel,
  rankWidths,
  score100,
  stretchDisplayScores,
} from "./widthFitRanking";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

assert(score100(0.92) === 92, "unit interval");
assert(score100(1.2) === 100, "clamp");
assert(score100(null) == null, "null");

const ranked = rankWidths({
  widthPts: [10, 20, 25],
  median: [0.4, 0.92, 0.70],
  n: [8, 8, 8],
  stability: [0.7, 0.8, 0.75],
});
assert(ranked[0].widthPts === 20, "lead 20");
assert(ranked[0].median === 0.92, "raw median");
assert(ranked[0].score === 100, "display top of stretch");
assert(ranked[1].widthPts === 25, "runner 25");
assert(confidenceLabel(ranked, 5) === "High", "high sep on raw median");

const tight = stretchDisplayScores([0.88, 0.87, 0.86]);
assert(tight[0] === 100, "tight high");
assert(tight[2] === 20, "tight floor");
assert((tight[0] ?? 0) - (tight[1] ?? 0) >= 10, "readable gap");

const tied = stretchDisplayScores([0.9, 0.9]);
assert(tied[0] === 100 && tied[1] === 100, "true ties stay tied");

console.log("ok  widthFitRanking");
