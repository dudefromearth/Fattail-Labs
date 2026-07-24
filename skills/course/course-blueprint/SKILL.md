---
name: course-blueprint
description: >
  Create and validate the Course Blueprint (Header + Outline) — the first factory
  product requiring human validation. AI chat is a co-pilot that drafts the structured
  blueprint; the approved blueprint row is the system of record, not the chat log.
  Min bar: descriptions. Use for course outline, blueprint gate, co-pilot chat, or
  /course-blueprint.
---

# course-blueprint

**Type:** Course — **first validated product**  
**Composes:** Header + Outline (modules with descriptions + lesson stubs)  
**Owner:** November (structure) · human **validates** · AI chat as **co-pilot**  
**WFM step:** `blueprint` → status `waiting_human` until Approve Blueprint  
**Package stages touched:** seeds `lesson_plan` structure + header fields (not full package)  

---

## 0. Doctrine: co-pilot vs system of record

| Layer | Role |
|---|---|
| **Board card** | Project shell: intent, status, ownership |
| **Course Blueprint** (DB row / approved snapshot) | **System of record** for gate 1 — primary project input after approve |
| **AI chat** | **Co-pilot** — temporary workspace to *produce and revise* the blueprint |
| **Chat history** | **Provenance / evidence**, not the course and not the backlog |
| **Full package** (later) | System of record for gate 2 |

```text
Chat is an IDE assistant, not the repository.
Downstream skills and agents consume the APPROVED BLUEPRINT structure —
never “whatever we said in turn 47.”
```

**Does a long-running chat session as primary project input make sense?**  
**No.** Chat may be long while drafting, but the **project input** is the structured  
blueprint (then package). Infinite scrollback is not a contract.

| Question | Answer |
|---|---|
| Chat as default *way to draft* the blueprint? | **Yes** |
| Chat as *primary input to the project / factory*? | **No** |
| What gates and workers read? | **Approved blueprint** (header + outline JSON) |

---

## 0.1 Why this skill exists

Everything after the blueprint is expensive (scripts, video, KC detail, placement).  
The system must not run that work on an unvalidated curriculum skeleton.

```text
Card intent
    │
    ▼
┌──────────────────────────────────────────────┐
│  COURSE BLUEPRINT  (system of record)        │
│  Header + Outline                            │
│  Co-pilot UX: AI chat (form fallback)        │
│  Min bar: descriptions                       │
│  Gate: human Approves Blueprint              │  ← FIRST validation product
└──────────────────────────────────────────────┘
    │ Approve Blueprint (freezes structure)
    ▼
research polish → KC → resources → scripts → video → … → final package gate
    (advance by skills/stages — not by “keep talking”)
```

**This is the first product the system creates that requires validation.**  
Final package approval remains a later gate; it does not replace the blueprint gate.

---

## 1. What a Blueprint is

| Part | Contents |
|---|---|
| **Header** | `title`, **`description_md` (required)**, optional subtitle, level, trailer intent |
| **Outline** | `modules[]` (≥1): each has `title` + **`description_md` (required)** + `lessons[]` stubs |

Lesson stubs at blueprint stage:

| Field | Blueprint requirement |
|---|---|
| `title` | Required |
| `outcomes` (short) | Strongly recommended |
| `video` / full `body_md` | **Not required yet** — filled after blueprint approval |
| Knowledge check questions | **Not required yet** — slots optional |
| Resources | Not required yet |

Blueprint is **structure + descriptions**, not a finished course.

---

## 2. Validation bar

### 2.1 Minimum (must pass — machine + human)

| Check | Rule |
|---|---|
| Header **description** | Non-empty `description_md` (not title-only) |
| ≥1 module | Outline not empty |
| Every module **description** | Non-empty `description_md` |
| ≥1 lesson title per module | Stubs exist so the outline is real |
| Doctrine lint (soft/hard) | No profit claims in descriptions |

**Minimum bar in one line:** *descriptions must exist* — course header description and  
every module description. Title-only blueprints **fail** validation (Red / blocked).

### 2.2 Likely / expected (human chat quality)

Most valid blueprints will exceed the minimum because they were **developed in AI chat**:

- Course description: problem → what you build → outcomes (150–400 words ideal)  
- Module descriptions: why this module exists, what changes for the learner  
- Lesson titles that match outcomes  
- Level + pathway notes  
- Open questions listed for Coach  

Human may request revisions in chat until they **Approve Blueprint**.

