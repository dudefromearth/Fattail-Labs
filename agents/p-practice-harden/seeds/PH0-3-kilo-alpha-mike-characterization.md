# Seed PH0-3 — Kilo (+ Alpha · Mike): Characterization & isolation suite

**Project:** p-practice-harden  
**Primary:** Kilo  
**Reviewers (required):** Alpha · Mike  
**Phase:** H0  
**Prerequisite:** PH0-1, PH0-2  

## Goal

**Audit** H0 coverage against `TEST-STRATEGY.md`. Add tests **only** for real gaps.
Do not re-add isolation or batch-legs tests that already exist.

## Files in scope

- `server/tests/test_trade_log.py`  
- `server/tests/test_trade_log_import.py` (extend if needed)  
- `agents/p-practice-harden/TEST-STRATEGY.md` (update matrix if needed)  

## Audit checklist (Kilo)

| Invariant | Expected home | Action if present |
|-----------|---------------|-------------------|
| Cross-member isolation | `test_trade_log_legacy_prose_and_isolation` | keep; do not duplicate |
| id=0 blocked outside dev | `test_identity_zero_fallback_blocked_outside_dev` | keep |
| Real session under production-like env | `test_real_identity_trade_log_works_when_env_not_dev` | keep |
| List multi-leg completeness + no N+1 | `test_list_trades_batch_loads_multi_leg_legs` | keep |
| Export batch legs | optional thin assertion if export still risky | add **only** if gap |

## Collaboration / review protocol

1. Kilo runs suite + gap analysis (written in gate-report appendix).  
2. Add ≤2 tests only if a unique regression would ship without them.  
3. **Alpha** confirms new tests hit real paths.  
4. **Mike** confirms isolation still sufficient.  
5. Both APPROVED.  

## Completion criteria

- [x] Gap analysis written (including “no new tests needed” if true)  
- [x] `pytest tests/test_trade_log*.py -q` green  
- [x] Alpha APPROVED · Mike APPROVED  
- [x] Evidence: pytest command + summary  

## Evidence (2026-07-29)

- Gap audit: **no new tests** — matrix already locked by pre-existing + PH0-1 + PH0-2  
- Report: `gate-reports/PH0-3-review.md`  
- `pytest tests/test_trade_log.py tests/test_trade_log_import.py -q` → **13 passed**  

## Feeds

→ PH0-G  


