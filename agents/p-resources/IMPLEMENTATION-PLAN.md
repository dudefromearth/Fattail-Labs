# Agent-led Implementation & Integration Plan — Resources v1.0

**Project folder:** `agents/p-resources/`  
**Orchestrator:** `ORCHESTRATOR.md`  
**Charter:** `CHARTER.md`  
**Spec:** `Specs/FatTail-Labs-Resource-Spec-v1.0.md`  
**Design:** `Architecture/10-resources-design.md`  
**Prior as-built:** Resource Library Specs v1.0–v1.2 (`attachments` aggregation)  
**Integrates with:** Canonical Course Model (slug + pin), Course in-place editor, `/resources`

Juliet owns plan updates. Coach prioritizes. Specialists execute **seeds**. Delta gates with evidence.

---

## 0. Locked decisions (do not re-litigate)

| ID | Decision |
|----|----------|
| RES-D1 | First-class Resource; courses **link** |
| RES-D2 | Immutable integer versions |
| RES-D3 | One published version max; **slug → published** |
| RES-D4 | Course pin independent; course always shows links at pin |
| RES-D5 | Library visibility = publish |
| RES-D6 | New resource default **unpublished** to hub |
| RES-D7 | free_preview ≠ publish |
| RES-D8 | Canonical package: slug + optional pin; no binary zip |
| RES-D9 | Types: spreadsheet, document, image, link, other |

---

## 1. Integration map

```
┌─────────────────────────────────────────────────────────────────┐
│  MEMBER                                                          │
│  /resources  ← published only + access gates                     │
│  /courses/{slug} Resources tab ← linked pins (always if linked)  │
└─────────────────────────────────────────────────────────────────┘
         ▲ API published                    ▲ course payload links
┌────────┴──────────────────────────────────┴─────────────────────┐
│  ADMIN                                                           │
│  /resources (admin density)  ·  Course edit → Resources editor │
│  Create · version · publish · pin · free · unlink                │
└────────┬──────────────────────────────────┬─────────────────────┘
         │                                  │
         ▼                                  ▼
   resources + resource_versions     course_resource_links
         │
         ▼
   Canonical export/import (slug + pinned_version)
```

| Surface | Member | Admin |
|---------|--------|-------|
| **Resources hub** | Browse published; download/open | + create, version, publish, free, history, course chips |
| **Course Resources tab** | Download/open pins | + attach existing, new resource, pin picker, free, unlink |
| **Course package** | — | Export/import resource refs (CCM) |

---

## 2. Phase map

```
R0 Docs/design lock
  → R1 Schema + domain lib + tests
    → R2 Member + admin APIs
      → R3a Resources hub UI (admin + member cutover dual-read)
        → R3b Course builder UI (attach / create / pin)
          → R4 Attachment backfill migration
            → R5 Canonical Course Model integration
              → R6 Deprecate attachment library path
                → R7 Delta close + Lima docs
```

| Phase | Name | Lead agents | Status |
|-------|------|-------------|--------|
| **R0** | Spec approval + design + this plan | Coach · Juliet · India · Echo · Lima | **IN PROGRESS** (plan + design landed; build awaits Coach) |
| **R1** | Schema, pure resource domain, invariants | **Alpha** · Kilo | PENDING |
| **R2** | Admin + member APIs | **Alpha** · Mike · Kilo | PENDING |
| **R3a** | Resources hub UI (member + admin) | **Charlie** · Echo · Tango | PENDING |
| **R3b** | Course builder resource UI | **Charlie** · Echo | PENDING |
| **R4** | Migrate attachments → resources | **Alpha** · Foxtrot | PENDING |
| **R5** | Canonical package slug/pin | **Alpha** · Kilo | PENDING |
| **R6** | Cutover dual-write off | **Alpha** · Delta | PENDING |
| **R7** | Project close gate | **Delta** · Lima · Mike | PENDING |

**Parallelism:** After R2, R3a and R3b may run in parallel if APIs stable. R4 after R2 minimum; prefer after R3a dual-read proven.

---

## 3. Phase detail

### R0 — Lock & design (Juliet · India · Echo · Lima · Coach)

**Deliverables**

- [x] Resource Spec v1.0  
- [x] DL-062  
- [x] `Architecture/10-resources-design.md`  
- [x] This plan + charter + seeds  
- [ ] Coach **approve for build** (explicit)  
- [ ] India architecture PASS (single store, migration safety)  
- [ ] Lima: status line on Resource Library v1.2 already notes supersession  

