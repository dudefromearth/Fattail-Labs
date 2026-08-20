/**
 *   npx --yes tsx lib/options-lab/templates/chainContext.test.ts
 */

import { chainContextFromLadder } from "./chainContext";
import { buildGexProfile, gexProfileScale } from "./gex";
import { contractKey } from "@/lib/chainLadderApi";
import type { LadderFull } from "@/lib/chainLadderApi";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

const ladder: LadderFull = {
  underlier: "SPX",
  expiration: "2026-12-18",
  side: "both",
  dual_side: true,
  spot: 7700,
  wings: 50,
  strike_step: 5,
  fields: [],
  row_count: 4,
  content_hash: "h1",
  rows: [
    { strike: 7700, side: "call", gamma: 0.001, open_interest: 1000, is_spot: true },
    { strike: 7700, side: "put", gamma: 0.001, open_interest: 800, is_spot: true },
    { strike: 7710, side: "call", gamma: 0.0008, open_interest: 500 },
    { strike: 7710, side: "put", gamma: 0.0009, open_interest: 400 },
  ],
};

const ctx = chainContextFromLadder("SPX", ladder);
assert(ctx.contracts.has(contractKey("call", 7700)), "call 7700");
assert(ctx.spot === 7700, "spot");
const pts = buildGexProfile(ctx, "gex_all");
assert(pts.length === 2, `strikes ${pts.length}`);
assert(pts.some((p) => p.call != null && p.put != null), "dual sides");
const scale = gexProfileScale(pts, "gex_all");
assert(scale > 0, "scale");
console.log("chainContext GEX 2 tests passed");
