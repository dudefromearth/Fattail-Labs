# FatTail Labs — Course Package Spec v1.0

> **SUPERSEDED (2026-07-26):** Portable contract is now  
> **`Specs/FatTail-Labs-Canonical-Course-Model-Spec-v1.0.md`** (DL-061).  
> Format `fattail.labs.course_package` remains an **import adapter** only.  
> New exports must use `fattail.labs.canonical_course`.

**Status:** SUPERSEDED by Canonical Course Model v1.0  
**Priority:** **Core** (historical draft retained for lineage)  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Parent:** `FatTail-Labs-Course-Hosting-Spec-v1.0` (domain)  
**Siblings:** In-Place Admin v1.0–v1.5 · Application Framework v1.0 · Content Board · Course Blueprint · Production Package Spec v1.0 (workflow freeze — **different artifact**)  
**Does not supersede:** MySQL remains the **runtime** system of record for live courses; this spec defines the **portable document**, the **mapping** to/from that record, and the **validate / inspect / export / import** contract  

**Reviewers (see Canonical Course Model for active work):**

| Gate | Reviewer | Concern |
|------|----------|---------|
| Architecture / domain | **India** | Single graph; no parallel course store; blueprint → package → DB pipeline |
| Backend / schema | **Alpha** | Export/import API, validation, optional revisions table |
| Content / curriculum | **Sierra + Hotel** | Copy rules, process-not-profit on validate |
| Admin UX | **Charlie + Echo** | Inspect / export / import surfaces |
| Security | **Mike** | Admin-only; media trust; no member PII in packages |
| Approver | **Coach** | Ship / scope |

---

## 0. One-paragraph standard

> A **course** has one **canonical graph** (identity, modules, lessons, media bindings, attachments, quizzes). That graph has an **internal representation** (Labs MySQL + admin APIs) and an **external representation** (**Course Package Document** — versioned, inspectable JSON, media by reference). Packages can be **saved** (as files or API bodies), **exported**, **imported**, **inspected**, and **validated** without requiring SQL or a browser session. Manual in-place editing and automated admin workflows **both** read and write through this graph — they do not invent ad-hoc shapes.

---

## 1. Intent

### 1.1 Why this exists

Manual edit and automation both fail if “what a course is” only lives in scattered tables and UI state. We need:

1. **One mental model** of a course for humans, AI, and APIs.  
2. **Portability** — save outside the live DB (backup, handoff, staging ↔ prod, offline review).  
3. **Validation** — reject incomplete or doctrine-violating packages before they become live courses.  
4. **Inspectability** — operators and tools can open a package and understand structure without running the full site.  
5. **A stable contract** for automated pipelines (blueprint → package → place into Labs).  
6. **Convergence** — manual create/edit and automated placement materialize the **same** graph.

### 1.2 Success criteria

| # | Criterion |
|---|-----------|
| S1 | A published or draft course can be **exported** to a Course Package Document that round-trips fields defined in this spec. |
| S2 | A valid package can be **imported** as a **new draft** course (or replace a draft under strict rules — §7). |
| S3 | **Validate** returns a structured report (errors / warnings) without writing the DB unless import is requested. |
| S4 | **Inspect** returns outline + stats without writing the DB. |
| S5 | Package schema is **versioned**; unknown `format_version` fails loud. |
| S6 | Package contains **no member data** (enrollments, progress, reviews, discussions, certificates of members). |
| S7 | Manual editor and automated board/blueprint **converge** on this graph — no third “course JSON” invented per feature. |
| S8 | Media policy is explicit: **by reference** (URLs / video ids) in v1; optional asset bundle later. |
| S9 | Existing **placement_proposal** plans can be **adapted** into a Course Package Document (migration path §3.2). |

### 1.3 Non-goals (v1.0)

- ZIP / binary media bundle packaging (v1.1 candidate).  
- Export of member progress, PII, analytics, or discussion threads.  
- Bidirectional code sharing with MarketSwarm (HTTP API only if ever needed).  
- Replacing Course Blueprint (header + outline is a **precursor**, not a full package).  
- Replacing Content Approval Package (board workflow freeze — different artifact; §3).  
- Public member-facing download of full course packages.  
- Auto-publish on import (default always lands as **draft**).

---

## 2. Terminology (do not conflate)