**Gate:** Coach “build” + India PASS → open R1.

---

### R1 — Domain core — `seeds/R1-alpha-schema-domain.md`

**Alpha**

| Item | Detail |
|------|--------|
| Migration | `029_resources.sql` (or next free N): `resources`, `resource_versions`, `course_resource_links` |
| Indexes | unique `resources.slug`; unique `(resource_id, version)`; publish invariant (app + optional generated uniqueness) |
| Module | `server/resources_domain.py` — create, new_version, publish, unpublish, pin link, resolve by slug |
| Fail loud | pin missing version; publish unknown version |

**Kilo**

- Pure/unit tests: version monotonic; single publish; pin independent of publish.

**Out of scope:** HTTP routes (R2).

---

### R2 — APIs — `seeds/R2-alpha-api.md`

**Alpha**

| Surface | Routes |
|---------|--------|
| Member | `GET /api/resources`, `GET /api/resources/{slug}`, download by version id |
| Admin resources | CRUD head, POST versions, POST publish/unpublish, list versions |
| Admin course | attach, patch pin/free/sort, unlink |
| Course public/admin payload | include linked resources with pin metadata |

**Mike**

- Download gates; private: paths; admin-only mutators; no SSRF on link kind.

**Kilo**

- Characterization: publish hub visibility; unpublish; course pin download after new publish.

**Dual-read (transition):** `GET /api/resources` may union old attachments until R4/R6 — document flag `LABS_RESOURCES_SOURCE=legacy|new|both` only if needed; prefer **new empty + migration R4** to avoid merge complexity. **Default plan:** R2 APIs serve **new tables only**; R4 backfill before flipping member UI fully (R3a can feature-flag).

---

### R3a — Resources hub UI — `seeds/R3a-charlie-hub-ui.md`

**Charlie** (primary files: `web/components/ResourceLibrary.tsx`, page under `web/app/resources/`)

| Audience | Work |
|----------|------|
| **Member** | Cards from new API: type, published version, description, free badge, **course chips**, download via version endpoint |
| **Admin** | New resource form (slug, type, category, description, file/link, publish checkbox default off); row: edit head; **New version**; **Publish/Unpublish**; free toggle; version history expand; linked courses |
| **Filters** | Category + type (map from `type` enum + category) |

**Echo:** hierarchy, density, empty states.  
**Tango:** badge copy (Published / Course only / Free / Members).

**Stay-put:** no full navigation loss on save.

**Gate evidence:** screenshot notes + API-backed list empty→create→publish→member visible.

---

### R3b — Course builder UI — `seeds/R3b-charlie-course-ui.md`

**Charlie** (primary: `EditorExtras` AttachmentsEditor → `CourseResourcesEditor`, CourseTabs Resources panel)

| Feature | Behavior |
|---------|----------|
| List | Linked resources at pin; free toggle; unlink |
| **Attach existing** | Search modal → select → pin default → attach |
| **New resource** | Modal create → auto link pin=v1; publish default off |
| **Pin picker** | Dropdown of versions |
| Lesson attach | Optional stretch if time; else file follow-up issue |

**Integration with edit bar:** mutations via structureOp / stay-put refresh (Application Framework).

**Do not remove** Export package; ensure course resources still appear in canonical export after R5.

**Gate:** attach + create + pin change without page reload; member course tab shows pin.

---

### R4 — Migration — `seeds/R4-alpha-migrate-attachments.md`

**Alpha**

1. One-shot or migrate.py companion: each course-level attachment → Resource (slugified unique), Version 1, CourseResourceLink pin=v1.  
2. If course `published` → set `published_version_id` = v1 (preserves hub listing).  
3. Lesson attachments → links with `lesson_id`.  
4. Idempotent re-run safe (key on attachment id map table `resource_migration_map`).  
5. Foxtrot: verify private files still resolve.

**Kilo:** count parity tests on dev DB probe set.

---

### R5 — Canonical Course Model — `seeds/R5-alpha-ccm-integration.md`

**Alpha**

- Export: `resource_ids` / refs as **slugs** + `pinned_version`.  
- Import: resolve slug; create link with pin; optional create-from-bundle metadata.  
- `course_model.py` + tests; update Canonical spec cross-link if needed (Lima).

