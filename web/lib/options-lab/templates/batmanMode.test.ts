/**
 *   npx --yes tsx lib/options-lab/templates/batmanMode.test.ts
 */
import {
  additivePayoffCanvas,
  batmanReady,
  sharedBatmanRows,
  stagedFlyLabel,
  supportsBatman,
  type StagedFly,
} from "./batmanMode";

function assert(c: unknown, m: string) {
  if (!c) throw new Error(`FAIL: ${m}`);
}

assert(supportsBatman("sym-fly"), "AF");
assert(supportsBatman("bw-fly"), "BWB");
assert(!supportsBatman("vertical"), "not vertical");
assert(!supportsBatman("width-fit"), "not width-fit");

const call: StagedFly = {
  side: "call",
  body: 7750,
  widthPts: 25,
  script: "BUY +1 BUTTERFLY SPX 100 11 AUG 26 7725/7750/7775 CALL @1.25 LMT",
  debit: 1.25,
  structure: "7725/7750/7775 ×25",
  inspect: null,
};
const put: StagedFly = {
  side: "put",
  body: 7700,
  widthPts: 30,
  script: "BUY +1 BUTTERFLY SPX 100 11 AUG 26 7670/7700/7730 PUT @1.40 LMT",
  debit: 1.4,
  structure: "7670/7700/7730 ×30",
  inspect: null,
};

assert(!batmanReady(call, null), "one side not ready");
assert(batmanReady(call, put), "two sides ready");
assert(stagedFlyLabel(call).includes("Call"), "call label");
assert(stagedFlyLabel(call).includes("1.25"), "debit in label");
assert(call.script !== put.script, "two scripts");

const rows = sharedBatmanRows(
  [
    { strike: 7700, label: "7700" },
    { strike: 7780, label: "7780", isSpot: true },
    { strike: 7900, label: "7900" },
  ],
  [
    { strike: 7600, label: "7600" },
    { strike: 7780, label: "7780", isSpot: true },
    { strike: 7820, label: "7820" },
  ],
  7780,
);
assert(rows.some((r) => r.isSpot && r.strike === 7780), "atm marked");
assert(rows[0].strike < rows[rows.length - 1].strike, "L→R");
assert(rows.some((r) => r.strike === 7600), "put wing kept");
assert(rows.some((r) => r.strike === 7900), "call wing kept");

const canvas = additivePayoffCanvas(
  [
    { x: 7700, y: -100 },
    { x: 7780, y: 50 },
    { x: 7860, y: -100 },
  ],
  [
    { x: 7700, y: -80 },
    { x: 7780, y: 40 },
    { x: 7860, y: -80 },
  ],
  7780,
);
assert(canvas.sum.length > 2, "sum path");
const mid = canvas.sum[Math.floor(canvas.sum.length / 2)];
assert(Math.abs(mid.y - 90) < 1, `additive at spot ${mid.y}`);
assert(
  Math.abs((canvas.xMin + canvas.xMax) / 2 - 7780) < 0.01,
  "spot centered on canvas",
);

console.log("ok  batmanMode");
