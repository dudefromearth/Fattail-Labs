/**
 *   npx --yes tsx lib/options-lab/heatmapTip.test.ts
 */

import {
  flyStructure,
  fmtIvPct,
  heatmapGexTip,
  heatmapMatrixTip,
  miniExpirationPayoff,
  peerScore10,
  toneForMode,
} from "./heatmapTip";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

let n = 0;
function test(name: string, fn: () => void) {
  fn();
  n += 1;
  console.log(`  ok  ${name}`);
}

console.log("heatmapTip");

test("peer score 1–10 ranks convexity in the column", () => {
  assert(peerScore10(1, [1, 2, 3, 4, 5]) === 1, "lowest");
  assert(peerScore10(5, [1, 2, 3, 4, 5]) === 10, "highest");
  assert(peerScore10(3, [1, 2, 3, 4, 5]) === 6, "mid");
  assert(peerScore10(1, [1]) == null, "need peers");
});

test("fly structure is body ± width", () => {
  assert(flyStructure(5740, 20) === "5720 / 5740 / 5760", "20-wide");
});

test("debit tile is labeled and amber-toned", () => {
  const t = heatmapMatrixTip({
    templateId: "sym-fly",
    templateLabel: "Advanced flies",
    mode: "debit",
    modeLabel: "Long/Debit",
    strike: 5740,
    strikeLabel: "5740",
    widthPts: 20,
    widthLabel: "20",
    tileFace: "2.05",
    tileAlt: "2.05",
    cellValid: true,
    cellValue: 2.05,
  });
  assert(t.title === "Long/Debit", "title");
  assert(t.structure === "5720 / 5740 / 5760", "structure");
  assert(t.rows[0]?.value === "2.05", "value");
  assert(t.rows[0]?.tone === "debit", "debit tone");
  assert(t.hint?.includes("Click copies ToS") === true, "hint");
});

test("invalid tile shows the reason, not a fake value", () => {
  const t = heatmapMatrixTip({
    templateId: "sym-fly",
    templateLabel: "Advanced flies",
    mode: "debit",
    modeLabel: "Long/Debit",
    strike: 5740,
    strikeLabel: "5740",
    widthPts: 20,
    widthLabel: "20",
    tileFace: "—",
    tileAlt: "—",
    cellValid: false,
    cellValue: null,
    cellTooltip: "Missing listed wing or null mid",
  });
  assert(t.rows.length === 0, "no fake value");
  assert(t.note === "Missing listed wing or null mid", "note");
});

test("credit and signed greeks get color", () => {
  assert(toneForMode("credit", 1.2) === "credit", "credit");
  assert(toneForMode("d_debit", -0.4) === "neg", "short delta");
  assert(toneForMode("gex_call", 1) === "call", "call");
});

test("mini tent peaks at the body for a long 20-wide fly", () => {
  const { points, maxProfit, maxLoss } = miniExpirationPayoff({
    legs: [
      { strike: 5720, quantity: 1, right: "call" },
      { strike: 5740, quantity: -2, right: "call" },
      { strike: 5760, quantity: 1, right: "call" },
    ],
    debit: 2,
  });
  assert(points.length > 8, "has a curve");
  const atBody = points.reduce((b, p) =>
    Math.abs(p.x - 5740) < Math.abs(b.x - 5740) ? p : b,
  );
  const atWing = points.reduce((b, p) =>
    Math.abs(p.x - 5720) < Math.abs(b.x - 5720) ? p : b,
  );
  assert(atBody.y > atWing.y, "body above wing");
  assert(maxProfit > maxLoss, "range");
});

test("IV decimal formats as percent", () => {
  assert(fmtIvPct(0.127) === "12.7%", "decimal");
  assert(fmtIvPct(null) === "—", "null");
});

test("GEX combined rows are Call / Put / Net", () => {
  const t = heatmapGexTip({
    strikeLabel: "5740",
    combined: true,
    call: 1.2,
    put: 0.8,
    net: 0.4,
    callLabel: "1.20",
    putLabel: "0.80",
    netLabel: "0.40",
  });
  assert(t.rows.map((r) => r.label).join("/") === "Call/Put/Net", "labels");
  assert(t.rows[0].tone === "call", "call tone");
  assert(t.rows[1].tone === "put", "put tone");
  assert(t.rows[2].tone === "pos", "net pos");
});

console.log(`\n${n} tests passed`);
