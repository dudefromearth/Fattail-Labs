# PH1-2 — Analytics API evidence + reviews

**Project:** p-practice-harden  
**Seed:** PH1-2 Alpha analytics read models  
**Date:** 2026-07-29  
**Primary:** Alpha  

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/me/trade-log/analytics/day-book?day=&account_id=` | Journal day book |
| GET | `/api/me/trade-log/analytics/days-interest?from_day=&to_day=&account_id=` | Calendar interest days |
| GET | `/api/me/trade-log/analytics/reports-book?account_id=&starting_capital=` | Reports equity/stats |

- Identity via `_storage_identity_id` (H0 gate).  
- Load path: `_load_member_book` → batch legs → `trade_log_domain`.  
- `list_trades` reuses `_load_member_book` (no second query pattern).

## Files

- `server/routes/trade_log.py`  
- `server/tests/test_trade_log_analytics.py`  

## Evidence

```text
cd server && .venv/bin/python -m pytest \
  tests/test_trade_log_analytics.py tests/test_trade_log.py tests/test_trade_log_domain.py -q
19 passed
```

Useful tests:

| Test | Invariant |
|------|-----------|
| reports shape + $150 synth | contract + domain through HTTP |
| day-book activity | contract |
| isolation cross-member | A’s trade_ids absent from B’s analytics |
| observer 403 | role gate |
| bad day 422 | fail loud |

## India

**APPROVED** — matches PH1-0 DTOs; domain-only computation; no MSC.

## Mike

**APPROVED** — identity-scoped load; peer isolation tested; no id=0 fallback on real sessions.

## Kilo

**APPROVED** — isolation + shape + golden synth through API; no theater.

## Seed completion

- [x] API returns series / day-book fields  
- [x] Isolation green  
- [x] India · Mike · Kilo APPROVED  
