# FatTail Labs — In-Place Editing System Spec v1.0

**Status:** **SUPERSEDED** by [`FatTail-Labs-Application-Framework-Spec-v1.0.md`](./FatTail-Labs-Application-Framework-Spec-v1.0.md)  
**Priority:** Historical — lifecycle audit intermediate; do not extend  

**Related (still in force for scope):**  
- `FatTail-Labs-InPlace-Admin-Spec-v1.0` … `v1.5` — element-level direct manipulation, admin API, markdown image upload  
- `FatTail-Labs-Course-Card-Editor-Spec-v1.1`  
- `FatTail-Labs-Human-Interface-Spec-v1.0`  

**Implemented in (v1.0 landing):**  
`web/components/edit/EditContext.tsx`, `web/components/CourseTabs.tsx`,  
`web/components/hub/HubEditContext.tsx`, `web/components/CatalogGrid.tsx`,  
`web/components/QuizBuilder.tsx`

---

## 1. Principle (non-negotiable)

**Edits happen in place.** After any create, read-update, delete, reorder, upload,
or publish of dynamic content, the administrator **must remain**:

| Must preserve | Examples |
|---|---|
| **Route** | Same pathname (`/courses/foo`, `/`, `/courses`) — no hard navigation |
| **View place** | Same course tab (Modules stays Modules), same hub section, same catalog filters |
| **Scroll position** | No jump to top / hero |
| **Edit session** | Edit mode stays on until explicit Exit |
| **Collapse / expand / local UI chrome** | Module collapse map, open card editor, etc. |
| **Unsaved field dirty set** | Structure ops refuse when dirty; field save clears only what it saved |

**Forbidden after a successful edit:**

- `window.location.reload()`
- `window.location.href = …` (except intentional leave: delete course, logout, pay)
- `router.push` / `router.replace` that changes the member-visible place
- Remounting the shell in a way that **resets** tab / scroll / edit mode without restore
- Driving editable lists only from **stale SSR props** after the admin graph changed

**Allowed:**

- `POST /api/revalidate` for **other visitors’** static HTML (fire-and-forget; never a reason to remount this session)
- Optimistic local state, then confirm with `GET` admin payload
- `sessionStorage` persistence for edit mode + active tab across *rare* full navigations

---

## 2. Definitions

| Term | Meaning |
|---|---|
| **Field edit** | Dirty-set mutation (title, markdown, video id…). Batched on **Save & Publish**. |
| **Structure op** | Immediate server write: create/delete/reorder module/lesson; categories; instructors; attachments; hero upload. |
| **Admin graph** | Client state from `GET /api/admin/courses/{slug}` (modules, lessons, attachments, …). |
| **Public props** | SSR / static page payload (`course.modules`, hub initial, catalog cards). |
| **View chrome** | Tab capsule, filters, collapse map, scrollY, edit-mode flag. |

**Rule:** In edit mode, **lists that structure ops mutate must render from the admin graph**, not from public props. Public props remain the member/SEO baseline until the next static revalidation.

---

## 3. State ownership (course page)

| State | Owner | Persistence |
|---|---|---|
| `editMode` | `EditProvider` | `sessionStorage` `labs-edit-mode:{slug}` |
| `courseTab` | `EditProvider` (not `CourseTabs` local state) | `sessionStorage` `labs-course-tab:{slug}` |
| `dirty` / `savedBaseline` | `EditProvider` | Memory only |
| `modules` / `lessons` | `EditProvider` admin graph | Memory; refresh after structure ops |
| Module collapse map | `CourseTabs` | `sessionStorage` `labs-module-collapsed:{slug}` |
| Scroll position | Locked around structure ops (`scrollY` → restore after paint) | Transient |

**Why tab lives on the provider:** Structure ops re-render and can remount children. Local `useState("About")` on `CourseTabs` re-initializes to About under SSR hydration and loses session intent. Provider ownership + session restore is the system standard.

