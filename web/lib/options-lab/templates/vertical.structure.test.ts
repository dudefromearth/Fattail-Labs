/**
 * Vertical heatmap orientation (HM §5.3).
 *   npx --yes tsx lib/options-lab/templates/vertical.structure.test.ts
 */
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import { verticalFarStrike, verticalPackage } from "./pricing";
import { verticalTemplate } from "./vertical";
import { buildGrid } from "./symFly";
import type { ChainContext } from "./types";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function row(side: "call" | "put", strike: number, mid: number): LadderRow {
  return { strike, side, mid, bid: mid, ask: mid } as LadderRow;
}

function ctx(side: "call" | "put"): ChainContext {
  const contracts = new Map<string, LadderRow>();
  for (const s of ["call", "put"] as const) {
    contracts.set(contractKey(s, 90), row(s, 90, s === "put" ? 2 : 10));
    contracts.set(contractKey(s, 100), row(s, 100, 6));
    contracts.set(contractKey(s, 110), row(s, 110, s === "call" ? 2 : 10));
  }
  return {
    symbol: "SPX",
    viewSide: side,
    spot: 100,
    strikeStep: 10,
    wings: 25,
    contracts,
    asOf: "2026-08-18T15:00:00.000Z",
    contentHash: "v1",
  };
}

assert(verticalFarStrike("call", 100, 10) === 110, "call far is up");
assert(verticalFarStrike("put", 100, 10) === 90, "put far is down");

{
  const c = ctx("call");
  const long = verticalPackage(c, 100, 10, "long");
  const short = verticalPackage(c, 100, 10, "short");
  assert(long === 4, `call long 6−2 = 4 got ${long}`);
  assert(short === -4, `call short is flip got ${short}`);
}

{
  const p = ctx("put");
  const long = verticalPackage(p, 100, 10, "long");
  assert(long === 4, `put long 6−2 = 4 got ${long}`);
}

assert(verticalTemplate.label === "Verticals", "label");
assert(verticalTemplate.valueModes[0]?.label === "Debit", "debit");
assert(verticalTemplate.valueModes[1]?.label === "Credit", "credit");

{
  const g = buildGrid(verticalTemplate, ctx("call"), {
    valueMode: "debit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(g.cells[mid]?.[0]?.valid, "call debit cell");
  assert(g.cells[mid][0].value === 4, `display value ${g.cells[mid][0].value}`);
  const cr = buildGrid(verticalTemplate, ctx("call"), {
    valueMode: "credit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const mid2 = cr.rows.findIndex((r) => r.strike === 100);
  assert(cr.cells[mid2][0].value === -4, "short is −long");
  const missing = buildGrid(verticalTemplate, ctx("call"), {
    valueMode: "debit",
    widthMode: "fixed_points",
    fixedPoints: [25],
  });
  const mid3 = missing.rows.findIndex((r) => r.strike === 100);
  assert(!missing.cells[mid3][0].valid, "unlisted width is invalid (no snap)");
}

assert(verticalTemplate.valueModes[2]?.label === "% Change", "% change");
assert(verticalTemplate.valueModes[3]?.label === "R:R", "R:R");

{
  const g = buildGrid(verticalTemplate, ctx("call"), {
    valueMode: "r2r",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(g.cells[mid][0].valid, "R:R valid");
  assert(Math.abs((g.cells[mid][0].value ?? 0) - (10 - 4) / 4) < 1e-9, "R:R (w−D)/D");
}

{
  const g = buildGrid(verticalTemplate, ctx("call"), {
    valueMode: "pct_change",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(g.cells[mid][0].display === "0.0%", `spot % ${g.cells[mid][0].display}`);
  assert((g.cells[mid][0].value ?? -1) >= 0, "% change not negative");
}

{
  const g = buildGrid(verticalTemplate, ctx("call"), {
    valueMode: "r2r",
    verticalKind: "credit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(g.cells[mid][0].valid, "credit R:R valid");
  assert(
    Math.abs((g.cells[mid][0].value ?? 0) - 4 / 6) < 1e-9,
    "credit R:R C/(w−C)",
  );
}

{
  const g = buildGrid(verticalTemplate, ctx("call"), {
    valueMode: "pct_change",
    verticalKind: "credit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(g.cells[mid][0].display === "0.0%", `credit % spot ${g.cells[mid][0].display}`);
}

console.log("ok  vertical Debit/Credit call up · put down · Type on package");
