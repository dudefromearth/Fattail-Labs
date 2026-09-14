# PPL2-G — W1 read models consume the slot

**Delta** · 2026-09-14 · StudioTwo · HEAD `87ab8748`  
**FIFO matcher:** not edited (diff starts after `match_open_close`).

## Verdict

**PASS** for the PPL lock + trade-log cluster. Full `pytest tests` hit a **pre-existing** live-xAI 403 (`test_ai_run_bravo_live_via_api`) then hung in help-AI live calls — not this packet.

## AT invert

| AT | After PPL2 |
|----|------------|
| **AT-PPL-1** | Green Keep (`close is None`, `open_units==5`, `closed_units==1`) |
| **AT-PPL-2** | `partial_residual` on open **and** 1-unit close (not Orphan / not Open) |
| **AT-PPL-3** | `positions_valuation` qty **4**; fill helper still 5 (not SoR) |
| **AT-PPL-4** | GET `/opens` `remaining_units==4` |
| **AT-PPL-5** | `fully_unmatched is False`; client `canDeleteTrade` ok:false |
| **AT-PPL-6/7** | Untouched (still 200) |
| **AT-PPL-8/9** | Untouched |

## pytest

Lock files: **44 passed** in 2.55s.

Trade-log cluster (`test_trade_log*.py` + capital + csrf): **79 passed** in 3.25s.

Client: `npx tsx lib/tradeLog.ppl2.test.ts` **ok** · `tradeLogAutofilter.test.ts` **ok**.

Grain: server `STATUS_PARTIAL_RESIDUAL == "partial_residual"` · client `positionBadge` / `tradeStatus` same string. Not Orphan amber.

## Live curl (StudioTwo :4000)

Seeded 5-unit fly + 1-unit close (ids 35953 / 35954). CSRF Origin `http://127.0.0.1:3000`.

GET `/api/me/trade-log/opens`:

```json
{
  "id": 35953,
  "remaining_units": 4,
  "open_units": 5,
  "closed_units": 1,
  "fully_unmatched": false
}
```

GET `/api/me/capital/positions-valuation`: **qty 4.0**

Browser :3000: no SSO session in this agent (cookie CSRF to Next would not show Coach's member book). API + TS tests are the grain proof. Machine-key badge is `partial_residual` (emerald-700, not Orphan amber) in `TradeLogTable.badgeMeta`.

## diff-stat (declared)

```
 server/capital_positions.py                |  14 +-
 server/routes/trade_log/trades.py          |  20 ++-
 server/tests/test_capital_positions.py     | 109 ++++++++++++++
 server/tests/test_trade_log.py             | 223 +++++++++++++++++++++++++++++
 server/tests/test_trade_log_domain.py      |  89 +++++++++++-
 server/trade_log_domain/matching.py        |  45 ++++--
 web/app/app/trade-log/page.tsx             |   9 +-
 web/components/trade-log/TradeLogTable.tsx |   5 +
 web/components/trade-log/TradeSheet.tsx    |   4 +-
 web/lib/tradeLog.ts                        |  67 ++++++---
 web/lib/tradeLogAutofilter.ts              |   2 +
 11 files changed, 551 insertions(+), 36 deletions(-)
```

Untracked: `web/lib/tradeLog.ppl2.test.ts`

Frozen paths: **empty**.

## Next

PPL3 (API 422 + DELETE 409 + kit confirm). Not started.
