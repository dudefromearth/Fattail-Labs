# Seed PH0-2 — Alpha + Kilo: Batch-load legs (kill N+1)

**Project:** p-practice-harden  
**Primary:** Alpha  
**Reviewers (required):** Kilo · India  
**Phase:** H0  
**Prerequisite:** PH0-0  

## Goal

`GET /api/me/trade-log/trades` must load legs in **O(1) or O(chunks)** queries, not one
query per trade. **Response JSON shape unchanged.**

## Files in scope

- `server/routes/trade_log.py`  
- `server/tests/test_trade_log.py` and/or new test  
- Optional: helper in `server/trade_log_*.py` if pure  

## Out of scope

- Frontend changes  
- New query params (unless India approves `include=legs` default true)  

## Implementation notes

- After selecting trades, `SELECT * FROM legs WHERE trade_id IN (...)` (chunk IN lists).  
- Preserve order and isolation (`identity_id`).  
- Keep LIMIT behavior; if truncated, prefer explicit flag (India approve).  

## Collaboration / review protocol

1. Alpha implements + curl/pytest evidence (timing optional).  
2. **Kilo** reviews tests; may add query-count instrumentation if available.  
3. **India** reviews contract stability (same fields).  
4. Both APPROVED.  

## Completion criteria

- [x] Multi-leg list returns full legs for multi-trade fixture  
- [x] No per-trade leg query in list path (code review + test)  
- [x] Kilo APPROVED · India APPROVED  
- [x] Evidence pasted  

## Evidence (2026-07-29)

- `_load_legs_for_trades` + list/export wired  
- `test_list_trades_batch_loads_multi_leg_legs`  
- Review: `gate-reports/PH0-2-review.md`  
- `pytest tests/test_trade_log.py tests/test_trade_log_import.py -q` → **13 passed**  

## Feeds

→ PH0-3, PH0-G  

