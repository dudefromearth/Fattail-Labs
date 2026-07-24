# Course type — anatomy & skills

**Type key:** `course`  
**Definition:** `course_create`  
**Shape (locked):** **Header** · **Outline** (Modules → Lessons) · **Knowledge Check** · **Resources**  
**Taxonomy:** [`docs/Content-Types-Taxonomy.md`](../../docs/Content-Types-Taxonomy.md)  
**Status:** Skill pack v0.4 — blueprint system of record; chat is co-pilot  

---

## 0. First validated product: Course Blueprint

Before scripts, video, or final package, the system creates a **Course Blueprint**:

```text
BLUEPRINT = HEADER + OUTLINE   ← system of record for gate 1
```

| Rule | |
|---|---|
| **First product requiring validation** | Header + Outline — not the finished course |
| **Minimum validation bar** | **Descriptions**: course `description_md` + every module `description_md` |
| **System of record** | Approved **structured blueprint** (`content_blueprints`), not the chat log |
| **Co-pilot UX** | **AI chat** drafts/revises that structure; form/PUT is equal fallback |
| **Chat history** | Provenance only — workers never parse chat for modules |
| **Human gate** | **Approve Blueprint** freezes structure and unlocks the factory |
| **Skill** | [`course-blueprint`](./course-blueprint/SKILL.md) |

```text
intent → [ co-pilot chat OR form ] → structured blueprint → min bar
      → human Approves Blueprint (project input for production)
      → stages: KC · resources · scripts · video · final package
      (not “keep chatting until the course exists”)
```

**Long-running chat is not the primary project input.** Chat is an assistant;  
the approved blueprint (then package) is what the factory runs on.

Downstream work is expensive; **unvalidated outlines never consume script/video budget**.

---

## 1. Course anatomy (product shape)

A Course is a tree of **member-facing surfaces**. Pipeline artifacts fill them **after**  
the blueprint is approved (except research, which may feed the chat).

```text
COURSE
│
├── ★ BLUEPRINT (first validation gate)   ← course-blueprint (AI chat)
│     ├── 1. HEADER                       ← course-header
│     │     title, description_md (req), subtitle?, level?, trailer_video?
│     └── 2. OUTLINE                      ← course-lesson-plan
│           MODULES[]  (length ≥ 1)
│             title
│             description_md              ← required
│             LESSONS[]  (stubs at blueprint; full later)
│               title (+ outcomes at blueprint)
│               video + markdown          ← required before final package
│
├── 3. KNOWLEDGE CHECK                    ← after blueprint approve
├── 4. RESOURCES                          ← after blueprint approve
│
└── (factory meta)
      research_pack, scripts, video_package, vision, approval package
```

### 1.1 Component contracts

| # | Component | Required fields | Notes |
|---|---|---|---|
| 1 | **Header** | `title`, `description_md` | Catalog identity; optional subtitle, level, trailer |
| 2 | **Outline → Module** | `title`, **`description_md`** | Description is mandatory — modules are not bare titles |
| 2 | **Outline → Lesson** | `title`, **`video`**, **`markdown`** | Every course lesson is **video + markdown notes** |
| 3 | **Knowledge Check** | ≥1 check for the course (v1) | Questions tied to outcomes; process-safe |
| 4 | **Resources** | May be empty only with explicit reason | Prefer tied to a module/lesson practice beat |

### 1.2 What “video + markdown” means for a Lesson

| Field | Member experience |
|---|---|
| **video** | Primary teaching media (`video_id` / YouTube id after produce or map) |
| **markdown** | Lesson notes under the player (`body_md`) — not optional filler |

A lesson missing video **or** markdown is **incomplete** (Red until filled or plan marks non-video exception — **v1 default: both required**).

### 1.3 Knowledge Check

Not a random quiz dump. Knowledge checks:

- Assess **stated lesson/module outcomes**  
- Live in the outline (typical: quiz lesson at end of module, and/or course capstone)  
- Are authored via **`course-knowledge-check`** and appear in placement as `kind: quiz` lessons (or equivalent assessment structure)  
- Never profit-claim or “gotcha” trivia  

### 1.4 Component → skill map

| Component | Skill(s) that produce it |
|---|---|
| **Blueprint** (Header + Outline) | **`course-blueprint`** — AI chat + first validation gate |
| **Header** | `course-header` (used inside blueprint) |
| **Outline** | `course-lesson-plan` (used inside blueprint) |
| **Lesson video** | `course-lesson-script` → `course-lesson-video` (**after** blueprint approve) |
| **Lesson markdown** | filled post-blueprint; finalized in placement |
| **Knowledge Check** | `course-knowledge-check` (**after** blueprint approve) |
| **Resources** | `course-resources` (**after** blueprint approve) |
| Full graph for Labs | `course-placement` |
| Research / vision / freeze | `course-research`, `course-vision`, `course-package` |
| Orchestration | `course-create` |

---

## 2. Skill inventory

