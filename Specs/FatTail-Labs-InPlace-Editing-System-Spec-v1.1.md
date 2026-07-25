# FatTail Labs — In-Place Editing System Spec v1.1

**Status:** **SUPERSEDED** by [`FatTail-Labs-Application-Framework-Spec-v1.0.md`](./FatTail-Labs-Application-Framework-Spec-v1.0.md)  
**Priority:** Historical — component catalog intermediate; do not extend

---

## 1. Purpose

This spec is the **system-wide standard for editing product components in place**.

It does **not** invent a second admin UI. It defines, for **every** editable component
(Course, Module, Lesson, **FAQ**, Banner, Display Text, …):

1. What the component is on the member surface  
2. Which fields and structure ops it owns  
3. Which editor primitive applies  
4. When writes are batched vs immediate  
5. How the UI must behave after every write (**stay put**)

**FAQ is a first-class ordered list component** — same family as Module list and Lesson
list (create, delete, reorder, edit fields, stay put). It is not a one-off hub widget.

If a new changeable component is added to Labs, it is **incomplete** until it appears
in §4 with a PASS against §2.

---

## 2. Universal editing standard (all components)

Every row in §4 must obey this standard. No exceptions for “structure is special”
or “reload is fine if edit mode persists.”

### 2.1 Affordance

| Mode | Appearance |
|---|---|
| Member / not editing | Component looks like production (SEO/static HTML unchanged). |
| Edit mode, idle | Same layout; dashed emerald outline + pointer on activatable elements. |
| Edit mode, active | Element **is** the editor (inline input, select, textarea, row controls). No modal for field-level edits. |

**Direct manipulation:** click the thing → edit the thing. Leave control (blur / Enter) commits to the dirty set or runs an immediate write per the component’s write class. Esc cancels an in-element draft.

### 2.2 Write classes

| Class | When used | Persist | UI after success |
|---|---|---|---|
| **F — Field (batched)** | Copy, titles, selects, video ids, toggles that are not structural | Dirty set → **Save & Publish** (or component-local Save if no course bar) | Patch local display + baseline; **no navigation, no reload** |
| **S — Structure (immediate)** | Create / delete / reorder / attach / assign lists | API write now | Patch or refresh **that component’s graph** only; **no navigation, no reload** |
| **U — Upload (immediate)** | Media file → URL then field or attach | Upload + link | Update preview in place; **no reload** |
| **X — Intentional leave** | Delete entity, open new place, logout, checkout | N/A | Navigation allowed **only** when the product outcome *is* leaving |

### 2.3 Stay-put invariant (after F, S, or U)

After a successful write the administrator **must still have**:

| Preserve | Meaning |
|---|---|
| **Route** | Same pathname |
| **Place** | Same course tab, hub section, catalog filters, open accordion, etc. |
| **Scroll** | No jump to page top |
| **Edit session** | Edit mode remains on until Exit |
| **Component chrome** | Collapse maps, open row editor, selected card stay as set |
| **Dirty set** | Structure ops refuse if dirty ≠ ∅; field save clears only saved keys |

**Forbidden on success paths:** `window.location.reload()`, navigations that change place, driving a list only from stale SSR props after the admin graph changed.

**Allowed:** fire-and-forget `POST /api/revalidate` for **other** visitors’ static HTML.

### 2.4 Editor primitives (reuse these; do not invent one-offs)

| Primitive | Use for | Code home |
|---|---|---|
| **EditableText** | Short display strings (titles, subtitles, one-line labels) | `web/components/edit/Editable.tsx` |
| **EditableMarkdown** | Long copy blocks (description, notes, FAQ answers) | same + hub twin `HubEditable*` |
| **EditableSelect** | Closed enums (level, module kind, lesson kind, status) | `Editable.tsx` |
| **Inline field row** | Compact multi-field (video id + start/end + free toggle) | Course Modules lesson row |
| **Chip / control overlay** | Banner/trailer/hero affordances on top of media | `TrailerEditChip`, `HeroImageChip`, catalog card chrome |
| **List row + steppers** | Ordered list components (modules, lessons, **FAQ items**) — ↑↓ not freeform drag | CourseTabs, HubFaqAccordion |
| **List accordion shell** | FAQ (and any future Q&A list): one open panel; answers stay in DOM for AEO | HubFaqAccordion, FaqAccordion |
| **Checklist** | Multi-select membership (categories, instructors) | `EditorExtras` |
| **Attachment manager** | Course resource links/files | `AttachmentsEditor` |
| **Local Save panel** | Surfaces without the course edit bar (quiz question, resource row, card editor) | Own Save/Cancel; still no reload |

