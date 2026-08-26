/**
 *   npx --yes tsx lib/tradeLogAutofilter.tlab1.test.ts
 * TLAB1 source characterization: book universe B (U1–U7).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const web = resolve(here, "..");

function read(rel: string): string {
  return readFileSync(resolve(web, rel), "utf8");
}

const page = read("app/app/trade-log/page.tsx");
const table = read("components/trade-log/TradeLogTable.tsx");
const bar = read("components/trade-log/TradeLogAutofilterBar.tsx");
const host = read("lib/tradeLogAutofilter.ts");
const api = read("lib/tradeLogApi.ts");
const journal = read("app/app/journal/page.tsx");
const reports = read("app/app/reports/page.tsx");

// U7 — one stream: FilterMap → list params; no second client membership apply
assert.match(host, /export function autofilterToListQuery/);
assert.match(page, /autofilterToListQuery/);
assert.match(page, /fetchBlotterDistincts/);
assert.match(page, /years: afq\.years/);
assert.match(page, /days: afq\.days/);
assert.match(page, /strategies: afq\.strategies/);
assert.match(page, /symbols: afq\.symbols/);
assert.match(page, /campaigns: afq\.campaigns/);
assert.match(page, /statuses: afq\.statuses/);
assert.doesNotMatch(page, /applyAutofilter\(/);
assert.match(page, /const tableTrades = trades/);

// U1 — menus from account-book distincts, not the first page
assert.match(api, /q\.set\("blotter", "1"\)/);
assert.match(api, /function blotterTokenList/);
assert.match(bar, /bookDistincts/);
assert.match(page, /status: dist\.data\.statuses/);
assert.match(page, /when: days/);

// U3 — Autofilter list stays lazy (A rejected). Positions sheet may still
// fetch full=1 to open a trade id not on the page.
assert.match(page, /const PAGE_LIMIT = 80/);
assert.match(page, /limit: PAGE_LIMIT/);
assert.match(page, /autofilterToListQuery\(autofilter, blotterDaysRef\.current\)/);

// U4 — shown/total is book-honest (O2)
assert.match(page, /filtersActive\(autofilter\) \? matchCount : bookCount/);
assert.match(page, /autofilterShown=\{ratioShown\}/);
assert.match(page, /autofilterTotal=\{ratioTotal\}/);
assert.match(table, /autofilterShown/);
assert.match(table, /autofilterTotal/);

// U5 — Journal / Records not this stream
assert.doesNotMatch(journal, /fetchBlotterDistincts/);
assert.doesNotMatch(reports, /fetchBlotterDistincts/);
assert.doesNotMatch(journal, /autofilterToListQuery/);

// U6 — Find and Badge distincts stay the default (no blotter=1 there)
assert.match(api, /export async function fetchTradeDistincts/);
assert.match(api, /export async function fetchBlotterDistincts/);
assert.doesNotMatch(
  read("components/trade-log/TradeFindTag.tsx"),
  /blotter=1/,
);
assert.doesNotMatch(
  read("components/trade-log/TradeFindTag.tsx"),
  /fetchBlotterDistincts/,
);

console.log("tradeLogAutofilter.tlab1.test.ts ok");
