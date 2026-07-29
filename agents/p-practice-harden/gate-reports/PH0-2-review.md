# PH0-2 — Evidence + reviewer verdicts

**Project:** p-practice-harden  
**Seed:** PH0-2 batch-load legs  
**Date:** 2026-07-29  
**Primary:** Alpha  

## Change summary

- Added `_load_legs_for_trades` — `IN (...)` leg load in chunks of 500.  
- `list_trades` and `export_trades` use batch path (export same N+1 class; same file).  
- Single-trade `_load_legs` remains for detail GET only.  
- Response JSON shape unchanged.

## Files touched

- `server/routes/trade_log.py`  
- `server/tests/test_trade_log.py`  
- `agents/p-practice-harden/TEST-STRATEGY.md` (board test doctrine)  
- PH0-3 seed tightened to gap-audit only  

## Evidence

```text
cd server && .venv/bin/python -m pytest tests/test_trade_log.py tests/test_trade_log_import.py -q
.............                                                            [100%]
13 passed
```

Useful test added:

| Test | Invariant |
|------|-----------|
| `test_list_trades_batch_loads_multi_leg_legs` | 6 multi-leg trades list complete; list path must not call `_load_legs` (N+1 guard) |

Dropped as non-product:

| Test | Why |
|------|-----|
| `test_identity_zero_fallback_allowed_in_dev` | Dev convenience, not a member-facing risk lock |

Kept PH0-1:

- `test_identity_zero_fallback_blocked_outside_dev`  
- `test_real_identity_trade_log_works_when_env_not_dev`  

## Kilo review

**Verdict: APPROVED**

- Completeness + N+1 path assertion is the right scale invariant.  
- Does not re-test isolation already covered.  
- PH0-3 reframed as audit/gap-only per TEST-STRATEGY.  

## India review

**Verdict: APPROVED**

- Public list/export contracts unchanged (fields, nesting).  
- Batch IN + identity_id filter preserves Family B scoping.  
- Export included: same correctness class, no new product surface.  

## Seed completion

- [x] Multi-leg list returns full legs  
- [x] No per-trade leg query on list path  
- [x] Kilo APPROVED · India APPROVED  
- [x] Evidence pasted  
