# PH0-1 — Evidence + reviewer verdicts

**Project:** p-practice-harden  
**Seed:** PH0-1 Alpha + Mike identity fallback gate  
**Date:** 2026-07-29  
**Primary:** Alpha  

## Change summary

`_storage_identity_id` in `server/routes/trade_log.py`:

- Real sessions (`identity_id != 0`): unchanged — claims identity only; missing row → 400.  
- `identity_id == 0` (internal/dev-admin session): storage fallback to ernie/coach/dev-admin  
  **only when** `get_config().env == "dev"`.  
- Staging/production: **401** `Invalid session identity for Trade Log` — never selects another member.

Aligned with `routes/auth_dev.py` (dev-login already gated on `LABS_ENV=dev`).

## Files touched

- `server/routes/trade_log.py`  
- `server/tests/test_trade_log.py`  

## Evidence

```text
cd server && .venv/bin/python -m pytest tests/test_trade_log.py -q --tb=short
........                                                                 [100%]
8 passed, 31 warnings in 0.87s
```

New tests:

| Test | Asserts |
|------|---------|
| `test_identity_zero_fallback_blocked_outside_dev` | id=0 + production/staging → 401 |
| `test_real_identity_trade_log_works_when_env_not_dev` | real activator + production env → 200 |
| `test_identity_zero_fallback_allowed_in_dev` | id=0 + LABS_ENV=dev → 200 |

## Mike review (isolation / auth)

**Attack surface checked:** session with `identity_id=0` outside dev must not read/write ernie, coach, or any administrator book via email/role fallback.

**Findings:**

- Fallback SQL and auto-`dev-admin` INSERT are unreachable when `env != "dev"`.  
- 401 before any SELECT on preferred emails.  
- Legitimate non-zero identity still works with env forced to production (no false block).  
- No cross-member path introduced; Family B still keys on resolved storage id.  

**Verdict: APPROVED**

## India review (env / architecture boundary)

**Doctrine check:** config-driven, fail-loud; no silent remapping of identity outside dev.

**Findings:**

- Gate uses `get_config().env` (same axis as auth_dev and Config boot rules).  
- Strict equality `== "dev"` — staging and production both blocked.  
- No product behavior change for real SSO sessions.  
- Product boundary / MSC: not involved.  

**Verdict: APPROVED**

## Seed completion

- [x] Fallback impossible when `LABS_ENV` not `dev` (test evidence)  
- [x] Mike APPROVED  
- [x] India APPROVED  
- [x] Evidence: pytest command + output  

**Seed PH0-1: DONE** → feeds PH0-2, PH0-3, PH0-G  
