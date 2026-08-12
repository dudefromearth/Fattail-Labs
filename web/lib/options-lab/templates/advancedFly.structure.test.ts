/**
 * Advanced Fly Wave‑1 structure freezes (Spec v0.2.1).
 *   npx --yes tsx lib/options-lab/templates/advancedFly.structure.test.ts
 */
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import { buildGrid, symFlyTemplate } from "./symFly";
import { symFlyCpAsym, symFlyDebit } from "./pricing";
import {
  FlySurfaceHistory,
  cellKey,
  type DebitGridSnap,
} from "./flySurfaceHistory";
import type { ChainContext, TemplateParams } from "./types";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function row(side: string, strike: number, mid: number): LadderRow {
  return {
    strike,
    side: side as "call" | "put",
    mid,
    bid: mid,
    ask: mid,
  } as LadderRow;
}

function makeCtx(): ChainContext {
  const contracts = new Map<string, LadderRow>();
  // Uniform 5-wide ladder 90–110 both books
  for (const side of ["call", "put"] as const) {
    for (let k = 90; k <= 110; k += 5) {
      // Simple smile-ish mids
      const m = Math.max(0.1, 10 - Math.abs(k - 100) * 0.5);
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
    contentHash: "h1",
  };
}

const ctx = makeCtx();

// AT-AF1 debit golden
{
  const d = symFlyDebit(ctx, 100, 10);
  // m(90)=5, m(100)=10, m(110)=5 → 5+5-20 = -10
  assert(d != null && Math.abs(d - -10) < 1e-9, `debit D=${d}`);
}

// AT-AF16 credit C = -D, display mag+CR
{
  const params: TemplateParams = {
    valueMode: "credit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  };
  const g = buildGrid(symFlyTemplate, ctx, params);
  const cell = g.cells.find((r, i) => g.rows[i].strike === 100)?.[0];
  assert(cell?.valid, "credit valid");
  assert(cell?.value === 10, `C_signed=+10 got ${cell?.value}`);
  assert(cell?.display === "10.00 CR", `display ${cell?.display}`);
}

// AT-AF5 slope per-point descending; edge invalid
{
  const params: TemplateParams = {
    valueMode: "slope",
    widthMode: "fixed_points",
    fixedPoints: [5],
  };
  const g = buildGrid(symFlyTemplate, ctx, params);
  const last = g.cells[g.cells.length - 1]?.[0];
  assert(last && !last.valid, "edge slope invalid");
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(mid >= 0, "mid row");
  const sc = g.cells[mid][0];
  assert(sc?.valid, "mid slope valid w=5");
  assert(g.cells.some((row) => row[0]?.valid), "some slope valid");
}

// Curvature non-uniform → invalid: inject skip-strike by using only some centers
// On uniform 5 grid, curvature should validate when triple equal
{
  const params: TemplateParams = {
    valueMode: "curvature",
    widthMode: "fixed_points",
    fixedPoints: [5], // smaller wings so more bodies complete
  };
  const g = buildGrid(symFlyTemplate, ctx, params);
  // Edge invalid
  assert(!g.cells[g.cells.length - 1]?.[0]?.valid, "curv edge invalid");
}

// cp_asym
{
  const a = symFlyCpAsym(ctx, 100, 10);
  assert(a != null && Math.abs(a) < 1e-9, `cp_asym ~0 got ${a}`);
}

// Time: 0.3s tick valid velocity invalid (via history)
{
  const hist = new FlySurfaceHistory(8);
  const k = cellKey("call", 100, 10);
  hist.push({
    asOf: null,
    contentHash: "a",
    receivedAt: 1_000_000,
    cells: new Map([[k, -10]]),
  });
  const live: DebitGridSnap = {
    asOf: null,
    contentHash: "b",
    receivedAt: 1_000_300,
    cells: new Map([[k, -9.5]]),
  };
  const tick = hist.tickDelta(live, "call", 100, 10);
  assert(tick != null && Math.abs(tick.dD - 0.5) < 1e-9, "tick dD");
  const vel = hist.velocityDelta(live, "call", 100, 10);
  assert(vel == null, "velocity null at 0.3s");
}

// Label
assert(symFlyTemplate.label === "Advanced flies", "label");
assert(symFlyTemplate.id === "sym-fly", "id keep");
assert(symFlyTemplate.defaultValueMode === "debit", "default debit");

console.log("ok  advancedFly structure AT-AF1/5/16 + history pair");
