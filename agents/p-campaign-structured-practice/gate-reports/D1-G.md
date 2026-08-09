# D1-G — Window eligibility + memory fallback + picker

**Status:** PASS  
**Date:** 2026-08-08  
**Evidence:** `practice_spine_domain.campaign_covers_fill` · `resolve_trade_campaign_id` · `GET …/campaigns/eligible` · TradeSheet picker · `tests/test_campaign_window.py`

## Landed

| Seed | Result |
|------|--------|
| D1-0 | Explicit stamp rejects when fill ∉ window (422). Ledger always stampable. Charters account-free (L5). |
| D1-1 | Memory of window-ineligible charter → silent ledger (L3). |
| D1-2 | Trade sheet uses eligible API; keep current stamp visible on edit even if out of window. |
| D1-3 | Fill-time edit does **not** auto-move stamp (quiet re-eval only). Redirect is explicit PATCH. |

## Also

- Witness no longer emits `trading_window` variance (window = membership, not variance).
- Journey T0 prefers `starts_at` (window start).
- `set_campaign_memory` accepts account-free charters.

## Kilo pack

```
tests/test_campaign_window.py  — 5 tests PASS
tests/test_campaign_panel.py   — PASS (updated)
tests/test_practice_spine.py   — PASS
```
