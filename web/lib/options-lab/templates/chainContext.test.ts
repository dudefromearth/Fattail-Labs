/**
 *   npx --yes tsx lib/options-lab/templates/chainContext.test.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chainContextFromLadder } from "./chainContext";
import {
  buildGexProfile,
  fmtGexAxis,
  gexHorizonExpiration,
  gexProfileScale,
  gexSidePeaks,
  gexValueToPlotY,
} from "./gex";
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
const peak = Math.max(
  ...pts.flatMap((p) => [p.call, p.put].filter((n): n is number => n != null).map(Math.abs)),
);
assert(scale === peak, `longest-bar scale ${scale} vs peak ${peak}`);

const p95Cutoff = gexProfileScale(
  Array.from({ length: 20 }, (_, i) => ({
    strike: i,
    label: String(i),
    isSpot: false,
    value: i === 19 ? 100 : 1,
    valid: true,
    call: i === 19 ? 100 : 1,
    put: 1,
  })),
  "gex_all",
);
assert(p95Cutoff === 100, `outlier is the scale, not p95 cutoff (${p95Cutoff})`);

const dual = gexSidePeaks([
  {
    strike: 1,
    label: "1",
    isSpot: false,
    value: 8,
    valid: true,
    call: 10,
    put: -4,
  },
  {
    strike: 2,
    label: "2",
    isSpot: false,
    value: -3,
    valid: true,
    call: 2,
    put: -8,
  },
]);
assert(dual.call === 10, `call peak ${dual.call}`);
assert(dual.put === 8, `put peak ${dual.put}`);
assert(dual.hasCall && dual.hasPut, "both sides");

assert(gexValueToPlotY(0, 100, 40, 200) === 140, "GEX 0 at mid");
assert(gexValueToPlotY(100, 100, 40, 200) === 40, "call peak at plot top");
assert(gexValueToPlotY(-100, 100, 40, 200) === 240, "put peak at plot bottom");
assert(fmtGexAxis(0) === "0", "axis zero");
assert(fmtGexAxis(-2.5e9).startsWith("−"), `neg axis ${fmtGexAxis(-2.5e9)}`);

assert(
  gexHorizonExpiration({
    tradeExpiration: null,
    rangeHorizon: "2026-12-18",
    listedExpirations: ["2026-09-18", "2026-12-18"],
  }) === "2026-12-18",
  "empty book uses Range / listed horizon",
);
assert(
  gexHorizonExpiration({
    tradeExpiration: "2026-09-18",
    rangeHorizon: "2026-12-18",
    listedExpirations: ["2026-09-18", "2026-12-18"],
  }) === "2026-09-18",
  "shown card exp wins",
);
assert(
  gexHorizonExpiration({
    listedExpirations: ["2026-09-18"],
  }) === "2026-09-18",
  "first listed when no card and no Range",
);
assert(
  gexHorizonExpiration({}) === "",
  "no listed calendar yet",
);

{
  const here = dirname(fileURLToPath(import.meta.url));
  const az = readFileSync(
    join(here, "../../../components/options-lab/OpfRiskAnalyzer.tsx"),
    "utf8",
  );
  assert(az.includes("gexHorizonExpiration"), "Analyzer GEX uses listed horizon");
  assert(
    !az.includes('const exp = (trade?.expiration || "").slice(0, 10)'),
    "GEX must not require a shown position expiration",
  );
}

console.log("chainContext GEX 10 tests passed");
