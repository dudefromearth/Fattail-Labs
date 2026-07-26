# FatTail Labs — Canonical Course Model Spec v1.0

**Status:** APPROVED FOR BUILD (Coach intent 2026-07-26; implements Draft v0.1)  
**Date:** 2026-07-26  
**Owner:** Coach · Orchestration: Juliet · Domain integrity: India  
**Priority:** **Core** — next step in course architecture evolution  
**Supersedes as portable contract:** Draft Course Package Spec v1.0 (same intent; this document is the canonical name and shape)  
**Parents:** Course Hosting Spec v1.0 · Production Package Spec v1.0 · Resource Library · Quizzes · SEO · Pathway · Live Sessions audience contract  
**Does not replace:** MySQL remains the **runtime** system of record for live member delivery. This model is the **portable, inspectable, agent-facing** definition of a Course.

### Coach decisions (2026-07-26) — media, kinds, free-preview

| # | Decision |
|---|----------|
| **CCM-D10** | **YouTube is the default (and current only) video provider** for trailers and lesson video. Other providers (e.g. local files) may be added later; not in v1.0 product path. |
| **CCM-D11** | **Preserve lesson `kind`** exactly on export/import: `video` \| `text` \| `download` \| `external` \| `replay` \| `quiz`. |
| **CCM-D12** | **Lesson- and course-level resources are pointers** to the generic Resource type (`resource_ids[]`). Do not embed resource binaries in the package. |
| **CCM-D13** | **All media except emoji** is a **reference**: either a **Resource** pointer or a **YouTube** id. Packages do **not** embed media blobs. Optional media ZIP is future (not v1.0). |
| **CCM-D14** | **Instructors export fully** — name, bio, avatar URL (as reference), links — in `bundle.instructors[]` (or equivalent). Not name-only. |
| **CCM-D15** | **SEO** — platform regenerates structured data from live course fields for now; package `seo` remains optional thin overrides only (undecided depth = defer). |
| **CCM-D16** | **`free_preview` is only an authorization flag.** Free-preview lessons have the **same** structure and content as any other lesson (full blocks, resources, video, notes). No separate “public notes” payload. |

---

## 0. One-paragraph standard

> A **Course** is a single versioned document: identity, audience, pathway position, modules/lessons, ordered **content blocks**, **references** to first-class platform entities (Resources, Categories, Media, Quizzes, Cast), SEO surface, and production/approval state. That document can be **saved**, **exported**, **imported**, **inspected**, and **validated** without SQL. Manual in-place editing and automated Content Studio / Quebec pipelines **converge** on this model. Platform entities already extracted elsewhere are **referenced**, not duplicated — full copies appear only inside an **export bundle** for portability.

---

## 1. Purpose

Define a single, versioned, machine-readable and human-editable definition of a **Course**.

This model is the contract used by:

| Consumer | Use |
|----------|-----|
| Administrators | Seed, review, export/import, polish in-place |
| Quebec / Content Studio | Produce work and freeze approval packages against a known shape |
| Platform | Import, export, validate, map to MySQL, render |
| Agents | Claim backlog items and assemble packages that conform |

**Round-trip invariant:** export from Labs → edit externally or in another tool → re-import **without loss of fidelity** for fields in this model that the runtime can store (see §10 mapping).

---

## 2. Design principles

1. **References over duplication**  
   Resources, Categories, Media assets, Live Session series, Cast avatars, and Quizzes (when platform-owned) are referenced by stable id or slug. Full embedding is allowed **only** inside an export bundle under top-level companion arrays.

2. **Hierarchy is explicit**  
   Course → Module (optional in the document; required in runtime via wrap rule) → Lesson → ContentBlock[].

3. **Production state is first-class in the document**  
   Draft/published/archived (runtime) and board production status, guardian flags, and approval history travel with the portable model when known.

4. **Agent-facing language**  
   Fields use domain terms (`audience_category`, `pathway_position`, `free_preview`, `content_blocks`) rather than raw column names.

