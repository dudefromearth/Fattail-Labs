# Gate R7 — First-class Resources project close

**Date:** 2026-07-26  
**Agents:** Delta (evidence) · Mike (security) · Lima (docs)  
**Verdict:** **PASS**

---

## 1. Delta — characterization suites

```text
cd server && .venv/bin/python -m pytest \
  tests/test_resources_api.py \
  tests/test_resources_domain.py \
  tests/test_resources_migration.py \
  tests/test_canonical_course_model.py \
  tests/test_production_packages.py -q

# 34 passed
```

(Includes placement resource → `course_resource_links` count after R6.)

---

## 2. Delta — U-matrix smoke (`R7_SMOKE PASS`)

| # | Scenario | Result |
|---|----------|--------|
| U1 | Unpublished hidden; publish → hub | **PASS** |
| U2 | Unpublish hub; course pin remains | **PASS** |
| U3 | New version published → hub updates | **PASS** |
| U4 | Course pin stays v1; download v1 URL | **PASS** |
| U5 | Attach existing | **PASS** (API) |
| U6 | Create new + link | **PASS** (API) |
| U7 | Members-only download 403 | **PASS** |
| U8 | Course chips on hub payload | **PASS** (API shape) |
| U9 | Canonical package pin round-trip | **PASS** (`test_export_import_resource_slug_pin`) |
| U10 | Unauth hub 401/403 | **PASS** |
| R6 | `sources: ["resource"]` only | **PASS** |

---

## 3. Mike — security

| Check | Evidence |
|-------|----------|
| No SSRF / outbound fetch on import/download path | No `requests`/`httpx`/`urlopen` in `resources_domain.py`, `routes/resources.py`, `routes/resources_admin.py` |
| Link downloads only `http(s)` | `_serve_file_or_link` |
| Private files path-safe | `private:` name rejects `/` and `..` |
| Admin mutators gated | `require_admin` on admin routes; unauth create 401/403 |
| Membership download gate | free vs alumni+; admin always ok |

---

## 4. Lima — docs parity

| Doc | Status |
|-----|--------|
| Resource Spec v1.0 | → **Approved as built** |
| Resource Library v1.2 | Historical + R6 cutover note |
| Architecture 04 domain model | resources / versions / links |
| ADMIN-GUIDE | Resources operator section |
| DL-062 … DL-062f | Decision trail |
| `agents/p-resources/` plan + orchestrator | Closed |

---

## 5. Residuals (non-blocking)

| Item | Notes |
|------|--------|
| Lesson-scoped attach UI | Domain supports `lesson_id`; course UI is course-level first |
| Bulk “repin all courses to published” | Explicitly out of scope v1.0 |
| Delete old `attachments` rows | Optional cleanup; download endpoint kept for bookmarks |
| Staging/prod migrator | Run `migrate_attachments_to_resources.py` on each env |

---

## 6. Definition of done

- [x] R1–R6 implemented and on `main`  
- [x] 34 pytest green  
- [x] U1–U10 evidence  
- [x] Docs + decision log  
- [x] Spec status approved as built  

**Verdict: PASS.** Project **p-resources** closed for v1.0.
