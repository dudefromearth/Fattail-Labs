# AC2-G — Delta Admin API gate

**Date:** 2026-08-02  
**Verdict:** **PASS**

| Evidence | Result |
|----------|--------|
| PUT surface:login | 422 |
| PUT app:trade-log hard | 422 Data-bearing |
| PUT stores selected_plans intent | not expanded |
| Audit rows | yes |
| Non-admin decision | 401/403 |
| GET /api/access/decision | 404 |
| Admin batch decision | 200 expand-at-eval |

```text
pytest tests/test_access_control_admin_api.py … → part of 41 AC tests green
```

Routes: `server/routes/access_admin.py` mounted in `main.py`.