| Skill | Owner | Fills | When |
|---|---|---|---|
| [`course-blueprint`](./course-blueprint/SKILL.md) | November + human; AI co-pilot | **Header + Outline** (SoR); first gate | **First** |
| [`course-research`](./course-research/SKILL.md) | Bravo | claims ground truth | Before/parallel chat optional; before scripts |
| [`course-lesson-plan`](./course-lesson-plan/SKILL.md) | November | Outline detail | Inside blueprint |
| [`course-header`](./course-header/SKILL.md) | November / Sierra | Header fields | Inside blueprint |
| [`course-knowledge-check`](./course-knowledge-check/SKILL.md) | November | KC questions | **After** blueprint approve |
| [`course-resources`](./course-resources/SKILL.md) | November | Resources | **After** blueprint approve |
| [`course-lesson-script`](./course-lesson-script/SKILL.md) | Romeo | scripts | **After** blueprint approve |
| [`course-lesson-video`](./course-lesson-video/SKILL.md) | Papa | videos | **After** blueprint approve |
| [`course-placement`](./course-placement/SKILL.md) | Papa / Quebec | Full Course JSON | Late |
| [`course-vision`](./course-vision/SKILL.md) | Quebec | vision notes | Late |
| [`course-package`](./course-package/SKILL.md) | Quebec | final freeze | Final package gate |
| [`course-create`](./course-create/SKILL.md) | Quebec / WFM | entire run | Orchestrator |

Guardians: Hotel, Tango, lineage as required. Open **block** → card **Red**.

---

## 3. Pipeline (skill order)

```text
course-create
  │
  ├─ 1. course-blueprint ★     ← co-pilot chat/form → structured Header + Outline
  │         min bar: descriptions
  │         HUMAN Approves Blueprint (SoR freeze)   ← FIRST validation product
  │
  ├─ 2. course-research        ← optional enrichment; not “more chat as input”
  ├─ 3. course-knowledge-check
  ├─ 4. course-resources
  ├─ 5. course-lesson-script
  ├─ 6. course-lesson-video
  ├─ 7. course-placement       ← full Header + Outline(video+md) + KC + Resources
  ├─ 8. course-vision
  └─ 9. course-package         → final awaiting_approval (second human gate)
```

**Two human gates for Course:**

| Gate | Product | Min bar |
|---|---|---|
| 1. **Approve Blueprint** | Header + Outline | Descriptions (header + each module) |
| 2. **Approve Package** | Full course package | All stages + video + markdown + KC + resources |

**Required package stages (final):**  
`research_pack` → `lesson_plan` → `script` → `video_package` → `placement_proposal` → `vision_alignment`

---

## 4. Shape validation (Course)

### 4.1 Blueprint gate (first validation)

| Rule | Detail |
|---|---|
| Header description | **required** (min bar) |
| Module descriptions | **each required** (min bar) |
| ≥1 module, ≥1 lesson title each | outline real |
| Structured blueprint | system of record (not chat log) |
| AI chat | co-pilot to draft/revise structure |
| Human Approve Blueprint | freezes SoR; required before expensive steps |

### 4.2 Final package gate

| Rule | Detail |
|---|---|
| Blueprint approved | must already be true |
| Lesson without video | every teaching lesson requires video |
| Lesson without markdown | every lesson requires `body_md` |
| No knowledge check | ≥1 knowledge check |
| Resources | empty only if plan says none required |
| Graph mismatch / open blocks | cannot final-approve |

Tutorial later: same lesson contract (video + markdown), **one** lesson, KC optional/single, slim outline.

---

## 5. Placement JSON shape (Course)

```json
{
  "course_title": "string",
  "subtitle": "string",
  "description_md": "string",
  "level": "beginner|intermediate|advanced",
  "trailer_video_id": null,
  "modules": [
    {
      "title": "Module title",
      "description_md": "What this module covers and why it matters.",
      "kind": "standard|worksheets|resources|bonus",
      "lessons": [
        {
          "title": "Lesson title",
          "slug": "lesson-slug",
          "kind": "video",
          "video_id": "11-char-or-url",
          "body_md": "Lesson markdown notes…",
          "free_preview": false,
          "duration_seconds": 0
        },
        {
          "title": "Module knowledge check",
          "slug": "module-1-check",
          "kind": "quiz",
          "body_md": "Optional intro markdown for the check",
          "quiz": { "questions": [] }
        }
      ]
    }
  ],
  "resources": [
    {
      "title": "Worksheet",
      "kind": "link",
      "url": "https://…",
      "free_preview": true,
      "description_md": "…",
      "tied_to": { "module": "…", "lesson": "…" }
    }
  ]
}
```

Knowledge checks may be:

- **Quiz lessons** inside a module’s `lessons[]` (`kind: quiz`), and/or  
- A final module dedicated to assessment  

v1 preference: **quiz lessons in the outline** so navigation and progress stay one model.

---

## 6. Green / Red (Course)

| Signal | Meaning |
|---|---|
| **Red** (blueprint) | Missing course or module **descriptions**; outline empty |
| **Green** (blueprint) | Min bar met; waiting human **Approve Blueprint** (not a failure) |
| **Red** (later) | Missing video, markdown, KC, cast, block, stall |
| **Green** (later) | Path clear to final package / awaiting final approval |

---

## 7. Reuse for other types (preview)

| Course component | Tutorial | YouTube Long | Campaign |
|---|---|---|---|
| Header | yes | yes | lander header |
| Outline / modules | **one lesson**, no multi-module | no | funnel steps (different) |
| Lesson video + md | one pair | one video + framing md | optional |
| Knowledge check | optional single | no | no |
| Resources | optional | rare | rare |

---

## 8. How to use a skill

1. Open `SKILL.md`.  
2. Confirm **Inputs**.  
3. Execute **Steps**; write artifacts / shape fields.  
4. **Verify**.  
5. **Handoff** — plan before script; script before video; placement last before vision/package.  
