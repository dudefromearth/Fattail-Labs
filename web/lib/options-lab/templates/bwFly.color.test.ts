/**
 * Broken-wing color: negative package (common above spot) is not black.
 *   npx --yes tsx lib/options-lab/templates/bwFly.color.test.ts
 */
import { NULL_CELL_COLOR } from "./color";
import { bwFlyTemplate } from "./bwFly";
import type { GridCell, TemplateParams } from "./types";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

const params: TemplateParams = {
  valueMode: "debit",
  widthMode: "fixed_points",
  fixedPoints: [10],
};

{
  const grid: GridCell[][] = [
    [{ display: "-1.20", value: -1.2, valid: true, colorT: null }],
    [{ display: "0.80", value: 0.8, valid: true, colorT: null }],
  ];
  bwFlyTemplate.assignColors(grid, params);
  assert(
    grid[0][0].bgCss != null && grid[0][0].bgCss !== NULL_CELL_COLOR,
    `credit-like BWB above spot must not be black, got ${grid[0][0].bgCss}`,
  );
  assert(
    grid[1][0].bgCss != null && grid[1][0].bgCss !== NULL_CELL_COLOR,
    `debit BWB must color, got ${grid[1][0].bgCss}`,
  );
}

console.log("ok  bwFly color paints |package| (negative is not empty)");
