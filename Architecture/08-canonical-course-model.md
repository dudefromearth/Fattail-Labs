# Architecture — Canonical Course Model

**Status:** As-built + residual C4 (2026-07-26)  
**Spec:** `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`  
**Design:** `Architecture/09-canonical-course-design.md`  
**Decision log:** DL-061 · DL-061a  
**Plan:** `agents/p-canonical-course/IMPLEMENTATION-PLAN.md`

---

## 1. Problem

“What a course is” was split across:

- MySQL tables (`courses` / `modules` / `lessons` / `attachments` / quizzes)
- In-place admin UI state
- Board `placement_proposal` JSON (close but not identical)
- Blueprint outline (upstream only)

That blocks reliable export/import, agent validation, and a single automation→manual polish path.

## 2. Solution overview

```
┌──────────────────────────────────────────────────────────────┐
│  Canonical Course Document (JSON)                            │
│  format: fattail.labs.canonical_course · model_version 1.0   │
│  validate · inspect · save · export · import                 │
└────────────────────────────┬─────────────────────────────────┘
                             │ project / materialize
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
   MySQL runtime      Content Board         External tools
   (members/SEO)      place/approve         AI agents / files
```

**Authorities:**

| Layer | Authority |
|-------|-----------|
| Portable document | Canonical Course Model Spec |
| Live delivery | MySQL + Course Hosting + member APIs |
| Production workflow | Content Board + Production Package Spec |
| Human polish | In-place admin (Application Framework stay-put) |

## 3. Components (as-built)

| Component | Path | Responsibility |
|-----------|------|----------------|
| JSON Schema | `Specs/schemas/canonical-course-v1.json`, `server/schemas/` | Machine contract |
| Pure model lib | `server/course_model.py` | validate, inspect, adapt, export, import |
| Admin API | `server/routes/canonical_courses.py` | validate/inspect/import/export |
| Migration | `migrations/028_canonical_course_model.sql` | Fidelity columns |
| Board hook | `server/packages.py` | placement plan → canonical **validate** before place |
| Admin UI | `AdminEditBar` export · `ImportCourseCard` | Operator download/upload |
| Tests | `server/tests/test_canonical_course_model.py` | Round-trip + invariants |

## 4. Data flow

### Export

1. Load course graph (modules, lessons, quizzes, attachments, categories, instructors).  
2. Project lessons → `kind` + `content_blocks` + `resource_ids` + `extra_blocks_json`.  
3. Video → **YouTube** ids only (CCM-D10).  
4. Resources → **pointers** + lightweight metadata (url **references**, never binary).  
5. Instructors → full profiles in `bundle.instructors[]` (bio, avatar **URL**, links).  
6. Optional `production` enrichment from board if `placed_course_slug` matches.

### Import

1. Normalize document (canonical | legacy package | placement plan).  
2. Validate (structural | publish | strict).  
3. Transaction: create_draft or replace_draft (draft only).  
4. Resolve categories (must exist); resolve/create instructors from bundle.  
5. Materialize lessons with **explicit kind** preserved; free_preview as auth flag.  
6. Attach resources from pointer + metadata url refs.

### Automation

```
Blueprint → stages → placement_proposal
       → placement_plan_to_document()
       → validate(structural)
       → place (today: packages graph; residual: import_document)
       → in-place polish → publish
```

## 5. Media rules (DL-061a)

| Asset | Package representation |
|-------|------------------------|
| Lesson / trailer video | YouTube `video_id` only |
| Files / downloads | Resource **pointer** (`resource_ids`) + optional url metadata |
| Hero / banner | URL reference (not zip) |
| Emoji | Inline in text fields |
| Binary media ZIP | **Out of scope** v1.0 |

## 6. Content blocks vs runtime lessons

Runtime remains one lesson row: primary `kind` + `body_md` + video columns + quiz rows.

Canonical multi-block list is authoring truth. Materialization:

1. **Lesson `kind` is authoritative** when present (CCM-D11).  
2. Fold notes into `body_md`.  
3. Persist residual blocks in `lessons.extra_blocks_json`.  
4. Export rehydrates blocks from columns + extras.

## 7. free_preview

**Authorization flag only** (CCM-D16). Free-preview lessons use the **same** content model as gated lessons. Access control remains in lesson APIs / public routes — not a separate content payload in the package.

## 8. Security boundaries

- Admin session (or future scoped agent key) required.  
- No server-side fetch of arbitrary media URLs on import (SSRF).  
- No member PII in documents.  
- Doctrine lint (profit-claim patterns) on publish validation.

## 9. Residual architecture debt

| Item | Status |
|------|--------|
| Dual materialize (place vs import) | **C4 residual** — validate shared; write path still packages-native |
| Admin UI for new course columns | **C6** optional |
| Media ZIP | **Deferred** |

## 10. Evolution

| Version | Theme |
|---------|--------|
| 1.0 | Document + APIs + migration + round-trip + YouTube/resource rules |
| 1.1 | Shared place materialize; optional field UI; course revision history |
| Later | Media ZIP if Coach reopens; additional video providers if needed |

---

*See Design doc for operator UX. Implementation plan for agent sequencing.*