---

### R6 — Cutover — `seeds/R6-alpha-cutover.md`

**Alpha**

- Course admin stops writing legacy `attachments` for library resources.  
- Member library only new tables.  
- Keep read fallback behind short deprecation window only if needed.  
- Delta: no dual sources in production path.

---

### R7 — Close — `seeds/R7-delta-lima-close.md`

**Delta:** full pytest + smoke member hub + course pin + publish.  
**Mike:** download security re-check.  
**Lima:** ADMIN-GUIDE, Architecture domain model, Resource Library “as-built” → “superseded as-built”.  
**Coach:** accept residuals (lesson attach, bulk repin).

---

## 4. UI acceptance matrix (must pass before R7)

| # | Scenario | Surface |
|---|----------|---------|
| U1 | Member sees only published resources | Hub |
| U2 | Unpublish removes from hub; course pin still listed | Hub + Course |
| U3 | New version not live until Publish | Hub |
| U4 | After publish v2, course pinned to v1 still downloads v1 | Course |
| U5 | Attach existing from course builder | Course edit |
| U6 | Create new from course → appears in admin resource list; not hub until publish | Course + Hub |
| U7 | free_preview still gates download | Both |
| U8 | Admin sees linked course chips on hub | Hub |
| U9 | Export/import package keeps resource slug pins (after R5) | Package |
| U10 | Signed-out hub still prompts login | Hub |

---

## 5. File ownership map (expected)

| Path | Phases |
|------|--------|
| `migrations/029_resources.sql` (N TBD) | R1 |
| `server/resources_domain.py` | R1–R2 |
| `server/routes/resources.py` | R2, R6 |
| `server/routes/admin.py` or `resources_admin.py` | R2 |
| `server/course_model.py` | R5 |
| `server/tests/test_resources_domain.py` | R1–R7 |
| `web/components/ResourceLibrary.tsx` | R3a |
| `web/app/resources/**` | R3a |
| `web/components/edit/EditorExtras.tsx` / new `CourseResourcesEditor.tsx` | R3b |
| `web/components/CourseTabs.tsx` | R3b |
| `docs/ADMIN-GUIDE.md` | R7 |
| `Architecture/04-domain-data-model.md` | R1/R7 |
| `Architecture/10-resources-design.md` | R0 |

---

## 6. Agent sequencing (recommended run order)

| Step | Seed | Agent session |
|------|------|----------------|
| 1 | R0 complete | Coach approve build |
| 2 | R1 | Alpha (+ Kilo) |
| 3 | R2 | Alpha (+ Mike review notes) |
| 4 | R3a \|\| R3b | Charlie (two seeds or one long session) |
| 5 | R4 | Alpha |
| 6 | R5 | Alpha |
| 7 | R6 | Alpha |
| 8 | R7 | Delta · Lima |

Echo/Tango reviews: after R3a first paint and R3b attach modal.

---

## 7. Risks

| Risk | Mitigation |
|------|------------|
| Dual `attachments` + resources confusion | Dual-write window short; R6 hard cut; migration map table |
| Slug collisions on migrate | Suffix `-2`, `-3`; log map |
| Course still using AttachmentsEditor after R3b | Feature flag or replace in same PR as API |
| Publish races | Transaction + single `published_version_id` column |
| Private file path break | Foxtrot verify on staging after R4 |

---

## 8. Verification commands

```bash
cd server && .venv/bin/python migrate.py
.venv/bin/python -m pytest tests/test_resources_domain.py tests/test_canonical_course_model.py -q
# Manual U1–U10 against staging/dev with admin + member sessions
```

---

## 9. Definition of done (project)

- [ ] Coach build approval recorded  
- [ ] R1–R6 complete with Delta notes  
- [ ] U1–U10 evidence  
- [ ] ADMIN-GUIDE + domain model updated  
- [ ] Resource Spec status → approved as built (or v1.1 as-built)  
- [ ] Attachment-based library path retired  

---

## 10. Out of scope (explicit)

- Media ZIP / binary course packages  
- Member version switching  
- Auto-upgrade all course pins  
- Separate resource category taxonomy (unless Coach overrides RES category default)  
- Non-YouTube lesson video as Resource type  

---

*Next action for Coach: approve Spec + this plan for build → open R1 seed.*
