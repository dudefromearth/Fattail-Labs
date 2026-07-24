# FatTail Labs — Content Types Taxonomy

**Status:** **FROZEN** (Coach 2026-07-23)  
**Purpose:** Define the **card / product types** before Workflow Manager, package stages,  
and placement are built further.  
**Parents:** Content Board · Production Package · Campaign Workflow · Workflow Manager Architecture  
**Skills (Course first):** [`skills/course/`](../skills/course/)  

---

## 0. Unifying idea

Every type on the board exists to produce **video and/or markdown content** that can be  
reviewed as a package and placed (or activated) by a human.

```text
Card type  =  shape of the finished work product
           +  what “complete” means
           +  which workflow definition runs
```

**Not** a free-form tag soup. **Four first-class types** in v1.

---

## 1. The four types (**frozen**)

| # | Type key | Label | Finished shape | Primary outputs |
|---|---|---|---|---|
| 1 | `course` | **Course** | **Header** + **one or more modules**, each with **one or more lessons** | Multi-lesson curriculum on Labs (draft course → human publish) |
| 2 | `tutorial` | **Tutorial** | **Header** + **exactly one lesson** | Single-lesson teaching unit on Labs (simpler course record) |
| 3 | `youtube_long` | **YouTube Long** | **Header** + **one primary video** | Long-form video asset (+ markdown framing); optional library placement |
| 4 | `campaign` | **Campaign** | **Funnel** + **Landing page** + **Mail list** | Marketing motion: lander, list/hooks, supporting creative |

```text
                    ┌─────────────────────────────────────┐
                    │     Video + Markdown content        │
                    └─────────────────────────────────────┘
                                      │
          ┌───────────────┬───────────┼───────────┬───────────────┐
          ▼               ▼           ▼           ▼
      Course          Tutorial   YouTube Long   Campaign
   Header+N modules  Header+1    Header+Video   Funnel+Lander
   + lessons         lesson                     + Mail list
```

### 1.1 Course vs Tutorial (both “Labs learning units”)

Both place as **member-facing teaching content** on Labs. They differ only in **structure**:

| | **Course** | **Tutorial** |
|---|---|---|
| Header | Title, description, level, trailer, etc. | Same class of header fields |
| Body | **≥1 module**, **≥1 lesson total** (typically many) | **Exactly one lesson** (one module or flat single-lesson shape) |
| Cognitive promise | Pathway / multi-step skill | One tight skill or walkthrough |
| Package / plan | Full `lesson_plan` (modules tree) | Slim plan: single lesson outline |
| Placement | Multi-module draft course | Draft course with single lesson graph |
| Approve → | Place draft course | Place draft course (constrained shape) |

**Rule:** A Tutorial is **not** a Course with unused modules. Validation **rejects**  
tutorial packages that contain more than one lesson (or more than one module if we  
standardize on single-module/single-lesson).

**Rule:** A Course that ends up with only one lesson may still be typed `course` if the  
intent is multi-step later — but production **target** for `tutorial` is single-lesson.

### 1.2 YouTube Long

| | **YouTube Long** |
|---|---|
| Header | Title, description/thumbnail framing, SEO/AEO notes (markdown) |
| Body | **One primary long-form video** (plus script provenance) |
| Not required | Multi-module curriculum, mail list, funnel |
| Placement | Video package + optional Labs/library card or external YT-first path |
| Distinct from Tutorial | Tutorial is a **lesson** (teaching unit on Labs). YT Long is a **show/video asset** whose primary home may be YouTube |

### 1.3 Campaign

| | **Campaign** |
|---|---|
| Funnel | Offer path, CTAs, sequencing (what happens after the click) |
| Landing page | Public lander (markdown/spec → placed lander) |
| Mail list | List / ActiveCampaign (or successor) hooks: tags, list, campaign key |
| Supporting | Scripts, creative/video variants as package stages — still video+markdown where used |
| Placement | Campaign record + lander + growth hooks — **not** a multi-module course |

---

## 2. What each type must produce (shape contract)

These are **product shapes**, independent of agent names. Workflow steps exist to fill them.

### 2.1 Course (`course`)

