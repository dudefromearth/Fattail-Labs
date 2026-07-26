# FatTail Labs — Resource Spec v1.0

**Status:** DRAFT — implementation plan ready (`agents/p-resources/`); awaiting Coach **build** approval  
**Priority:** Core domain — first-class versioned materials (logs, worksheets, process graphics)  
**Orchestration:** `agents/p-resources/ORCHESTRATOR.md` · `IMPLEMENTATION-PLAN.md`  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Parents:** Course Hosting Spec v1.0 · Canonical Course Model Spec v1.0 · Media Library Spec v1.0  
**Supersedes (as domain model):** Resource Library Specs v1.0–v1.2 for **entity shape and ownership**. Library UI/access rules from those specs remain guidance until re-mapped.  
**Does not replace:** MySQL runtime for member delivery; private file storage under `uploads/private/`; Canonical Course Model pointers (`resource_ids` / slug + version).

**Reviewers (PENDING):**

| Gate | Reviewer | Concern |
|------|----------|---------|
| Architecture | **India** | First-class entity; no dual orphan stores long-term; migration from `attachments` |
| Backend | **Alpha** | Schema, version immutability, publish invariant |
| Security | **Mike** | Download gates; private files; admin-only publish |
| Frontend / UX | **Charlie · Echo** | Library vs course surfaces; version pickers |
| Member honesty | **Tango** | Visibility = publish, not deceptive “hidden course material” |
| Approver | **Coach** | Ship / defaults |

---

## 0. One-paragraph standard

> A **Resource** is a first-class, versioned library object (slug, title, description, type, category) that may be **linked** to zero or more courses. **Updates create a new version**; older versions remain. **At most one version is published** at a time; the resource **slug always resolves to that published version** (or is not publicly listable if none is published). **Courses pin a specific version** and **always show** linked resources in the course Resources experience. The global **Resources** hub lists only **published** resources for member-wide discovery — so frequently updated assets (Excel trade logs, process infographics, worksheets) can ship new cuts without silently breaking every course pin or flooding the hub.

---

## 1. Purpose & motivating cases

### 1.1 Why this exists

Operators maintain materials that change often:

| Example | Why versioning matters |
|---------|------------------------|
| Excel / CSV **trade log** or sizing sheet | Template columns evolve; old courses may keep a frozen cut |
| **Process infographic** (PDF/PNG) | Doctrine wording updates; pathway courses may lag |
| Worksheet / checklist | New steps without breaking an in-flight cohort |

Requirements:

1. **First-class** library identity (not “only an attachment of one course”).  
2. **History** — old versions keep existing.  
3. **Course stability** — creator chooses which version the course uses.  
4. **Member-wide control** — admin chooses what appears in the global Resources hub (publish).  
5. **Canonical Course packages** point at resources by **slug** (+ optional pinned version), not embedded files.

### 1.2 Success criteria

| # | Criterion |
|---|-----------|
| S1 | Admin can create a Resource with slug, title, description, type, category, and initial version payload. |
| S2 | Updating content creates version N+1; version N remains readable. |
| S3 | At most one `published` version per resource; publishing another unpublishes the previous. |
| S4 | Slug resolution (member library / public resource URL) serves **only** the published version. |
| S5 | Course can attach existing resource or create new (auto library + link); course always surfaces linked resource at **pinned** version. |
| S6 | Unpublishing removes from global Resources hub; course pin still shows on the course. |
| S7 | Canonical Course Model import/export uses resource **slug** (and pin version when specified). |
| S8 | Characterization tests prove publish invariant + pin ≠ published. |

### 1.3 Non-goals (v1.0)

- Full digital asset management (DAM) / CDN packaging of every media type.  
- Member-authored resources.  
- Automatic “bump all course pins to latest published.”  
- Semver marketing (use integer versions first).  
- Replacing YouTube lesson video (video remains course lesson / YouTube per CCM).  
- Media ZIP inside course packages (still deferred).

---

## 2. Domain model

### 2.1 Entities

```
Resource (stable identity)
├── slug, title, description_md
├── type, category_slug (or category_id)
├── published_version_id  → NULL | one ResourceVersion
└── versions[]
    └── ResourceVersion (immutable content snapshot)
        ├── version (int 1..n)
        ├── payload (file ref | link url | …)
        ├── description_md override? (optional; default inherit resource description)
        ├── changelog_md
        ├── created_at, created_by
        └── (not independently slugged)

CourseResourceLink
├── course_id
├── resource_id
├── pinned_version_id
├── sort_order
├── free_preview (access: free vs members — separate from library publish)
└── scope: course | lesson (+ lesson_id if lesson)
```

