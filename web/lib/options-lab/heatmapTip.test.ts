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

test("Width Fit hover names the color when the tile has no number", () => {
  const t = heatmapMatrixTip({
    templateId: "width-fit",
    templateLabel: "Width Fit",
    mode: "width_fit",
    modeLabel: "Width Fit",
    strike: 5740,
    strikeLabel: "5740",
    widthPts: 20,
    widthLabel: "20",
    tileFace: "",
    tileAlt: "Width Fit",
    cellValid: true,
    cellValue: 0.72,
    widthFit: { colorT: 0.8, outline: true, stability: 0.7, detail: false },
  });
  assert(t.structure === "5720 / 5740 / 5760", "fly structure");
  const color = t.rows.find((r) => r.label === "Color");
  const meaning = t.rows.find((r) => r.label === "Meaning");
  assert(color?.value === "Amber", "amber");
  assert(meaning?.value.includes("Stronger fit"), "meaning");
  assert(t.note?.includes("Not a directional signal"), "not a signal");
});

test("Width Fit click adds component rows", () => {
  const t = heatmapMatrixTip({
    templateId: "width-fit",
    templateLabel: "Width Fit",
    mode: "width_fit",
    modeLabel: "Width Fit",
    strike: 5740,
    strikeLabel: "5740",
    widthPts: 20,
    widthLabel: "20",
    tileFace: "",
    tileAlt: "",
    cellValid: true,
    cellValue: 0.8,
    widthFit: {
      colorT: 0.8,
      detail: true,
      components: {
        debit_efficiency: 0.4,
        payoff_efficiency: 1.2,
        gamma_efficiency: 0.01,
        curvature_efficiency: 0.02,
        theta_efficiency: 0.5,
        surface_responsiveness: 0.3,
        call_put_asymmetry: 0.1,
      },
    },
  });
  assert(
    t.rows.some((r) => r.label === "gamma efficiency"),
    "components on click",
  );
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
