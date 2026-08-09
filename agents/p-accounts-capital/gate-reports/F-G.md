# F-G — Cash movements + balance/trading curves + master DD $

**Status:** PASS  
**Date:** 2026-08-09  
**Phase:** F (Funding v0.2)

## Evidence

### Schema
- `110_capital_prefs.sql` — identity prefs (tolerance form, BP, confirm as-of).
- `111_account_starting_balance.sql` — `starting_balance` on accounts (OD-F5 separate field).
- `112_account_cash_movements.sql` — fund/defund rows with export_key.
- `113_campaign_funding_composition.sql` — composition table ready for phase C (schema only).

### Domain (`capital_domain.py`)
- **Balance** = start + fill P&L + movements (Ring 1).
- **Trading curve** = chronological fill P&L only (starts at 0; campaign-blind).
- **Master DD** = `realized_dd_dollars` vs `tolerance_budget_dollars` (percent×capital or $).
- Zero-amount movement → 422 (validation, not trade-path umpire).

### API
- `POST /api/me/capital/accounts/{id}/movements`
- `GET /api/me/capital/accounts/{id}/movements`
- Overview embeds master DD + quiet witness when over budget.

### UI
- Accounts & Capital: Deposit / Withdraw, movements list, starting balance edit, prefs save.

### Tests (Kilo)
```
pytest tests/test_capital.py -q
→ 4 passed
```
- `test_realized_dd_dollars_pure`
- `test_capital_overview_balance_and_movements` (10000+250+500=10750; undirected trade)
- `test_master_dd_fill_only_ignores_cash` (cash withdraw excluded from trading DD; DD=1100)
- `test_patch_prefs_and_confirm`

## Delta

| Acceptance | Result |
|------------|--------|
| Balance = start + fills + movements | PASS |
| Trading curve fill-only | PASS |
| Master DD $ vs budget $ | PASS |
| Campaign-blind master | PASS |
| Movements API + UI | PASS |