**Member-facing shape (locked):** Header · Outline · Knowledge Check · Resources.

```text
HEADER
  title, subtitle?, description_md, level?, trailer_video?

OUTLINE
  MODULES[]  (length ≥ 1)
    title
    description_md              ← required
    LESSONS[]  (length ≥ 1 per module)
      title, slug?
      video                     ← required (video_id)
      markdown                  ← required (body_md)
      free_preview?, duration?

KNOWLEDGE CHECK                 ← ≥1 per course (quiz lessons in outline)
  questions tied to outcomes

RESOURCES[]                     ← empty only with explicit reason
  title, kind, url, description_md?, tied_to?
```

**First validated product:** **Course Blueprint** = Header + Outline.  
**System of record:** approved structured blueprint (not the chat log).  
**Co-pilot:** AI chat drafts/revises that structure; form/PUT allowed.  
**Minimum validation bar: descriptions** (course + every module). Human  
**Approve Blueprint** freezes input before scripts/video.  
See [`skills/course/course-blueprint/SKILL.md`](../skills/course/course-blueprint/SKILL.md).

**Complete (final package) when:** blueprint approved; every lesson has **video + markdown**;  
≥1 knowledge check; resources resolved; package stages present; vision aligned; no open  
block flags.

**Skills:** [`skills/course/`](../skills/course/)

### 2.2 Tutorial (`tutorial`)

```text
HEADER
  title, description_md, level?, trailer_video? (optional)
LESSON  (exactly one)
  title, body_md?, video?, kind
```

**Complete when:** header + exactly one lesson; required package stages present;  
no open block flags.  
**Invalid:** second lesson, second module, or multi-module tree.

### 2.3 YouTube Long (`youtube_long`)

```text
HEADER
  title, description_md (markdown framing / show notes)
VIDEO
  primary long-form video (id/url + package metadata)
  script provenance (markdown)
```

**Complete when:** header + primary video package + required stages; no open block flags.  
**Not required:** modules[], lessons[] tree, mail list.

### 2.4 Campaign (`campaign`)

```text
FUNNEL
  objective, audience, CTA path, success metrics (brief)
LANDING PAGE
  lander slug, H1, answer/body markdown, CTA mode + target
MAIL LIST
  list/tag/hooks (growth_hooks / AC campaign key)
(+ optional creative: script pack, video variants)
```

**Complete when:** funnel brief, landing spec, mail-list hooks, and remaining required  
campaign stages present; no open block flags for paid/member doctrine checks.

---

## 3. Product line keys (board field)

| `product_line` value | Label on card |
|---|---|
| `course` | Course |
| `tutorial` | Tutorial |
| `youtube_long` | YouTube Long |
| `campaign` | Campaign |

**v1 board create:** only these four.  
**No** `coaching_short`, `thematic_short`, or `other` as first-class factory types in this freeze.

### 3.1 Migration from earlier product lines

| Previous | Disposition |
|---|---|
| `course` | Unchanged — multi-module course |
| `youtube_long` | Unchanged — header + video |
| `campaign` | Unchanged meaning; shape reframed as Funnel + Lander + Mail list |
| `coaching_short` | **Not v1 type.** Revisit later as short-form video line or map into tutorial/YT |
| `thematic_short` | **Not v1 type.** Same |
| `other` | **Not v1 type.** Escape hatch only if Coach insists; prefer one of the four |

Existing DB rows with deprecated lines remain readable; new cards and WFM registry  
use the four-type set. Migration script optional when factory ships.

---

## 4. Package stages by type (proposal)

Align with Production Package Spec when frozen; **tutorial is new**.

| product_line | Required stages (proposed) |
|---|---|
| `course` | `research_pack`, `lesson_plan`, `script`, `video_package`, `placement_proposal`, `vision_alignment` |
| `tutorial` | `research_pack`, `lesson_plan` (single-lesson), `script`, `video_package`, `placement_proposal`, `vision_alignment` |
| `youtube_long` | `research_pack`, `script`, `video_package`, `placement_proposal`?, `vision_alignment` |
| `campaign` | `campaign_brief` (funnel), `landing_spec`, `script`?, `video_package`?, `distribution_plan`?, `vision_alignment`, `growth_hooks` (mail list) |

