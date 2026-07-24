---
name: course-lesson-plan
description: >
  Design a multi-module Course OUTLINE (modules with descriptions, lessons as
  video+markdown slots, knowledge-check slots, resource hooks) for product_line=course.
  Use when producing lesson_plan, November course design, or /course-lesson-plan.
---

# course-lesson-plan

**Type:** Course component — owns the **OUTLINE**  
**Owner:** November  
**Package stage:** `lesson_plan`  
**Board sub_stage:** `design`  
**Produces shape:** Modules (w/ description) → Lessons (video + markdown slots) + KC slots  

---

## Purpose

Design the Course **OUTLINE** — the other half of the **Course Blueprint**  
(Header + Outline), the **first product that requires validation**.

**Minimum bar for validation:** every module has a **description** (plus header description  
in the blueprint skill). Title-only modules fail.

**Primary path:** co-pilot chat or PUT via [`course-blueprint`](../course-blueprint/SKILL.md).  
This skill is the outline procedure that fills **structured modules** (system of record).  
Chat is not the product.

At blueprint time: module descriptions + lesson **stubs** (titles/outcomes).  
Full lesson video + markdown, KC questions, and resources come **after** Approve Blueprint.

**Full course shape:** Header · **Outline** · Knowledge Check · Resources  

---

## Inputs

| Required | Source |
|---|---|
| `research_pack` artifact | `course-research` |
| Card intent + acceptance | card |
| Content Vision | vision doc |

| Soft | Source |
|---|---|
| Hotel clearance | when trading claims exist |

**Fail loud if:** no research pack, or research lists blocking open questions unaddressed.

---

## Outputs

Artifact stage `lesson_plan` — markdown and/or JSON:

```json
{
  "course_title": "string",
  "subtitle": "string",
  "level": "beginner|intermediate|advanced",
  "pathway_notes": "flagship-first / prereqs",
  "outcomes_course": ["observable outcome", "..."],
  "modules": [
    {
      "title": "Module title",
      "description_md": "Required. What this module covers and why.",
      "kind": "standard|worksheets|resources|bonus",
      "outcomes": ["..."],
      "lessons": [
        {
          "title": "Lesson title",
          "slug": "optional-slug",
          "kind": "video",
          "outcomes": ["learner can …"],
          "beats": ["hook", "teach", "CFU/practice", "close"],
          "practice": "what they do",
          "markdown_intent": "what body_md must cover after the video",
          "video_required": true,
          "resources": ["worksheet name or none"],
          "free_preview": false,
          "duration_target_seconds": 0,
          "cast_role": "optional presenter role"
        }
      ],
      "knowledge_check_slot": {
        "required": true,
        "placement": "end_of_module",
        "outcomes_assessed": ["…"]
      }
    }
  ],
  "knowledge_checks_summary": "≥1 check planned for the course",
  "resource_inventory": [
    { "title": "…", "purpose": "tied to lesson X beat Y", "kind": "worksheet|template|…" }
  ]
}
```

**Shape rules (Course outline):**

| Rule | |
|---|---|
| ≥1 module | required |
| Each module has **`description_md`** | required — not title-only |
| Each module has ≥1 lesson | required |
| Each teaching lesson is **video + markdown** | both required in final package |
| ≥1 knowledge check slot | required for course |
| If total lessons == 1 | soft-warn: prefer type **Tutorial** |

---

## Invariants

1. **Outcome-first** — every lesson has observable outcomes.  
2. **Module descriptions required** — outline is teachable without opening every lesson.  
3. **Lesson plan before script** — Romeo must not start without this artifact.  
4. **Video + markdown lesson contract** — plan states both; production fills both.  
5. **Active learning** — practice/CFU; knowledge checks assess outcomes.  
6. **Resources named in plan** when practice needs them.  
7. **Cognitive load** — one primary idea per lesson.  
8. **Process outcomes only.**  

---

## Steps

1. Read research pack + vision + acceptance.  
2. Define course-level outcomes and pathway slot.  
3. Design module sequence; write each module’s **description_md**.  
4. For each lesson: outcomes, beats, practice, markdown_intent, video required, duration, cast_role.  
5. Place **knowledge check slots** (end of module and/or capstone).  
6. Build resource inventory linked to beats.  
7. Educational self-lint.  
8. Write `lesson_plan` artifact.  
9. Route to Tango / Hotel as needed.  

---

## Verify

- [ ] `lesson_plan` present  
- [ ] ≥1 module; each has non-empty **description_md**  
- [ ] ≥1 lesson per module; each has outcomes + markdown_intent + video_required  
- [ ] ≥1 knowledge check slot  
- [ ] Resource inventory purpose-linked (or empty with reason)  
- [ ] Lint clean or exceptions listed for Coach  

---

## Handoff

→ Remains under **`course-blueprint`** until human Approves Blueprint  
→ Then **`course-knowledge-check`**, **`course-resources`**, **`course-lesson-script`**  

Do **not** hand off to Romeo/Papa while blueprint is unapproved.  
