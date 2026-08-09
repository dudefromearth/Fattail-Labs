# PV-G — Positions View Spec v0.2 (GO)

**Status:** PASS (implementation land)  
**Date:** 2026-08-09  
**Spec:** `Specs/FatTail-Labs-Accounts-Capital-and-Positions-View-Spec-v0.2.md`  
**Coach GO:** 2026-08-09 — defaults: OD-MC omit Cash; OD-SV derived-only; OD-D1–D4 as proposed.

## Landed

| Item | Evidence |
|------|----------|
| #5a per-account BP | `migrations/115_account_buying_power.sql` + account patch / capital BP endpoint |
| Valuation API | `GET /api/me/capital/positions-valuation` · `capital_positions.py` |
| Weekend rule V17 | `valuation_uses_latest_mark`; no tick-stale blanking |
| Undirected absence | `campaign: null` on undirected opens; filter `undirected=true` |
| Cash omit OD-MC | `cash: null`, `cash_omitted_reason: match_cash_pending` |
| Positions UI | Trade Log **Log \| Positions** · `PositionsView` chip filters |
| Accounts & Capital | Summary card + marks as-of + embed compact table + per-account BP |
| Shared table | `PositionsValuationTable` compact/full |

## Tests

```
pytest tests/test_capital_positions.py tests/test_capital.py -q
→ 7 passed
```

## Residual (not blocking GO defaults)

- OD-MC match-cash (Cash still omitted)  
- OD-SV stated account value field  
- Options chain marks (degrade at cost)  
- Composition / overcommit lines (phase C)

## Delta

PASS for ship of valuation surfaces under locked defaults.
