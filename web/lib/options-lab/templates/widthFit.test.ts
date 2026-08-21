/**
 * Width Fit AT-WF2 / AT-WF3 / AT-WF5 / AT-WF6 / AT-WF10 / AT-WF11 / AT-WF12
 *   npx --yes tsx lib/options-lab/templates/widthFit.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { contractKey, type LadderRow } from "@/lib/chainLadderApi";
import { HEATMAP_TEMPLATES } from "./registry";
import { buildGrid, HEATMAP_FLY_WIDTHS, symFlyTemplate } from "./symFly";
import { WIDTH_FIT_TEMPLATE_ID, widthFitTemplate } from "./widthFitTemplate";
import {
  assignWidthFitColors,
  attachFooterWidths,
  clampStabilityPenalty,
  DEFAULT_MIN_VALID_N,
  DEFAULT_WIDTH_FIT_WEIGHTS,
  STABILITY_PENALTY_FLOOR,
  widthFitComputeCell,
  widthFitLegsListed,
  widthFitSurfaceState,
} from "./widthFit";
import type { ChainContext, GridCell, TemplateParams } from "./types";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function row(
  side: "call" | "put",
  strike: number,
  mid: number,
  extra: Partial<LadderRow> = {},
): LadderRow {
  return {
    strike,
    side,
    mid,
    bid: mid - 0.05,
    ask: mid + 0.05,
    delta: 0.5 - (strike - 100) * 0.02,
    gamma: Math.max(0.01, 0.08 - Math.abs(strike - 100) * 0.003),
    theta: -0.05 - Math.abs(strike - 100) * 0.001,
    ...extra,
  };
}

/** Long fly with positive debit: wings richer than 2× body. */
function makeRich(step = 5): ChainContext {
  const contracts = new Map<string, LadderRow>();
  for (const side of ["call", "put"] as const) {
    for (let k = 70; k <= 130; k += step) {
      const dist = Math.abs(k - 100);
      const mid = Math.max(0.15, 2.5 + dist * 0.35);
      contracts.set(contractKey(side, k), row(side, k, mid));
    }
  }
  return {
    symbol: "SPX",
    viewSide: "call",
    spot: 100,
    strikeStep: step,
    wings: 50,
    contracts,
    asOf: "2026-08-21T15:00:00.000Z",
    contentHash: "wf1",
  };
}

const rich = makeRich();
const params: TemplateParams = {
  valueMode: "width_fit",
  widthMode: "fixed_points",
  fixedPoints: [...HEATMAP_FLY_WIDTHS],
};

{
  const dOk = widthFitLegsListed(rich, 100, 10);
  assert(dOk, "listed 90/100/110");
  const cell = widthFitComputeCell(
    rich,
    { strike: 100, label: "100" },
    { id: "w10", label: "10", widthPts: 10 },
    { ...params, flyRowStrikes: [110, 105, 100, 95, 90], flyRowIndex: 2 },
  );
  assert(cell.valid, "positive debit cell valid");
  assert(cell.display == null, "no numbers by default");
  assert(cell.value == null, "composite not in computeCell");
  assert(cell.components?.payoff_efficiency != null, "r2r alias present");
  assert(cell.qualityFlag === "good", "quality good");
}

// AT-WF2 missing wing
{
  const cell = widthFitComputeCell(
    rich,
    { strike: 100, label: "100" },
    { id: "w50", label: "50", widthPts: 50 },
    params,
  );
  // 50–100–150; 150 not listed
  assert(!cell.valid, "unlisted K+w invalid");
  assert(cell.display === "—", "invalid paints —");
}

// AT-WF11 negative debit
{
  const cheap = makeRich();
  for (const side of ["call", "put"] as const) {
    cheap.contracts.get(contractKey(side, 90))!.mid = 1;
    cheap.contracts.get(contractKey(side, 100))!.mid = 10;
    cheap.contracts.get(contractKey(side, 110))!.mid = 1;
  }
  const cell = widthFitComputeCell(
    cheap,
    { strike: 100, label: "100" },
    { id: "w10", label: "10", widthPts: 10 },
    params,
  );
  assert(!cell.valid, "negative debit invalid (same as r2r §5.2.1)");
}

// AT-WF11 crossed
{
  const x = makeRich();
  const body = x.contracts.get(contractKey("call", 100))!;
  body.bid = 5;
  body.ask = 1;
  const cell = widthFitComputeCell(
    x,
    { strike: 100, label: "100" },
    { id: "w10", label: "10", widthPts: 10 },
    { ...params, flyRowStrikes: [110, 105, 100, 95, 90], flyRowIndex: 2 },
  );
  assert(!cell.valid, "crossed market invalid");
}

