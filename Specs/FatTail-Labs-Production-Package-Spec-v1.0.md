# FatTail Labs — Production Package & Placement Spec v1.0

**Status:** Approved as built (Phase C complete + Phase D start, 2026-07-23)  
**Parents:** Content Board Spec v1.0, Agent Model Interface Spec v1.0, P2 charter  
**Decision log:** 2026-07-23 "Phase C packages + Phase D placement start"

---

## 1. Purpose

**Phase C:** A card may enter `awaiting_approval` only with a **complete package** of
required stage artifacts, optional AI provenance, and a **frozen approval snapshot**.

**Phase D (start):** Approving a package can **apply a placement plan** onto Labs as a
**draft** course (modules/lessons skeleton + notes), leaving human publish on the P1
course for final go-live.

---

## 2. Required stages by product line

| product_line | Required stage keys |
|---|---|
| `course` | `research_pack`, `lesson_plan`, `script`, `video_package`, `placement_proposal`, `vision_alignment` |
| `youtube_long` | `research_pack`, `script`, `video_package`, `placement_proposal`, `vision_alignment` |
| `coaching_short` | `research_pack`, `script`, `video_package`, `vision_alignment` |
| `thematic_short` | `research_pack`, `script`, `video_package`, `vision_alignment` |
| `other` | `research_pack`, `vision_alignment` |

Guardian **block** flags must be cleared (existing board rule).

---

## 3. Data model

### 3.1 `ai_invocations` (append-only)

| Column | Notes |
|---|---|
| id | PK |
| content_item_id | FK nullable |
| callsign | agent task callsign |
| task_id | e.g. research_pack |
| provider / model | |
| prefer | primary\|secondary\|auto |
| markers_json | |
| usage_json | |
| status | success\|fail |
| error | |
| actor_kind / actor_id / actor_label | who invoked |
| created_at | |

### 3.2 Artifact extensions

`content_artifacts.ai_invocation_id` (nullable FK), `content_hash` (sha256 of body_md).

### 3.3 `content_approval_packages`

| Column | Notes |
|---|---|
| id | PK |
| item_id | FK |
| status | `pending` \| `approved` \| `rejected` |
| vision_hash | sha256 of vision at freeze |
| checklist_json | stage → artifact_id map |
| artifact_ids_json | frozen list |
| placement_result_json | Phase D apply result |
| created_actor_* | who submitted |
| decided_actor_* / decided_at | approve/reject |
| created_at | |

### 3.4 Item columns

`content_items.latest_package_id`, `content_items.placed_course_slug`.

---

## 4. Rules

1. Transition **to** `awaiting_approval` → validate checklist + no open block flags →  
   **freeze** package (`pending`) → set `latest_package_id`.  
2. Transition **to** `published` (human only) → mark latest package `approved`;  
   **run placement apply** if `placement_proposal` present and not yet placed (Phase D).  
3. Transition **to** `rejected` / `revision_requested` → mark latest package `rejected` if pending.  
4. AI run with `content_item_id` records invocation and attaches artifact for mapped stage.

### 4.1 Task → stage map (AI workbench)

| callsign / task_id | stage |
|---|---|
| bravo / research_pack | research_pack |
| november / lesson_plan | lesson_plan |
| romeo / lesson_script, coaching_short_script | script |
| papa / placement_proposal | placement_proposal |
| hotel / accuracy_review | guardian_review (optional artifact) |
| * / * | `{callsign}_{task_id}` fallback |

---

## 5. Placement apply (Phase D start)

**Input:** latest `placement_proposal` artifact body (markdown or JSON) **or** card title/intent fallback.

**Action (idempotent per item if `placed_course_slug` set):**

1. Create **draft** course: title from card, description from intent, status `draft`.  
2. Create one module `"Module 1"`.  
3. Create one lesson slug `lesson-1`, title from card, `body_md` from script artifact if any.  
4. Set `placed_course_slug` on the content item.  
5. Return `{slug, course_id, lesson_id}` in package `placement_result_json`.

**Non-goals v1.0 D:** YouTube upload, multi-module graphs, auto-publish course, resource file upload from package.

---

## 6. API additions

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/admin/board/items/{id}/package` | Checklist + latest package snapshot |
| POST | `/api/admin/board/items/{id}/package/validate` | Dry-run completeness |
| POST | `/api/admin/ai/.../run` body `content_item_id` | Link invocation + artifact |

Approve remains `POST …/transition` `to_status=published` (runs placement).

---

## 7. Verification

- Incomplete course card cannot enter awaiting_approval  
- Complete checklist freezes package  
- AI run with content_item_id creates artifact + invocation  
- Publish creates draft course slug when placement_proposal exists  

---

## 8. Implementation map

| Path | Role |
|---|---|
| `migrations/019_production_packages.sql` | Schema |
| `server/packages.py` | Checklist, freeze, AI attach, placement |
| `server/board.py` | Hooks on transition |
| `server/routes/ai_admin.py` | content_item_id |
| `server/routes/board_admin.py` | package endpoints |
| `web/components/admin/BoardKanban.tsx` | Package checklist UI |
| `server/tests/test_production_packages.py` | Characterization |