### 2.3 Not validated at this gate

- Lesson videos  
- Full lesson markdown  
- Full scripts  
- Rendered media  
- Complete knowledge-check question banks  
- Resource files  

Those skills run **only after** blueprint approval.

---

## 3. Co-pilot UX: AI chat (not the product)

**Default authoring path** is chat; **default product** is always the structured blueprint  
shown in **Preview**. Operators judge the outline, not the eloquence of the assistant.

```text
Operator opens course card → Blueprint panel
    → Co-pilot chat drafts/revises Header + Outline
    → Each turn PERSISTS structured blueprint (system of record grows)
    → Preview shows the product; chat is the workbench
    → Validate min bar → human Approves Blueprint (freeze)
    → Factory continues by stages — chat is no longer the driver
```

### 3.1 Chat contract

| Role | Behavior |
|---|---|
| **System / skill prompt** | Course doctrine; shape rules; process outcomes only; flagship-first when relevant |
| **User** | Intent, audience, source notes, “make module 2 about X”, “shorten description” |
| **Assistant** | Updates **structured** header/outline; short plain-language note; never treats chat as the deliverable |
| **Server** | Persist blueprint JSON every successful turn; chat log is append-only provenance |

### 3.2 Chat modes (episodic, not eternal project)

| Mode | When |
|---|---|
| **Draft from intent** | Card has title + intent_md — co-pilot proposes full blueprint |
| **Revise** | Human comments — co-pilot patches structure; still writes blueprint row |
| **Import polish** | Human pasted outline — co-pilot fills missing module descriptions |

Long threads are fine for **one discovery sitting**. They are not the backlog.  
Context sent to the model: **current blueprint JSON + last N turns**, not infinite history as truth.

### 3.3 Fallback without chat

`PUT` / form / paste is first-class for operators who already know the outline:

- Same min-bar validation  
- Same Approve gate  
- Chat is **recommended co-pilot**, not a monopoly  

### 3.4 Provenance (chat is evidence)

Each AI turn that changes the blueprint records:

- `ai_invocations`  
- Actor (human admin + model)  
- Resulting blueprint version  
- Chat turns on the blueprint row  

Evidence over assertion. **Workers never parse chat to invent modules.**

### 3.5 After Approve Blueprint

| Do | Don’t |
|---|---|
| Advance via skills (research, KC, script, video, package) | Use “continue the chat” as the path to video |
| Open **new blueprint version** if curriculum structure must change | Mutate approved structure silently in scrollback |
| Keep chat history for audit | Treat chat as input to Romeo/Papa |

---

## 4. Inputs

| Layer | What | Source |
|---|---|---|
| **Project shell** | `product_line=course`, title, intent | board card |
| **Primary structured input (gate 1)** | Header + Outline | `content_blueprints` (after co-pilot or PUT) |
| **Co-pilot context** | chat turns, clarifications | blueprint `chat_json` (supporting only) |
| **Optional** | inputs_md, research, Content Vision | card / vision / research pack |

Research **may** run before blueprint (richer co-pilot) or after (blueprint-first).  
**Scripts/video never before approved blueprint.**

---

## 5. Outputs (system of record)

Persisted in **`content_blueprints`** (not “the chat won”):

1. `header_json` + `outline_json` — the product  
2. `chat_json` — provenance  
3. `validation_json` + `status`  
4. On approve: `lesson_plan` artifact snapshot for downstream skills  

```json
{
  "blueprint_version": 1,
  "status": "pending_validation",
  "header": {
    "course_title": "…",
    "description_md": "…",
    "subtitle": null,
    "level": "beginner"
  },
  "outline": {
    "modules": [
      {
        "title": "…",
        "description_md": "…",
        "lessons": [
          { "title": "…", "outcomes": ["…"] }
        ]
      }
    ]
  },
  "chat_session_id": "optional",
  "validation": {
    "min_descriptions_ok": true,
    "errors": []
  }
}
```

Board projection:

- sub_stage: `design` / `blueprint`  
- readiness: **Red** if min bar fails; **Green** if min bar passes and awaiting human  
- On submit for validation: notify owner/admins (optional kind `workflow.blueprint_ready`)  

---

## 6. Gate: human validates

| Action | Effect |
|---|---|
| **Approve Blueprint** | `blueprint_status=approved`; unlock KC, resources, scripts, video skills |
| **Request revision** | Stay in blueprint; chat continues; status pending |
| **Reject card** | Existing board reject path |