### 2.5 State ownership rules

| Concern | Owner |
|---|---|
| Edit mode flag | Page-level provider (`EditProvider`, `HubEditProvider`) + `sessionStorage` |
| Course tab place | **`EditProvider.courseTab`** (not leaf `CourseTabs` state alone) |
| Component graph after structure ops | Client admin graph (`edit.modules`, **`edit.faqs`**, catalog `items`, quiz `questions`) |
| Public SSR props | Member baseline only; **never** sole source of truth while admin graph is active |
| Open FAQ panel id | Accordion leaf may hold it; **must survive** list reorder/add/save (prefer keep open id if still present) |

### 2.6 Ordered list components (shared contract)

These three lists share one editing contract. Implementations may batch list writes
with the page Save (hub FAQ) or write immediately (modules/lessons); **stay-put and
graph ownership are identical**.

| List component | Parent | Item type | Order control | Create CTA | Delete |
|---|---|---|---|---|---|
| **Module list** | Course → Modules tab | Module | ↑↓ on module | + Add module | Confirm trash |
| **Lesson list** | Module card | Lesson | ↑↓ on lesson | + Add lesson | Confirm trash |
| **FAQ list** | Hub (and any future FAQ surface) | FAQ item (Q + A) | ↑↓ on item | + Add FAQ item | Confirm delete |

**Rules for every ordered list:**

1. Render from the **client list graph** in edit mode (`edit.modules`, `edit.faqs`, …), not only SSR props.  
2. Create appends an empty/default item **in place** at the end (or sorted end).  
3. Reorder is **steppers (↑↓)** only — not freeform drag (HIG).  
4. Delete requires confirm; graph drops the row without reload.  
5. Field edits on the row use Display Text primitives (short Q → text; long A → markdown).  
6. After create / delete / reorder / Save: **same route, same section, scroll held, edit mode on.**  
7. SEO/AEO: FAQ answers remain in the document for crawlers (accordion may hide visually).

---

## 3. How to read the catalog

Each component entry:

| Column | Meaning |
|---|---|
| **Component** | Product object the member sees |
| **Where** | Route / region |
| **Fields / ops** | What can change |
| **Primitive** | §2.4 control |
| **Write** | F / S / U / X |
| **Local graph** | What state must update without reload |
| **Status** | PASS = implements §2; GAP = known debt |

---

## 4. Component catalog

### 4.1 Course shell & identity

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **Course title** | Course hero `h1` | `title` | EditableText | F | dirty → baseline | PASS |
| **Course subtitle** | Course hero | `subtitle` | EditableText | F | dirty → baseline | PASS |
| **Course level** | Hero metadata strip | `level` enum | EditableSelect | F | dirty → baseline | PASS |
| **Course status** | Floating edit bar | `draft` / `published` / `archived` | Select on AdminEditBar | F (with Save) | status vs serverStatus | PASS |
| **Course description** | About tab | `description_md` | EditableMarkdown | F | dirty → baseline | PASS |
| **Course categories** | Hero metadata | category slugs set | Checklist (`CategoriesCell`) | S | `edit.categories` | PASS |
| **Course instructors** | About tab | instructor ids set | Checklist (`InstructorsEditor`) | S | `edit.instructors` | PASS |
| **Course publish bar** | Fixed bottom | Enter/exit edit, Discard, Save & Publish | AdminEditBar | F / chrome | editMode session | PASS |
| **Danger: unpublish / delete course** | Course page foot | status / delete entity | Confirm + action | X (leave allowed) | N/A | PASS (exempt leave) |

### 4.2 Banner & media (course)

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **Course banner / hero image** | Hero background (blurred on course page) | `hero_image_url` upload/replace | Chip overlay `HeroImageChip` | U + S | `edit.heroImageUrl` | PASS |
| **Course trailer** | Hero player | `trailer_video_id` (YouTube) | Chip `TrailerEditChip` | F | dirty + trailerVideoId | PASS |
| **Catalog course card banner** | `/courses` grid card | `card_color`, `hero_image_url` | Card editor overlay | U + S | catalog `items[]` | PASS |
| **New course card** | Catalog (admin) | create draft course | Affordance card | X → draft route | N/A | PASS (intentional leave) |

