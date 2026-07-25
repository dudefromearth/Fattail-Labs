# FatTail Labs — Application Framework Spec v1.0

**Status:** **Approved for build** (2026-07-25, Coach — W0 review chain complete; T-D2 Cut A = W0+W1). Further amendments = new version.  
**Product:** FatTail Labs (`labs.fattail.ai`)  
**Purpose:** Single consolidated architecture for **how Labs pages are composed, displayed, and edited**  
**Supersedes (behavior & intent):**  
- `FatTail-Labs-InPlace-Editing-System-Spec-v1.0` … `v1.2` (shell + component + stay-put)  
- Application Templates proposal v0.1 (bounded page archetypes; folded in and extended)  
**Does not supersede:** domain product specs (Course Hosting, Live Sessions, Identity, SEO, HIG, …) — those remain system-of-record for their domains  
**Family B privacy authority:** [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) — isolation, consent, admin aggregate vs individual access, member rights (resolves **T-D1** privacy model)  
**Inherits:** In-Place Admin Specs v1.0–v1.5 (API allowlists, direct manipulation, markdown images) where not contradicted; **contradictions lose to this document** on stay-put / no-reload / shell place  
**Doctrine:** `agents/bench/doctrine.md`, capacity-over-dependency, process-not-profit claims  

**Reviewers (PENDING until Coach schedules):**

| Gate | Reviewer | Concern |
|---|---|---|
| Architecture / product boundary | **India** | Layering; templates as bounded units; Family B domain surfaces; no second store of truth |
| Auth / privacy / entitlements | **Mike** | Family A admin authority server-side; Family B isolation/consent per **Member-Data-Privacy** |
| SEO / AEO | **Sierra** | Public templates emit correct JSON-LD |
| Design + member psychology | **Echo + Tango** | HIG at page + component; process-first Trade Log / Journal |
| Trading-education accuracy | **Hotel** | Trade Log / Journal framing (no profit-outcome marketing) |
| Evidence | **Delta** | Phase-end gates |
| Approver | **Coach** | Ship / scope |

---

## 0. One-paragraph standard

> Labs is a **finite set of purpose-built page templates**. Each template is a **composition contract**: named slots, only **registered components**, bound to **one domain data source** in FastAPI/MySQL. Every template renders through a **two-mode system** (display for members/crawlers; edit path for the correct actor). **Family A** (admin content) uses in-place admin edit on the production surface. **Family B** (member tools) uses member CRUD on private data — same composition and HIG rules, different actor/auth. There is **no template builder**, no freeform page designer, and **no reload or place-jump** after a successful write. Growth is by **governed construction** (spec → review → build), not by end-user generation.

---

## 1. Intent & success criteria

### 1.1 Goals expressed (combined)

1. **Bounded page archetypes** for real use cases (course, hub, calendar, trade log, journal, …) — not a CMS page builder.  
2. **Consistent component system** (Course, Module, Lesson, FAQ list, Banner, Display text, …) with one editing language.  
3. **Page host that supports those components the same way** (edit session, place chrome, graph, stay-put).  
4. **True in-place editing** — create/reorder/save never kicks the user off their place (e.g. Modules → About).  
5. **Two actor paths** — admin-published content vs member-private tools — without two product philosophies.  
6. **Doctrine-safe** member tools (process-first; no profit-claim framing).  
7. **Single system of record**; public structured data where appropriate.

### 1.2 Success criteria

| # | Criterion |
|---|---|
| S1 | Each supported use case has **one purpose-built template**, composed only of **registered** components under a **slot policy** (v1: **documentation-enforced** via review + characterization; optional runtime registry later). |
| S2 | Templates render via **two-mode** rules: display = production/SEO-safe; edit = in-place for the **declared actor**. |
| S3 | No template introduces a **parallel store of truth**. |
| S4 | HIG-conformant at page level; components conform at control level. |
| S5 | New templates require **governed construction** (no builder UI). |
| S6 | Public templates emit correct **JSON-LD** (Course, FAQ, Event as applicable). |
| S7 | After any successful field, structure, or upload write: **same route, same place chrome, same scroll (approx), same edit session** — never `location.reload` on success. |
| S8 | Ordered lists (**Module**, **Lesson**, **FAQ**, and equivalents) share one list contract. |
| S9 | Family B: **per-member isolation** + entitlement gating proven with two distinct members (detail: **Member-Data-Privacy**). |
| S10 | Trade Log / Journal: **process-first** schema and copy; P&L never the product headline; private-by-default; no sharing in v1. |
| S11 | Admin access to member content: **aggregates only** without consent; **individual read only** with scoped, time-boxed, revocable, audited consent (**Member-Data-Privacy** §4). |

