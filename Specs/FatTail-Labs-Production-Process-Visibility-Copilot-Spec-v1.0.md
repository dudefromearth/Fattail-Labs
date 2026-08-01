# FatTail Labs — Production Process Visibility & Co-pilot Spec v1.0

**Status:** Accepted (as-built + normative) — 2026-08-01  
**Type:** Product / production UX + companion AI  
**Parents:**  
- Content Board Spec v1.0 (`FatTail-Labs-Content-Board-Spec-v1.0.md`)  
- Production Package Spec v1.0  
- Course Blueprint / course skill pack (`skills/course/`)  
- Handoff Contract v1.0 (`FatTail-Labs-Handoff-Contract-v1.0.md`)  
- Workflow Manager Architecture (design; not fully built)  
- CGE integration plan (`docs/CGE-Skills-Course-Integration-Plan.md`)  
**UI surface:** `/admin/board` card drawer  
**Decision log:** 2026-08-01 — operator needs insight, control, and continuous AI communication through the full card lifecycle  

---

## 0. Summary

This spec defines two complementary control surfaces on every production board card:

| Surface | Role |
|---|---|
| **Workflow cockpit** | Deterministic UI: readiness, factory path, checklist, next action, artifact attach with feedback |
| **Process co-pilot** | Card-scoped AI chat: peer in at any column, diagnose, draft fixes, optional one-click apply of proposed artifacts |

Together they close the gap where operators “submit a card / drop a script” and cannot tell **where the process is**, **what still counts as done**, or **what to do next**.

**Blueprint co-pilot** (November chat on Header + Outline) remains a **separate**, structure-only channel. It is not replaced by the process co-pilot.

---

## 1. Problem statement

### 1.1 Observed failure mode

1. Operator creates a course card (e.g. “Stop the Bleed”), adds intent and a **script** artifact.  
2. Board columns and artifact list update, but **no narrative** explains progress.  
3. Package checklist stage keys (`research_pack`, `script`, …) are technical and easy to miss.  
4. “Quebec tick / Tick + produce” and column drags feel like **side effects**, not a conversation with a process.  
5. AI help existed only for **blueprint** co-pilot — not for mid-pipeline diagnosis or repair.

### 1.2 Requirements (operator)

| ID | Requirement |
|---|---|
| R1 | At any time, see **where the card is** (column + factory step) in plain language. |
| R2 | See **what is complete / missing / blocked** for the package contract of that `product_line`. |
| R3 | Get a **single recommended next action** when one is computable. |
| R4 | When adding evidence (artifacts), receive **process feedback** (what that changed; what remains). |
| R5 | Have an **AI chatbot available for the entire lifecycle** of the card (not only blueprint). |
| R6 | Use AI to **inspect**, **verify**, and **fix** without silent publish or inventing completed stages. |
| R7 | Preserve **human gates** (Approve Blueprint, Approve Package) and package stages as systems of record. |

---

## 2. Scope

### 2.1 In scope (v1.0)

- Workflow cockpit UI on **course** cards (primary).  
- Process co-pilot UI on **all** product lines’ card drawers.  
- Persistence of process co-pilot chat per card.  
- APIs to load/send process co-pilot messages with **live card context**.  
- Optional **Apply** of model-proposed package artifacts.  
- Alignment with course factory skill order (including optional `course-lesson-edit`).  
- Documentation links from board operator guide.

### 2.2 Out of scope (v1.0)

- Full Workflow Manager **run/step engine** (see WFM architecture; future).  
- Automatic board transitions initiated solely by co-pilot (no auto-column moves).  
- Email/SMS on every readiness change (Admin Notifications may cover Red later).  
- Replacing blueprint chat or cast/HeyGen controls.  
- Importing CGE `video-idea-finder` / `holy-trifecta` into course-create.  
- Member-facing UX.

### 2.3 Non-goals