### 4.3 Module *(ordered list — see §2.6)*

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **Module list** | Modules tab | Collection of modules | List shell | — | `edit.modules[]` | PASS |
| **Module (list item)** | Modules tab | Whole module card | Surface card + header row | — | `edit.modules[]` | PASS |
| **Module title** | Module header | `title` | EditableText | F | dirty / modules | PASS |
| **Module kind** | Module header | `standard` / `worksheets` / `resources` / `bonus` | EditableSelect | F | dirty / modules | PASS |
| **Module collapse** | Module header chevron | UI only | IconButton | chrome | session collapse map | PASS |
| **Module reorder** | ↑↓ steppers | sort order | List steppers | S | optimistic `edit.modules` order | PASS |
| **Module create** | “+ Add module” | empty module at end | Dashed CTA | S | append module | PASS |
| **Module delete** | Trash on header | cascade lessons | Confirm + S | S | remove from graph | PASS |

### 4.4 Lesson (course outline) *(ordered list — see §2.6)*

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **Lesson list** | Inside a module | Collection of lessons | List shell | — | `module.lessons[]` | PASS |
| **Lesson (row)** | Under module | Whole outline row | Row layout | — | `module.lessons[]` | PASS |
| **Lesson title** | Row | `title` | EditableText | F | dirty / lessons map | PASS |
| **Lesson kind** | Row | `video` / `text` / `download` / `external` / `replay` / `quiz` | EditableSelect | F | dirty / lessons | PASS |
| **Lesson video binding** | Row (edit) | `video_id`, start/end params | Inline field row | F | dirty video_* | PASS |
| **Lesson free preview** | Row | `free_preview` | Checkbox | F | dirty | PASS |
| **Lesson reorder** | ↑↓ on row | sort within module | List steppers | S | optimistic lesson order | PASS |
| **Lesson create** | “+ Add lesson” | empty video lesson | Row CTA | S | append lesson; **stay on Modules** | PASS |
| **Lesson delete** | Trash on row | delete lesson | Confirm + S | S | remove lesson | PASS |
| **Lesson (member link)** | Row when not editing | navigate to player | Link | member | N/A | N/A |

### 4.5 Lesson page (player surface)

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **Lesson body / notes** | Below player | `body_md` (+ image embed) | Click-to-edit markdown (`LessonBody`) | F (page-local save) | local draft → saved body | PASS |
| **Lesson video player** | Main stage | Playback only (binding edited on course outline) | LessonPlayer | — | progress | N/A (not content edit) |
| **Quiz question** | Quiz lesson | CRUD questions | QuizBuilder form | S | `questions[]` | PASS |
| **Quiz player** | Member take | answers | QuizPlayer | member | attempt | N/A |

### 4.6 Course resources & attachments

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **Course attachment** | Resources tab (edit) | title, kind, url, free | AttachmentsEditor | S | `edit.attachments` | PASS |
| **Resource library item** | `/resources` | emoji, title, description | ResourceRowEditor | F (row Save) | reload list key / local list | PASS* |
| **Resource download** | Row action | file download | link | member / X | N/A | N/A |

\*Resource library already avoids full document reload for list refresh via `reloadKey`; must not introduce `location.reload`.

### 4.7 FAQ *(ordered list — same treatment as Module / Lesson; see §2.6)*

FAQ is a **list component**: an ordered sequence of Q&A items, not a single text
block. It receives the full list contract (create, delete, reorder, field edit,
client graph, stay put). Presentation is typically an accordion (one open panel;
answers remain in the DOM for SEO/AEO).

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **FAQ list** | Hub `#faq` (primary CMS-backed FAQ) | Collection of FAQ items | List accordion shell | — | `edit.faqs[]` (drafts) | PASS |
| **FAQ section title** | Above accordion | `faq_title` | Short display text | F | dirty → hub baseline | PASS |
| **FAQ section description** | Above accordion | `faq_description_md` | Long display text | F | dirty → hub baseline | PASS |
| **FAQ item (list item)** | Accordion row | Whole Q&A card | Accordion item | — | item in `faqs[]` | PASS |
| **FAQ question** | Item header | `question` | Short display text (inline input in edit mode) | F (batched with hub Save) | `setFaqField` on draft | PASS |
| **FAQ answer** | Item body | `answer_md` | Long display text (markdown) | F (batched with hub Save) | `setFaqField` on draft | PASS |
| **FAQ reorder** | ↑↓ on item (edit mode) | `sort_order` | List steppers | F until Save (list dirty) | optimistic `faqs[]` order | PASS |
| **FAQ create** | “+ Add FAQ item” | empty Q&A at end | Dashed / chip CTA | F until Save | append draft (`_new`) | PASS |
| **FAQ delete** | Delete on item | remove item | Confirm + list mutate | F until Save | remove from `faqs[]` | PASS |
| **FAQ open/close** | Member accordion | UI only | Accordion toggle | chrome | `openId`; prefer keep open after list mutate if id still exists | PASS |
| **Membership FAQ** | `/membership` | Static `FAQ` const + `FaqAccordion` | Display-only accordion today | — | N/A | **GAP** — not CMS-backed; if made editable, must use this same list contract (do not invent a second pattern) |

