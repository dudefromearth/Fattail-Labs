# Agent-led Implementation Plan — Canonical Course Model v1.0

**Project folder:** `agents/p-canonical-course/`  
**Orchestrator board:** `ORCHESTRATOR.md`  
**Charter:** `CHARTER.md`  
**Spec:** `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`  
**Architecture:** `Architecture/08-canonical-course-model.md`  
**Design:** `Architecture/09-canonical-course-design.md`  

This is the **Juliet execution plan**: phases, agent ownership, seeds, gates, and
residual work. Coach runs the board; specialists execute seeds; Delta gates with evidence.

---

## 0. Locked product decisions (do not re-litigate in seeds)

| ID | Decision |
|----|----------|
| CCM-D1 | Format `fattail.labs.canonical_course`, `model_version` `1.0` |
| CCM-D2 | References over embed |
| CCM-D3 | Content blocks + `extra_blocks_json` for multi-block fidelity |
| CCM-D4 | Default import `create_draft`; no silent published overwrite |
| CCM-D5 | ProductionState is portable enrichment only |
| CCM-D10 | **YouTube only** for video/trailer in v1.0 |
| CCM-D11 | **Preserve lesson kind** exactly |
| CCM-D12 | Resources are **pointers** to generic Resource type |
| CCM-D13 | No media binary / ZIP in v1.0 (emoji OK inline) |
| CCM-D14 | Full **instructor profiles** in bundle (bio + avatar URL) |
| CCM-D15 | SEO JSON-LD platform-regenerated; package seo thin |
| CCM-D16 | **`free_preview` = auth flag only** |

---

## 1. Phase map

```
C0 Docs lock ──► C1 Model core ──► C2 API + tests ──► C3 Admin UI
                      │                                    │
                      └──────────► C4 Board converge ◄─────┘
                                        │
                                   C5 Media ZIP (deferred)
```

| Phase | Name | Lead agents | Status |
|-------|------|-------------|--------|
| **C0** | Spec, architecture, design, decision log | Juliet · India · Lima · Coach | **DONE** |
| **C1** | Migration, JSON Schema, pure `course_model` | **Alpha** · Kilo | **DONE** |
| **C2** | Admin validate/inspect/import/export APIs + tests | **Alpha** · Kilo · Mike | **DONE** |
| **C3** | Export / Import admin UI (MVP) | **Charlie** · Echo | **DONE (MVP)** |
| **C4** | Board place → shared materialize | **Alpha** · Quebec | **DONE** |
| **C5** | Optional media ZIP | Foxtrot · Alpha | **DEFERRED** (Coach: not now) |
| **C6** | Admin fields for new course columns | Charlie · Echo | **DONE** |
| **C7** | Close-out: Delta full gate + Lima parity | Delta · Lima | **DONE** |

---

## 2. Agent work packages (seeds)

Execute only **pending** seeds cold; completed seeds remain as audit trail.

### C0 — Docs (DONE)

- Spec v1.0 with Coach decisions D10–D16  
- Architecture 08 + Design 09  
- DL-061 / DL-061a  
- This plan + charter  

**Agents:** Juliet (plan), India (arch review when re-opened), Lima (log)

### C1 — Model core (DONE) — `seeds/C1-alpha-model-core.md`

| Agent | Work |
|-------|------|
| **Alpha** | `migrations/028_*.sql`, `server/course_model.py`, schemas |
| **Kilo** | Unit/characterization foundations |

### C2 — API (DONE) — `seeds/C2-alpha-api-import-export.md`

| Agent | Work |
|-------|------|
| **Alpha** | `routes/canonical_courses.py`, wire `main.py` |
| **Kilo** | `tests/test_canonical_course_model.py` |
| **Mike** | Review admin-only + no SSRF on import (spot-check at C7) |

### C3 — Admin UI MVP (DONE) — `seeds/C3-charlie-admin-ui.md`

| Agent | Work |
|-------|------|
| **Charlie** | Export package (edit bar), Import package (catalog) |
| **Echo** | Polish pass optional at C6/C7 |

### C4 — Board converge (PARTIAL) — `seeds/C4-alpha-board-converge.md`

| Agent | Work remaining |
|-------|----------------|
| **Alpha** | `apply_placement` still materializes via placement graph after **structural validate**. **Next:** materialize through `course_model.import_document` (`replace_draft` / create) so one code path owns graph writes. |
| **Quebec** | Ensure factory stages still produce placeable plans that pass canonical validate |
| **Kilo** | Keep `test_production_packages.py` green; add place-via-canonical characterization when materialize switches |

