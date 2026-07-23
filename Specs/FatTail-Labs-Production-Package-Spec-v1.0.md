# FatTail Labs — Production Package & Placement Spec v1.0

**Status:** Approved as built (Phase C + Phase D complete, 2026-07-23)  
**Parents:** Content Board Spec v1.0, Agent Model Interface Spec v1.0, P2 charter  
**Decision log:** 2026-07-23 "Phase C packages + Phase D placement"

---

## 1. Purpose

**Phase C:** A card may enter `awaiting_approval` only with a **complete package** of
required stage artifacts, AI provenance where used, and a **frozen approval snapshot**.

**Phase D:** Approving a package (or explicit place) **applies a placement plan** onto
Labs as a **draft** course: multi-module/lesson graph, YouTube video IDs, trailer,
and course-level resource links. Human **course publish** remains in-place on the
production course URL.

---

## 2. Required stages by product line

| product_line | Required stage keys |
|---|---|
| `course` | `research_pack`, `lesson_plan`, `script`, `video_package`, `placement_proposal`, `vision_alignment` |
| `youtube_long` | `research_pack`, `script`, `video_package`, `placement_proposal`, `vision_alignment` |
| `coaching_short` | `research_pack`, `script`, `video_package`, `vision_alignment` |
| `thematic_short` | `research_pack`, `script`, `video_package`, `vision_alignment` |
| `other` | `research_pack`, `vision_alignment` |

Guardian **block** flags must be cleared.

---

## 3. Data model

Unchanged from Phase C (`ai_invocations`, `content_approval_packages`, artifact
`content_hash` / `ai_invocation_id`, item `latest_package_id` / `placed_course_slug`).

---

## 4. Package rules

1. Transition **to** `awaiting_approval` → validate checklist + freeze package (`pending`).  
2. Transition **to** `published` → mark package `approved`; **apply placement** with
   `replace=True` (refresh draft structure).  
3. Transition **to** `rejected` / `revision_requested` → mark latest package `rejected` if pending.  
4. AI run with `content_item_id` → invocation + stage artifact.  

---

## 5. Placement plan JSON (`placement_proposal` artifact)

Preferred body: JSON (optionally inside a ` ```json ` fence).

```json
{
  "course_title": "string",
  "subtitle": "string",
  "description_md": "string",
  "level": "beginner|intermediate|advanced",
  "trailer_video_id": "11-char YouTube id",
  "modules": [
    {
      "title": "Module title",
      "kind": "standard|worksheets|resources|bonus",
      "lessons": [
        {
          "title": "Lesson title",
          "slug": "optional-slug",
          "kind": "video|text|download|external|replay|quiz",
          "video_id": "YouTube id or URL",
          "body_md": "lesson notes",
          "free_preview": false,
          "duration_seconds": 0,
          "external_url": null
        }
      ]
    }
  ],
  "resources": [
    {
      "title": "Worksheet",
      "url": "https://…",
      "kind": "link",
      "free_preview": true,
      "emoji": "📊",
      "description_md": "…"
    }
  ]
}
```

**Fallbacks if modules missing:**

1. `lesson_plan` artifact JSON with `modules` array (same lesson shape).  
2. Single module/lesson from card title + `script` body_md.  

**`video_package` JSON (optional merge):**

```json
{
  "trailer_video_id": "…",
  "videos": { "lesson-slug": "youtubeId", "…": "…" }
}
```

Lesson `video_id` wins; else map by slug; YouTube URLs normalized to 11-char ids.

---

## 6. Placement apply algorithm

`apply_placement(item_id, actor, replace=False|True)`:

| Case | Behavior |
|---|---|
| No `placed_course_slug` | Create draft course; build all modules/lessons/attachments; set slug |
| Slug exists, `replace=False` | Return `{already_placed: true}` |
| Slug exists, `replace=True`, course **draft** | Delete modules/lessons/course attachments; update course fields; rebuild graph |
| Slug exists, course **published/archived** | **422** — refuse to wipe live courses |

Always leaves course `status=draft`. Does **not** auto-publish the course.

`POST /api/admin/board/items/{id}/place` body `{ "replace": true }` (default true).

Board UI: **Re-apply placement** when slug present.

---

## 7. API

| Method | Path | Behavior |
|---|---|---|
| GET | `/api/admin/board/items/{id}/package` | Checklist + latest package |
| POST | `/api/admin/board/items/{id}/package/validate` | Dry-run |
| POST | `/api/admin/board/items/{id}/place` | Apply/replace draft placement |
| POST | `/api/admin/ai/.../run` + `content_item_id` | Artifact + invocation |
| POST | `…/transition` → `published` | Approve package + place (replace) |

---

## 8. Verification

- Incomplete package → cannot awaiting_approval  
- Complete package freezes snapshot  
- Publish creates multi-module draft with video ids + resources  
- Re-place rebuilds same slug without duplicating courses  
- Characterization: `test_production_packages.py`  

---

## 9. Non-goals (still out)

- YouTube **upload** / HeyGen render orchestration  
- Private file binary placement (links only in v1.0 D)  
- Auto-publish of the Labs course  
- Member-visible board  

---

## 10. Implementation map

| Path | Role |
|---|---|
| `migrations/019_production_packages.sql` | Schema |
| `server/packages.py` | Plan parse, place/replace, AI attach |
| `server/board.py` | Transition hooks |
| `server/routes/board_admin.py` | package + place routes |
| `web/components/admin/BoardKanban.tsx` | Checklist + re-place |
| `server/tests/test_production_packages.py` | Tests |
