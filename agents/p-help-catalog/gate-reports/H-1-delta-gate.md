# H-1-G Delta Gate — Help catalog GET (2026-08-24)

**Gate:** Help catalog · **DL-572**  
**Verdict: PASS**

No migration. No Wiki three-OK. No draft state. No admin surface.

## Evidence

```
tests/test_help_catalog.py + test_help.py + test_help_ai.py + poll tests
35 passed in 27.79s
```

| Claim | Proof |
|-------|--------|
| List matches disk | `test_list_matches_disk_unauthenticated` — ids = `help_reference/*.md` stems; body = file bytes; no cookie |
| GET by id | same test; unknown / traversal **404** |
| No write | POST/PUT catalog → 405/404/401 |
| Poller GET-only | `poll_help_source(..., "/api/help/guides")` — GET list only; POST raises |

**URL:** `/api/help/guides`