### 2.2 Resource (head)

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | bigint | yes | PK |
| `slug` | string | yes | Unique; URL-safe; **points to published version only** for public resolution |
| `title` | string | yes | Display name |
| `description_md` | markdown | yes† | Catalog/summary; †required for publish-to-library |
| `type` | enum | yes | See §2.4 |
| `category_slug` | string | yes | Taxonomy for library filters (reuse `categories` or resource-specific set — §9) |
| `published_version_id` | FK → version \| null | no | **At most one** published; null = not in global hub |
| `emoji` | string \| null | no | Display chrome (≤16 chars); not a media blob |
| `created_at` / `updated_at` | timestamps | yes | Head metadata; content changes bump versions, not rewrite payload |

### 2.3 ResourceVersion

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `id` | bigint | yes | PK |
| `resource_id` | FK | yes | Parent |
| `version` | int ≥ 1 | yes | Monotonic per resource; unique `(resource_id, version)` |
| `kind` | `file` \| `link` | yes | Align with current attachment kinds |
| `url` | string | yes | `private:{name}` or https link or media path **reference** |
| `title_override` | string \| null | no | Rare; default use resource title |
| `description_md` | markdown \| null | no | Version-specific notes; else resource description |
| `changelog_md` | markdown \| null | no | What changed in this cut |
| `byte_size` | int \| null | no | For files |
| `content_type` | string \| null | no | MIME if known |
| `created_at` | timestamp | yes | Immutable after create |
| `created_by_identity_id` | FK \| null | no | Actor |

**Immutability:** After insert, payload fields are **not updated**. “Edit” = new version row.

### 2.4 Type enum (v1.0)

| `type` | Intent | Examples |
|--------|--------|----------|
| `spreadsheet` | Excel/CSV/Google-export style tools | Trade log template, position sizer |
| `document` | Long-form / printable | PDF worksheet, checklist |
| `image` | Static visual | Process infographic, diagram |
| `link` | External URL | Notion, Drive, published sheet URL |
| `other` | Escape hatch | Fail loud if overused in strict CI |

Emoji may default by type when null (library UX).

### 2.5 CourseResourceLink

| Field | Type | Required | Notes |
|-------|------|----------|--------|
| `course_id` | FK | yes | |
| `resource_id` | FK | yes | |
| `pinned_version_id` | FK | yes | Version served **inside the course** |
| `sort_order` | int | yes | Course Resources tab order |
| `free_preview` | bool | no | Access on download when reached via course or library |
| `lesson_id` | FK \| null | no | If set, lesson-scoped presentation; still same resource |

**Uniqueness:** one link per `(course_id, resource_id)` for course-level; lesson links may allow `(course_id, lesson_id, resource_id)` if lesson-scoped.

**Invariant:** Course UI **always** shows linked resources (using pin). There is **no** “hide on course” flag. Library publish is independent.

### 2.6 Publish / visibility (library)

| Concept | Meaning |
|---------|--------|
| **Published version** | The single version pointed to by `resource.published_version_id` |
| **Library listed** | Resource appears in `GET /api/resources` / `/resources` **iff** `published_version_id IS NOT NULL` and (for member library) access rules pass |
| **Slug resolve** | `GET /resources/{slug}` or API by slug returns **published** version only; if unpublished → 404 (or admin preview with flag) |
| **Unpublish** | Set `published_version_id = NULL`; history retained; course pins unaffected |

**Invariant:** Never two published versions. Publishing version B sets `published_version_id = B` (A ceases to be published automatically).

---

## 3. Access control (orthogonal to publish)

| Axis | Field | Controls |
|------|-------|----------|
| **Discovery (library)** | `published_version_id` | Whether resource appears in global Resources hub |
| **Entitlement (open/download)** | `free_preview` on link and/or resource default | Free for signed-in vs membership (alumni+) — same spirit as Resource Library v1.1 |

Rules (v1.0 default):

1. Global library: session required (as today).  
2. Download published library item: free_preview → any signed-in; else membership role gate.  
3. Course-linked pin: visible on course Resources tab to those who can see course resources (member/enrolled rules as Course Hosting); download still respects free_preview.  
4. Admins always pass download gates for ops.

---

## 4. Lifecycle & workflows

### 4.1 Create resource (library or admin)

1. Admin sets slug, title, description, type, category.  
2. Creates **version 1** with file or link.  
3. Optionally **Publish v1** → listed in hub; slug live.  
4. Default: new resources may start **unpublished** so course-only materials don’t flood the hub (product default: **unpublished** until explicit publish).

