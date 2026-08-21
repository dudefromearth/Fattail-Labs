/**
 * AT-WF4 isolated spike vs coherent region · AT-WF7 sticky
 *   npx --yes tsx lib/options-lab/templates/widthFit.stability.test.ts
 */
import type { GridCell, WidthFitComponents } from "./types";
import {
  assignWidthFitColors,
  DEFAULT_WIDTH_FIT_WEIGHTS,
  widthFitFill,
} from "./widthFit";
import { updateStickyScale } from "./color";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

function cell(raw: number, extras: Partial<WidthFitComponents> = {}): GridCell {
  const components: WidthFitComponents = {
    debit_efficiency: raw,
    payoff_efficiency: raw,
    gamma_efficiency: raw,
    curvature_efficiency: raw,
    theta_efficiency: raw,
    surface_responsiveness: raw,
    call_put_asymmetry: raw,
    ...extras,
  };
  return {
    display: null,
    value: null,
    colorT: null,
    valid: true,
    components,
    qualityFlag: "good",
  };
}

function invalid(): GridCell {
  return {
    display: "—",
    value: null,
    colorT: null,
    valid: false,
    qualityFlag: "invalid",
  };
}

// One column, 7 centers. Coherent high band at rows 1–3; isolated spike at row 6.
{
  const grid: GridCell[][] = [
    [cell(0.2)],
    [cell(0.82)],
    [cell(0.84)],
    [cell(0.83)],
    [cell(0.22)],
    [cell(0.21)],
    [cell(0.95)],
  ];
  assignWidthFitColors(grid, {
    valueMode: "width_fit",
    widthMode: "fixed_points",
    widthFitWeights: DEFAULT_WIDTH_FIT_WEIGHTS,
    stabilityPenaltyStrength: 1,
  });
  const region = grid[2][0].value ?? 0;
  const spike = grid[6][0].value ?? 0;
  assert(region > 0, "region scored");
  assert(
    spike < region,
    `isolated spike ${spike} suppressed vs coherent ${region}`,
  );
  assert(!grid[6][0].widthFitOutline, "isolated spike no outline");
}

{
  const s0 = updateStickyScale(undefined, 1.0, 0.25);
  const s1 = updateStickyScale(s0, 1.1, 0.25);
  assert(s1 === s0, "ordinary move keeps sticky (AT-WF7)");
  const s2 = updateStickyScale(s0, 2.0, 0.25);
  assert(s2 === 2.0, "25% break updates sticky");
}

{
  const lo = widthFitFill(0);
  const hi = widthFitFill(1);
  assert(lo.startsWith("rgb("), "teal rgb");
  assert(hi.startsWith("rgb("), "amber rgb");
  assert(lo !== hi, "scale moves");
  assert(!lo.includes("239,68,68"), "not debit red");
}

void invalid;
console.log("widthFit.stability.test.ts ok");