Until **Approve Blueprint**:

- Worker **must not** run `course-lesson-script`, `course-lesson-video`, full KC authoring, or final package  
- Card may show **Green** (min bar met, waiting on human) or **Red** (descriptions missing)  

This is a **`wait_human`** WFM step — intentional gate, not a failure.

---

## 7. Steps (procedure)

1. Open course card; enter Blueprint / chat.  
2. AI (or human) drafts Header + Outline.  
3. Run **minimum validator** (descriptions + structure).  
4. If fail → Red; show missing fields; continue chat.  
5. If pass → offer **Submit for validation** / show Approve Blueprint.  
6. Human Approves → handoff to post-blueprint pipeline.  
7. On revision → return to chat; bump blueprint version.  

---

## 8. Verify

### Machine (min bar)

- [ ] Header `description_md` non-empty  
- [ ] ≥1 module  
- [ ] Every module `description_md` non-empty  
- [ ] Every module has ≥1 lesson title  
- [ ] No profit-claim lint hits (or flagged for human)  

### Human (validation gate)

- [ ] Curriculum scope matches intent  
- [ ] Module sequence sensible  
- [ ] Descriptions honest and process-safe  
- [ ] Worth spending script/video budget  

---

## 9. Invariants

1. **First validation product** — nothing more expensive runs without **approved blueprint**.  
2. **Structured blueprint is system of record** — chat is co-pilot + provenance only.  
3. **Descriptions required** — min bar is not optional.  
4. **Chat is default co-pilot UX** — forms are equal for validation, not second-class truth.  
5. **Fail loud** on empty descriptions — no silent “Untitled module”.  
6. **Process outcomes only** in all AI-proposed copy.  
7. **Human gate** for blueprint approve — agents propose, humans validate.  
8. **Downstream never reads chat for structure** — only approved header/outline (and later package).  
9. Provenance on AI-assisted versions.  

---

## 10. Handoff

| After | Next |
|---|---|
| Blueprint approved | Factory stages: research → KC → resources → scripts → video → package |
| Blueprint revision | Co-pilot chat or PUT → new version if was approved → re-validate |
| Related skills | `course-header` + `course-lesson-plan` = field procedures; **this skill** = product + gate |

**Relationship to other skills:**

- `course-header` / `course-lesson-plan` — component procedures used by co-pilot and PUT.  
- `course-blueprint` — product + gate; **approved row** is input to the rest of `course-create`.  
- `course-create` **blocks** until Approve Blueprint; does not “continue chat” into video.  

---

## 11. API (built)

Prefix: `/api/admin/board` · module: `server/blueprint.py` · migration `024`

| Method | Path | Behavior |
|---|---|---|
| GET | `/items/{id}/blueprint` | Latest blueprint (ensures empty draft if none) |
| PUT | `/items/{id}/blueprint` | Manual header/outline save (human admin) |
| POST | `/items/{id}/blueprint/chat` | AI chat turn; body `{ message, use_fixtures?, prefer?, temperature?, max_tokens? }` |
| POST | `/items/{id}/blueprint/validate` | Run min bar; returns `{ validation, blueprint }` |
| POST | `/items/{id}/blueprint/approve` | Human admin only; requires min bar; writes `lesson_plan` artifact |

**Chat response:**

```json
{
  "blueprint": { "id", "status", "header", "outline", "chat", "validation", ... },
  "assistant_message": "…",
  "parse_error": false,
  "ai": { "provider", "model", "usage", "invocation_id", "fixture" }
}
```

**Fixture mode:** `use_fixtures: true` — deterministic draft without LLM keys (tests + offline).

**UI (built):**  
- **Primary:** full-page workspace `/admin/board/blueprint/{id}` — **chat-first**  
  (~3/5 width streaming chat, ~2/5 live outline). Develop Header / modules / lessons here.  
- **Drawer:** launch pad only (counts + **Open outline workspace**).  
- Live Grok stream default; fixtures opt-in. Card chip `bp:…`.

---

## 12. Green / Red at blueprint stage

| State | Signal |
|---|---|
| Missing descriptions / empty outline | **Red** — cannot validate |
| Min bar OK, waiting human | **Green** (or chip “Ready for blueprint review”) — not a hold |
| Human requested revision | Working state; may stay Green while chat continues |
| Approved | Proceed; blueprint frozen unless re-open revision |