// AT-WF11 null greek → component null, cell may still be valid on debit
{
  const g = makeRich();
  g.contracts.get(contractKey("call", 100))!.gamma = null;
  const cell = widthFitComputeCell(
    g,
    { strike: 100, label: "100" },
    { id: "w10", label: "10", widthPts: 10 },
    { ...params, flyRowStrikes: [110, 105, 100, 95, 90], flyRowIndex: 2 },
  );
  assert(cell.valid, "debit-valid cell stays valid");
  assert(cell.components?.gamma_efficiency == null, "null gamma → no gamma_eff");
}

assert(
  clampStabilityPenalty(0) === STABILITY_PENALTY_FLOOR,
  "OD-W6 floor",
);
assert(
  Math.abs(
    Object.values(DEFAULT_WIDTH_FIT_WEIGHTS).reduce((a, b) => a + b, 0) - 1,
  ) < 1e-9,
  "1/7 sums to 1",
);

{
  const g = buildGrid(symFlyTemplate, rich, params);
  const footer = attachFooterWidths(
    assignWidthFitColors(g.cells, params).footer,
    g.cols,
  );
  // AT-WF3: wider columns fewer valid n
  const n10 = footer.find((f) => f.widthPts === 10)?.n ?? 0;
  const n40 = footer.find((f) => f.widthPts === 40)?.n ?? 0;
  assert(n10 > 0, "n at 10");
  assert(n40 <= n10, `wider n ${n40} <= ${n10}`);
  // AT-WF6 usable
  const state = widthFitSurfaceState(footer);
  assert(state !== "no_reliable_fit" || n10 > 0, "surface produces cells");
  // AT-WF10 low n
  const tiny = assignWidthFitColors(g.cells, {
    ...params,
    minValidN: 10_000,
  }).footer;
  assert(
    tiny.every((f) => f.n === 0 || f.lowConfidence),
    "min_valid_n flags low confidence",
  );
  assert(DEFAULT_MIN_VALID_N === 5, "JR2");
}

// AT-WF5 / AT-WF12 weights change score without new chain
{
  const g1 = buildGrid(symFlyTemplate, rich, params);
  const a = assignWidthFitColors(g1.cells, params);
  const g2 = buildGrid(symFlyTemplate, rich, params);
  const tilt = {
    ...DEFAULT_WIDTH_FIT_WEIGHTS,
    gamma_efficiency: 4,
    debit_efficiency: 0.1,
  };
  const b = assignWidthFitColors(g2.cells, {
    ...params,
    widthFitWeights: tilt,
  });
  const fa = attachFooterWidths(a.footer, g1.cols);
  const fb = attachFooterWidths(b.footer, g2.cols);
  const changed = fa.some((x, i) => {
    const y = fb[i];
    if (x.median == null || y.median == null) return x.n !== y.n;
    return Math.abs(x.median - y.median) > 1e-9;
  });
  assert(changed, "weight change moves footer aggregates");
}

// Debit default unchanged
assert(symFlyTemplate.defaultValueMode === "debit", "JR6 Debit default");
assert(
  !symFlyTemplate.valueModes.some((m) => m.id === "width_fit"),
  "Width Fit is not an Advanced Fly Value mode",
);
assert(
  HEATMAP_TEMPLATES.some((t) => t.id === WIDTH_FIT_TEMPLATE_ID),
  "Width Fit is a Heatmap template",
);
assert(widthFitTemplate.label === "Width Fit", "template label");

// Existing debit still computes
{
  const g = buildGrid(symFlyTemplate, rich, {
    valueMode: "debit",
    widthMode: "fixed_points",
    fixedPoints: [10],
  });
  const mid = g.rows.findIndex((r) => r.strike === 100);
  assert(g.cells[mid]?.[0]?.valid, "debit mode still valid");
  assert(typeof g.cells[mid][0].display === "string", "debit still shows number");
}

{
  const here = dirname(fileURLToPath(import.meta.url));
  const panel = readFileSync(
    join(here, "../../../components/options-lab/HeatmapChainPanel.tsx"),
    "utf8",
  );
  assert(!/massive|fetchMassive/i.test(panel), "AT-WF1 no Massive in panel");
  assert(panel.includes("widthFitWeights"), "weights live in templateParams");
  assert(panel.includes("isWidthFitTemplate"), "Width Fit is a template");
}

console.log("widthFit.test.ts ok");