---

## 2. Layered architecture

Four layers. **Upper layers may only compose lower layers** — never bypass them with ad-hoc markup or parallel APIs.

```
┌──────────────────────────────────────────────────────────────────┐
│  L4  APPLICATION TEMPLATES                                       │
│      Bounded page archetypes · slots · data binding · visibility │
├──────────────────────────────────────────────────────────────────┤
│  L3  HIG-FOR-WEB (Echo)                                          │
│      Tokens, layout, density, surfaces — page + control          │
├──────────────────────────────────────────────────────────────────┤
│  L2  COMPONENT CONTRACT                                          │
│      Registry · kinds · capabilities · ordered-list contract     │
├──────────────────────────────────────────────────────────────────┤
│  L1  DISPLAY–EDIT MODE                                           │
│      Two modes · actor paths · write classes · stay-put · place  │
├──────────────────────────────────────────────────────────────────┤
│  L0  SYSTEM OF RECORD + MEMBER DATA GOVERNANCE                   │
│      FastAPI · MySQL · entitlements · no MSC code imports        │
│      + Member-Data-Privacy (isolation, consent, admin access)    │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | Spec home | Owns |
|---|---|---|
| **L0 System of record** | Domain specs + migrations | Entities, APIs, schema |
| **L0 Member data governance** | [`Member-Data-Privacy`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) | Family B isolation, consent, admin aggregate vs examination |
| **L1 Display–Edit Mode** | Part A (this doc) | How any surface switches display ↔ edit; stay-put; write classes; revalidate |
| **L2 Component Contract** | Part B (this doc) | What may be composed; Module / Lesson / FAQ lists; primitives |
| **L3 HIG** | Reference `Human-Interface` + Echo | Visual system (not redefined here) |
| **L4 Application Templates** | Part C (this doc) | Which pages exist; slots; actors; Family A/B |

This document is the **framework of record** for L1 + L2 + L4. Domain specs still define entities and APIs. Family B **access control** is not inventable in L1–L4 — it defers to Member-Data-Privacy.

---

# Part A — Display–Edit Mode (L1)

## A1. Two modes

| Mode | Audience | Rendering | JS role |
|---|---|---|---|
| **Display** | Members, crawlers, agents | Production layout; public/gated content; SEO/AEO HTML | Near-zero for content reading; progressive for player/progress |
| **Edit** | Declared **actor** only | Same layout; components become direct-manipulation editors | Client graph + dirty/save or member CRUD |

**Direct manipulation (Family A, content):** the element **is** the editor — no detached admin form for field-level work. Click → edit in place → blur/Enter commits to dirty (or local Save where the template declares it).

**Member CRUD (Family B, tools):** same HIG density and stay-put; UI may use list rows + forms appropriate to private tools — still **on the tool’s own template**, not a second admin site.

## A2. Actor paths

| Path | Actor | Typical mode entry | Persist authority |
|---|---|---|---|
| **Family A — Admin content** | `administrator` | ✎ Edit → edit mode on production URL | `/api/admin/*` + session role (server) |
| **Family B — Member tools** | Authenticated member (entitled) | Use the tool (always “their” data) | Member-scoped APIs; isolation server-enforced |
| **Member consume** | Entitled / public | Display only | Read APIs / static |

Client-side role checks are **visibility only**. Writes always re-authorize server-side.

## A3. Write classes

| Class | Meaning | UI after success |
|---|---|---|
| **F — Field (batched)** | Dirty set → Save & Publish (or template-local Save) | Patch baseline/graph; **stay put** |
| **S — Structure (immediate)** | Create / delete / reorder / assign lists now | Patch graph; **stay put** |
| **U — Upload** | Media → URL → field/attach | Preview updates; **stay put** |
| **X — Intentional leave** | Delete entity, open new place, logout, checkout | Navigation allowed **only** when leave is the product outcome |

Structure ops **refuse** if dirty ≠ ∅ (alert: save or discard first) on Family A shells that batch fields.

## A4. Stay-put invariant (non-negotiable)

After F, S, or U success, the actor **must retain**:

| Preserve | Examples |
|---|---|
| Route | Same pathname |
| **Place chrome** | Course tab (Modules stays Modules), filters, open FAQ panel id, calendar range |
| Scroll | No jump to top |
| Edit / tool session | Edit mode on until Exit; member tool context intact |
| List chrome | Collapse maps, open row editors |

**Forbidden on success:** `window.location.reload()`; navigations that change place “because content changed”; driving structure-mutated lists only from stale SSR props while a client graph exists.

**Allowed:** `void revalidate(paths)` for **other visitors’** static HTML (Family A public pages only). Never revalidate as a substitute for updating the client graph.

## A5. Place chrome & host services

Every template **instance host** (the Next.js page that mounts the template) provides:

| Service | Behavior |
|---|---|
| Edit or tool session | Family A: edit mode + `sessionStorage` key; Family B: auth + entitlement |
| Edit bar (Family A when F-batched) | Enter / Exit / Discard / Save & Publish; dirty count; errors |
| Client graph | Mutable model components render from in edit/tool mode |
| Place chrome ownership | Tabs, filters, section — owned **above** remounting leaves |
| Scroll lock | Capture `scrollY` around structure mutations; restore after paint |
| Revalidate helper | Family A public paths only; fire-and-forget |

## A6. Lifecycle (all writes)

```
Intent → Guard (dirty / confirm / auth) → Pin place + scroll
  → Mutate API → Patch client graph (optimistic optional)
  → Confirm GET if needed → void revalidate (public only)
  → Restore place + scroll + session
```

---

# Part B — Component Contract (L2)

## B1. Principles

1. Templates **compose only registered components**. Unregistered markup is a defect.  
2. A component has: identity, kind, fields/ops, primitive, write class(es), graph slice, HIG notes.  
3. The same kind **feels the same** on every template that hosts it.  
4. Components **never** own document reload or shell place reset.  
5. **Slot policy enforcement (v1):** the registry and per-template allowed-component tables in this spec are the **contract**. Enforcement is by **India review, seeds, and characterization tests** — not a compiler plugin. A later optional code registry may harden this without changing the contract.

## B2. Component kinds

| Kind | Role | Examples |
|---|---|---|
| **Display text** | Short / long / enum copy | Titles, descriptions, FAQ Q/A |
| **Banner** | Visual header / card art | Course hero, catalog card |
| **Media binding** | Video / trailer source | Trailer chip, lesson video row |
| **Ordered list** | Create · ↑↓ reorder · delete · row fields | **Module list**, **Lesson list**, **FAQ list**, quiz questions |
| **Checklist** | Multi-select membership | Categories, instructors |
| **Attachment / resource** | File or link + metadata | Course resources, library rows |
| **Player / progress** | Consume media & track | Lesson player (edit of binding is Media/List) |
| **Tool entry** (Family B) | Member-authored record | Trade log row, journal entry (schemas in domain specs) |
| **Host chrome** | Framework UI | Edit bar, tab capsule, filters |

## B3. Display text

| Variant | Primitive | Write |
|---|---|---|
| Short | EditableText (or Family B equivalent) | F |
| Long | EditableMarkdown (same public renderer; lesson notes may embed images) | F |
| Enum | EditableSelect | F |

Display markup when idle = production. Esc cancels in-element draft.

## B4. Ordered list contract (Module · Lesson · FAQ · …)

**First-class list kind.** FAQ is **not** a one-off hub widget; it is the same contract as Module and Lesson lists.

| Capability | Required |
|---|---|
| Graph | In edit/tool mode, render from **client list graph** |
| Create | “+ Add …” appends a default item in place |
| Reorder | **↑↓ steppers only** (HIG) — not freeform drag |
| Delete | Confirm; remove from graph; stay put |
| Row fields | Display text / kind-specific fields on the row |
| After op | Host stay-put (Part A4) |
| FAQ AEO | Answers remain in DOM for crawlers (accordion may hide visually) |

| List | Typical host template | Item | Persist timing (ref) |
|---|---|---|---|
| Module list | Course Presentation | Module | S immediate (Family A) |
| Lesson list | Course Presentation (Modules region) | Lesson | S immediate |
| FAQ list | Hub Page | FAQ item (Q + A) | F with page Save (Hub) |
| Quiz questions | Course Presentation (lesson) | Question | S immediate |
| Tool entries | Trade Log / Journal | Entry | Family B CRUD (domain spec) |

S vs F is **API timing only** — never different stay-put rules.

## B5. Banner & media

| Component | Write | Stay-put |
|---|---|---|
| Course hero / banner image | U + link | Yes |
| Catalog card banner (color/image) | U + S | Yes; patch catalog graph |
| Trailer video id | F | Yes |
| Lesson video binding | F on outline row | Yes |

## B6. Component registry (Family A — as-built + required)

Status: **PASS** = implemented under Part A4; **GAP** = must converge.

### B6.1 Display text & identity

| Component | Template slot (typical) | Fields | Kind | Write | Status |
|---|---|---|---|---|---|
| Course title | Course hero | `title` | Display short | F | PASS |
| Course subtitle | Course hero | `subtitle` | Display short | F | PASS |
| Course level | Course hero | `level` | Display enum | F | PASS |
| Course status | Course edit bar | status | Display enum | F | PASS |
| Course description | Course About | `description_md` | Display long | F | PASS |
| Module title / kind | Modules | title, kind | Display | F | PASS |
| Lesson title / kind / free / video | Modules | … | Display + media | F | PASS |
| Lesson notes | Lesson region | `body_md` | Display long | F local | PASS |
| Hub title / intro | Hub header | … | Display | F | PASS |
| FAQ section title / description | Hub FAQ | `faq_title`, `faq_description_md` | Display | F | PASS |
| FAQ question / answer | Hub FAQ item | question, answer_md | Display | F | PASS |

### B6.2 Ordered lists

| Component | Template | Ops | Write | Graph | Status |
|---|---|---|---|---|---|
| Module list | Course Presentation | CRUD order | S + F fields | `edit.modules` | PASS |
| Lesson list | Course Presentation | CRUD order | S + F fields | `module.lessons` | PASS |
| FAQ list | Hub Page | CRUD order | F batch Save | `edit.faqs` | PASS |
| Quiz question list | Lesson | CRUD | S | `questions[]` | PASS |
| Membership FAQ | Membership | static today | — | — | **GAP** (if CMS: same FAQ list contract) |

### B6.3 Banner, checklist, attachments

| Component | Template | Status |
|---|---|---|
| Course banner / trailer | Course Presentation | PASS |
| Catalog card banner | Catalog (listing host) | PASS |
| Categories / instructors | Course Presentation | PASS |
| Course attachments | Course Resources | PASS |
| Resource library row | Resources listing | PASS |

### B6.4 Family B components (registry stubs — schemas in domain specs)

| Component | Template | Notes |
|---|---|---|
| Trade entry | Trade Log | Process-first fields; P&L neutral (T-D5) |
| Journal entry | Journal | Calendar-structured; process/adherence |
| Playbook item | Playbook | Personal setups/rules |
| Journey milestone | Journey | Mostly system-recorded progression |

No Family B component may publish profit claims in member-visible shared contexts (sharing deferred v1).

## B7. Primitives (toolkit)

| Primitive | Kind | Implementation (ref) |
|---|---|---|
| EditableText / HubEditableText | Display short | `edit/Editable.tsx`, `hub/HubEditable.tsx` |
| EditableMarkdown / HubEditableMarkdown | Display long | same |
| EditableSelect | Display enum | Editable.tsx |
| List steppers ↑↓ | Ordered list | CourseTabs, HubFaq |
| List accordion shell | FAQ | HubFaqAccordion, FaqAccordion |
| Chip overlay | Banner / trailer | TrailerHero, HeroImageChip |
| Checklist | Membership sets | EditorExtras |
| Attachment manager | Attachments | AttachmentsEditor |
| Edit bar | Host chrome Family A | AdminEditBar, HubEditBar |
| Local Save panel | No page bar | LessonBody, QuizBuilder, CardEditor |

New primitives require a registry row and HIG note — no one-off controls for the same job.

---

# Part C — Application Templates (L4)

## C1. What a template is

A **registered template** is a **bounded page archetype**, not a user-generated layout. It declares:

| Element | Meaning |
|---|---|
| **Identity** | Name + version + use case |
| **Structure** | Named **regions / slots** |
| **Component policy** | Allowed / default registered components per slot (**constrained**, not freeform) |
| **Data binding** | Domain model / API (course, hub, live_sessions, member entries, …) |
| **Actor & edit path** | Family A admin two-mode **or** Family B member CRUD |
| **Visibility** | public / gated / **private-per-member** |
| **Structured data** | JSON-LD when public (Course, FAQ, Event) |
| **HIG** | Page layout conforms; components already conform |
| **Verification** | Characterization: render, bind, slot policy, visibility, stay-put |

**Rejected:** template builder UI; unbounded variants; parallel data stores; member-public social sharing in v1; agent-authored templates (later phase).

## C2. Two families

### Family A — Content templates (admin-authored, published)

- Actor: **administrator**  
- Path: **Part A Family A** (edit mode on production or draft admin URL)  
- Visibility: public and/or gated  
- Data: shared content in system of record  
- Revalidate public HTML after publish  

### Family B — Member-tool templates (member-authored, private)

- Actor: **authenticated entitled member**  
- Path: **Part A Family B** (member CRUD — **not** admin edit mode)  
- Visibility: **private per-member** (v1: no sharing)  
- Data: per-user isolated rows — **governed by** [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md)  
- Admin may **not** read raw content except under that spec’s **consented individual examination**; aggregates are de-identified metrics only  
- **New domain surfaces** require data-model specs before build (T-A1 / Privacy A-2)  
- Framing: **process-first** (Tango + Hotel); P&L never headline  

**Shared with Family A:** HIG, component kinds where applicable, stay-put after write, single MySQL/API store, no builder.  
**Not shared:** AdminEditBar, public revalidate of private rows, admin course graph, silent admin read of member journals/logs.

**Invariant AF-B1 (India):** Course in-place admin (Family A edit mode), `/admin/*` boards, and any operator tooling **must not** read Family B raw content except through Member-Data-Privacy **§4.2** (consented individual examination). Aggregate dashboards use **§4.1** only. There is no “admin role implies read journals” back door.

## C3. Template catalog (bounded)

| Template | Use case | Family | Actor | Visibility | P1 posture |
|---|---|---|---|---|---|
| **Course Presentation** | Course + modules/lessons/player | A | admin | public + gated | Existing — formalize |
| **Hub Page** | Home CMS + taxonomy + FAQ | A | admin | public | Existing — formalize |
| **Catalog Listing** | Course grid + card art | A | admin (cards) | public | Existing — formalize |
| **Calendar / Schedule** | Time-based events | A | admin | public/gated | Extend live sessions (T-D4) |
| **Resources Library** | Global resources | A / gated | admin metadata | gated | Existing — formalize |
| **Trade Log** | Process-first trade logging | **B** | member | private | **NEW** — data spec first |
| **Journal** | Process/adherence, calendar-structured | **B** | member | private | **NEW** — variant of Calendar (T-D3) |
| **Playbook** | Personal setups/rules | **B** | member | private | **NEW** |
| **Journey** | Progression / engagement | **B** | member + system | private | Extends progress |
| **Method Exemplar** | Admin-published teaching example | A | admin | public/gated | Optional content |

*Bounded is the point: growth is by construction (Part D), not a builder.*

### C3.1 Journal as Calendar variant (T-D3)

Journal is a **bounded specialization** of the Calendar archetype: shared time-grid structure; different entry schema + Family B actor. Variants are **finite and named** — not open-ended inheritance trees.

### C3.2 Calendar data (T-D4)

**Default direction:** Calendar/Schedule **extends `live_sessions`** (and related admin APIs) — no parallel event store. New fields only if the domain model requires them; India + Alpha decide before build.

## C4. Family A templates — structure & as-built map (T-A3)

### C4.1 Course Presentation

| Slot / region | Allowed components (policy) | Data |
|---|---|---|
| Hero | Banner, trailer (media), title, subtitle, level, categories | `courses` |
| Place chrome | Tab capsule (About, Modules, Resources, Discussion, Students, …) | Host state |
| About | Description (long text), instructors (checklist), reviews (read) | course + joins |
| Modules | **Module list** → nested **Lesson list** | modules, lessons |
| Resources | Attachments | attachments |
| Lesson URL region | Player, lesson notes, quiz list | lesson, progress |
| Edit host | Edit bar, danger zone (X) | admin graph |

**Routes:** `/courses/[slug]`, `/courses/[slug]/lessons/[lessonSlug]`, draft admin course editor.  
**Edit path:** Family A — `EditProvider`, stay-put on tab `Modules` across structure ops.  
**JSON-LD:** Course (+ trailer VideoObject per SEO specs).

### C4.2 Hub Page

| Slot | Components | Data |
|---|---|---|
| Header | Title, intro long text, intro video | hub page |
| FAQ | Section title/description + **FAQ list** | faq_items |
| Edit host | Hub edit bar | hub admin |

**Route:** `/`. **JSON-LD:** FAQPage when items exist.

### C4.3 Catalog Listing

| Slot | Components | Data |
|---|---|---|
| Filters | Host chrome | client |
| Grid | Course cards; admin card banner editor | course cards |
| New course | Affordance → draft (X leave) | create course |

**Route:** `/courses`.

### C4.4 Calendar / Schedule

| Slot | Components | Data |
|---|---|---|
| Time grid / list | Event rows (display); admin editor | **live_sessions** (T-D4) |
| Edit | Family A event CRUD stay-put | admin live APIs |

### C4.5 Resources Library

| Slot | Components | Data |
|---|---|---|
| Filters | Host chrome | client |
| List | Resource rows (metadata edit) | attachments/resources APIs |

## C5. Family B templates — posture (detail in domain + privacy specs)

**Privacy / isolation / consent / admin access:**  
[`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) is authoritative. This section only names templates and UI posture.

| Template | Binding (intent) | Edit path | v1 constraints |
|---|---|---|---|
| Trade Log | member trade entries | Member CRUD | Process-first schema (T-D5); private; no share |
| Journal | member journal entries on calendar | Member CRUD | Calendar variant; process/adherence |
| Playbook | member rules/setups | Member CRUD | Private |
| Journey | progress + milestones (reuse existing progress) | Mostly system; limited member input | Private; **no second progress store** (Privacy DS-2) |

**T-A1 / Privacy A-2** required before implementation: entities, isolation keys, entitlements, indexes, retention, consent/audit tables (Privacy A-3).

**Process-not-P&L (invariants):** default fields toward setup, plan, rule adherence, deviation, lesson learned; P&L is one neutral field, never hero metric or marketing claim. Tango + Hotel sign schema and copy.

## C6. Method Exemplar (Family A, optional)

Admin-authored **read-only teaching** instance of log/journal-shaped content for members. Reuses **display** components; does not expose other members’ private data. Separate content rows — never a view into Family B storage.

---

# Part D — Governance

## D1. Construct a new template (T-A2)

1. Coach intent + success criteria.  
2. Juliet: template section in this spec (or versioned addendum): slots, policy, binding, family, visibility.  
3. If new domain data: **data-model spec** first (T-A1).  
4. India: boundary, single store, slot policy.  
5. Mike if Family B or entitlements.  
6. Sierra if public JSON-LD.  
7. Echo + Tango (+ Hotel if trading-process tools).  
8. Coach approval → Lima decision log.  
9. Implementation uses only **registered** components; add components via D2 if needed.  
10. Delta gate: S1–S10 evidence as applicable.

**No template-builder UI. Ever (v1 doctrine).**

## D2. Register a new component

1. Classify kind (B2).  
2. Add registry row (B6).  
3. Reuse primitive (B7) or justify new.  
4. Declare write class(es) and graph slice.  
5. If ordered list: full B4.  
6. Stay-put tests under a host template.  
7. HIG note if new control language.

## D3. Decisions (land on approval)

| ID | Decision | Owner | Notes |
|---|---|---|---|
| **T-D1** | Family B in scope: private member tools + optional Method Exemplar; **privacy model = Member-Data-Privacy v0.1** | Coach + India + Mike | Sharing deferred; consent-gated admin read |
| **T-D2** | v1 ship cut of C3 table | India + Coach | **India default:** Cut A = W0+W1 (Family A formalize); Cut B = W2+ Family B after privacy spine + counsel/DPIA status recorded |
| **T-D3** | Bounded variants (Journal ⟵ Calendar) allowed | India + Echo | Finite named variants only |
| **T-D4** | Calendar extends live_sessions | India + Alpha | No parallel event store |
| **T-D5** | Trade Log / Journal process-first schema | Tango + Hotel + Echo | P&L neutral; private |
| **F-D1** | This document is L1+L2+L4 framework of record; In-Place Editing System v1.x superseded | Coach + India | — |
| **F-D2** | Lesson URLs are regions of **Course Presentation**, not a separate product template | India + Juliet | Aligns catalog simplicity |

## D4. Open actions

| ID | Action |
|---|---|
| **T-A1** | Data-model specs: Trade Log, Journal, Playbook, Journey (and Calendar only if model changes) — **with** Privacy A-2 |
| **T-A2** | Operationalize construct-template process in bench workflow |
| **T-A3** | Keep C4 as-built map truthful as code moves (Lima) |
| **T-A4** | Entitlements: which plans unlock Family B tools (Mike + Coach) — Privacy A-4 |
| **T-A5** | Land Member-Data-Privacy through review (Mike primary); counsel/DPIA status recorded |
| **F-A1** | Converge Membership FAQ to FAQ list component if CMS-backed |
| **F-A2** | Split long-term: optional extract of Part A/B/C into separate files **without changing meaning** if review prefers thin docs |

---

# Part E — Implementation map (Family A today)

| Template | Host code (ref) |
|---|---|
| Course Presentation | `EditProvider`, `AdminEditBar`, `app/courses/[slug]/page.tsx`, `CourseTabs`, lesson page, `LessonBody`, `QuizBuilder` |
| Hub Page | `HubEditProvider`, `HubShell`, `HubHeader`, `HubFaqAccordion`, `HubEditBar` |
| Catalog Listing | `CatalogGrid` |
| Resources Library | `ResourceLibrary` |
| Calendar / Schedule | Live sessions UI + admin EventEditor (converge stay-put) |

---

# Part F — Acceptance & definition of done

## F1. Framework tests

| ID | Test | Pass |
|---|---|---|
| AF1 | Course: Modules → + Add lesson | Still Modules; new row; no reload |
| AF2 | Course: module/lesson reorder ↑↓ | Order changes; place held |
| AF3 | Course: Save & Publish on Modules | Dirty clears; still Modules |
| AF4 | Hub: FAQ create / reorder / delete + Save | Still on hub; FAQ list correct; no reload |
| AF5 | Catalog: card banner save | Filters held; art updates |
| AF6 | Lesson: notes or quiz save | Same lesson URL |
| AF7 | Public Course/Hub | JSON-LD present and matches visible content (Sierra) |
| AF8 | Family B (when built) | Two members cannot read each other’s rows (Mike evidence; Privacy §11) |
| AF9 | Trade Log copy/schema | No profit-claim marketing; process fields primary (Tango/Hotel) |
| AF10 | Admin individual read | Denied without consent; allowed + audited with valid grant (Privacy §4.2) |
| AF11 | Aggregate endpoint | No raw content; cohort floor suppresses tiny cells (Privacy §4.1) |

## F2. Definition of done (ship a template)

- [ ] Declared in C3 with version; slots + component policy  
- [ ] Only registered components  
- [ ] Correct actor path (A or B); stay-put verified  
- [ ] No parallel store; no MSC imports; no hardcoded secrets/ports  
- [ ] Public JSON-LD if public  
- [ ] HIG page check  
- [ ] Characterization tests green  
- [ ] Decision log + domain data specs same body of work when new domain  
- [ ] Admin/member guide updated if authoring path changes  

---

# Part G — Relationship to prior specs

| Prior | Relationship |
|---|---|
| In-Place Admin v1.0–v1.5 | Element direct manipulation + admin API — **in force**; reload-on-save language **void** (use Part A4) |
| In-Place Editing System v1.0–v1.2 | **Superseded** by this document |
| Application Templates v0.1 draft | **Absorbed** into Part C + governance |
| Course Hosting, Live Sessions, SEO, Identity, HIG | **Unchanged domain authority**; templates bind to them |
| Member Data & Privacy v0.1 | **Family B privacy authority** — isolation, consent, admin access modes, aggregates |
| Display-Edit / Component-Contract as separate files | Optional future extract (F-A2); meanings live here until then |

---

## Version history

| Ver | Change |
|---|---|
| **v1.0** | Combined framework: Display–Edit Mode + Component Contract (incl. FAQ lists) + Application Templates (Family A/B) + governance + stay-put |

---

*DRAFT v1.0 — no authority until Coach approves and Lima logs F-D1 and applicable T-D*. Where this conflicts with a pillar or decision log, the source wins and this draft is the bug.*
