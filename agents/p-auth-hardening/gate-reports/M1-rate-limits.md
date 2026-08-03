# M1 — Auth rate limits

**Date:** 2026-08-03  
**Verdict:** **PASS**

## Delivered

- `server/rate_limit.py` — sliding window, IP (+ email where useful)
- Wired: login, forgot, register, reset-password, SSO callback
- 429 + `Retry-After`
- Tests: `tests/test_rate_limit_m1.py` (3 passed)

## Reevaluation

| Next | Note |
|------|------|
| Host ops H5/H2 | Still blocked on MiniTwo SSH / MiniThree |
| M7 webhook replay | Next code item |
| M2 email/link | After M7 |