### 4.2 Create / attach from course

| Action | Result |
|--------|--------|
| **Attach existing** | `CourseResourceLink` with `pinned_version_id` default = published version if any, else latest version; creator may change pin |
| **Introduce new** | Create Resource + version 1 + link (pin = v1); resource appears in library store; **publish optional** (default off) |

### 4.3 Update content (new version)

1. Admin/creator uploads new file or changes link / notes.  
2. System inserts version `max+1` (immutable).  
3. Does **not** change `published_version_id` unless actor chooses **Publish this version**.  
4. Does **not** change course pins unless actor chooses **Update pin** on a course.

### 4.4 Publish (library visibility)

1. Admin selects a version → **Publish**.  
2. `published_version_id` set to that version; previous published (if any) no longer published.  
3. Slug now serves the new cut in the hub.  
4. Courses still on old pins keep old files.

### 4.5 Unpublish

1. Admin clears library visibility.  
2. Hub listing gone; slug member resolve 404.  
3. Courses with pins still show resource.

---

## 5. Member & admin surfaces

### 5.1 Global Resources (`/resources`)

- Lists resources with **published** version only.  
- Card: emoji, title, description, type, category, version number of published cut, linked course(s) as **labels** (from links — informational).  
- Admin: create; edit head metadata; **new version**; **publish / unpublish**; set free_preview; do **not** silently rewrite old version payloads.

### 5.2 Course Resources tab

- Lists **linked** resources at **pinned** version (title, type, download/open, free badge).  
- Always visible when linked (no library-publish requirement).  
- Admin/creator: attach existing; create new; change **pinned version**; reorder; free_preview on link.  
- Indicate pin: e.g. “v3 (pinned)” and whether v3 is also library-published.

### 5.3 Resource detail (admin)

- Version history table (v1…vn), published badge on one row.  
- Actions: Publish, Download/open that version, New version from upload.

---

## 6. API surface (admin + member)

### 6.1 Member / session

```
GET  /api/resources
  → published resources only [{ slug, title, description_md, type, category,
       version, free, emoji, courses: [{slug,title}], … }]

GET  /api/resources/{slug}
  → published version payload or 404 if unpublished

GET  /api/resources/{slug}/download   (or by version id for pin — see below)
  → gated stream / redirect
```

Course payload attachments replaced (or dual-written during migration) with:

```
resources: [{ slug, title, type, pinned_version, free_preview, download_url }]
```

### 6.2 Admin

```
GET    /api/admin/resources
POST   /api/admin/resources                    # create head + v1
GET    /api/admin/resources/{slug}
PATCH  /api/admin/resources/{slug}             # head fields only (title, description, type, category, emoji)
POST   /api/admin/resources/{slug}/versions    # new version (file/link + changelog)
POST   /api/admin/resources/{slug}/publish     # body: { version: N } | unpublish: { version: null }
GET    /api/admin/resources/{slug}/versions

POST   /api/admin/courses/{slug}/resources     # attach { resource_slug, pinned_version?, free_preview? }
PATCH  /api/admin/courses/{slug}/resources/{resource_slug}  # pin, sort, free_preview
DELETE /api/admin/courses/{slug}/resources/{resource_slug}  # unlink only (does not delete resource)
```

Fail loud: invalid slug, publish unknown version, pin missing version, second concurrent publish race → transaction + unique partial index on published.

### 6.3 Download by pin

Course UI requests download with **pinned version id** (authorized via course link), not only slug-published, so older pins remain downloadable after a new library publish.

```
GET /api/attachments/{version_id}/download  → migrate to
GET /api/resource-versions/{id}/download
```

---

## 7. Canonical Course Model alignment

| Package field | Meaning |
|---------------|---------|
| `resource_ids[]` / refs | Prefer **`slug`** (stable) |
| Optional `pinned_version` | Integer version for course pin on import |
| Bundle | Optional **metadata only** (slug, title, type, version numbers, url **references**) — no binary zip (CCM-D13) |

Import:

1. Resolve resource by slug in target env.  
2. If missing and bundle has metadata + url ref, create resource + version (policy flag).  
3. Create `CourseResourceLink` with pin.  
4. Do not auto-publish unless import option says so.

Export:

1. Emit slugs + pinned versions for links.  
2. Optionally include lightweight metadata for offline review.

---

## 8. Storage & media

| Kind | Storage |
|------|---------|
| `file` | Private tier `private:{name}` under `uploads/private/` (Resource Library private rules) |
| `link` | https URL stored as reference |
| Image type | Prefer private file or media library **url reference**; no package embed |

