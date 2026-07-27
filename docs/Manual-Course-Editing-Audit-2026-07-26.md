# Manual Course Editing — Audit

**Date:** 2026-07-26  
**Scope:** Manual authoring only (create + edit courses via admin/in-place UI).  
**Out of scope:** Automated board/blueprint course factory, Labs tools (Journey/Trade Log).  
**Sources:** In-Place Admin Specs v1.0–v1.5, Application Framework stay-put rules, live code under `web/components/edit/*`, `CourseTabs`, catalog, lesson page.

**Verdict (summary):** Manual authoring is **largely feature-complete against v1.0–v1.4 specs** and is **usable for building a full course**, but it is **not polish-complete** and has **UX/reliability gaps** that will frustrate daily use. Treat as **MVP production-capable with known debt**, not “done.”

---

## 1. Where manual editing lives

| Surface | URL | Who | Role |
|---------|-----|-----|------|
| **Catalog — New Course** | `/courses` | Admin only | Create draft → jump to draft editor |
| **Draft editor** | `/admin/courses/{slug}` | Admin only | Full in-place structure for **unpublished** courses |
| **Published course page** | `/courses/{slug}` | Admin (✎ Edit) | Same editor on public URL |
| **Draft public URL** | `/courses/{slug}` | Admin | 404 + client redirect into draft editor |
| **Lesson page** | `/courses/{slug}/lessons/{lessonSlug}` | Admin | Lesson notes (markdown + images), quiz builder |
| **Catalog card editor** | `/courses` card overlay | Admin | Banner color + hero image for **card** |
| **Hub page** | `/` | Admin | Hub copy/FAQ (not course authoring) |

Engine: `EditProvider` + `AdminEditBar` + `Editable*` + `CourseTabs` structure ops.

---

## 2. Feature inventory (functional completeness)

### 2.1 Course lifecycle

| Capability | Status | Notes |
|------------|--------|--------|
| Create draft course | **Works** | Catalog “+ New Course” → `POST /api/admin/courses` → `/admin/courses/{slug}` |
| Edit draft before publish | **Works** | Draft route forces edit mode |
| Publish (status → published) | **Works** | Status select + Save & Publish; revalidates public path |
| Unpublish | **Works** | Danger zone; navigates to draft route (intentional leave) |
| Delete course | **Works** | Double confirm; **not** type-exact-title (spec v1.4 drift) |
| Draft invisible publicly | **Works** | Public 404 until published |

**Not feature-complete vs polish:** create uses browser `prompt()` for title (not HIG). Delete omits “type the course title” gate from v1.4.

### 2.2 Course fields (batched Save)

| Field | UI | Status |
|-------|-----|--------|
| Title | Hero EditableText | **Works** |
| Subtitle | Hero EditableText | **Works** |
| Level | Hero EditableSelect | **Works** |
| Description | About EditableMarkdown | **Works** |
| Status draft/published/archived | Edit bar | **Works** (dirty counter **does not** include status-only change — UX bug) |
| Trailer YouTube id | TrailerEditChip | **Works** (batched dirty) |
| Hero / banner image | HeroImageChip upload | **Works** (immediate structure upload) |
| Categories | Checklist in hero | **Works** (immediate) |
| Instructors | About checklist | **Works** (immediate; bios not editable) |
| Card color | Catalog card editor only | **Works on catalog**; not on course page |
| Certification flag | — | **Missing UI** |
| Custom slug | — | **Server-generated only** (create from title) |

### 2.3 Modules & lessons (structure)

| Capability | Status | Notes |
|------------|--------|--------|
| Add module | **Works** | End of list; in-place refresh |
| Delete module | **Works** | Confirm; cascades lessons |
| Module title / kind | **Works** | Editable in Modules tab |
| Collapse / expand modules | **Works** | Incl. collapse all |
| Reorder modules | **Works** | ↑↓ steppers (spec said drag; steppers match HIG) |
| Add lesson | **Works** | Per module; in-place |
| Delete lesson | **Works** | Confirm |
| Lesson title / kind | **Works** | |
| Lesson video id + start/end | **Works** | Uncontrolled inputs (can desync after save — UX debt) |
| Free preview toggle | **Works** | |
| Reorder lessons | **Works** | ↑↓ |
| Open lesson while editing | **Partial** | “Open” link added; not as smooth as click-row-to-open |
| Lesson body / notes | **Works** | On **lesson page** only, not Modules tab |
| Lesson duration | — | **No UI** (API supports field) |
| Lesson slug | — | **Server-generated**; no rename UI |
| Quiz questions | **Works** | QuizBuilder on lesson page when kind=quiz |

### 2.4 Resources (course attachments)

| Capability | Status |
|------------|--------|
| Add link/file attachment | **Works** (Resources tab, edit mode) |
| Edit / delete / free preview | **Works** |
| Lesson-scoped attachments | **Out of scope** (spec) |

### 2.5 Stay-put / reliability (Application Framework)

| Rule | Status |
|------|--------|
| Field save without full page reload | **Works** |
| Structure create/reorder/delete without reload | **Works** (local graph + revalidate) |
| Stay on Modules tab after structure op | **Works** (tab on EditProvider) |
| `location.reload` on edit success | **Absent** on Family A edit path |
| Unpublish / delete navigation | **Intentional leave** |

### 2.6 What is *not* manual course editing

- Board / blueprint / AI course factory (automated path — separate priority later)  
- Labs tools  
- Creating categories/instructors themselves (assign existing only)

