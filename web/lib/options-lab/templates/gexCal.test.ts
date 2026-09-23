/**
 * Term Mass AT-GC1,2,4,5,8,9,10,13 — Hotel goldens GC0-2.
 *   npx --yes tsx lib/options-lab/templates/gexCal.test.ts
 */

import { contractKey, type LadderFull, type LadderRow } from "@/lib/chainLadderApi";
import { chainContextFromLadder } from "./chainContext";
import { gexNet } from "./pricing";
import {
  computeGexCal,
  fmtGexCalDollars,
  gexCalColorT,
  gexCalStickyScale,
  inspectPack,
  type GexCalBook,
  type GexCalPack,
} from "./gexCal";
import { gexTemplate } from "./gex";
import { HEATMAP_TEMPLATES, memberHeatmapTemplates } from "./registry";
import { buildGexProfile } from "./gex";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(`FAIL: ${msg}`);
}

function row(
  strike: number,
  side: "call" | "put",
  gamma: number | null,
  oi: number | null,
  extra?: Partial<LadderRow>,
): LadderRow {
  const r: LadderRow = { strike, side };
  if (gamma != null) r.gamma = gamma;
  if (oi != null) r.open_interest = oi;
  return { ...r, ...extra };
}

function book(
  expiration: string,
  rows: LadderRow[],
  spot = 100,
): GexCalBook {
  const ladder: LadderFull = {
    underlier: "SPY",
    expiration,
    side: "both",
    dual_side: true,
    spot,
    wings: 25,
    strike_step: 5,
    fields: [],
    row_count: rows.length,
    content_hash: `h-${expiration}`,
    rows,
  };
  return { expiration, ctx: chainContextFromLadder("SPY", ladder) };
}

const E1 = "2026-06-05";
const E2 = "2026-06-06";

const golden1Rows: LadderRow[] = [
  row(105, "call", 0.4, 20),
  row(105, "put", 0.1, 5),
  row(100, "call", 0.5, 10, { is_spot: true }),
  row(100, "put", 0.5, 10, { is_spot: true }),
  row(95, "call", 0.1, 5),
  row(95, "put", 0.4, 20),
];

const golden2E2Rows: LadderRow[] = [
  row(105, "call", 0.15, 10),
  row(105, "put", 0.05, 4),
  row(100, "call", 0.2, 10),
  row(100, "put", 0.2, 10),
  row(95, "call", 0.05, 4),
  row(95, "put", 0.15, 10),
];

function packOf(
  books: GexCalBook[],
  vis?: string[],
): GexCalPack {
  const map = new Map<string, GexCalBook>();
  for (const b of books) map.set(b.expiration, b);
  return {
    symbol: "SPY",
    wings: 25,
    spot: 100,
    visibleExpirations: vis ?? books.map((b) => b.expiration),
    books: map,
  };
}

// --- AT-GC1 ---
const p1 = packOf([book(E1, golden1Rows)]);
assert(inspectPack(p1) === "ok", "g1 inspect");
const r1 = computeGexCal(p1, "gex_net");
assert(r1.cols.length === 1, `g1 cols ${r1.cols.length}`);
assert(r1.cols[0].expiration === E1, "g1 col id");
const ctx1 = p1.books.get(E1)!.ctx;
for (const strike of [105, 100, 95]) {
  const cell = r1.cells.find((row) => row[0].strike === strike)![0];
  const frozen = gexNet(ctx1, strike);
  assert(cell.value === frozen, `AT-GC1 ${strike} ${cell.value} vs ${frozen}`);
}
assert(r1.cells.find((row) => row[0].strike === 105)![0].value === 75000, "g1 105");
assert(r1.cells.find((row) => row[0].strike === 100)![0].value === 0, "g1 100");
assert(r1.cells.find((row) => row[0].strike === 95)![0].value === -75000, "g1 95");
assert(r1.rows.find((row) => row.strike === 100)?.isSpot === true, "AT-GC3 spot");
{
  const live = computeGexCal({ ...p1, spot: 200 }, "gex_net");
  const cell = live.cells.find((row) => row[0].strike === 105)![0];
  assert(cell.value === 300000, `live S² uses pack.spot, got ${cell.value}`);
}
const prof1 = buildGexProfile(ctx1, "gex_net");
for (const pt of prof1) {
  const cell = r1.cells.find((row) => row[0].strike === pt.strike)![0];
  assert(cell.value === pt.value, `AT-GC1 frozen profile ${pt.strike}`);
}

