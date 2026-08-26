/**
 *   npx --yes tsx lib/autofilter/apply.test.ts
 * TLAF1 A7 / A8 / A9 / A12 engine. Select-time (O3). Clean visit (O4) = no persist API.
 */
import assert from "node:assert/strict";
import {
  NOTHING_MATCHED,
  applyAutofilter,
  dateVsWindowsConflict,
  emptyValidCopy,
  filterOnLabel,
  filtersActive,
  selectionGate,
} from "./apply";
import { NONE_TOKEN, type ColumnDef, type FilterMap } from "./types";

type Row = { day: string; campaign: string | null; symbol: string };

const cols: ColumnDef<Row>[] = [
  { key: "when", label: "When", type: "date", read: (r) => r.day },
  {
    key: "campaign",
    label: "Campaign",
    type: "value",
    read: (r) => r.campaign,
  },
  { key: "symbol", label: "Symbol", type: "value", read: (r) => r.symbol },
];

const rows: Row[] = [
  { day: "2026-01-10", campaign: "1", symbol: "SPX" },
  { day: "2026-01-11", campaign: "1", symbol: "QQQ" },
  { day: "2026-02-01", campaign: null, symbol: "SPX" },
];

type Block = { day: string; campaign: string | null; symbols: string[] };
const blockCols: ColumnDef<Block>[] = [
  { key: "when", label: "When", type: "date", read: (r) => r.day },
  { key: "campaign", label: "Campaign", type: "value", read: (r) => r.campaign },
  { key: "symbol", label: "Symbol", type: "value", read: (r) => r.symbols },
];
const blocks: Block[] = [
  { day: "2026-01-10", campaign: "1", symbols: ["SPX", "QQQ"] },
];

const windows = [
  { id: "1", start: "2026-01-01", end: "2026-01-31" },
  { id: "2", start: "2026-03-01", end: "2026-03-31" },
];
const incompatibility = dateVsWindowsConflict("when", "campaign", windows);

// A12 — (none) reachable
{
  const r = applyAutofilter(rows, cols, { campaign: [NONE_TOKEN] });
  assert.equal(r.shown, 1);
  assert.equal(r.rows[0]?.symbol, "SPX");
  assert.equal(r.rows[0]?.campaign, null);
}

// AND across / OR within
{
  const r = applyAutofilter(rows, cols, {
    symbol: ["SPX", "QQQ"],
    campaign: ["1"],
  });
  assert.equal(r.shown, 2);
  assert.equal(r.filterOn, true);
}

// A9
assert.equal(filterOnLabel(2, 3), "Filter on — 2/3");
assert.equal(filtersActive({}), false);
assert.equal(filtersActive({ symbol: ["SPX"] }), true);

// A8 empty-but-valid — SPX + campaign 1 + a day that exists but not for that combo
{
  const filters: FilterMap = { symbol: ["QQQ"], campaign: [NONE_TOKEN] };
  const r = applyAutofilter(rows, cols, filters);
  assert.equal(r.shown, 0);
  assert.equal(emptyValidCopy(r.shown, r.filterOn), NOTHING_MATCHED);
  const gate = selectionGate(filters, "campaign", NONE_TOKEN, incompatibility);
  assert.equal(gate.disabled, false);
}

// A7 select-time conflict — campaign 1 window is January; pick a March day
{
  const filters: FilterMap = { campaign: ["1"] };
  const gate = selectionGate(filters, "when", "2026-03-15", incompatibility);
  assert.equal(gate.disabled, true);
  assert.match(String(gate.reason), /outside the selected campaign window/i);
}

// A7 inverse — March day vs campaign 1
{
  const filters: FilterMap = { when: ["2026-03-15"] };
  const gate = selectionGate(filters, "campaign", "1", incompatibility);
  assert.equal(gate.disabled, true);
}

// A4 whole block — leg symbol QQQ returns the entire trade
{
  const r = applyAutofilter(blocks, blockCols, { symbol: ["QQQ"] });
  assert.equal(r.shown, 1);
  assert.deepEqual(r.rows[0]?.symbols, ["SPX", "QQQ"]);
}

// Compatible: January day + campaign 1
{
  const gate = selectionGate(
    { campaign: ["1"] },
    "when",
    "2026-01-10",
    incompatibility,
  );
  assert.equal(gate.disabled, false);
}

// O4: this module has no persist / lastUsed API (assert source stays clean in TLAF1-G grep)
console.log("autofilter apply.test.ts ok");