5. **Fail loud**  
   Invalid references, missing required fields, or schema violations **abort** import. No silent defaults for identity fields. Unknown `model_version` major → refuse.

6. **One graph**  
   No third ad-hoc “course JSON” per feature. Placement plans adapt **into** this model; board place and admin import share one importer.

---

## 3. Document envelope

```json
{
  "format": "fattail.labs.canonical_course",
  "model_version": "1.0",
  "exported_at": "2026-07-26T18:00:00Z",
  "exported_by": { "kind": "human", "label": "admin@fattail.ai" },
  "source": {
    "course_id": 12,
    "slug": "first-stop-the-bleeding",
    "runtime_status": "published"
  },
  "course": { },
  "bundle": {
    "resources": [],
    "categories": [],
    "media": [],
    "quizzes": [],
    "casts": []
  }
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `format` | yes | Constant `fattail.labs.canonical_course` |
| `model_version` | yes | Document version (`1.0`, `1.1`, …) |
| `exported_at` | yes on export | ISO-8601 UTC |
| `exported_by` | no | Audit actor |
| `source` | no | Present when projected from live runtime |
| `course` | yes | Canonical course body (§4) |
| `bundle` | no | Full copies of referenced entities for offline portability (§5) |

**Alias accepted on import (adapter):** legacy `fattail.labs.course_package` / `format_version` + `package` body → this envelope (see §11).

**File convention:** `course.json` inside a directory bundle, or standalone `*.course.json`.

---

## 4. Core hierarchy

```
course
├── identity & metadata
├── audience & access
├── pathway position
├── modules[] (preferred)
│   └── lessons[]
│       ├── content_blocks[]
│       └── resource_ids[] / resource_refs[]
├── lessons[] (only if modules empty — import wraps into default module)
├── resource_ids[] (course-level)
├── trailer / banner (MediaRef)
├── seo
└── production
```

### 4.1 Course

| Field | Type | Required | Runtime map |
|-------|------|----------|-------------|
| `id` | string | yes | Stable key in document (`course` or UUID). **Not** MySQL PK. On import, never written as PK. |
| `slug` | string | yes | `courses.slug` (uniquified on collision for create) |
| `title` | string | yes | `courses.title` |
| `subtitle` | string | no | `courses.subtitle` |
| `description_md` | markdown | yes† | `courses.description_md` — †required for publish validation; draft may warn |
| `short_description` | string | no | `courses.short_description` |
| `status` | `draft` \| `published` \| `archived` | yes | `courses.status` — import default **draft** unless mode says otherwise |
| `version` | string | yes | Instance version of this course content (semver or date stamp); stored `courses.model_instance_version` |
| `level` | `beginner` \| `intermediate` \| `advanced` | yes | `courses.level` |
| `created_at` / `updated_at` | ISO 8601 | no on hand-authored; yes on export | timestamps |
| `category_slugs` | string[] | yes‡ | via `course_categories` — ‡empty allowed only for draft structural mode (warning) |
| `instructor_refs` | InstructorRef[] | no | via `course_instructors` |
| `audience_category` | `public` \| `members` \| `coaching` | yes | `courses.audience_category` — catalog/access intent; aligns with Live audience contract spirit (DL-036) |
| `pathway_position` | integer \| null | no | `courses.pathway_position` — null = not on pathway |
| `flagship` | boolean | no | `courses.flagship` — default false; “stop the bleeding” entry course |
| `trailer` | YouTubeRef | no | Trailer → `trailer_video_id` (YouTube id only in v1.0) |
| `banner` | ResourceRef \| MediaRef | no | Hero/card → `hero_image_url` as **resource or media library URL reference** (no binary) |
| `card_color` | string \| null | no | `courses.card_color` (not media) |
| `certification_enabled` | boolean | no | `courses.certification_enabled` |
| `estimated_duration_minutes` | integer | no | `courses.estimated_duration_minutes` |
| `learning_outcomes` | string[] | no | `courses.learning_outcomes_json` |
| `modules` | Module[] | no* | Prefer modules |
| `lessons` | Lesson[] | no* | Only when modules empty; import wraps |
| `resource_ids` | string[] | no | Course-level **pointers** to Resource entities |
| `related_live_series_ids` | string[] | no | JSON on course; Live series not owned by course |
| `seo` | SeoBlock | no | Optional thin overrides; platform regenerates JSON-LD (CCM-D15) |
| `production` | ProductionState | no§ | §yes when exported from board-linked course or automation; optional for pure manual courses |

\* At least one of `modules` (with lessons) or root `lessons` must be non-empty for **publish** validation.

### 4.2 Module

| Field | Type | Required | Runtime map |
|-------|------|----------|-------------|
| `id` | string | yes | Local key (e.g. `mod-1`) |
| `title` | string | yes | `modules.title` |
| `description_md` | markdown | no | `modules.description_md` |
| `order` | integer | yes | `modules.sort_order` |
| `kind` | `standard` \| `worksheets` \| `resources` \| `bonus` | no | default `standard` |
| `lessons` | Lesson[] | yes | |

### 4.3 Lesson

| Field | Type | Required | Runtime map |
|-------|------|----------|-------------|
| `id` | string | yes | Local key |
| `title` | string | yes | `lessons.title` |
| `slug` | string | yes | `lessons.slug` (generated from title if missing on import) |
| `order` | integer | yes | `lessons.sort_order` |
| `kind` | enum | yes | **`video` \| `text` \| `download` \| `external` \| `replay` \| `quiz`** — preserved exactly (CCM-D11) |
| `free_preview` | boolean | no | **Authorization flag only** (CCM-D16). Default false. Does **not** change content shape. |
| `estimated_duration_minutes` | integer | no | derived from `duration_seconds` when exporting |
| `content_blocks` | ContentBlock[] | yes | Same structure whether free_preview is true or false |
| `resource_ids` | string[] | no | Lesson-scoped **pointers** to generic Resource entities (CCM-D12) |

### 4.4 ContentBlock (discriminated union)

Ordered list. Runtime **projects** blocks to/from today’s lesson columns. Multi-block lessons use `extra_blocks_json` for residual fidelity.

| Priority when materializing | Rule |
|----------------------------|------|
| **Lesson `kind`** | **Authoritative** when present (CCM-D11). Do not re-infer over an explicit kind. |
| Notes | First `notes` block → `body_md`; additional notes concatenated with `\n\n` |
| Video | First `video_clip` → video columns (YouTube id) when kind is `video` or `replay` |
| Quiz | First `quiz` → questions table when kind is `quiz` |
| Extra blocks | Stored in `lessons.extra_blocks_json` when present |

#### `type: "video_clip"`

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | Local key |
| `provider` | no | **v1.0: `youtube` only** (default). Other providers reserved for later. |
| `video_id` | yes* | YouTube video id (normalized) |
| `params` | no | Allowlisted player params |
| `avatar_id` / `cast_id` | no | Production metadata only (not a media embed) |
| `render_job_id` | no | Production job id |
| `script_md` | no | Optional text; not a media blob |
| `captions_url` | no | URL **reference** only if used |
| `duration_seconds` | no | |

#### `type: "notes"`

| Field | Required |
|-------|----------|
| `id` | yes |
| `body_md` | yes |

#### `type: "quiz"`

| Field | Required | Notes |
|-------|----------|--------|
| `id` | yes | |
| `quiz_id` | no | Platform quiz entity ref (future) |
| `questions` | no* | Inline definition — *required if no quiz_id |

Question shape (inline): `kind`, `prompt_md`, `options`, `correct`, `explanation_md`, `order`.

#### `type: "assignment"` (v1 accepted, limited runtime)

| Field | Required |
|-------|----------|
| `id` | yes |
| `instructions_md` | yes |
| `submission_type` | no — `none` \| `link` \| `file` \| `text` |

Runtime: stored primarily as notes/`extra_blocks_json`; lesson kind `text` or `download`.

#### `type: "resource_link"`

| Field | Required |
|-------|----------|
| `id` | yes |
| `resource_id` | yes |

#### `type: "external"`

| Field | Required |
|-------|----------|
| `id` | yes |
| `url` | yes |
| `label` | no |

Future types via extension: unknown types → **warning** structural / **error** strict (unless `extra_blocks_json` round-trip path).

### 4.5 Media and resource references (CCM-D10, D12, D13)

**Rule:** Packages never embed media binaries. Emoji characters in text fields are fine.

| Kind of asset | How it appears in the package |
|---------------|-------------------------------|
| Lesson / trailer **video** | YouTube id (`provider: "youtube"`, `video_id`) |
| Downloadable files, images used as resources | **`resource_id` pointer** to Resource entity |
| Hero / banner image | URL **reference** or resource pointer (same Labs media path / https) — not a zip entry |
| Emoji | Inline in markdown / `emoji` field on resources |

```json
// YouTube (trailer or video_clip)
{ "source": "youtube", "provider_id": "izSfocWOB0E", "type": "video" }