**FAQ list lifecycle (hub):**

```
Edit mode on
  → add / reorder / delete / edit Q&A mutate edit.faqs (+ faqDirty)
  → Save & Publish writes faq_items[] with hub PUT
  → setBaseline + setFaqs(toDrafts(server))  // in place
  → void revalidate("/")
  → stay on hub, #faq section, edit mode, scroll held  // NEVER reload
```

**Parity with Module / Lesson lists:**

| Capability | Module list | Lesson list | FAQ list |
|---|---|---|---|
| Client graph in edit mode | `edit.modules` | `module.lessons` | `edit.faqs` |
| Create at end | + Add module | + Add lesson | + Add FAQ item |
| Reorder ↑↓ | Yes (immediate S) | Yes (immediate S) | Yes (batched F with hub Save) |
| Delete + confirm | Yes | Yes | Yes |
| Field edit on row | title, kind | title, kind, video… | question, answer_md |
| Stay put after op / Save | Required | Required | Required |
| No `location.reload` | Required | Required | Required |

Write-class difference (S vs F) is **persistence timing only**, not UX: the admin
must not experience a page change for any of the three.

### 4.8 Hub (labs.fattail.ai home)

Hub shell copy (FAQ **list** is §4.7, not repeated as a second pattern).

| Component | Where | Fields / ops | Primitive | Write | Local graph | Status |
|---|---|---|---|---|---|---|
| **Hub title** | Hub header | `title` | HubEditableText | F | dirty → baseline | PASS |
| **Hub intro copy** | Hub header | markdown intro | HubEditableMarkdown | F | dirty → baseline | PASS |
| **Hub intro video** | Hub header | video id + title | Inline fields | F | dirty | PASS |
| **Hub FAQ block** | `#faq` | See **§4.7 FAQ** | List accordion | F | `faqs[]` | PASS |
| **Hub edit bar** | Fixed bottom | Save / Discard / Exit | HubEditBar | F | baseline after save **no reload** | PASS |

### 4.9 Display text (generic)

“Display text” is not one entity — it is the **pattern** for any short or long copy on a production surface.

| Component pattern | Examples | Primitive | Write | Stay-put |
|---|---|---|---|---|
| **Short display text** | Course title, module title, hub title, FAQ question | EditableText / HubEditableText | F | Commit on blur/Enter to dirty; Save publishes; never reload |
| **Long display text** | Course description, lesson notes, FAQ answer, hub intro | EditableMarkdown (+ image upload on lesson notes) | F | Preview uses same Markdown renderer as public |
| **Enum display text** | Level, kinds, status | EditableSelect | F | Immediate dirty on change |

**Standard for all display text:**

1. Idle display markup matches public render.  
2. Click → in-place control, same typography/width as feasible.  
3. Esc restores prior display value for that activation.  
4. Blur/Enter writes dirty (or page-local save for lesson notes).  
5. Published value only after Save (or local Save on lesson/quiz/resource row).

### 4.10 Live sessions & admin boards (bound by this standard when edited in UI)

| Component | Where | Fields / ops | Primitive | Write | Status |
|---|---|---|---|---|---|
| **Live session / event** | Live admin UI | schedule fields | EventEditor | S / F per feature | Must stay put on save (no full page reload) |
| **Content board item** | `/admin` board | item fields, HeyGen | BoardKanban panels | S | Stay on board; refresh item in place |
| **Cast / media library** | `/admin/*` | assets | Admin panels | U / S | Stay on admin route; no gratuitous reload |
| **Admin notifications** | Header | mark read, open href | List | X if open href | Opening target is intentional leave |

---

## 5. Component → implementation map

