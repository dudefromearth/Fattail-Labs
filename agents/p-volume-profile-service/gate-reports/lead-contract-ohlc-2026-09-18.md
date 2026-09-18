# Lead-contract rule — OHLC path · 2026-09-18

**Implemented** in `market_data.vp_ingest.lead_contract.select_lead_contract`.  
Every OHLC consumer of `bars_from_prints` / `ohlc_for_source` inherits it. **No hardcoded ticker.**

| Situation | Rule name | Pick |
|-----------|-----------|------|
| No Contracts metadata | `volume_only` | Volume leader among print contracts |
| `as_of` within 8 days of front `last_trade_date` | `volume_in_roll_window` | Volume leader of {front, next} |
| Outside roll window | `front_calendar` | Front if it printed |
| Front expired (`last_trade_date` < as_of) | `front_calendar` (next is the new front) | New front |

Payload adds `lead_rule` beside `contract`. Tests: `test_lead_contract.py` + existing mix-front-next golden.

Today (ESU6 expiry, roll window): ESZ6 volume leader → OHLC uses **ESZ6** only. Profile bins still mix both (see `Q-roll-week-bin-eligibility.md`).
