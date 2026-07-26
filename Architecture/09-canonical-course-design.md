# Design — Canonical Course Model (portable + admin)

**Status:** As-built MVP + residual polish (2026-07-26)  
**Spec:** Canonical Course Model Spec v1.0  
**Architecture:** `Architecture/08-canonical-course-model.md`  
**HIG:** Human Interface Spec v1.0 · Application Framework v1.0 (stay-put)

---

## 1. Design goals

1. Operators can **see** a course as a tree without opening SQL.  
2. Export/import feel like normal admin tools (download JSON, upload, validate, open draft).  
3. Validation messages use **paths** (`course.modules[0].lessons[1]`) so agents and humans share language.  
4. No emoji as chrome; tokens only; AlertDialog for destructive replace.  
5. Language matches Coach model: **package** in UI; **canonical course** in docs/API.

---

## 2. Information architecture

### 2.1 Portable document outline (inspect view)

```
Course title · slug · status · level · audience
├── Instructors (full profiles in bundle)
├── SEO (collapsed; platform regenerates JSON-LD)
├── Production (collapsed when empty)
├── Module 1
│   ├── Lesson A  [kind=video]  free-preview?
│   └── Lesson B  [kind=quiz]
├── Module 2 …
└── Resources (n pointers)
```

Stats: modules · lessons · blocks · free-preview count · resource pointers · warnings.

**free_preview** appears as a badge (“Free preview”) — it is **not** a different content type.

### 2.2 Admin surfaces (shipped MVP)

| Surface | Placement | Behavior |
|---------|-----------|----------|
| **Export package** | Course edit bar (edit mode) | Downloads `{slug}.course.json` |
| **Import package** | Catalog grid (admin) | File picker → validate → create draft → `/admin/courses/{slug}` |
| **Validation** | On import (API structural mode) | Errors block import; first error shown |

### 2.3 Future (C6 / polish)

| Surface | Behavior |
|---------|----------|
| Validation panel | Full errors/warnings list with paths before write |
| Replace draft | AlertDialog confirm when targeting existing draft |
| New field editors | flagship, pathway_position, audience_category, short_description |

### 2.4 Approval gate (board)

Human sees outline derived from inspect API (or client-side parse). Full JSON under “View model” disclosure — not default.

---

## 3. Visual / interaction notes

- Primary after validate: **Import as draft**.  
- Secondary: **Validate only** (future UI).  
- Mode: Structural default; Publish readiness for CI/operators later.  
- After import: open draft editor; stay-put / no full shell reload if possible.  
- Export: no confirm (read-only).  
- **YouTube** assumed for video fields; no multi-provider picker in v1.0 package UI.

---

## 4. Content model language (operators)

| Say | Mean |
|-----|------|
| Lesson kind | video / text / download / external / replay / quiz |
| Resource | Shared library item; course/lesson **points** at it |
| Free preview | Member/anonymous **may** open this lesson’s full content per access rules |
| Package | The portable course JSON file |

Do **not** imply free-preview lessons have thinner content.

---

## 5. Content block authoring (future UI)

v1.0 projects blocks from existing lesson fields without a multi-block editor.

Later:

- Ordered block list per lesson  
- Add Video (YouTube id) / Notes / Quiz / Resource pointer  
- Drag reorder  

Until then: polish via in-place fields; export rehydrates blocks.

---

## 6. Error copy (examples)

| Code | User message |
|------|----------------|
| `CATEGORY_NOT_FOUND` | Category `{slug}` does not exist here. Create it first. |
| `PUBLISHED_REPLACE_FORBIDDEN` | Cannot replace a published course. Unpublish first or import as a new draft. |
| `LESSON_VIDEO_MISSING` | Lesson “{title}” needs a YouTube video id for publish readiness. |
| `PROFIT_CLAIM` | Marketing copy appears to claim profits. Use process outcomes only. |
| Resource missing in bundle | Resource `{id}` has no metadata/url reference for import. |

---

## 7. Accessibility

- Validation list semantic + `aria-live="polite"` on re-validate (when panel ships).  
- File input labeled.  
- Paths monospace; messages plain language.  
- 44pt targets on primary actions (HIG).

---

## 8. Out of scope for design v1.0

- Member-facing package download  
- Visual diff of two packages  
- Media browser / ZIP unpacker  
- Multi-provider video UI  

---

*Implementation tracks Application Framework Family A admin surfaces.*