| Name | What it is | Spec / home |
|------|------------|-------------|
| **Course Package Document** | Portable **authoring graph** of one course (JSON). Save / export / import / validate / inspect. | **This spec** |
| **Internal course graph** | Runtime MySQL rows: `courses`, `modules`, `lessons`, `attachments`, quiz questions, joins | Course Hosting + migrations |
| **Course Blueprint** | Header + module/lesson **outline** (titles, descriptions); chat co-pilot; first human gate | Blueprint skill / `content_blueprints` |
| **Content Approval Package** (a.k.a. Production Package freeze) | Board workflow snapshot: required **stages** complete, guardians clear, frozen for Approve | Production Package Spec v1.0 · skill `course-package` |
| **placement_proposal** | Board stage artifact used **today** to place a draft course | Production Package Spec §5 |
| **video_package** | Media production artifact (trailer + per-lesson video ids) | Production Package Spec |

**Naming rule for code and docs:**

- Prefer **Course Package Document** or `course_package` / `fattail.labs.course_package` for **this** artifact.  
- Prefer **approval package** / `content_approval_packages` for the board freeze.  
- Skill `course-package` freezes the **approval package**; it does **not** define the portable course JSON. Implementation of this spec should use routes under `/api/admin/course-packages/…` (document) vs board package routes (approval freeze).

---

## 3. Two representations

```
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL — Course Package Document                         │
│  Portable · versioned · validate/inspect without live site  │
│  JSON (required) · optional media bundle (future)           │
└───────────────────────────┬─────────────────────────────────┘
                            │ export / import / validate / inspect
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  INTERNAL — Runtime course graph                            │
│  MySQL: courses, modules, lessons, attachments, quizzes     │
│  Mutated by: in-place editor · import · automation place    │
│  Read by: public/member APIs · export                       │
└─────────────────────────────────────────────────────────────┘
```

| | **Internal** | **External (Course Package Document)** |
|--|--------------|----------------------------------------|
| **Authority** | Runtime truth for members & SEO | Portable snapshot / transfer object |
| **Identity** | Numeric ids + unique `slug` | Stable **local keys** + optional `slug` hint |
| **Storage** | MySQL | File / API body / (later) object storage |
| **Consumers** | Next.js, members, SSO | Admins, CI, AI agents, board placement |
| **Lifecycle** | draft → published → archived | Immutable once exported (new export = new revision) |

**Invariant:** Import never silently overwrites a **published** course. Default import creates a **new draft** (or a new slug). Overwrite of draft requires explicit mode + admin confirmation (§7).

### 3.1 Pipeline (manual and automated converge here)

```
Research / intent
    → Blueprint (outline)                    [human gate 1]
        → Course Package Document            [full graph, validated]
            → Import / place → Internal MySQL course (draft)
                → In-place polish            [human]
                    → Publish                [human; never silent]
```

| Path | How it uses the Course Package |
|------|--------------------------------|
| **Manual create** | Human builds graph via in-place editor; **export** produces package; **import** can rehydrate elsewhere |
| **Manual save-as-file** | Export downloads `.course.json`; re-import creates or replaces draft |
| **Automated (board)** | Stages produce content → **materialize** into Course Package Document → validate → import `create_draft` or `replace_draft` |
| **CI / agents** | Validate + inspect without DB write; strict mode for automation gates |

### 3.2 Migration path from today’s placement_proposal

Today, `server/packages.py` materializes from a **placement plan** JSON (Production Package Spec §5) that is almost—but not exactly—the Course Package body.

| Today (`placement_proposal`) | Course Package Document |
|------------------------------|-------------------------|
| Flat `course_title`, `subtitle`, … | Nested under `package.course` |
| `resources[]` | `package.attachments[]` |
| Lesson `video_id` string | `lesson.video.video_id` + `provider` |
| No envelope / format version | Full envelope §4.1 |
| No local `key`s | Required unique `key`s |

**v1.0 requirement:** provide a pure adapter:

- `placement_plan_to_course_package(plan) → Course Package Document`  
- `course_package_to_placement_plan(doc) → plan` (lossy OK for fields placement never had)

**Target end-state:** board place and import **both** call the same import path that consumes a Course Package Document. Placement plan remains accepted as input via adapter until board artifacts are rewritten (no big-bang required).

---

## 4. External document: Course Package Document

### 4.1 Envelope

