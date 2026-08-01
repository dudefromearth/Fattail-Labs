---
name: course-lesson-video
description: >
  Produce Course lesson videos (HeyGen cast pipeline or map existing YouTube ids)
  into video_package for product_line=course. Use when producing video_package,
  Papa course render, batch HeyGen, or /course-lesson-video.
---

# course-lesson-video

**Type:** Course component  
**Owner:** Papa  
**Package stage:** `video_package`  
**Board sub_stage:** `produce`  
**External skills:** `heygen-video` (and cast registry); never invent cast  

---

## Purpose

Turn **approved / plan-locked scripts** into video assets with provenance, or map  
existing YouTube IDs into a complete package — without silent publish.

---

## Inputs

| Required | Source |
|---|---|
| `script` artifact | `course-lesson-script` |
| `lesson_plan` | structure + slugs |
| Cast | `cast_id` on card or per-script assignment (live mode) |

| Preferred (live HeyGen) | Source |
|---|---|
| `script_edit_brief` | `course-lesson-edit` — on-screen, cuts, B-roll, retention priorities |

| Mode | Edit brief |
|---|---|
| **Fixture / stub** | Skip edit skill |
| **Live HeyGen** | **Prefer** `course-lesson-edit` first (default ON) |
| **Map-only** | Skip edit skill; map YT ids |

**Fail loud if:** no script; live mode without cast; budget hard-stop.  
Missing edit brief on live path → warn; may proceed with `script` only (`edit_brief_optional`).

---

## Outputs

Artifact stage `video_package` (JSON preferred):

```json
{
  "trailer_video_id": "optional-11-char",
  "videos": {
    "lesson-slug": "youtubeIdOrPending",
    "...": "..."
  },
  "provenance": [
    {
      "slug": "lesson-slug",
      "cast": "NAME",
      "heygen_video_id": "…",
      "script_ref": "…",
      "mode": "live|fixture|map"
    }
  ]
}
```

---

## Invariants

1. No render without script (or explicit map-only path).  
2. Named cast only for member courses (unless Coach waiver).  
3. No silent publish to members or YT public.  
4. Provenance on every asset.  
5. Edit does not invent new teaching claims — return to Romeo.  
6. Respect HeyGen budget ledger hard-stops.  

---

## Steps

1. Validate inbound handoff (`script_ref`; optional `script_edit_brief_ref`).  
2. Resolve lesson list from plan + scripts.  
3. Resolve cast from registry (`docs/studio/cast/`).  
4. If live HeyGen and no edit brief: note skip; use script callouts only.  
5. For each lesson: render (heygen-video) using edit brief when present **or** accept mapped id **or** fixture stub.  
6. Optional trailer render/map.  
7. Write `video_package` with provenance (include `script_edit_brief_ref` when used).  
8. Emit handoff_v1 → `course-placement`. Do not place course.  

---

## Verify

- [ ] `video_package` present  
- [ ] Every plan video-lesson has id or explicit pending + Red reason  
- [ ] Provenance rows for produced assets  
- [ ] Budget events recorded when live  
- [ ] No member publish  
- [ ] Outbound handoff_v1 present  

---

## Handoff

```text
---
HANDOFF → course-placement
from: course-lesson-video
product_line: course
inputs_resolved:
  video_package_ref: artifact://video_package
  lesson_plan_ref: artifact://lesson_plan
inputs_missing: []
constraints: [blueprint_approved, no_silent_publish, process_outcomes_only]
artifacts_out_expected: [placement_proposal]
human_gate: null
---
```

→ **`course-placement`** (merge video ids into placement graph)  

Holds: `missing_cast`, `budget_exhausted`, `provider_error` → **Red** + notify.  