// --- AT-GC2 ---
const p2 = packOf([book(E1, golden1Rows), book(E2, golden2E2Rows)]);
const r2 = computeGexCal(p2, "gex_net");
assert(r2.cols.length === 2, "g2 cols");
assert(r2.netFooter[0].value === 0, `NET E1 ${r2.netFooter[0].value}`);
assert(r2.netFooter[1].value === 0, `NET E2 ${r2.netFooter[1].value}`);
const bar105 = r2.profile.find((p) => p.strike === 105)!;
const bar95 = r2.profile.find((p) => p.strike === 95)!;
assert(bar105.value === 88000, `bar105 ${bar105.value}`);
assert(bar95.value === -88000, `bar95 ${bar95.value}`);
assert(r2.peakStrike === 95, `peak tie lowest ${r2.peakStrike}`);
const g2gold = r2.cells.flat().filter((c) => c.mark === "gold");
assert(g2gold.length === 1, "one gold cell");
assert(
  r2.cells.find((row) => row[0].strike === 105)![0].mark === "gold" ||
    r2.cells.find((row) => row[0].strike === 95)![0].mark === "gold",
  "gold is max |cell|",
);
const g2green = r2.cells.flat().filter((c) => c.mark === "green");
assert(g2green.every((c) => (c.value ?? 0) > 0), "green is column + peak");

// --- AT-GC4 sign colors ---
const tNeg = gexCalColorT(-75000, 75000);
const tPos = gexCalColorT(75000, 75000);
assert(tNeg < 0 && tPos > 0, "signs");
const tNeg2 = gexCalColorT(-75000, 150000);
assert(tNeg2 < 0, "scale change does not flip sign");
const sticky = gexCalStickyScale(r1, 75000);
assert(sticky === 75000, `sticky hold ${sticky}`);

// --- AT-GC5 / AT-GC10 missing put ---
const missingPut = golden1Rows.filter(
  (r) => !(r.strike === 105 && r.side === "put"),
);
const p3 = packOf([book(E1, missingPut)]);
const r3 = computeGexCal(p3, "gex_net");
const c105 = r3.cells.find((row) => row[0].strike === 105)![0];
assert(c105.valid === false, "AT-GC10 invalid");
assert(c105.display === null, "AT-GC5 blank");
assert(r3.netFooter[0].value === -75000, `NET omit ${r3.netFooter[0].value}`);

// --- AT-GC8 empty ---
const empty: GexCalPack = {
  symbol: "SPY",
  wings: 25,
  spot: 100,
  visibleExpirations: [],
  books: new Map(),
};
const r8 = computeGexCal(empty);
assert(r8.empty && r8.emptyReason === "empty", "AT-GC8");
assert(r8.cols.length === 0, "AT-GC8 no cols");

// --- AT-GC9 fake relabel ---
const one = book(E1, golden1Rows);
const fake: GexCalPack = {
  symbol: "SPY",
  wings: 25,
  spot: 100,
  visibleExpirations: [E1, E2],
  books: new Map([
    [E1, one],
    [E2, { expiration: E2, ctx: one.ctx }],
  ]),
};
assert(inspectPack(fake) === "fake", "AT-GC9 inspect");
const r9 = computeGexCal(fake);
assert(r9.empty && r9.emptyReason === "fake", "AT-GC9 refuse");

const mislabel: GexCalPack = {
  symbol: "SPY",
  wings: 25,
  spot: 100,
  visibleExpirations: [E2],
  books: new Map([[E2, { expiration: E1, ctx: one.ctx }]]),
};
assert(inspectPack(mislabel) === "fake", "AT-GC9 expiration mismatch");

// --- AT-GC13 ---
assert(fmtGexCalDollars(0) === "$0", "zero display");
assert(fmtGexCalDollars(75000) === "$75K", `75k ${fmtGexCalDollars(75000)}`);
assert(c105.display === null, "invalid not $0");

assert(gexTemplate.id === "gex", "frozen gex id untouched");
const ids = HEATMAP_TEMPLATES.map((t) => t.id);
assert(
  ids.join(",") ===
    "sym-fly,bw-fly,width-fit,vertical,lim,gex,gex-cal,ladder",
  `template menu order ${ids.join(",")}`,
);
assert(ids.indexOf("gex") < ids.indexOf("gex-cal"), "AT-GC14 after gex");
assert(ids.indexOf("lim") < ids.indexOf("gex-cal"), "AT-GC14 after lim");
assert(ids.filter((id) => id === "gex-cal").length === 1, "AT-GC14 once");
assert(
  memberHeatmapTemplates().every((t) => t.id !== "gex-cal"),
  "AT-GC6 flag off hides Term Mass",
);

console.log("gexCal.test.ts PASS");
void contractKey;
