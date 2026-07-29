# PH0-3 — Kilo gap audit + reviewer verdicts

**Project:** p-practice-harden  
**Seed:** PH0-3 characterization / isolation suite (gap audit)  
**Date:** 2026-07-29  
**Primary:** Kilo  
**Doctrine:** [`TEST-STRATEGY.md`](../TEST-STRATEGY.md)

## Goal restated

Audit H0 coverage. Add tests **only** for unique regressions. Prefer “no new tests”
when the matrix is already locked.

## Gap analysis

| Invariant | Home | Present? | Action |
|-----------|------|----------|--------|
| Cross-member isolation (A ≠ B) | `test_trade_log_legacy_prose_and_isolation` | Yes | Keep; no duplicate |
| Observer 403 on Trade Log | same | Yes | Keep |
| id=0 storage fallback blocked outside `dev` | `test_identity_zero_fallback_blocked_outside_dev` | Yes | Keep |
| Real session works when env forced production-like | `test_real_identity_trade_log_works_when_env_not_dev` | Yes | Keep |
| List multi-leg completeness (N trades) | `test_list_trades_batch_loads_multi_leg_legs` | Yes | Keep |
| List path must not call per-trade `_load_legs` | same (monkeypatch) | Yes | Keep — N+1 lock |
| Multi-leg create + detail GET | `test_butterfly_multi_leg_create` | Yes | Keep (create contract) |
| Import/export book honesty | `test_trade_log_import.py` (5 tests) | Yes | Keep; no H0 change |
| Export path uses batch helper | code: `export_trades` → `_load_legs_for_trades` | Code yes; no dedicated export N+1 test | **No new test** — wrong data already covered by export roundtrip; N+1 is scale. List test already locks the batch helper contract. Reverting export alone is a review residual, not a silent correctness bug. |
| Dev id=0 convenience | — | Dropped in PH0-2 | Correct |

### Candidates considered and rejected

1. **Second isolation test for multi-leg only** — same isolation SQL path; no unique risk.  
2. **Export N+1 monkeypatch twin** — performance-only; data correctness already roundtripped.  
3. **Query-count absolute bound** (e.g. `executes ≤ 10`) — brittle under account/identity SELECTs; path forbid is more stable.  
4. **Empty book list** — no unique regression vs default-account tests.  

## New tests added this seed

**None.** H0 invariants are covered by pre-existing + PH0-1 + PH0-2 tests.

## Evidence

```text
cd server && .venv/bin/python -m pytest tests/test_trade_log.py tests/test_trade_log_import.py -q --tb=line
.............                                                            [100%]
13 passed, 52 warnings in 0.31s
```

Code path check (this session):

- `_load_legs` call sites: definition + `_load_trade` only (detail).  
- `_load_legs_for_trades`: `list_trades`, `export_trades`.  
- Identity gate: `get_config().env != "dev"` before fallback SQL.

## Alpha review

**Verdict: APPROVED**

- Gap analysis matches real code paths.  
- No missing characterization required for H0 ship.  
- Agrees not to add export N+1 twin under useful-only bar.

## Mike review

**Verdict: APPROVED**

- Isolation coverage remains sufficient (cross-member + id=0 outside dev).  
- No new attack surface opened by “no new tests.”  
- Batch load still filters `identity_id` on legs SELECT.

## Seed completion

- [x] Gap analysis written (including “no new tests needed”)  
- [x] `pytest tests/test_trade_log*.py -q` green  
- [x] Alpha APPROVED · Mike APPROVED  
- [x] Evidence: pytest command + summary  

**Seed PH0-3: DONE** → feeds PH0-G  
