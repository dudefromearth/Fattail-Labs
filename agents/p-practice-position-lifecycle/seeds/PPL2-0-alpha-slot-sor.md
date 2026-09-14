# PPL2-0 — Server read models consume the slot

**Project:** Practice Position Lifecycle  
**Agent:** Alpha  
**Depends:** PPL1-G  
**Feeds:** PPL2-G

## Intent

**Family A+B+C on the server.** Qty/pairing SoR = match **slot**. Matcher FIFO **untouched**.

| Change | After |
|--------|--------|
| `blotter_status_by_id` | Walk `closes[]` even when `m.close` is None. Partial close is not Orphan. Open with slices is not Open-at-original-size |
| GET `/api/me/trade-log/opens` | Do not list a remainder as a fully unmatched open |
| `positions_valuation` | Qty from `slot_remaining`, not `open_qty_and_avg_cost(trade)` as qty SoR |
| `campaign_phase_reports.py` | **Out** unless GO allowlist ticked |

`blotter_status_by_id` lives in `matching.py` — that function is a **read model**. Do not change the FIFO loop that sets `m["close"]`.

## Files in scope

- `server/trade_log_domain/matching.py` (`blotter_status_by_id` / helpers only)
- `server/routes/trade_log/trades.py` (`list_unmatched_opens`)
- `server/capital_positions.py`
- Tests that invert AT-PPL-2…5 on the server

## Out of scope

FIFO loop. Client (`PPL2-1`). API 422/409 (`PPL3`). Migrations. Frozen trees.

## Done when

1-of-5: server status residual; GET `/opens` omits it as fully unmatched; positions qty 4. AT-PPL-1 green. Pytest evidence.