Video for lessons remains **YouTube** on the lesson (CCM), not a Resource type in v1.0 unless later added as `link` to a video page.

---

## 9. Categories

**v1.0 recommendation:** reuse platform `categories` (course taxonomy) for resource filter chips **or** introduce `resource_categories` if product wants a separate vocabulary.

**Decision default:** reuse `categories.slug` for hub filters (less UI surface). Open to Coach override (§12).

---

## 10. Migration from `attachments` (as-built Resource Library)

Today: library = `attachments` where `owner_type=course` on published courses.

| Step | Action |
|------|--------|
| M1 | Add `resources`, `resource_versions`, `course_resource_links` tables |
| M2 | For each course-level attachment: create Resource (slug from title), Version 1, link with pin=v1, set published if course published |
| M3 | Dual-read: library API from new tables; course tab from links |
| M4 | Dual-write admin create on course → new resource path |
| M5 | Deprecate writing new orphan-only attachments for library; keep attachment table for transition or map 1:1 |

Lesson-level attachments: migrate to links with `lesson_id` set.

**No silent data loss:** every migrated attachment becomes version 1.

---

## 11. UI rules (operator)

| Surface | Content edit | Version pin | Library publish | free_preview |
|---------|--------------|-------------|-----------------|--------------|
| Global Resources admin | New version / head metadata | n/a | **Yes** (publish flag) | Yes |
| Course Resources admin | Create new resource or open library editor | **Yes** | Optional shortcut | Yes on link |
| Member `/resources` | — | — | sees published only | badge |
| Member course tab | — | sees pin | — | badge |

When a resource is linked to courses, library UI **shows linked course chips** (one or more). Content versioning still happens on the Resource admin; course only changes **pin**.

---

## 12. Decisions locked (this draft)

| ID | Decision |
|----|----------|
| **RES-D1** | Resource is first-class; courses **link**, do not own exclusively |
| **RES-D2** | Immutable versions; integer sequence |
| **RES-D3** | At most one published version; slug → published only |
| **RES-D4** | Course pin independent of published; course always shows linked resource at pin |
| **RES-D5** | Library visibility = publish (`published_version_id`) |
| **RES-D6** | Default new resource **unpublished** to hub until explicit publish |
| **RES-D7** | free_preview remains access gate, separate from publish |
| **RES-D8** | Canonical package uses slug + optional pinned version; no binary embed |
| **RES-D9** | Motivating types: spreadsheet, document, image, link (frequent-update materials) |

---

## 13. Open questions (non-blocking if defaults kept)

1. Reuse course `categories` vs dedicated resource categories? (**Default: reuse.**)  
2. Who may publish — administrator only, or course creator for resources they created? (**Default: administrator only for publish; creators may create versions if admin.**)  
3. Semver later? (**Default: integers in v1.0.**)  
4. Soft-delete resource with links? (**Default: archive head; block delete if links exist unless force.**)

---

## 14. Implementation phases (high level)

| Phase | Work | Owner |
|-------|------|--------|
| R0 | Spec approval + decision log | Coach · India · Lima |
| R1 | Schema migration + pure version/publish invariants | Alpha · Kilo |
| R2 | Admin API + dual-read library | Alpha |
| R3 | Course attach/create UI + pin picker | Charlie · Echo |
| R4 | Member library + course tab cutover | Charlie |
| R5 | Attachment backfill migration | Alpha · Foxtrot (files) |
| R6 | Canonical Course Model import/export slug pins | Alpha |
| R7 | Remove dual-write / deprecate attachment library path | Alpha · Delta |

---

## 15. Definition of done (v1.0 implementation)

- [ ] Spec approved; DL entry  
- [ ] Tables + publish invariant tests (unique published per resource)  
- [ ] Create version immutability proven  
- [ ] Pin ≠ published proven (course shows old; hub shows new)  
- [ ] Unpublish hides hub, course pin remains  
- [ ] Migration of existing attachments  
- [ ] Canonical package docs updated for slug + version  
- [ ] ADMIN-GUIDE operator section  

---

## 16. Relation to prior Resource Library specs

| Spec | Status after this |
|------|-------------------|
| Resource Library v1.0–v1.2 | **UI/gating heritage**; entity model **replaced** by this spec when R* ships |
| Canonical Course Model v1.0 | CCM-D12 pointers → this Resource entity |
| Media Library | Storage for public images; private files for resource versions |

---

*Resource Spec v1.0 — versioned first-class materials for FatTail Labs. No authority until Coach approves and Lima logs. Implementation follows agents plan after approval.*
