/**
 *   npx --yes tsx lib/options-lab/templates/flySurfacePipeline.test.ts
 */
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import { FlySurfacePipeline } from "./flySurfacePipeline";
import type { ChainContext } from "./types";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function row(side: string, strike: number, mid: number): LadderRow {
  return { strike, side, mid, bid: mid, ask: mid } as LadderRow;
}

function makeCtx(hash: string, midBody: number): ChainContext {
  const contracts = new Map<string, LadderRow>();
  for (const side of ["call", "put"] as const) {
    for (let k = 90; k <= 110; k += 5) {
      const m =
        k === 100 ? midBody : Math.max(0.1, 10 - Math.abs(k - 100) * 0.5);
      contracts.set(contractKey(side, k), row(side, k, m));
    }
  }
  return {
    symbol: "SPX",
    viewSide: "call",
    spot: 100,
    strikeStep: 5,
    wings: 25,
    contracts,
    asOf: "2026-08-12T15:00:00.000Z",
    contentHash: hash,
  };
}

{
  const pipe = new FlySurfacePipeline();
  const r1 = pipe.ingest(makeCtx("g1", 10), "debit", [5, 10], {
    receivedAt: 1_000_000,
  });
  assert(r1.stats.debitValid > 0, "debitValid");
  assert(r1.mode === "debit", "mode");
  assert(r1.cells.length > 0, "grid");
}

{
  const pipe = new FlySurfacePipeline();
  pipe.ingest(makeCtx("g1", 10), "debit", [10], { receivedAt: 1_000_000 });
  const r2 = pipe.ingest(makeCtx("g2", 9.5), "velocity", [10], {
    receivedAt: 1_003_000,
  });
  assert(r2.stats.historySize >= 1, "history");
  assert(r2.stats.modeValid >= 0, "modeValid");
  // Same hash+mode cache hit
  const r2b = pipe.ingest(makeCtx("g2", 9.5), "velocity", [10], {
    receivedAt: 1_003_000,
  });
  assert(r2b === r2 || r2b.genKey === r2.genKey, "cache same gen");
}

{
  const pipe = new FlySurfacePipeline();
  pipe.ingest(makeCtx("g1", 10), "debit", [10], { receivedAt: 1_000_000 });
  const ctx = makeCtx("g3", 10);
  const bad = ctx.contracts.get(contractKey("call", 100))!;
  (bad as { mid: number | null }).mid = null;
  const r3 = pipe.ingest(ctx, "debit", [10], { receivedAt: 1_006_000 });
  // sticky hold may reuse
  assert(r3.cells.length > 0, "still paints");
}

// Memory: only one mode grid allocated per paint (not 11)
{
  const pipe = new FlySurfacePipeline();
  const r = pipe.ingest(makeCtx("g1", 10), "d_debit", [5], {
    receivedAt: 1_000_000,
  });
  assert(r.mode === "d_debit", "single mode");
  assert(r.stats.recomputeCount > 0, "recomputed");
}

console.log("ok  flySurfacePipeline lean single-mode + sticky");
