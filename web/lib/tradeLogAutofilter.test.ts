/**
 *   npx --yes tsx lib/tradeLogAutofilter.test.ts
 * TLAF2 — A4 / A5 / A7 / A8 / A9 host wiring + column readers.
 */
import assert from "node:assert/strict";
import { applyAutofilter, filtersActive, type FilterMap } from "./autofilter";
import type { Trade } from "./tradeLog";
import {
  campaignColumnFilter,
  strategyLabelsFromCatalog,
  TL_STATUS,
  tradeExecDay,
  tradeLogColumns,
  tradeStatus,
  tradeStrategy,
  tradeSymbols,
} from "./tradeLogAutofilter";

function trade(partial: Partial<Trade> & Pick<Trade, "id">): Trade {
  return {
    account_id: 1,
    exec_at: "2026-01-10T15:30:00Z",
    asset_class: "equity_option",
    strategy: "VERTICAL",
    order_type: "MKT",
    net_price: 1,
    net_side: "DEBIT",
    setup_md: "",
    plan_md: "",
    rules_md: "",
    adherence: "",
    deviation_md: "",
    lesson_md: "",
    pnl_amount: null,
    legs: [
      {
        side: "BUY",
        quantity: 1,
        fill_price: 1,
        pos_effect: "TO_OPEN",
        underlier: "SPX",
      },
    ],
    ...partial,
  };
}

const a = trade({
  id: 1,
  strategy: "BUTTERFLY",
  practice_campaign_id: 7,
  exec_at: "2026-01-10T15:30:00Z",
  legs: [
    {
      side: "BUY",
      quantity: 1,
      fill_price: 1,
      pos_effect: "TO_OPEN",
      underlier: "SPX",
    },
    {
      side: "SELL",
      quantity: 1,
      fill_price: 1,
      pos_effect: "TO_OPEN",
      underlier: "QQQ",
    },
  ],
});
const b = trade({
  id: 2,
  strategy: "VERTICAL",
  practice_campaign_id: 8,
  exec_at: "2026-02-01T15:30:00Z",
  legs: [
    {
      side: "BUY",
      quantity: 1,
      fill_price: 1,
      pos_effect: "TO_OPEN",
      underlier: "IWM",
    },
  ],
});
const c = trade({
  id: 3,
  practice_campaign_id: null,
  exec_at: "2026-01-11T09:00:00Z",
  legs: [
    {
      side: "SELL",
      quantity: 1,
      fill_price: 1,
      pos_effect: "TO_CLOSE",
      underlier: "SPX",
    },
  ],
});
const book = [a, b, c];
const cols = tradeLogColumns(book);

assert.deepEqual(
  cols.map((c) => c.key),
  ["when", "campaign", "strategy", "symbol", "status"],
);
assert.equal(tradeStrategy(a), "BUTTERFLY");
assert.equal(tradeStrategy(trade({ id: 99, strategy: "  " })), null);
{
  const labels = strategyLabelsFromCatalog([
    { code: "BUTTERFLY", label: "Butterfly" },
    { code: "CUSTOM_X", label: "" },
  ]);
  assert.equal(labels.get("BUTTERFLY"), "Butterfly");
  assert.equal(labels.has("CUSTOM_X"), false);
}

assert.equal(tradeExecDay(a), "2026-01-10");
assert.deepEqual(tradeSymbols(a).sort(), ["QQQ", "SPX"]);
assert.equal(tradeStatus(a, book), TL_STATUS.open);
assert.equal(tradeStatus(c, book), TL_STATUS.orphan);

// A4 — QQQ on one leg returns the whole block
{
  const r = applyAutofilter(book, cols, { symbol: ["QQQ"] });
  assert.equal(r.shown, 1);
  assert.equal(r.rows[0]?.id, 1);
  assert.deepEqual(tradeSymbols(r.rows[0]!), ["SPX", "QQQ"]);
}

// A5 — badge / ?campaign= identity
{
  const fromBadge = campaignColumnFilter({}, 7);
  const fromQuery = campaignColumnFilter({}, 7);
  assert.deepEqual(fromBadge, fromQuery);
  assert.deepEqual(fromBadge.campaign, ["7"]);
  const r = applyAutofilter(book, cols, fromBadge);
  assert.equal(r.shown, 1);
  assert.equal(r.rows[0]?.id, 1);
}

// A9
{
  const r = applyAutofilter(book, cols, { campaign: ["7"] });
  assert.equal(r.filterOn, true);
  assert.equal(r.shown, 1);
  assert.equal(r.total, 3);
  assert.equal(filtersActive({}), false);
}

// A8 empty-but-valid
{
  const filters: FilterMap = { symbol: ["QQQ"], campaign: ["8"] };
  const r = applyAutofilter(book, cols, filters);
  assert.equal(r.shown, 0);
  assert.equal(r.filterOn, true);
}

// Status=Open is Autofilter, not Open:N
{
  const r = applyAutofilter(book, cols, { status: [TL_STATUS.open] });
  assert.ok(r.rows.every((t) => tradeStatus(t, book) === TL_STATUS.open));
}

// S2 — Strategy token is stored code; whole block
{
  const r = applyAutofilter(book, cols, { strategy: ["BUTTERFLY"] });
  assert.equal(r.shown, 1);
  assert.equal(r.rows[0]?.id, 1);
  assert.equal(r.rows[0]?.strategy, "BUTTERFLY");
}

// S3 — AND across Strategy + Symbol
{
  const r = applyAutofilter(book, cols, {
    strategy: ["BUTTERFLY", "VERTICAL"],
    symbol: ["IWM"],
  });
  assert.equal(r.shown, 1);
  assert.equal(r.rows[0]?.id, 2);
}

console.log("tradeLogAutofilter.test.ts ok");
