/**
 *   npx --yes tsx lib/options-lab/algoNarrative.test.ts
 */
import { algoNarrativeLines } from "./algoNarrative";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const near = algoNarrativeLines({
  phase: "armed",
  side: "near",
  symbol: "SPX",
  fPct: 60,
  xS: 6080,
  gexOn: false,
  vpOn: false,
  decayFast: false,
});
assert(
  near.some((l) => l.includes("armed")),
  "near armed",
);
assert(
  !near.some((l) => /GEX|Volume profile/i.test(l)),
  "omit GEX/VP when off",
);

const far = algoNarrativeLines({
  phase: "armed",
  side: "far",
  symbol: "SPX",
  fPct: 40,
  xS: 6120,
  gexOn: true,
  vpOn: false,
  decayFast: true,
});
assert(
  far.some((l) => /through the body/i.test(l)),
  "far names side",
);
assert(
  far.some((l) => /outrun the structure/i.test(l)),
  "far decay copy ≠ near",
);
assert(far.some((l) => /GEX/i.test(l)), "GEX on");
assert(!far.some((l) => /Volume profile/i.test(l)), "VP off omitted");

console.log("algoNarrative ok");