---

## 3. End-to-end manual create path (happy path)

1. Admin on `/courses` → **+ New Course** → title prompt → draft created.  
2. Lands on `/admin/courses/{slug}` in edit mode.  
3. Set title/subtitle/level/description; add modules/lessons; set videos/free preview.  
4. Optional: hero, trailer, categories, instructors, attachments.  
5. Status → **published** → **Save & Publish**.  
6. Public `/courses/{slug}` live; further edits via ✎ Edit on public page.  
7. Lesson notes/quizzes: open each lesson page while signed in as admin.

**This path is complete enough to author a real course without SQL.**

---

## 4. Functional issues (bugs / reliability)

| Severity | Issue | Impact |
|----------|--------|--------|
| **High** | Video/start/end inputs use `defaultValue` (uncontrolled) | After Save or structure refresh, UI can show stale values until remount |
| **High** | Structure ops blocked if any field dirty | Easy to trap user: must Save/Discard before Add lesson/reorder |
| **Medium** | Dirty count ignores status-only changes | Admin thinks “0 pending” but status changed and unsaveable until another field edit — or status saved only with Save which may still send status if compared… actually save checks `status !== serverStatus` so status alone DOES save. Count is wrong only. |
| **Medium** | Public course page after publish needs revalidation | Usually OK; failures leave stale SSG until rebuild |
| **Medium** | Empty draft: until admin payload loads, Modules list can show empty/public props | Brief flash or empty modules before graph loads |
| **Low** | DangerZone always passes `status="published"` on public course page | Unpublish button logic may not reflect true status if archived |
| **Low** | `prompt()` for new course title | Works; fails HIG / mobile / keyboard |

**Recently fixed (context):** lesson page load hardening; stay-put structure ops; Open link in edit mode.

---

## 5. UX issues (vs direct-manipulation / HIG intent)

| Area | Assessment |
|------|------------|
| Enter edit | Clear ✎ Edit FAB | **Good** |
| Click-to-edit text/markdown | Dashed affordance | **Good** |
| Edit bar | Always visible in edit mode; cramped on small screens | **OK / cramped** |
| “Save & Publish” | Label implies publish even when saving draft fields | **Confusing** |
| New course | Browser prompt | **Poor** |
| Modules list in edit mode | Dense: steppers + title + kind + trash + video row | **Power-user dense** |
| Opening a lesson while building | Requires “Open” or leave edit | **Friction** |
| Lesson notes | Only on lesson page — easy to miss | **Discoverability gap** |
| Reorder | Steppers better than broken drag | **Good** (spec text outdated) |
| Delete course | Double confirm, not type-title | **Weaker than v1.4** |
| Success feedback | No toast beyond dirty clear / saving… | **Thin** |
| Error feedback | Truncated red text in bar | **OK for MVP** |

---

## 6. Spec alignment matrix

| Spec claim | Reality |
|------------|---------|
| v1.1 Direct manipulation | **Yes** for main fields |
| v1.2 Structure create/delete | **Yes**; reload removed (better than original “reload”) |
| v1.3 Drag reorder | **Steppers** instead (intentional HIG) |
| v1.3 Hero upload, categories, instructors, attachments | **Yes** |
| v1.3 New course → draft route | **Yes** |
| v1.4 Unpublish / delete | **Yes**; delete type-title **not** implemented |
| v1.5 Lesson image embed | **Yes** on lesson body editor |
| Application Framework stay-put | **Yes** for field + structure (except intentional danger navigations) |

---

## 7. Feature-complete?

| Question | Answer |
|----------|--------|
| Can an admin create a course from empty → published with modules, lessons, video, free preview, description, hero, trailer, categories, resources **without SQL**? | **Yes** |
| Is every field the domain model allows exposed in UI? | **No** (slug rename, duration, certification, instructor bio, card color on course page) |
| Is UX production-polished? | **No** — MVP tooling, dense, some HIG debt |
| Is manual editing “done” for Coach’s #1 priority? | **Functionally mostly yes; not “done” until high/medium issues and create UX are cleaned** |

---

## 8. Recommended fix order (manual editing only)

Priority order if we only work on manual editing before automation:

1. **Create-course UX** — replace `prompt()` with HIG dialog; land on draft editor with empty module affordance.  
2. **Dirty / Save clarity** — include status in dirty UI; rename button (“Save” vs “Save & Publish” when status=published).  
3. **Video fields controlled** — bind to `edit.value` / dirty so save and structure refresh stay consistent.  
4. **Lesson authoring flow** — from Modules: Open (or side panel) for notes/video without losing place; clearer empty-video state.  
5. **Danger zone** — type-to-confirm delete (v1.4); fix status prop from live course status.  
6. **Polish** — success toast, less dense module rows, mobile edit bar.

Then: automated/admin-driven course creation on top of this spine.

---

## 9. Evidence notes

- Create: `POST /api/admin/courses` + `NewCourseCard` → `/admin/courses/{slug}`.  
- Engine: `EditContext.structureOp` revalidates without `location.reload`.  
- Structure: modules/lessons CRUD + reorder APIs present in `server/routes/admin.py`.  
- Stay-put tests: `server/tests/test_framework_stayput_contract.py`.  
- Specs: `Specs/FatTail-Labs-InPlace-Admin-Spec-v1.*.md`.

---

*Audit only — no implementation changes required by this document.*
