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
| Cast | `cast_id` on card or per-script assignment |

| Mode | |
|---|---|
| **Fixture / stub** | Dev/test: placeholder package with provenance notes |
| **Live HeyGen** | Budget + keys; batch by lesson |
| **Map-only** | Admin supplies YT ids; package records map |

**Fail loud if:** no script; live mode without cast; budget hard-stop.

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

1. Resolve lesson list from plan + scripts.  
2. Resolve cast from registry (`docs/studio/cast/`).  
3. For each lesson: render (heygen-video) **or** accept mapped id **or** fixture stub.  
4. Optional trailer render/map.  
5. Write `video_package` with provenance.  
6. Update board; do not place course.  

---

## Verify

- [ ] `video_package` present  
- [ ] Every plan video-lesson has id or explicit pending + Red reason  
- [ ] Provenance rows for produced assets  
- [ ] Budget events recorded when live  
- [ ] No member publish  

---

## Handoff

→ **`course-placement`** (merge video ids into placement graph)  

Holds: `missing_cast`, `budget_exhausted`, `provider_error` → **Red** + notify.  
