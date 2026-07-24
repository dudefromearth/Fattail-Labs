---
name: course-placement
description: >
  Build the Course placement_proposal JSON (header + modules + lessons + resources +
  video map) for product_line=course so Approve can place a multi-module draft course.
  Use when assembling placement, Papa placement plan, or /course-placement.
---

# course-placement

**Type:** Course component  
**Owner:** Papa / Quebec  
**Package stage:** `placement_proposal`  
**Board sub_stage:** `package`  
**Shape:** full COURSE tree for Labs apply  

---

## Purpose

Assemble the **authoritative placement graph** that `apply_placement` will turn into a  
**draft course** on Labs. Human still Approves.

**Must emit full Course shape:**

```text
Header + Outline(Modules w/ description → Lessons w/ video + markdown)
     + Knowledge Checks (quiz lessons) + Resources
```

---

## Inputs

| Required | Source |
|---|---|
| Header | `course-header` |
| Outline | `course-lesson-plan` |
| Knowledge checks | `course-knowledge-check` |
| Scripts | lesson markdown / notes source |
| `video_package` | lesson **video** ids |
| Resources | `course-resources` |

---

## Outputs

Artifact stage `placement_proposal`:

```json
{
  "course_title": "string",
  "subtitle": "string",
  "description_md": "string",
  "level": "beginner|intermediate|advanced",
  "trailer_video_id": "11-char or null",
  "modules": [
    {
      "title": "Module title",
      "description_md": "Required module description",
      "kind": "standard|worksheets|resources|bonus",
      "lessons": [
        {
          "title": "Lesson title",
          "slug": "lesson-slug",
          "kind": "video",
          "video_id": "YouTube id or URL",
          "body_md": "Lesson markdown (required)",
          "free_preview": false,
          "duration_seconds": 0
        },
        {
          "title": "Knowledge check",
          "slug": "module-1-check",
          "kind": "quiz",
          "body_md": "Optional intro",
          "quiz": { "questions": [] }
        }
      ]
    }
  ],
  "resources": []
}
```

**Course shape validate:**

| Check | |
|---|---|
| Header | title + description_md |
| Modules | ≥1; each has **description_md** |
| Lessons | ≥1 per module; teaching lessons have **video_id** + **body_md** |
| Knowledge check | ≥1 quiz lesson (or equivalent) in the graph |
| Resources | array present (empty only if plan allowed) |

---

## Invariants

1. Placement matches plan module / lesson / KC structure.  
2. **Module description** never dropped.  
3. **Lesson = video + markdown** for teaching lessons.  
4. Knowledge checks are in the outline (`kind: quiz`), not omitted.  
5. No publish — proposal only.  
6. Process-safe header copy.  

---

## Steps

1. Load header, plan, KC, video_package, resources, scripts.  
2. Build modules with **description_md**.  
3. For each teaching lesson: set **video_id** + **body_md** (markdown).  
4. Insert knowledge-check quiz lessons in planned slots.  
5. Attach resources[].  
6. Shape-validate full Course contract.  
7. Write `placement_proposal`.  

---

## Verify

- [ ] Parseable `placement_proposal`  
- [ ] Header complete  
- [ ] Every module has description_md  
- [ ] Every teaching lesson has video_id **and** body_md  
- [ ] ≥1 knowledge check (quiz) present  
- [ ] Resources array present  

---

## Handoff

→ **`course-vision`** → **`course-package`**  

Missing video, markdown, module description, or KC → **Red**.  
