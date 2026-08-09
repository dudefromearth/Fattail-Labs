# L-G — Ledger abolition + undirected stamp

**Status:** PASS  
**Date:** 2026-08-09  
**Phase:** L (Amendment Top-Level Account)

## Evidence

### Migration
- `migrations/114_ledger_furniture_reverse.sql` applied — unstamps trades on `is_ledger=1`, abandons furniture rows, clears memory → furniture.

### Domain
- `practice_spine_domain.ensure_ledgers_for_identity` — no genesis campaigns.
- `list_campaigns` filters `is_ledger = 0`.
- `resolve_trade_campaign_id` → `(None, None)` undirected when no explicit/eligible memory; rejects furniture stamp.
- `on_account_created` → no-op; `get_active_campaign` / `list_active_campaigns` exclude ledger.
- `routes/trade_log/common._ensure_default_account` no longer calls `ensure_ledger_campaign`.
- Import commit defaults to null stamp (no ledger ensure).
- Trade create allows null `practice_campaign_id`; witnesses skip when undirected.

### UI
- Trade sheet campaign empty option: “Undirected (or memory if set)”.
- Import sheet default: Undirected.
- Blotter badge empty when null / furniture.
- Practice Context: no ledger default filter; campaign label “All · undirected OK”.

### Tests (Kilo)
```
pytest tests/test_practice_spine.py tests/test_campaign_window.py tests/test_campaign_panel.py -q
→ 20 passed (subset of 24 with capital)
```
Key cases:
- `test_campaign_list_no_ledger_furniture`
- `test_structured_practice_undirected_stamp`
- `test_memory_falls_to_undirected_when_window_ends`
- `test_default_book_campaign_and_import_stamp` (null import stamp)
- eligible API has no ledger rows

## Delta

| Acceptance | Result |
|------------|--------|
| No genesis ledger | PASS |
| Undirected null stamp | PASS |
| Memory no furniture fallback | PASS |
| Furniture reverse migration | PASS |