---

## 4. CRUD lifecycle (canonical)

Every dynamic editable surface follows this cycle. **No step may navigate or reload.**

```
┌─────────────┐
│ 1. INTENT   │  User action (click Save, + Add lesson, ↑, 🗑, …)
└──────┬──────┘
       ▼
┌─────────────┐
│ 2. GUARD    │  Dirty check (structure); confirm (delete); auth (server)
└──────┬──────┘
       ▼
┌─────────────┐
│ 3. PIN      │  Capture courseTab + scrollY (and any surface-local chrome)
└──────┬──────┘
       ▼
┌─────────────┐
│ 4. MUTATE   │  fetch admin API (POST/PUT/DELETE)
└──────┬──────┘
       ▼
┌─────────────┐
│ 5. PATCH    │  Optimistic local graph OR apply response body
└──────┬──────┘
       ▼
┌─────────────┐
│ 6. CONFIRM  │  Optional GET admin payload → replace graph (authoritative)
└──────┬──────┘
       ▼
┌─────────────┐
│ 7. REVAL    │  void revalidate(paths) — other visitors only; never await for UX
└──────┬──────┘
       ▼
┌─────────────┐
│ 8. RESTORE  │  Re-assert pinned tab; restore scrollY; keep editMode
└─────────────┘
```

### 4.1 Field save (batch)

1. PUT course / modules / lessons for dirty keys.  
2. Fold dirty → `savedBaseline` + patch admin graph titles/kinds/video.  
3. Clear dirty.  
4. void revalidate course path.  
5. **No reload. Tab and scroll unchanged.**

### 4.2 Structure op (immediate)

1. Refuse if dirty non-empty (alert).  
2. Pin tab + scroll.  
3. POST/DELETE/PUT.  
4. Optimistic row when response includes ids (`module_id`, lesson `{id,slug}`).  
5. `refreshAdmin()` replaces graph.  
6. void revalidate.  
7. Re-assert tab + scroll.

### 4.3 Create lesson (regression that motivated this spec)

| Step | Correct behavior | Bug (pre-v1.0 system) |
|---|---|---|
| User on Modules, clicks **+ Add lesson** | POST lesson | POST + **reload** |
| After success | New row in `edit.modules`; still Modules; scroll held | Full document load → tab SSR default **About** |
| List source | `edit.modules` | Index-aligned `course.modules` (SSR), desyncs |

---

## 5. Surface audit matrix

Audit of every admin-editable / dynamic surface. **Target for all rows: In-place PASS.**

| Surface | Ops | Pre-fix failure mode | Required state | v1.0 verdict |
|---|---|---|---|---|
| Course fields (title, subtitle, level, description) | Field save | Reload / tab reset | dirty + baseline | **PASS** — no reload; baseline |
| Course status | Field save / bar | Reload | status vs serverStatus | **PASS** |
| Module title / kind | Field save | Reload | dirty keys `module.{id}.*` | **PASS** |
| Lesson title / kind / video / free | Field save | Reload | dirty keys `lesson.{id}.*` | **PASS** |
| **Create module** | Structure | Reload → About | admin graph + tab pin | **PASS** |
| **Create lesson** | Structure | Reload → About | admin graph + tab pin + optimistic row | **PASS** |
| Delete module / lesson | Structure | Reload → About | admin graph | **PASS** |
| Reorder modules / lessons (↑↓) | Structure | Reload / SSR order | optimistic order + confirm | **PASS** |
| Categories / instructors | Structure | Reload | admin lists | **PASS** |
| Attachments CRUD | Structure | Reload | attachments[] | **PASS** |
| Hero / trailer | Structure / field | Reload | heroImageUrl / trailerVideoId | **PASS** |
| Hub copy + FAQ | Field + list dirty | **reload after save** | baseline + faqs | **PASS** (no reload) |
| Catalog card color/image | Immediate PUT | **reload after save** | local `items[]` | **PASS** |
| Quiz builder questions | Immediate CRUD | **reload after save/delete** | local `questions[]` | **PASS** |
| Lesson body_md | Field on lesson page | N/A (dynamic page) | local dirty/save | PASS (existing) |
| Danger zone delete course | Intentional leave | Navigate away | N/A | **Exempt** (destructive leave) |
| New course → draft editor | Intentional leave | `router.push` admin draft | N/A | **Exempt** (new place) |
| Media library | Own admin route | Own UX | N/A | Out of scope v1.0 (must still not reload parent if embedded later) |
| Board / Cast / Live admin | `/admin/*` | App-local | Per-feature | Must follow this standard; audit as those surfaces change |

