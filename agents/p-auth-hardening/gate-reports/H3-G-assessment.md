# H3-G — Admin allowlist assessment

**Date:** 2026-08-02  
**Verdict:** **PASS**

## Evidence

| Item | Result |
|------|--------|
| `LABS_ADMIN_EMAILS` config fail-loud outside dev | `config.py` |
| SSO promote only if allowlisted | `admin_allowlist.py` + `auth_routes.py` |
| Tests | `tests/test_admin_allowlist_h3.py` — green |
| Seed emails | ernie@, coach@, conor@ (+ dev-admin local) |

```text
pytest tests/test_admin_allowlist_h3.py tests/test_live_role_h1.py … → 21 passed (suite)
```

## Residual

Existing `role_override=administrator` rows (incl. zztest) **not** stripped — intentional.  
Prod must set `LABS_ADMIN_EMAILS` or boot fails outside dev.

## Reevaluation

| ID | Action |
|----|--------|
| H1 | **NEXT** (implemented same session) |
| M3 | Folded partially into H1 (iid 0 hard-fail outside dev) |
