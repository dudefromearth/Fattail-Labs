# FatTail Labs — Phase E Hardening Spec v1.0

**Status:** Approved as built (2026-07-23)  
**Scope:** Connection pool, SSO contract tests, API smoke, browser smoke, ops notes  
**Does not change product features** — reliability and verification only.

---

## 1. DB pool

| Item | Value |
|---|---|
| Module | `server/db.py` |
| API | Unchanged: `transaction()`, `connect()` |
| Env | `LABS_DB_POOL_SIZE` (default **10**, range 1–100) |
| Behavior | Checkout with `ping(reconnect=True)`; rollback before return; drop dead conns |
| Fail-loud | Invalid pool size → `ConfigError`; pool exhausted → `TimeoutError` |

Tests: `server/tests/test_db_pool.py`.

---

## 2. WP SSO contract (Labs side)

| Item | Value |
|---|---|
| Tests | `server/tests/test_sso_providers.py` |
| Method | Mint HS256 JWT with configured `LABS_SSO_SECRET_*`; hit `/api/auth/sso/wordpress:fattail` |
| Cases | Unknown provider 404; bad token 401; happy path cookie + identity_link; wrong secret 401 |
| Fallback | Native login still works (`test_native_login_still_works_when_sso_would_fail`) |

**Runbook:** If WordPress SSO is unavailable, members use **native** email/password.
SSO buttons only appear when `LABS_SSO_LOGIN_URL_*` is set.

---

## 3. Member path API smoke

`server/tests/test_smoke_member_path.py`: health → catalog → course detail → enroll → continue.

---

## 4. Browser smoke

`web/e2e/smoke.spec.ts` (Playwright):

- Public `/courses` and `/`  
- Dev-login → `/admin` shell  
- `/admin/board` Kanban  
- `/login` form  

```bash
cd web && npm run test:e2e:smoke
# requires web+API; LABS_ENV=dev for dev-login
```

---

## 5. Non-goals

- Full pen-test  
- CDN (Phase F)  
- HeyGen (Phase G)  
- Changing product auth model  

---

## 6. Implementation map

| Path | Role |
|---|---|
| `server/db.py` | Pool |
| `server/tests/test_db_pool.py` | Pool tests |
| `server/tests/test_sso_providers.py` | SSO contracts |
| `server/tests/test_smoke_member_path.py` | Member API smoke |
| `web/e2e/smoke.spec.ts` | Browser smoke |