| Component family | Primary implementation |
|---|---|
| Course fields + bar | `EditContext`, `Editable*`, `AdminEditBar`, `app/courses/[slug]/page.tsx` |
| Module + Lesson outline *(lists)* | `CourseTabs.tsx` + `EditContext` structure ops |
| **FAQ list** | `hub/HubFaqAccordion.tsx` + `HubEditContext` (`faqs`, `addFaq`, `removeFaq`, `moveFaq`, `setFaqField`) |
| FAQ / display-only accordion | `FaqAccordion.tsx` (membership static; GAP for CMS) |
| Banner / trailer / hero | `TrailerHero.tsx`, `EditorExtras.HeroImageChip`, `CatalogGrid` CardEditor |
| Lesson notes | `LessonBody.tsx` |
| Quiz questions | `QuizBuilder.tsx` |
| Course attachments | `EditorExtras.AttachmentsEditor` |
| Hub shell copy | `hub/HubHeader.tsx`, `HubEditable*`, `HubEditBar` |
| Resource library rows | `ResourceLibrary.tsx` ResourceRowEditor |
| Live event | `live/EventEditor.tsx` |

---

## 6. CRUD lifecycle (one cycle for every component)

```
Intent → Guard (dirty / confirm) → Pin place+scroll
  → Mutate API → Patch local component graph
  → (optional) Confirm GET → void revalidate
  → Restore place+scroll+editMode
```

Structure and field paths differ only in **when** the API runs (now vs Save). Both end with **stay put**.

---

## 7. Acceptance tests (by component)

| ID | Component action | Pass |
|---|---|---|
| C1 | Course title edit + Save | Title updates; still on same tab/scroll |
| C2 | Module create | New module card; **Modules** tab; no About flash |
| C3 | Lesson create | New lesson row under module; **Modules**; no reload |
| C4 | Lesson reorder ↑↓ | Order changes; tab+scroll held |
| C5 | Module delete | Card gone; still Modules |
| C6 | Banner / hero upload | Preview updates; no reload |
| C7 | Catalog card banner save | Card art updates; filters kept |
| C8 | Display text (description) Save | Markdown updates; About (or current tab) held |
| C9 | Lesson notes Save | Body updates; stay on lesson URL |
| C10 | Quiz question add | List grows; stay on lesson |
| C11 | **FAQ create** (+ Add FAQ item) | New item in list; still on hub `#faq`; no reload |
| C12 | **FAQ reorder** ↑↓ | Order changes; scroll/edit mode held |
| C13 | **FAQ delete** (confirm) | Item gone; stay on hub; no reload |
| C14 | **FAQ question/answer edit + Save** | Copy updates; baseline applied in place; no page flash |
| C15 | FAQ section title/description Save | Section chrome updates; list still visible |
| C16 | Attachment add | Resources list updates in place |

Hard-fail: reload flash, tab reset to About, scroll-to-top, or **any ordered list** (Module / Lesson / **FAQ**) that ignores the client graph after create.

---

## 8. Adding a new editable component (checklist)

Before merge:

1. [ ] Add a row to §4 (component name, where, fields, primitive, write class).  
2. [ ] Choose F / S / U only; document any X leave.  
3. [ ] Reuse a §2.4 primitive or justify a new one in this spec.  
4. [ ] If it is an **ordered list** (Module / Lesson / **FAQ** / future), implement the full §2.6 contract.  
5. [ ] Local graph updates without `location.reload`.  
6. [ ] Place (tab/section/filters/open FAQ id) owned above remounting leaves.  
7. [ ] Manual test against §2.3 stay-put.  
8. [ ] Gate evidence when the change is gated.

---

## 9. Version history

| Ver | Change |
|---|---|
| **v1.1** | Component catalog + universal standard; **FAQ elevated to first-class ordered list** (§2.6, §4.7) alongside Module and Lesson. |
| v1.0 | Lifecycle / audit matrix first; still valid as engineering appendix. |

---

## 10. Summary standard (one paragraph)

> Every changeable Labs component — **Course, Module, Lesson, FAQ (as an ordered list), Banner, Display text, attachments, hub copy, catalog card, quiz question, resource row** — is edited **on the production surface**, with a shared affordance language, one of four write classes (field / structure / upload / intentional leave), and a hard rule that success **never** reloads or relocates the administrator. **Ordered lists** (modules, lessons, **FAQ items**) share one contract: client graph, create/reorder/delete, field edit on the row, stay put. Revalidation is for other visitors only.