---

## 6. Implementation standards (engineering)

### 6.1 Never

```ts
window.location.reload(); // after edit
```

### 6.2 Always (structure / list mutations)

```ts
// 1) pin chrome
const pinnedTab = courseTab;
const y = window.scrollY;
// 2) mutate API
// 3) patch or refreshAdmin()
// 4) void revalidate(paths)
// 5) setCourseTab(pinnedTab); window.scrollTo(0, y);
```

### 6.3 List rendering in edit mode

```ts
// Course modules
editMode && modules.length > 0
  ? render(edit.modules)   // admin graph
  : render(course.modules) // public props
```

### 6.4 Revalidation

- Purpose: static HTML for **anonymous / other sessions**.  
- Must not be coupled to “refresh my UI.” UI refresh = local state / GET admin.  
- Prefer `void revalidate(...)` so latency never blocks the admin.

### 6.5 New editable component checklist

Before merging any new dynamic editor:

1. [ ] Document CRUD cycle in the feature spec (or this matrix).  
2. [ ] No `location.reload` on success path.  
3. [ ] View chrome owned above the remounting leaf (provider / URL / session).  
4. [ ] List UI reads from client graph after write.  
5. [ ] Manual test: perform op while not at page top; confirm tab + scroll + edit mode.  
6. [ ] Evidence: screenshot or recorded steps in gate report when gated.

---

## 7. Acceptance tests (evidence)

| # | Action | Pass criteria |
|---|---|---|
| A1 | Enter edit mode → Modules → **+ Add lesson** | Still Modules; new row visible; scroll ≈ same; edit mode on |
| A2 | **+ Add module** | Same as A1 for new module card |
| A3 | ↑ / ↓ module and lesson | Order changes; no tab change; no top jump |
| A4 | Delete lesson (confirm) | Row gone; still Modules |
| A5 | Edit title, **Save & Publish** | Dirty clears; still Modules; title shows new value |
| A6 | Hub: edit FAQ, Save | No full page flash; FAQ stays; edit mode on |
| A7 | Catalog: card editor Save | Card updates; filters intact; no reload |
| A8 | Quiz: add/edit/delete question | List updates; stay on lesson page |

Hard-fail: any flash of About tab, document reload, or scroll-to-top after A1–A5.

---

## 8. Out of scope / deliberate exemptions

- **Leaving the product surface by intent:** delete course, logout, checkout, “open media library in new tab.”  
- **Member-facing progress / enrollment fetches** that do not edit content.  
- **Full multiplayer collaborative editing** (OT/CRDT) — single-admin optimistic model is enough.

---

## 9. Migration notes

| Prior spec language | This system |
|---|---|
| v1.2: “republish and **reload** still in edit mode” | Republish via revalidate; **never reload**; edit mode + tab persist in provider |
| v1.1: “Save & Publish … reloads” | Save patches baseline + graph; revalidate only |
| sessionStorage edit mode as primary fix for structure | Still used; **insufficient alone** — tab must not live only on SSR-initialized child state |

---

## 10. Versioning

- **v1.0** — System-wide invariant + course/hub/catalog/quiz landing implementation.  
- Future: fold remaining `/admin` boards into the same matrix when they gain in-page edit patterns.