// Resource pointer
{ "resource_id": "att-42" }
// optional lightweight metadata for display (not binary):
// title, kind, url (reference string), free_preview, description_md, emoji
```

**No media ZIP in v1.0.** A future optional packer may add binaries; out of scope now.

### 4.6 Instructor (full profile — CCM-D14)

On the course body, instructors may be listed as refs. **Export always includes full profiles** under `bundle.instructors[]`:

| Field | Type | Notes |
|-------|------|--------|
| `id` | string | Local key e.g. `inst-3` |
| `instructor_id` | number | Platform id when known |
| `name` | string | required |
| `bio_md` | markdown | full bio |
| `avatar_url` | string | **URL reference** (not embedded image bytes) |
| `links_json` | object \| array | social / site links as stored |

Import: resolve by `instructor_id` else unique `name`; if missing, **create** instructor row from bundle profile (name + bio + avatar_url + links). Course join uses resolved id.

### 4.7 SeoBlock

| Field | Type | Notes |
|-------|------|--------|
| `title` | string | Optional override; default = course title |
| `description` | string | Optional meta description |
| `canonical_path` | string | e.g. `/courses/{slug}` |
| `json_ld` | object | Optional; **platform regenerates** Course JSON-LD from live fields if omitted (CCM-D15) |

### 4.8 ProductionState

| Field | Type | Notes |
|-------|------|--------|
| `status` | enum | Board statuses: `draft`, `queued`, `in_production`, `awaiting_approval`, `published`, `rejected`, `revision_requested` — **distinct** from runtime `course.status` |
| `guardian_flags` | object[] | Hotel, Tango, lineage, etc. |
| `approval_history` | ApprovalEvent[] | admin identity label + timestamp + decision |
| `seed_id` | string | Backlog / Quebec seed reference |
| `content_vision_ref` | string | Content Vision link |
| `content_item_id` | number | Board card id when known |
| `placed_course_slug` | string | Echo of placement |

**Runtime rule:** ProductionState is **enrichment** from Content Board when linked. Import does **not** auto-transition board cards unless a dedicated place API is used. Import never auto-publishes the member course without `import_mode=publish` + publish validation.

---

## 5. Bundle (references vs embedding)

| Platform entity | In `course` body | In `bundle` |
|-----------------|------------------|-------------|
| **Resources** | `resource_ids[]` / block `resource_id` only | Optional **metadata** for resolution (title, kind, **url reference**, emoji) — **never binary** |
| **Categories** | `category_slugs[]` | Optional name/description metadata |
| **Instructors** | refs / order | **Full profiles** (bio, avatar **URL**, links) — CCM-D14 |
| **YouTube video** | ids on trailer / video_clip | Not duplicated as files |
| **Quizzes** | Inline questions on block (or future `quiz_id`) | Not required |
| **Cast** | optional production ids on video_clip | optional |
| **Live series** | `related_live_series_ids[]` only | not owned |
| **Pathway** | `pathway_position` only | Pathway collection is separate entity |

On import:

1. Resolve refs against target environment.  
2. If missing and present in `bundle`, create **only** when `import_options.create_missing_*` flags allow (default **false** for instructors/categories/resources).  
3. If still missing → **error** (fail loud).

---

## 6. Export / import formats

### 6.1 Single document

Primary: one JSON file conforming to §3 + JSON Schema  
`Specs/schemas/canonical-course-v1.json` (also copied under `server/schemas/` for runtime).

### 6.2 Directory bundle (v1.0 accept; packer optional)

```
course-slug/
├── course.json          # canonical model (required)
├── notes/               # optional split markdown (resolved into blocks on import)
├── scripts/             # optional
├── resources/           # optional full Resource copies
└── media/               # optional binary (v1.1 full support; v1.0 may ignore binaries)
```

- Export always produces valid `course.json`.  
- Import accepts single JSON **or** directory with `course.json`.  
- ZIP of directory: v1.1 preferred; v1.0 may accept JSON only in API body.

### 6.3 Import modes

| Mode | Behavior |
|------|----------|
| `create_draft` (default) | New course row; slug uniquified |
| `replace_draft` | Target exists and is `draft`; rebuild module/lesson graph under same id |
| `publish` | create or replace then set published **only if** validate(publish) ok |

**Forbidden:** silent replace of **published** courses.

---

## 7. Validation

### 7.1 Modes

| Mode | Use |
|------|-----|
| `structural` | Schema, keys, enums, draft-grade required fields |
| `publish` | Structural + ready-to-publish bar + doctrine lint |
| `strict` | Publish with zero warnings (CI / Quebec gate) |

### 7.2 Rules (summary)

1. `format` + known `model_version`.  
2. `course.title`, `slug`, `level`, `audience_category`, `version` present.  
3. Unique local `id`s within document.  
4. Content block types known or stored as extension.  
5. Referenced slugs/ids resolve (import / env-aware validate).  
6. Publish: description min length, ≥1 standard module (or wrapped), ≥1 lesson, video clips have video when kind video, quizzes have questions, profit-claim patterns → error.  
7. **`free_preview` is authorization only** — free-preview lessons use the same content rules as any lesson (CCM-D16). No separate public-notes payload.  
8. Cast refs: if `cast_id` set, optional production metadata only.

### 7.3 Report shape

```json
{
  "ok": false,
  "mode": "publish",
  "model_version": "1.0",
  "errors": [{ "code": "…", "path": "course.modules[0].lessons[1]", "message": "…" }],
  "warnings": [],
  "info": [],
  "stats": { "modules": 3, "lessons": 12, "blocks": 20, "resources": 2 }
}
```

---

## 8. Agent & administrator contracts

| Role | Contract |
|------|----------|
| **Quebec** | Validates approval package contents against this model (or adapter from stages → model) before `awaiting_approval` |
| **Administrators** | Human-readable outline + JSON at approval gate; export/import in admin UI |
| **Alpha** | Import/export/validate pure functions + API; MySQL mapping; migrations for new columns |
| **Charlie** | Admin Export / Import / validation panel; stay-put after import |
| **Sierra / Hotel / Tango** | Doctrine lint rules (process outcomes, no profit claims; capacity language) |
| **India** | Single graph invariant; no parallel course store |
| **Lima** | Decision log + docs parity |
| **Delta / Kilo** | Round-trip characterization tests; gates |

---

## 9. Resolved open questions (v1.0)

| # | Question | Resolution |
|---|----------|------------|
| 1 | Other reference-only entities | Categories, Media, Cast, Live series, Instructors, Quizzes (when external id). Attachments remain runtime storage for Resources until Resource entity fully splits. |
| 2 | Quizzes inline vs entity | **Both:** prefer inline in lesson quiz block for self-contained export; `quiz_id` reserved for future shared quiz bank. |
| 3 | Post-publish versioning | v1.0: **in-place mutation** of draft/published via editor; `version` string bumps on export. Full course-version history table deferred (v1.1). |
| 4 | Pathway export | Course carries `pathway_position` only; Pathway collection model is a follow-on spec. |
| 5 | Schema location | `Specs/schemas/canonical-course-v1.json` + `server/schemas/canonical-course-v1.json` |
| 6 | Root lessons without modules | Allowed in document; **import wraps** into module `Default Module` / `kind=standard` with **info** log |
| 7 | Multi content blocks | Document supports many; runtime projects primary + notes + `extra_blocks_json` for fidelity |

---

## 10. Runtime mapping (MySQL)

### 10.1 New columns (migration)

| Table | Columns |
|-------|---------|
| `courses` | `short_description`, `pathway_position`, `flagship`, `audience_category`, `estimated_duration_minutes`, `learning_outcomes_json`, `related_live_series_ids_json`, `model_instance_version` |
| `modules` | `description_md` |
| `lessons` | `extra_blocks_json` (JSON NULL) |

### 10.2 Existing columns

Unchanged meaning for title, slug, description_md, level, status, trailer, hero, card_color, certification, video_*, body_md, free_preview, attachments, quiz_questions, categories, instructors.

### 10.3 Not in course package

Enrollments, progress, reviews, discussion threads, certificates of members, analytics.

---

## 11. Adapters

| From | To |
|------|-----|
| Placement plan (`placement_proposal`) | Canonical Course document |
| Legacy Course Package (`fattail.labs.course_package`) | Canonical Course document |
| Admin GET graph | Canonical Course document (export) |
| Canonical Course document | MySQL via import |

Board `apply_placement` **should** (implementation phase) call: plan → adapter → shared import (`replace_draft` semantics).

---

## 12. API surface (admin-only)

```
POST /api/admin/canonical-courses/validate
POST /api/admin/canonical-courses/inspect
POST /api/admin/canonical-courses/import
GET  /api/admin/courses/{slug}/canonical
POST /api/admin/courses/{slug}/canonical   # replace_draft
```

Aliases (optional): `/api/admin/course-packages/*` → same handlers for transitional naming.

---

## 13. Security

1. Admin (or scoped agent) only.  
2. No server-side fetch of arbitrary media URLs on import (SSRF).  
3. No member PII in documents.  
4. Markdown sanitized on render as today.  
5. Doctrine lint on publish mode.

---

## 14. Success criteria

| # | Criterion |
|---|-----------|
| S1 | Export → validate → import new draft → structure and mapped fields match |
| S2 | Missing required refs fail import loudly |
| S3 | Published course cannot be wiped via replace |
| S4 | Quebec/agents can validate JSON against schema without browser |
| S5 | Manual editor and automation converge on one importer |
| S6 | JSON Schema published in repo and kept in lockstep |

---

## 15. Implementation phases

| Phase | Work |
|-------|------|
| **C0** | Spec + architecture + design + decision log (this release docs) |
| **C1** | Migration + JSON Schema + pure validate/inspect/adapters |
| **C2** | Export + import APIs + characterization tests |
| **C3** | Admin UI export/import + validation panel |
| **C4** | Board place uses shared importer |
| **C5** | Directory/ZIP bundle polish (optional) |

---

## 16. Decisions locked

| ID | Decision |
|----|----------|
| **CCM-D1** | Format name `fattail.labs.canonical_course`, `model_version` `1.0` |
| **CCM-D2** | References over embed; bundle for portability |
| **CCM-D3** | Content blocks are canonical; runtime projects to lesson columns + `extra_blocks_json` |
| **CCM-D4** | Default import `create_draft`; no silent published overwrite |
| **CCM-D5** | ProductionState is portable enrichment; board transitions stay on board APIs |
| **CCM-D6** | Course Package draft is transitional alias of this model |
| **CCM-D7** | Modules preferred; root lessons auto-wrap on import |
| **CCM-D10–D16** | See Coach decisions table at top (YouTube default, preserve kinds, resource pointers, no media zip, full instructors, SEO defer, free_preview = auth flag) |

---

*Canonical Course Model v1.0 — portable contract for course architecture. Runtime field semantics remain under Course Hosting; this document owns the portable shape, validation, and import/export behavior.*