**Out of scope C4:** Changing required board stages; auto-publish.

### C5 — Media ZIP (DEFERRED)

Do **not** seed until Coach reopens. Spec explicitly defers.

### C6 — Admin fields for new columns — `seeds/C6-charlie-course-fields.md` (NEW)

| Agent | Work |
|-------|------|
| **Charlie** | Expose in-place (or package-only remains OK if Coach prefers): `flagship`, `pathway_position`, `audience_category`, `short_description`, `learning_outcomes`, module `description_md` |
| **Echo** | Placement density, labels (not emoji chrome) |
| **Tango** | Copy for flagship / pathway language if member-visible |

**Gate:** optional fields round-trip via export after edit.

### C7 — Close-out — `seeds/C7-delta-lima-close.md` (NEW)

| Agent | Work |
|-------|------|
| **Delta** | Full project gate: pytest suite, curl export/import, UI smoke notes |
| **Lima** | Domain model + ADMIN-GUIDE + Architecture README already partially done; verify parity |
| **India** | Confirm single-graph invariant post–C4 if C4 completes |
| **Mike** | Confirm import does not fetch arbitrary URLs server-side |

---

## 3. Coordination rules

1. **All coordination through Coach or Juliet** — no direct agent-to-agent scope creep.  
2. **Declare files before touch** (seed “Files in scope”).  
3. **Every phase end → Delta** ternary verdict with command + output.  
4. **Do not invent a second course JSON** — placement plans adapt into canonical only.  
5. **Stay-put admin UX** (Application Framework) on import redirect to draft editor.  

---

## 4. Recommended execution order (from now)

| Step | Action | Agent |
|------|--------|--------|
| 1 | Land this commit (docs + C1–C3 + partial C4) | Coach / implementer |
| 2 | **C4 residual:** shared materialize in `packages.apply_placement` | Alpha + Kilo |
| 3 | Delta gate C4 | Delta |
| 4 | **C6** if Coach wants UI for new fields; else skip | Charlie |
| 5 | **C7** project close | Delta · Lima |

---

## 5. File ownership map

| Path | Owner phase |
|------|-------------|
| `Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md` | C0 |
| `Specs/schemas/canonical-course-v1.json` | C1 |
| `server/schemas/canonical-course-v1.json` | C1 |
| `migrations/028_canonical_course_model.sql` | C1 |
| `server/course_model.py` | C1–C4 |
| `server/routes/canonical_courses.py` | C2 |
| `server/main.py` | C2 |
| `server/packages.py` | C4 |
| `server/tests/test_canonical_course_model.py` | C2 |
| `web/components/edit/AdminEditBar.tsx` | C3 |
| `web/components/edit/EditorExtras.tsx` | C3 |
| `web/components/CatalogGrid.tsx` | C3 |
| `Architecture/08-*.md`, `09-*.md` | C0 |
| `docs/ADMIN-GUIDE.md` | C0 / C7 |
| `Architecture/00-decision-log.md` | Lima |

---

## 6. Verification commands (evidence culture)

```bash
# Migration
cd server && set -a && source ../.env && set +a && .venv/bin/python migrate.py

# Characterization
cd server && .venv/bin/python -m pytest tests/test_canonical_course_model.py tests/test_production_packages.py -q

# Manual smoke (admin session)
# GET  /api/admin/courses/{slug}/canonical
# POST /api/admin/canonical-courses/validate  { "document": … }
# POST /api/admin/canonical-courses/import    { "document": …, "mode": "create_draft" }
```

---

## 7. Definition of done (project)

- [x] Spec approved content in repo  
- [x] Architecture + design in repo  
- [x] Decision log DL-061 / DL-061a  
- [x] Migration + pure model + JSON Schema  
- [x] Admin API export/import/validate/inspect  
- [x] Round-trip characterization tests green  
- [x] Admin Export + Import MVP UI  
- [ ] C4 full materialize converge (optional residual)  
- [ ] C7 Delta project PASS  

---

## 8. Risk register

| Risk | Mitigation |
|------|------------|
| Dual materialize paths (place vs import) | C4 residual — single importer |
| Resource pointer without metadata on import | Fail loud; require `bundle.resources[]` metadata with url ref |
| Instructor name collisions | Prefer instructor_id; create only when unresolved |
| Bunny ids in old DB rows | Normalize export/import to YouTube product path; existing bunny rows remain runtime until migrated manually |

---

*Juliet owns plan updates. Coach prioritizes residual C4 vs C6 vs close.*