```json
{
  "format": "fattail.labs.course_package",
  "format_version": "1.0",
  "exported_at": "2026-07-26T18:00:00Z",
  "exported_by": { "kind": "human", "label": "ernie@fattail.ai" },
  "source": {
    "course_id": 12,
    "slug": "first-stop-the-bleeding",
    "status_at_export": "published"
  },
  "package": { }
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `format` | yes | Constant `fattail.labs.course_package` |
| `format_version` | yes | Document version string (`1.0`, `1.1`, …) — not app semver |
| `exported_at` | yes on export | ISO-8601 UTC; optional for hand-authored packages |
| `exported_by` | no | Actor label for audit (`kind`: human \| agent \| system) |
| `source` | no | Present when export from live course; omit for hand-authored / AI packages |
| `package` | yes | Body — §4.2 |

### 4.2 Package body (`package`)

Logical tree (array order = `sort_order`):

```
package
├── course          — identity & marketing fields
├── categories[]    — category slugs (must exist on import)
├── instructors[]   — instructor refs
├── modules[]
│   └── lessons[]
│       ├── video? / body_md? / quiz? / external_url?
│       └── attachments[]?   — lesson-level resources (optional)
└── attachments[]   — course-level resources
```

#### 4.2.1 `course`

| Field | Type | Required | Maps to DB |
|-------|------|----------|------------|
| `key` | string | yes | Local stable id within package (e.g. `course`) |
| `slug` | string | no* | `courses.slug` — *required on export; on import may be rewritten if collision |
| `title` | string | yes | `courses.title` |
| `subtitle` | string | no | `courses.subtitle` |
| `description_md` | string | yes† | `courses.description_md` — †required for **publish** validation; draft import may warn if empty |
| `level` | enum | yes | `beginner` \| `intermediate` \| `advanced` |
| `status` | enum | no | Export reflects source; import default always `draft` unless mode `publish` |
| `trailer_video_id` | string \| null | no | YouTube id (normalized) or Bunny id per provider policy |
| `hero_image_url` | string \| null | no | Labs media path or absolute https |
| `card_color` | string \| null | no | `courses.card_color` |
| `certification_enabled` | bool | no | default false |

#### 4.2.2 `modules[]`

| Field | Type | Required | Maps to DB |
|-------|------|----------|------------|
| `key` | string | yes | Local id (e.g. `mod-1`) |
| `title` | string | yes | `modules.title` |
| `kind` | enum | yes | `standard` \| `worksheets` \| `resources` \| `bonus` |
| `description_md` | string | no | **Package / blueprint bridge** — not in MySQL `modules` today; preserved in package; not dropped on round-trip of package files |
| `lessons` | array | yes | Empty only for draft-grade packages (warning) |

#### 4.2.3 `lessons[]`

| Field | Type | Required | Maps to DB |
|-------|------|----------|------------|
| `key` | string | yes | Local id (e.g. `les-1-1`) |
| `slug` | string | no* | `lessons.slug` — generated on import if absent (`_slugify(title)`) |
| `title` | string | yes | `lessons.title` |
| `kind` | enum | yes | `video` \| `text` \| `download` \| `external` \| `replay` \| `quiz` |
| `duration_seconds` | int ≥ 0 | no | default 0 |
| `free_preview` | bool | no | default false |
| `body_md` | string \| null | no | Lesson notes / markdown |
| `external_url` | string \| null | no | For `external` / some downloads |
| `video` | object \| null | no | See below |
| `quiz` | object \| null | no | See below |
| `attachments` | array | no | Lesson-level attachments (§4.2.4 shape) |

**`video` object** (maps to `lessons.video_id`, `video_provider`, `video_params`)

| Field | Type | Notes |
|-------|------|--------|
| `provider` | `youtube` \| `bunny` | default `youtube` |
| `video_id` | string | Normalized id / GUID |
| `params` | object | Allowlisted player params only (`start`, `end`, …) — same allowlist as admin API |

**Legacy accept on import (adapter):** flat `video_id` + optional `video_provider` on the lesson object → normalize into `video`. Export always uses nested `video`.

**`quiz` object** (when `kind = quiz`; maps to `quiz_questions`)

| Field | Type | Notes |
|-------|------|--------|
| `questions[]` | array | Each: `kind`, `prompt_md`, `options`, `correct`, `explanation_md`, `sort_order` — aligns with Quizzes Spec |

#### 4.2.4 `attachments[]` (course-level or lesson-level)

| Field | Type | Required | Maps to DB |
|-------|------|----------|------------|
| `key` | string | yes | Local id |
| `title` | string | yes | `attachments.title` |
| `kind` | `file` \| `link` | yes | `attachments.kind` |
| `url` | string | yes | `attachments.url` — Labs `/api/media/…` or https |
| `free_preview` | bool | no | `attachments.free_preview` |
| `description_md` | string \| null | no | `attachments.description_md` |
| `emoji` | string \| null | no | `attachments.emoji` |

Course-level: `owner_type=course`. Lesson-level: `owner_type=lesson` after lesson row exists.

#### 4.2.5 `categories[]` / `instructors[]`

- **Categories:** list of **slugs** that must exist in the target environment (or import fails with actionable error).  
- **Instructors:** list of `{ "key", "name" }` and/or `{ "id" }` — resolve by id if present else unique name match; unresolved → **error**. No silent create in v1 unless flag `create_missing_instructors: true` (default **false**).

### 4.3 Local keys

- All `key` values **unique within the package**.  
- Export generates keys from stable prefixes + sort index (e.g. `mod-1`, `les-1-2`, `att-c-1`).  
- Import maps keys → new DB ids; **never** reuses package keys as MySQL primary keys.  
- Response includes `key_map` for tooling: `{ "mod-1": 42, "les-1-1": 99, … }`.

### 4.4 File convention

| Item | Convention |
|------|------------|
| Extension | `.course.json` (recommended) or `.json` |
| MIME | `application/json` |
| Encoding | UTF-8 |
| Pretty-print | Export may pretty-print; import accepts either |

### 4.5 Example (truncated)

```json
{
  "format": "fattail.labs.course_package",
  "format_version": "1.0",
  "exported_at": "2026-07-26T18:00:00Z",
  "package": {
    "course": {
      "key": "course",
      "slug": "first-stop-the-bleeding",
      "title": "First, Stop the Bleeding",
      "subtitle": "Capital preservation as a trading system",
      "description_md": "…",
      "level": "beginner",
      "trailer_video_id": "izSfocWOB0E",
      "hero_image_url": "/api/media/….jpg",
      "card_color": null,
      "certification_enabled": true
    },
    "categories": ["fat-tail-doctrine", "risk-sizing"],
    "instructors": [{ "key": "ernie", "name": "Ernie Varitimos" }],
    "modules": [
      {
        "key": "mod-1",
        "title": "Module 1 — The Anatomy of the Bleed",
        "kind": "standard",
        "description_md": "Why accounts die and what stop-the-bleeding means.",
        "lessons": [
          {
            "key": "les-1-1",
            "slug": "why-accounts-die",
            "title": "Why Accounts Die: The Unbounded Loser",
            "kind": "video",
            "duration_seconds": 338,
            "free_preview": true,
            "video": {
              "provider": "youtube",
              "video_id": "aqz-KE-bpKQ",
              "params": {}
            },
            "body_md": null
          }
        ]
      }
    ],
    "attachments": []
  }
}
```

---

## 5. Validation

### 5.1 Validation modes

| Mode | Use |
|------|-----|
| **`structural`** | Schema, enums, key uniqueness, required fields for **draft** grade |
| **`publish`** | Structural + ready-to-publish bar (description, ≥1 standard module with ≥1 lesson, video completeness, doctrine lint) |
| **`strict`** | Publish + no warnings allowed (CI / automation gate) |

### 5.2 Error vs warning

| Level | Meaning |
|-------|---------|
| **error** | Import / publish blocked |
| **warning** | Allowed for draft import; blocked in `strict` |
| **info** | Advisory (e.g. slug will be rewritten) |

### 5.3 Structural rules (errors unless noted)

1. `format` is `fattail.labs.course_package` and `format_version` is known.  
2. `package.course.title` non-empty.  
3. `level` ∈ `beginner` \| `intermediate` \| `advanced`.  
4. Module/lesson/attachment `kind` ∈ allowlists (same as admin API).  
5. All `key` values unique within the package.  
6. Lesson `slug` unique **within module** if provided.  
7. `video.provider` / `params` allowlisted when `video` present.  
8. `quiz.questions` structurally valid when present; if `kind=quiz` and mode is `publish`, empty questions → **error**.  
9. Category slugs exist in target environment **on import** (validate-only may skip env checks or mark as env-dependent).  
10. URLs for attachments/hero are non-empty strings when present.  
11. Unknown `format_version` major → **error**. Unknown keys under `package` → **warning** (structural) / **error** (strict).

### 5.4 Publish rules (additional)

1. `description_md` non-empty (default min length ≥ 40 chars).  
2. ≥ 1 module with `kind=standard`.  
3. ≥ 1 lesson overall.  
4. Doctrine lint: profit-claim patterns → **error** on title/subtitle/description and lesson titles (same family as blueprint lint; process outcomes only).  
5. Free-preview: product policy default = **warning** if zero free preview lessons (not hard error).  
6. Video lessons without `video.video_id` → **warning** on draft, **error** on publish (unless explicit empty-lesson policy later).

### 5.5 Validation report shape

```json
{
  "ok": false,
  "mode": "publish",
  "format_version": "1.0",
  "errors": [
    {
      "code": "LESSON_VIDEO_MISSING",
      "path": "package.modules[0].lessons[1]",
      "message": "Video lesson requires video.video_id for publish"
    }
  ],
  "warnings": [
    {
      "code": "SLUG_COLLISION",
      "path": "package.course.slug",
      "message": "Slug in use; import will use first-stop-the-bleeding-2"
    }
  ],
  "info": [],
  "stats": {
    "modules": 3,
    "lessons": 12,
    "free_preview_lessons": 2,
    "quizzes": 1,
    "attachments": 0
  }
}
```

`path` uses JSONPath-like dotted/indexed paths for tooling and UI.

### 5.6 Inspect (no write)

```json
{
  "format": "fattail.labs.course_package",
  "format_version": "1.0",
  "outline": {
    "title": "…",
    "slug": "…",
    "level": "beginner",
    "modules": [
      {
        "key": "mod-1",
        "title": "…",
        "kind": "standard",
        "lessons": [
          { "key": "les-1-1", "title": "…", "kind": "video", "has_video": true }
        ]
      }
    ]
  },
  "stats": { "modules": 3, "lessons": 12, "attachments": 2, "quizzes": 1 }
}
```

---

## 6. Mapping: package ↔ internal

### 6.1 Export algorithm (from live course)

1. Load admin course graph (course + modules + lessons + attachments + categories + instructors + quiz questions for quiz lessons).  
2. Project to package body; assign keys; set envelope `source` + `exported_at`.  
3. Do **not** include enrollments, progress, reviews, threads, certificates of members, actor events.  
4. Media: keep URLs and video ids as stored (no binary embed in v1.0).  
5. Nested `video` object always; never omit known provider defaults incorrectly.

### 6.2 Import algorithm (to draft course)

1. If input is legacy placement plan, run adapter → Course Package Document.  
2. `validate(document, mode=structural|publish)` — stop on errors.  
3. Resolve slug: use package slug if free; else `slug-2`, `slug-3`, … (info in report).  
4. In a **transaction**: create course draft; create modules/lessons in order; set video, body_md, free_preview, kinds; create quiz questions; set categories/instructors/attachments.  
5. Leave status **`draft`** unless `import_mode=publish` **and** validate(publish) ok.  
6. Return `{ slug, course_id, validation, key_map }`.  
7. Fail loud on partial write (rollback).

### 6.3 Diff (optional later)

- `diff(package_a, package_b)` for automation review — not required for v1.0 DoD.

---

## 7. Import modes

| Mode | Behavior |
|------|----------|
| `create_draft` (**default**) | Always new course row; slug uniquified |
| `replace_draft` | Target must exist, status must be `draft`; **replaces** modules/lessons/attachments graph (delete-and-rebuild under same `course_id`); updates course fields |
| `publish` | create_draft (or replace_draft if `target_slug` + replace) then set published **only if** validate(publish) ok |

**Forbidden in v1.0:** silent `replace_published`. Operator must unpublish via normal lifecycle first, then replace_draft, then re-publish.

---

## 8. API surface (admin-only)

```
POST /api/admin/course-packages/validate
  body: { "document": <Course Package Document>, "mode"?: "structural"|"publish"|"strict" }
  → validation report

