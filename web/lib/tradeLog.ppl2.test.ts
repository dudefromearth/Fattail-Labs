/**
 *   npx --yes tsx lib/tradeLog.ppl2.test.ts
 * PPL2 — client read models consume the match slot (same grain as blotter_status_by_id).
 */
import assert from "node:assert/strict";
import {
  canDeleteTrade,
  findPairedOpen,
  listUnmatchedOpens,
  matchOpenClose,
  positionBadge,
  tradeRowIssues,
  type Leg,
  type Trade,
} from "./tradeLog";
import { tradeStatus } from "./tradeLogAutofilter";

function leg(
  side: "BUY" | "SELL",
  qty: number,
  effect: "TO_OPEN" | "TO_CLOSE",
  strike: number,
): Leg {
  return {
    side,
    quantity: qty,
    pos_effect: effect,
    underlier: "SPX",
    expiry: "2026-12-31",
    strike,
    right: "PUT",
    fill_price: 1,
    asset_class: "equity_option",
  };
}

function trade(
  id: number,
  exec: string,
  effect: "TO_OPEN" | "TO_CLOSE",
  units: number,
): Trade {
  const open = effect === "TO_OPEN";
  return {
    id,
    account_id: 1,
    exec_at: exec,
    asset_class: "equity_option",
    strategy: "BUTTERFLY",
    order_type: "LMT",
    net_price: 0.6,
    net_side: open ? "DEBIT" : "CREDIT",
    setup_md: "",
    plan_md: "",
    rules_md: "",
    adherence: "",
    deviation_md: "",
    lesson_md: "",
    pnl_amount: null,
    legs: [
      leg(open ? "BUY" : "SELL", units, effect, 7080),
      leg(open ? "SELL" : "BUY", units * 2, effect, 7075),
      leg(open ? "BUY" : "SELL", units, effect, 7070),
    ],
  };
}

const openT = trade(1, "2026-04-21T10:00:00", "TO_OPEN", 5);
const closeT = trade(2, "2026-04-21T14:00:00", "TO_CLOSE", 1);
const book = [openT, closeT];

const matched = matchOpenClose(book, "2026-04-21");
assert.equal(matched.length, 1);
assert.equal(matched[0].close, null);
assert.equal(matched[0].open_units, 5);
assert.equal(matched[0].closed_units, 1);

assert.equal(positionBadge(closeT, book), "partial_residual");
assert.equal(positionBadge(openT, book), "partial_residual");
assert.equal(tradeStatus(closeT, book), "partial_residual");
assert.equal(tradeStatus(openT, book), "partial_residual");
assert.notEqual(tradeStatus(closeT, book), "Orphan close");

assert.equal(findPairedOpen(book, closeT.id)?.id, openT.id);
assert.deepEqual(listUnmatchedOpens(book).map((t) => t.id), []);

const gate = canDeleteTrade(openT, book);
assert.equal(gate.ok, false);
assert.equal(gate.blockingClose?.id, closeT.id);

assert.ok(!tradeRowIssues(openT, book).includes("unmatched_open"));
assert.ok(!tradeRowIssues(closeT, book).includes("orphan_close"));

console.log("tradeLog.ppl2.test.ts ok");
