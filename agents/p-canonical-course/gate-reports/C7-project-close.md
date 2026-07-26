# Gate C7 — Canonical Course Model project close

**Date:** 2026-07-26  
**Agents:** Delta (evidence) · Mike (security spot-check) · Lima (docs parity)  
**Verdict:** **PASS**

Coach residual: **C4 materialize converge not required for close** — dual write path
accepted with shared **validate** on place; full shared importer remains optional follow-on.

---

## 1. Delta — characterization suite

```text
cd server && .venv/bin/python -m pytest \
  tests/test_canonical_course_model.py tests/test_production_packages.py -q

# 16 passed
```

Covers: structural validate, profit-claim publish lint, placement adapter, inspect,
import/export round-trip, published replace refuse, unauth, package aliases,
lesson kind preserve (`replay`), YouTube provider coerce.

---

## 2. Delta — live smoke (TestClient)

| Check | Result |
|-------|--------|
| Unauth `POST …/validate` | **401** |
| Import `create_draft` | **200**, status `draft` |
| Export `GET …/canonical` | **200**, `format=fattail.labs.canonical_course`, lesson `kind=video` |
| Publish then `POST …/canonical` replace | **422** `PUBLISHED_REPLACE_FORBIDDEN` |
| Cleanup | draft + delete probe course |

Command result line: `C7_SMOKE_PASS`.

---

## 3. Mike — security spot-check

| Claim | Evidence |
|-------|----------|
| Import does not server-side fetch media URLs | `course_model.py` / `canonical_courses.py`: **no** `requests` / `httpx` / `urlopen` |
| Admin-only | unauth → 401 (smoke); `require_admin` on all routes |
| No member PII in package | Export projects content graph only (no enrollments/progress) — by design in export code |

---

## 4. Lima — docs parity

| Doc | Parity |
|------|--------|
| Spec v1.0 + CCM-D10–D16 | Present |
| Architecture 08 (YouTube, resources, free_preview, residual C4) | Present |
| Design 09 (export/import UX, free_preview language) | Present |
| ADMIN-GUIDE export/import section | Present |
| Decision log DL-061 / DL-061a | Present |
| JSON Schema in Specs + server | Present |

No factual drift requiring a same-day doc rewrite.

---

## 5. Residual (explicit, non-blocking for C7 PASS)

| Item | Status |
|------|--------|
| C4 full `apply_placement` → `import_document` materialize | **Optional residual** — validate-on-place ships; dual write path accepted |
| C5 media ZIP | **Deferred** (Coach) |
| C6 admin UI for new course columns | **Optional** follow-on |
| Validation panel UX (full path list in UI) | MVP shows first error on import only |

---

## 6. Definition of done checklist

- [x] Spec + architecture + design + decision log  
- [x] Round-trip tests green  
- [x] Admin export/import without SQL  
- [x] DL-061 / DL-061a  
- [x] Delta C2 + **C7** gate reports  
- [x] C4 residual **Coach-acceptable** as dual path with shared validate  
- [x] C7 Delta project **PASS**

---

**Verdict: PASS.** Project **p-canonical-course** closed for v1.0 delivery scope.