POST /api/admin/course-packages/inspect
  body: { "document": <Course Package Document> }
  → outline + stats

POST /api/admin/course-packages/import
  body: {
    "document": <Course Package Document>,
    "mode"?: "create_draft"|"replace_draft"|"publish",
    "target_slug"?: string
  }
  → { slug, course_id, validation, key_map }

GET  /api/admin/courses/{slug}/package
  → full Course Package Document (export)

POST /api/admin/courses/{slug}/package
  body: document (implies replace_draft for that slug)
  → same as import replace_draft
```

All endpoints: **administrator** session (or agent with explicit scope — later). Fail loud on auth.

**Optional storage (v1.1):** `course_package_revisions` for audit snapshots — not required for v1.0 if export is pure projection.

**Board integration (same release or immediately after):**  
`apply_placement` adapts placement plan → Course Package Document → shared import path (replace_draft semantics already match Production Package Spec §6).

---

## 9. Admin / operator UX (minimum)

| Surface | Behavior |
|---------|----------|
| Course edit chrome **Export package** | Download `.course.json` |
| Catalog / admin tools **Import course** | Upload JSON → validate panel → create draft → open draft editor (stay-put / in-place per Application Framework) |
| Validation panel | Errors/warnings with `path` before write |
| Board placement | Automation materializes package; placement runs import; human polish + publish remain in-place |

Manual in-place editing remains the human polish tool; the package is the **file-level** representation of the same graph.

---

## 10. Security & trust

1. Import / export / validate / inspect that write or accept bodies: **admin-only**.  
2. Imported URLs are **not** fetched server-side in v1.0 (SSRF avoidance); store as-is; media should already be Labs-hosted or trusted https.  
3. No execution of embedded scripts; `body_md` sanitized on render as today.  
4. Package must not contain session tokens, member identity ids, progress, or PII.  
5. Doctrine: publish validation rejects profit-claim marketing copy (Sierra / Hotel / Tango).  
6. Unknown format major version: refuse import.

---

## 11. Versioning

| Change | Version bump |
|--------|----------------|
| Additive optional fields | `1.x` minor |
| Breaking field rename/remove | `2.0` |
| Enum expansion | minor if purely additive |

Importers **must** reject unknown major versions. Unknown keys under `package` → **warning** in structural, **error** in strict.

JSON Schema file (implementation artifact):  
`server/schemas/course_package_v1.json` (or equivalent) — kept in lockstep with this spec.

---

## 12. Implementation plan (high level)

| Phase | Work | Owner |
|-------|------|--------|
| P0 | Spec approval (this doc) + decision log | Coach + India + Lima |
| P1 | JSON Schema + pure validate / inspect / adapters | Alpha + Kilo |
| P2 | Export `GET …/package` | Alpha |
| P3 | Import `create_draft` + `replace_draft` + tests (round-trip) | Alpha + Kilo |
| P4 | Admin UI: Export + Import + validation panel | Charlie (+ Echo) |
| P5 | Wire board place through package adapter | Alpha + board owners |
| P6 | Blueprint materialize → package document | Blueprint owners |
| P7 | Optional ZIP media bundle | Foxtrot / Alpha later |

---

## 13. Decisions

| ID | Decision | Default in this draft |
|----|----------|------------------------|
| **CP-D1** | Package format name | `fattail.labs.course_package` |
| **CP-D2** | Default import mode | `create_draft` |
| **CP-D3** | Media in v1.0 | URL / video id references only |
| **CP-D4** | Module `description_md` | Package field; not required in MySQL until schema add |
| **CP-D5** | Overwrite published | Forbidden in v1.0 |
| **CP-D6** | Create missing instructors/categories on import | Forbidden by default |
| **CP-D7** | File extension | `.course.json` recommended |
| **CP-D8** | Board placement | Converges on package import via adapter (no permanent dual graph) |
| **CP-D9** | Approval package vs course package | Distinct artifacts; do not overload names in code |

---

## 14. Definition of done (v1.0 implementation)

- [ ] Spec approved; decision log entry  
- [ ] JSON Schema + validate / inspect pure functions + characterization tests  
- [ ] Placement-plan adapter tests  
- [ ] Export round-trip: export → validate → import new draft → fields match within mapping rules  
- [ ] Import refuses published overwrite  
- [ ] Profit-claim strings fail publish validation  
- [ ] Admin can download package and upload package without SQL  
- [ ] Documented in `docs/ADMIN-GUIDE.md`  
- [ ] Board place either uses package path or has explicit gap issue filed with adapter in place  

---

## 15. Open questions (non-blocking for approval)

1. Should `module.description_md` get a MySQL column, or only live in packages/blueprints?  
2. ZIP media bundle timeline?  
3. Agent-scoped import (scoped token) vs human admin only for v1?  
4. Persist `course_package_revisions` in v1.0 or defer to v1.1?  

---

## 16. Relation to Course Hosting (runtime fields)

Where this document conflicts with Course Hosting domain rules for **runtime** field meaning or member-facing behavior, **Course Hosting wins**.  
This document owns:

- Portable envelope  
- Local keys  
- Validate / inspect / export / import behavior  
- Convergence of manual and automated create paths onto one graph  

---

*DRAFT v1.0 — no authority until Coach approves and Lima logs. Implementation must not start without Phase 5 approval per `agents/bench/spec-create-review-workflow.md`.*