- Chat as system of record for structure or package stages.  
- Silent member publish or public YouTube upload from co-pilot.  
- Profit claims or performance-porn drafts in co-pilot outputs.

---

## 3. Architecture overview

```text
┌─────────────────────────────────────────────────────────────┐
│  Board card drawer  (/admin/board → item)                     │
│                                                               │
│  ┌─ Process co-pilot ─────────────────────────────────────┐  │
│  │  Chat history (content_item_process_chat)                │  │
│  │  Context = live snapshot of card + package + flags       │  │
│  │  Optional proposed ```artifact blocks → Apply           │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌─ Workflow cockpit (course) ────────────────────────────┐  │
│  │  Readiness · path · checklist · next CTA · add artifact │  │
│  └──────────────────────────────────────────────────────────┘  │
│  Blueprint panel (course) · Cast/HeyGen · Flags · History    │
└───────────────────────────────┬─────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
 content_items            content_artifacts        content_blueprints
 content_transitions      package_checklist()      (structure SoR gate 1)
 content_flags            production package       handoff_v1 (docs)
 content_item_process_chat
```

**Authorities:**

| Layer | Authority |
|---|---|
| Board status / transitions | Content Board Spec |
| Package completeness | Production Package Spec + `packages.package_checklist` |
| Course structure gate | Approved Course Blueprint |
| Skill-to-skill machine handoff | Handoff Contract v1.0 (docs-first in v1) |
| Operator narrative + assist | **This spec** (cockpit + process co-pilot) |

---

## 4. Mental model (normative)

Operators must be taught three **orthogonal** dimensions:

| Dimension | Question | Source of truth |
|---|---|---|
| **Board column** | Where is this in human process? | `content_items.status` (+ `sub_stage`) |
| **Package stages** | What evidence exists to approve? | `content_artifacts` by stage + checklist |
| **Blueprint gate** (course) | Is structure frozen? | `blueprint_status == approved` |

**Rule:** Completing one dimension does not complete the others.  
Example: a `script` artifact does **not** mean the card is ready for approval or that blueprint is approved.

**Rule:** Co-pilot and cockpit **project** these dimensions; they do not invent stage completion.

---

## 5. Workflow cockpit

### 5.1 Purpose

Deterministic, always-consistent control panel for **course** cards so the operator never relies on memory for factory order.

### 5.2 Placement

- **Surface:** Board card drawer, above Blueprint panel for `product_line=course`.  
- **Component:** `web/components/admin/CourseWorkflowPanel.tsx`.  
- **Header hint:** Board title area mentions “workflow cockpit”.

### 5.3 Sections (required)

| # | Section | Behavior |
|---|---|---|
| 1 | **Readiness** | Binary-ish signal: GREEN / RED / IDLE with plain-language detail |
| 2 | **Where this card is** | Column, sub_stage, cast; paragraph explaining column meaning |
| 3 | **Course factory path** | Ordered steps with state: done / current / todo / blocked |
| 4 | **Package checklist** | Human labels + stage keys; optional note for `script_edit_brief` |
| 5 | **What to do next** | Single primary recommendation + optional CTA button / blueprint link |
| 6 | **Add package artifact** | Stage + title + body → POST artifact → **feedback string** on remaining gaps |
| 7 | **Recent process activity** | Last transitions (actor, from→to, reason) |

### 5.4 Readiness rules (course)

| Condition | Signal | Detail (intent) |
|---|---|---|
| Open **block** flags | RED | Name count; clear flags before finish |
| `product_line=course` and blueprint not `approved` | RED | Approve blueprint before expensive stages count as factory progress |
| `awaiting_approval` and checklist complete | GREEN | Ready for human package approve |
| `published` | GREEN | Board path finished |
| In active columns with `missing_stages` | RED | List missing human labels; name next stage |
| `draft` | IDLE | Not in factory yet |
| Else | GREEN | Path clear for current column |

### 5.5 Factory path steps (course)

Displayed order (labels may vary; keys fixed):

1. **Blueprint** — blocked until approved  
2. **research_pack**  
3. **lesson_plan**  
4. **script**  
5. **video_package** (optional enrichment: `script_edit_brief` noted separately)  
6. **placement_proposal**  
7. **vision_alignment**  
8. **Package approve** — human gate  

Step state:

- `done` — complete for that gate/stage  
- `current` — first incomplete after prerequisites  
- `todo` — later  
- `blocked` — prerequisite not met (typically unapproved blueprint)

### 5.6 Next-action rules (course)

| Priority | Condition | Recommended next |
|---|---|---|
| 1 | `draft` | Move to Queued |
| 2 | Course + blueprint not approved | Open blueprint workspace / Approve Blueprint |
| 3 | `queued` | Claim → Scheduled |
| 4 | `scheduled` | Start production (`in_production`, sub_stage research) |
| 5 | `in_production` + missing stages | Focus first missing stage (copy + skill name) |
| 6 | `in_production` + checklist complete | Submit for approval |
| 7 | `awaiting_approval` | Human approve / reject / revision (no auto) |

### 5.7 Artifact attach feedback (required)

When the operator saves an artifact via the cockpit:

1. Persist via existing `POST .../artifacts`.  
2. Show a **process reply** including:  
   - Stage human label recorded  
   - Remaining missing stages (if any)  
   - Special case for `script`: mention optional edit brief + HeyGen/map next  

### 5.8 Column help copy (normative intent)

| status | Operator-facing meaning |
|---|---|
| `draft` | Parking lot; queue when ready |
| `queued` | Submitted; claim or allow advance |
| `scheduled` | Claimed; start production to work stages |
| `in_production` | Active factory; fill stages then submit |
| `awaiting_approval` | Human package gate |
| `revision_requested` | Fix per reason; return to production |
| `published` | Board path complete |
| `rejected` | Stopped; reopen only via draft policy |

---

## 6. Process co-pilot

### 6.1 Purpose

A **card-scoped AI companion** available for the **entire** lifecycle so the operator can peer in at any point to:

- Confirm work is progressing correctly  
- Diagnose stuck / RED states  
- Draft missing package content  
- Repair weak intent/inputs language (doctrine-safe)  

### 6.2 Identity

| Property | Value |
|---|---|
| Product name | Process co-pilot |
| Agent flavor | Quebec-style process orchestration (not November structure-only) |
| Model path | Existing agent model interface (Grok primary; fixture mode for offline) |
| Callsign/task for AI log | `quebec` / `process_copilot_chat` |

### 6.3 Separation from blueprint chat

| | Blueprint co-pilot | Process co-pilot |
|---|---|---|
| Skill/domain | `course-blueprint` | This spec |
| Mutates | Header + Outline (structured blueprint) | **Does not** mutate blueprint structure by default |
| When | Structure design / pre-approve | Any status, any product_line |
| SoR | Approved blueprint row | Package stages + board status |
| Storage | `content_blueprints.chat_json` | `content_item_process_chat.chat_json` |

**Rule:** Process co-pilot may **advise** “go approve blueprint” or draft outline text for the operator to paste into blueprint chat; it must not silently rewrite the approved blueprint.

### 6.3a Knowledge pack (required every live Grok turn)

In addition to the live snapshot, the server injects a **static knowledge pack**
(`server/process_copilot_knowledge.py`) covering:

- Product taxonomy (first-class v1 + legacy board lines)  
- Board column meanings and operator moves  
- Package contracts (from `packages.REQUIRED_STAGES`, live import)  
- Course factory skill sequence  
- Operator playbook / stuck states  
- Handoff + CGE boundaries  

**Rule:** Conceptual questions (e.g. “what is a coaching short?”) are answered from the
knowledge pack; completion claims always from the live snapshot.

**Ops for full Grok reasoning:** `XAI_API_KEY` must be set on the Labs API process.
Without it, co-pilot falls back to local guidance (still knowledge-aware for common asks).

See also: `docs/Process-Copilot-Grok-Integration.md`.

### 6.4 Context snapshot (required every turn)

Server builds a **live** JSON snapshot including at least:

- Card: id, title, product_line, status, sub_stage, cast_id, priority, intent/acceptance/inputs (truncated), claimed_callsign, blueprint_status, placed_course_slug  
- `package_checklist` (complete, missing_stages, stages[], open_block_flags)  
- Blueprint summary (status, version, module_count, validation_ok) when available  
- Artifacts: stage, title, actor, body length + preview  
- Open flags (guardian, severity, message)  
- Recent transitions (capped)  
- Course factory order reminder list  

**Rule:** Model output must treat this snapshot as ground truth for “done/missing.”

### 6.5 System behaviors (invariants)

1. **Insight first** — status, missing, blocked.  
2. **One best next move** when possible.  
3. **No invented completion** — never claim a stage exists if not in snapshot.  
4. **Doctrine** — process outcomes only; no profit guarantees.  
5. **Gates** — for courses, emphasize Approve Blueprint before expensive stages.  
6. **No silent publish.**  
7. **Fail loud** on empty messages / AI config errors (422).  

### 6.6 Proposed artifacts

When drafting package content, the model **should** use:

```text
```artifact
stage: <package_stage_key>
title: <short title>
---
<markdown body>
```
```

Server/UI parse these into `proposed_artifacts[]`.  
Operator **Apply** → existing add-artifact API → optional follow-up co-pilot turn re-checking readiness.

Supported stages for proposals (v1):

`research_pack` · `lesson_plan` · `script` · `script_edit_brief` · `video_package` · `placement_proposal` · `vision_alignment`

### 6.7 Optional action hints (advisory only)

Model may emit:

```text
```action
transition: <status>
sub_stage: <sub_stage|null>
reason: <one line>
```
```

**v1:** UI may display as advice; **must not** auto-transition without explicit human control (cockpit buttons or board footer).

### 6.8 Fixture mode

`use_fixtures: true` returns deterministic guidance without external LLM (for demos/tests). Still persists chat turns.

### 6.9 Chat retention

- Persist full chat history per card (cap last **80** turns server-side).  
- UI shows full loaded history; scrollable.  
- Chat is **provenance**, not package SoR.

---

## 7. Data model

### 7.1 Table `content_item_process_chat`

**Migration:** `063_process_copilot_chat.sql`

| Column | Type | Notes |
|---|---|---|
| `content_item_id` | BIGINT PK/FK → `content_items.id` ON DELETE CASCADE | One chat thread per card |
| `chat_json` | MEDIUMTEXT NOT NULL | Array of turns |
| `last_ai_invocation_id` | BIGINT NULL | Optional link to `ai_invocations` |
| `updated_at` | TIMESTAMP | Auto-update |

### 7.2 Turn shape (`chat_json` element)

```json
{
  "role": "user" | "assistant",
  "content": "string",
  "at": "ISO-8601",
  "actor_label": "optional on user",
  "provider": "optional on assistant",
  "model": "optional on assistant"
}
```

### 7.3 No change required (v1) to

- `content_items` status machine  
- `content_artifacts` schema  
- Blueprint tables  

---

## 8. API

Base prefix: `/api/admin/board`  
Auth: board operate and/or human admin; chat send requires `ai:run` **or** human admin fallback (same pattern as blueprint chat).

### 8.1 `GET /items/{item_id}/process-chat`

**Response:**

```json
{
  "process_chat": {
    "content_item_id": 1,
    "chat": [],
    "last_ai_invocation_id": null,
    "updated_at": null
  }
}
```

### 8.2 `POST /items/{item_id}/process-chat`

**Body:**

```json
{
  "message": "Where am I and what's next?",
  "use_fixtures": false,
  "prefer": null,
  "temperature": 0.3,
  "max_tokens": 4096
}
```

**Response:**

```json
{
  "content_item_id": 1,
  "assistant_message": "…",
  "chat": [/* full history */],
  "snapshot_summary": {
    "status": "in_production",
    "missing_stages": ["video_package"],
    "blueprint_status": "approved"
  },
  "proposed_artifacts": [
    { "stage": "vision_alignment", "title": "…", "body_md": "…" }
  ],
  "ai": { "provider": "xai", "model": "…", "invocation_id": 123 }
}
```

**Errors:** 422 empty message / AI failure / board not found; 401/403 auth.

### 8.3 Apply proposed artifact

Uses existing:

`POST /items/{item_id}/artifacts`  
`{ "stage", "title", "body_md" }`

No new apply endpoint in v1.

---

## 9. UI specification

### 9.1 Process co-pilot panel

| Property | Spec |
|---|---|
| Component | `web/components/admin/ProcessCopilotPanel.tsx` |
| Placement | **Top** of card drawer (all product lines) |
| Collapsible | Yes; default **expanded** |
| Quick prompts | ≥4 fixed strings (where am I; stuck; missing; draft next) |
| Fixtures checkbox | Yes |
| Message list | User vs assistant styling; mono-safe pre-wrap |
| Input | Textarea; Enter sends (Shift+Enter newline) |
| Apply UI | When `proposed_artifacts` non-empty |
| test ids | `process-copilot-panel`, `-toggle`, `-messages`, `-input`, `-send`, `-apply-artifact` |

### 9.2 Workflow cockpit panel

| Property | Spec |
|---|---|
| Component | `web/components/admin/CourseWorkflowPanel.tsx` |
| Placement | Below process co-pilot; **course only** |
| test ids | `course-workflow-panel`, `workflow-readiness`, `workflow-next-action`, `workflow-primary-cta`, `workflow-artifact-*`, `workflow-feedback` |

### 9.3 Drawer width

- Course cards: up to `max-w-xl` to fit co-pilot + cockpit.  
- Other lines: at least `max-w-lg` for co-pilot.

### 9.4 Existing board controls (unchanged ownership)

Still in drawer (below or alongside):

- Course blueprint launch pad / link to workspace  
- Cast select + HeyGen produce/refresh + YouTube map  
- Technical package checklist detail  
- Flags, artifact list, transition history  
- Footer column transition buttons  

---

## 10. Course factory alignment

### 10.1 Skill sequence (normative for cockpit labels)

```text
1  course-blueprint ★ human Approve Blueprint
2  course-research          → research_pack
3  course-knowledge-check   (outline/placement; may not be a package stage key)
4  course-resources
5  course-lesson-script     → script
5b course-lesson-edit       → script_edit_brief (optional; default ON live HeyGen)
6  course-lesson-video      → video_package
7  course-placement         → placement_proposal
8  course-vision            → vision_alignment
9  course-package ★ human Approve Package
```

### 10.2 Required package stages (course)

From Production Package Spec / `packages.REQUIRED_STAGES["course"]`:

1. `research_pack`  
2. `lesson_plan`  
3. `script`  
4. `video_package`  
5. `placement_proposal`  
6. `vision_alignment`  

Optional enrichment: `script_edit_brief`, `voice_profile` — **not** required for checklist complete in v1.

### 10.3 CGE boundary (reaffirmed)

| CGE skill | Course factory |
|---|---|
| video-idea-finder, holy-trifecta | **Out** |
| scriptwriter craft | **In** via `course-lesson-script` |
| editor-notes craft | **In** via `course-lesson-edit` |
| handoff pattern | **In** via Handoff Contract v1.0 |

---

## 11. Handoff contract relationship

Skill-to-skill machine handoffs use **Handoff Contract v1.0** (`handoff_v1` JSON + MD twin).

| Concern | Owner |
|---|---|
| Agent/skill automation between stages | Handoff Contract |
| Human narrative + AI peer on the card | **This spec** |
| Persist handoffs on board UI | Future (Phase 5 of integration plan); not required for v1 copilot |

Process co-pilot **may** explain handoff fields to operators but is not required to emit `handoff_v1` objects in v1.

---

## 12. Security & doctrine

1. Admin/board auth only; no member access to process chat.  
2. AI invocations logged when live (`ai_invocations`).  
3. Process outcomes only in co-pilot system prompt.  
4. Never auto-publish courses or YT from co-pilot.  
5. Artifact apply is human-confirmed (Apply click).  
6. Fail closed on missing AI config unless fixtures used.

---

## 13. Observability

| Event / data | Where |
|---|---|
| Co-pilot turns | `content_item_process_chat.chat_json` |
| AI usage | `ai_invocations` (callsign quebec, task process_copilot_chat) |
| Board events | `agent_auth.record_event` `board.process_copilot.chat` |
| Artifact applies | Existing artifact create audit |

---

## 14. Acceptance criteria (v1.0)

### 14.1 Cockpit

- [ ] Course card drawer shows workflow cockpit above blueprint controls.  
- [ ] Readiness reflects unapproved blueprint as RED for courses.  
- [ ] Missing package stages listed in human-readable form.  
- [ ] “What to do next” matches §5.6 for draft/queue/blueprint/production/approval.  
- [ ] Adding an artifact via cockpit yields explicit remaining-gap feedback.  

### 14.2 Process co-pilot

- [ ] Panel present for course **and** non-course product lines.  
- [ ] Chat persists across reloads (after migration 063 applied).  
- [ ] Each live turn uses a fresh context snapshot (missing stages update after new artifacts).  
- [ ] Fixture mode works without external API keys.  
- [ ] Proposed `artifact` blocks parse; Apply creates artifact and refreshes card.  
- [ ] Co-pilot does not mutate blueprint structure automatically.  

### 14.3 Non-regression

- [ ] Blueprint chat/stream endpoints unchanged in contract.  
- [ ] Package checklist and placement approve still gate on required stages only.  
- [ ] No silent publish paths introduced.  

---

## 15. Implementation map (as-built references)

| Piece | Path |
|---|---|
| Spec (this doc) | `Specs/FatTail-Labs-Production-Process-Visibility-Copilot-Spec-v1.0.md` |
| Migration | `migrations/063_process_copilot_chat.sql` |
| Server domain | `server/process_copilot.py` |
| Routes | `server/routes/board_admin.py` (`process-chat`) |
| Cockpit UI | `web/components/admin/CourseWorkflowPanel.tsx` |
| Co-pilot UI | `web/components/admin/ProcessCopilotPanel.tsx` |
| Board integration | `web/components/admin/BoardKanban.tsx` |
| Operator guide | `docs/Board-Workflow-Cockpit.md` |
| Handoff | `Specs/FatTail-Labs-Handoff-Contract-v1.0.md` |
| Course skill upgrades | `skills/course/course-lesson-script`, `course-lesson-edit`, `course-create` |
| Integration plan | `docs/CGE-Skills-Course-Integration-Plan.md` |

---

## 16. Future work (non-blocking)

1. **WFM run records** — cockpit/co-pilot project run/step state when Workflow Manager lands.  
2. **Streaming** process-chat SSE (parity with blueprint stream).  
3. **Persist handoff_v1** on board with co-pilot explanation.  
4. **Notify on edge to RED** (admin notifications + email).  
5. **Action blocks** that offer one-click transitions with confirm modal.  
6. **youtube_long** cockpit variant (slim factory path).  

---

## 17. Revision history

| Date | Change |
|---|---|
| 2026-08-01 | v1.0 — Workflow cockpit + process co-pilot; course factory alignment; CGE boundaries; acceptance criteria |
