/**
 * Advanced Fly Wave‑1 structure freezes (Spec v0.2.1).
 *   npx --yes tsx lib/options-lab/templates/advancedFly.structure.test.ts
 */
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import { FLY_MAX_WIDTHS } from "./flySurfacePipeline";
import { buildGrid, heatmapFlyWidths, HEATMAP_FLY_WIDTHS, symFlyTemplate } from "./symFly";
import { rocSensitivityToThreshold } from "./color";
import {
  symFlyCpAsym,
  symFlyCredit,
  symFlyDebit,
  symFlyDebitPctFromSpot,
  symFlyGreek,
} from "./pricing";
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
  const t = (strike - 100) / 20;
  return {
    strike,
    side: side as "call" | "put",
    mid,
    bid: mid,
    ask: mid,
    delta: 0.5 - t * t * 0.2,
    gamma: 0.05 - Math.abs(strike - 100) * 0.002,
    theta: -0.04 + Math.abs(strike - 100) * 0.001,
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

// AT-AF16 Short/Credit is −1/+2/−1, not abs(D)+CR
{
  const c = symFlyCredit(ctx, 100, 10);
  // −m(90)+2m(100)−m(110) = −5+20−5 = +10 (short fly pays)
  assert(c != null && Math.abs(c - 10) < 1e-9, `short package C=${c}`);
  const params: TemplateParams = {
    valueMode: "credit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  };
  const g = buildGrid(symFlyTemplate, ctx, params);
  const cell = g.cells.find((r, i) => g.rows[i].strike === 100)?.[0];
  assert(cell?.valid, "credit valid");
  assert(cell?.value === 10, `short package +10 got ${cell?.value}`);
  assert(cell?.display === "10.00", `display ${cell?.display} (no fake CR chip)`);
}

// Typical long debit / short credit: wings richer than 2× body
{
  const rich = makeCtx();
  for (const side of ["call", "put"] as const) {
    rich.contracts.get(contractKey(side, 90))!.mid = 8;
    rich.contracts.get(contractKey(side, 100))!.mid = 3;
    rich.contracts.get(contractKey(side, 110))!.mid = 8;
  }
  const d = symFlyDebit(rich, 100, 10);
  const c = symFlyCredit(rich, 100, 10);
  assert(d != null && Math.abs(d - 10) < 1e-9, `long +1/−2/+1 D=${d}`);
  assert(c != null && Math.abs(c - -10) < 1e-9, `short −1/+2/−1 C=${c}`);
  const g = buildGrid(symFlyTemplate, rich, {
    valueMode: "credit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const cell = g.cells.find((r, i) => g.rows[i].strike === 100)?.[0];
  assert(cell?.display === "-10.00", `short credit display ${cell?.display}`);
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

// Time: 0.3s tick valid velocity invalid; after push(live) lag still prior
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
  assert(hist.velocityDelta(live, "call", 100, 10) == null, "velocity null at 0.3s");
  // Archive live gen — lag must still resolve to "a"
  hist.push(live);
  const tick2 = hist.tickDelta(live, "call", 100, 10);
  assert(tick2 != null && Math.abs(tick2.dD - 0.5) < 1e-9, "post-push lag still A");
}
// Velocity at 3s after prior gen archived
{
  const hist = new FlySurfaceHistory(8);
  const k = cellKey("call", 100, 10);
  hist.push({
    asOf: null,
    contentHash: "a",
    receivedAt: 1_000_000,
    cells: new Map([[k, 2]]),
  });
  const live: DebitGridSnap = {
    asOf: null,
    contentHash: "b",
    receivedAt: 1_003_000,
    cells: new Map([[k, 2.5]]),
  };
  hist.push(live);
  const vel = hist.velocityDelta(live, "call", 100, 10);
  assert(vel != null && Math.abs(vel.dD - 0.5) < 1e-9, "velocity after push");
}

// Label
assert(symFlyTemplate.label === "Advanced flies", "label");
assert(symFlyTemplate.id === "sym-fly", "id keep");
assert(symFlyTemplate.defaultValueMode === "debit", "default debit");
assert(symFlyTemplate.valueModes[0]?.label === "Long/Debit", "long label");
assert(symFlyTemplate.valueModes[1]?.label === "Short/Credit", "short label");
assert(symFlyTemplate.valueModes[2]?.label === "% Change (debit)", "% change label");
assert(symFlyTemplate.valueModes[3]?.label === "Risk to Reward", "R:R label");
assert(symFlyTemplate.valueModes[4]?.label === "Delta", "delta label");
assert(symFlyTemplate.valueModes[5]?.label === "Gamma", "gamma label");
assert(symFlyTemplate.valueModes[6]?.label === "Theta", "theta label");

{
  const del = symFlyGreek(ctx, 100, 10, "delta");
  const gam = symFlyGreek(ctx, 100, 10, "gamma");
  const th = symFlyGreek(ctx, 100, 10, "theta");
  // 90: Δ0.45 Γ0.03 θ−0.03 · 100: Δ0.50 Γ0.05 θ−0.04 · 110: Δ0.45 Γ0.03 θ−0.03
  assert(del != null && Math.abs(del - -0.1) < 1e-9, `fly Δ ${del}`);
  assert(gam != null && Math.abs(gam - -0.04) < 1e-9, `fly Γ ${gam}`);
  assert(th != null && Math.abs(th - 0.02) < 1e-9, `fly θ ${th}`);
}

{
  const centers = [110, 105, 100, 95, 90];
  const atSpot = symFlyDebitPctFromSpot(ctx, centers, 2, 5);
  const up = symFlyDebitPctFromSpot(ctx, centers, 1, 5);
  const dn = symFlyDebitPctFromSpot(ctx, centers, 3, 5);
  assert(atSpot === 0, `spot % is 0 got ${atSpot}`);
  // inner D(100,5)=−5, outer D(105,5)=0 → ((−5−0)/(−5))*100 = 100
  assert(up != null && Math.abs(up - 100) < 1e-6, `up from spot ${up}`);
  assert(dn != null && Math.abs(dn - 100) < 1e-6, `down from spot ${dn}`);
  assert(up >= 0 && dn >= 0, "% change is never negative");
  const g = buildGrid(symFlyTemplate, ctx, {
    valueMode: "pct_change",
    widthMode: "fixed_points",
    fixedPoints: [5],
  });
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(g.cells[mid]?.[0]?.display === "0.0%", `spot cell ${g.cells[mid]?.[0]?.display}`);
}

{
  const w = heatmapFlyWidths();
  assert(w.join(",") === [...HEATMAP_FLY_WIDTHS].join(","), "10…50 by 5");
  assert(w[0] === 10 && w[w.length - 1] === 50, "start 10 end 50");
  assert(
    FLY_MAX_WIDTHS >= HEATMAP_FLY_WIDTHS.length,
    "pipeline must not drop the 50-wide column",
  );
  assert(heatmapFlyWidths(5, 8).join(",") === w.join(","), "not step-multiples from 5");
  assert(rocSensitivityToThreshold(0) === 150, "− end is calm");
  assert(rocSensitivityToThreshold(50) === 50, "center is default threshold");
  assert(rocSensitivityToThreshold(100) === 5, "+ end is hot");
}

console.log("ok  advancedFly structure AT-AF1/5/16 + history pair");
