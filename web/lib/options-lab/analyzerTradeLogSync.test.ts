import assert from "node:assert/strict";
import { closePosition, positionFromInput } from "./analyzerBook";
import {
  applyTradeLogCloseIfAny,
  linkTradeLogId,
  syncBookFromTradeLog,
} from "./analyzerTradeLogSync";
import type { Trade } from "@/lib/tradeLog";

function trade(partial: Partial<Trade> & { id: number }): Trade {
  return {
    account_id: 1,
    exec_at: "2026-08-18T14:00:00Z",
    asset_class: "equity_option",
    strategy: "VERTICAL",
    order_type: "LMT",
    net_price: 1.2,
    net_side: "CREDIT",
    setup_md: "",
    plan_md: "",
    rules_md: "",
    adherence: "",
    deviation_md: "",
    lesson_md: "",
    pnl_amount: null,
    legs: [
      {
        side: "SELL",
        quantity: 1,
        pos_effect: "TO_OPEN",
        fill_price: 1.2,
        underlier: "SPX",
      },
    ],
    ...partial,
  };
}

const base = positionFromInput({
  underlying: "SPX",
  expiration: "2026-08-18",
  contracts: 1,
  direction: "sell",
  legs: [
    { strike: 5600, type: "put", quantity: 1, side: "short", entry_price: 2 },
    { strike: 5550, type: "put", quantity: 1, side: "long", entry_price: 0.8 },
  ],
});

{
  const unlinked = applyTradeLogCloseIfAny(base, [
    trade({
      id: 9,
      legs: [{ side: "BUY", quantity: 1, pos_effect: "TO_CLOSE", fill_price: 0.4 }],
    }),
  ]);
  assert.equal(unlinked.closedAt, null, "no link → Trade Log close is ignored");
}

{
  const linked = linkTradeLogId(base, 10);
  assert.equal(linked.tradeLogTradeId, 10);
  const stillOpen = applyTradeLogCloseIfAny(linked, [trade({ id: 10 })]);
  assert.equal(stillOpen.closedAt, null, "open fill only → stay open");

  const closed = applyTradeLogCloseIfAny(linked, [
    trade({ id: 10 }),
    trade({
      id: 11,
      exec_at: "2026-08-18T18:00:00Z",
      legs: [
        {
          side: "BUY",
          quantity: 1,
          pos_effect: "TO_CLOSE",
          fill_price: 0.4,
          underlier: "SPX",
        },
      ],
    }),
  ]);
  assert.ok(closed.closedAt, "paired TO_CLOSE stamps Options Lab close");
  assert.equal(closed.closedAt, Date.parse("2026-08-18T18:00:00Z"));
}

{
  const already = closePosition(linkTradeLogId(base, 10), 1);
  const again = applyTradeLogCloseIfAny(already, [
    trade({ id: 10 }),
    trade({
      id: 12,
      exec_at: "2026-08-18T19:00:00Z",
      legs: [{ side: "BUY", quantity: 1, pos_effect: "TO_CLOSE", fill_price: 0.1 }],
    }),
  ]);
  assert.equal(again.closedAt, 1, "already closed — no second stamp");
}

{
  const { next, changed } = syncBookFromTradeLog([base], []);
  assert.equal(changed, false);
  assert.equal(next[0].closedAt, null);
}