Notes:

- **Tutorial `lesson_plan`** is a **single-lesson** plan (not multi-module tree). Validator enforces shape.  
- **YouTube Long `placement_proposal`:** optional vs required TBD — if YT-only, may be lighter; if Labs library card required, keep required. **Coach decision.**  
- **Campaign:** funnel ≈ brief; lander ≈ `landing_spec`; mail list ≈ `growth_hooks`. Creative stages as needed for the motion.

---

## 5. Placement by type

| Type | On human Approve / place |
|---|---|
| `course` | Apply multi-module **draft course** on Labs |
| `tutorial` | Apply **single-lesson draft course** on Labs (same courses table, constrained graph) |
| `youtube_long` | Apply video placement plan (library/external); **not** multi-module curriculum |
| `campaign` | Upsert campaign + place lander + wire mail-list hooks |

Member **publish** of Labs courses/tutorials remains human in-place admin (not WFM).

---

## 6. Workflow definitions (names only; detail in WFM doc)

| product_line | Definition key |
|---|---|
| `course` | `course_create` |
| `tutorial` | `tutorial_create` |
| `youtube_long` | `youtube_long_create` |
| `campaign` | `campaign_create` |

Shared engine. **Different** steps and Green/Red requirements per type  
(see `docs/Workflow-Manager-Architecture.md`).

---

## 7. Green / Red (type-aware, short form)

| Type | Green means path clear to finish… | Example Red holds |
|---|---|---|
| Course | Multi-module package + placement | Missing module tree, missing lesson_plan depth |
| Tutorial | Single-lesson package + placement | Second lesson present (invalid), missing sole lesson video/md |
| YouTube Long | Header + primary video package | Missing video, missing script |
| Campaign | Funnel + lander + mail list hooks | Missing lander slug, missing list/tag hooks |

Red → notify owner + resolvers (WFM §7A).

---

## 8. Explicit non-goals of this freeze

- Short-form / Reels / X-native types (later)  
- Multi-card sagas (campaign spawns 12 child cards) — v1.1  
- Treating Tutorial as a flag on Course instead of its own type (rejected: different validation + UX)  
- Profit claims or commerce inside campaign cards (Woo remains storefront)

---

## 9. Decisions (Coach ratified 2026-07-23)

| # | Decision | Status |
|---|---|---|
| 1 | Freeze these **four** types for v1 factory | **Yes — frozen** |
| 2 | Tutorial = own `product_line` (not `course` + flag) | **Yes — frozen** |
| 3 | Tutorial placement = same `courses` table, 1 lesson | **Yes** |
| 4 | Deprecate `coaching_short` / `thematic_short` / `other` on new cards | **Yes** for factory v1 |
| 5 | YouTube Long Labs library place | Optional — video package required; Labs place optional |
| 6 | Campaign mail list | Pluggable provider; ActiveCampaign first |
| 7 | Skills | **Component skills per type**; **start with Course** (most complex) |

---

## 10. Skills track (after freeze)

| Order | Work |
|---|---|
| 1 | **Course** component skills — [`skills/course/`](../skills/course/) |
| 2 | Derive **Tutorial** skills (subset / stricter shape of Course) |
| 3 | **YouTube Long** skills (header + video path) |
| 4 | **Campaign** skills (funnel + lander + mail list) |

Also still pending for code/spec enum sync:

1. Content Board Spec — `product_line` enum  
2. Production Package Spec — stages for `tutorial`; trim deprecated lines  
3. Campaign Workflow Spec — Funnel + Lander + Mail list language  
4. WFM registry of four definitions  
5. Board UI type picker  

---

## 11. One-line definitions (for UI copy)

| Type | One-liner |
|---|---|
| **Course** | A full curriculum: header plus modules and lessons. |
| **Tutorial** | A single lesson under a header — one skill, one sitting. |
| **YouTube Long** | A long-form video with a header and framing markdown. |
| **Campaign** | A growth motion: funnel, landing page, and mail list. |

---

*Types frozen. Course skills are the next build surface.*
