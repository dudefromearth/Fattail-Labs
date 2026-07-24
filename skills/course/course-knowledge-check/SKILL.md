---
name: course-knowledge-check
description: >
  Author Course Knowledge Checks (quizzes / CFU assessments) tied to module and
  lesson outcomes for product_line=course. Use when building knowledge checks,
  quiz lessons, assessment for a course outline, or /course-knowledge-check.
---

# course-knowledge-check

**Type:** Course component  
**Owner:** November  
**Shape field:** **KNOWLEDGE CHECK** (in Outline as quiz lessons)  
**Package:** questions land in `lesson_plan` + `placement_proposal` (`kind: quiz`)  

---

## Purpose

Assess whether the learner can do what the Course claimed — **outcomes-aligned**  
knowledge checks, not trivia. Part of the frozen Course shape:

> Header · Outline (Modules → Lessons) · **Knowledge Check** · Resources  

---

## Inputs

| Required | Source |
|---|---|
| Outline / `lesson_plan` | modules with descriptions, lessons with outcomes |
| `research_pack` | misconceptions make good distractors (honest ones) |

**Fail loud if:** no lesson plan / no outcomes to assess.

---

## Outputs

For each knowledge check:

| Field | Rule |
|---|---|
| `title` | e.g. “Module 1 knowledge check” |
| `slug` | stable |
| `kind` | `quiz` |
| `body_md` | optional short intro markdown |
| `placement` | end of module and/or course capstone |
| `questions[]` | see below |
| `tied_to` | module and/or lesson outcomes assessed |

**Question kinds** (Labs quiz model):

- `multiple_choice` — options + correct index  
- `binary` — true/false  
- `short_answer` — acceptable answers list (normalized)  

Each question:

- Maps to a **stated outcome**  
- Uses process-safe language (no profit claims)  
- Prefer misconceptions from research as wrong options when accurate  

**v1 completeness:** ≥1 knowledge check in the Course (recommend one per module for multi-module courses).

---

## Invariants

1. **Assessment matches outcomes** — no orphan quiz questions.  
2. **Process outcomes only** — no income / profit framing in stems or feedback.  
3. **Dignity** — no humiliation; wrong answers teach.  
4. **Active learning** — checks reinforce practice, not only recall of slogans.  
5. Knowledge checks live **in the outline** (quiz lessons), not a hidden side channel.  

---

## Steps

1. Read plan: modules, lesson outcomes, practice beats.  
2. Decide KC placement (end of each module and/or final check).  
3. For each check: draft 3–8 questions (scale with module size).  
4. Attach feedback that points back to the lesson markdown/video.  
5. Write questions into `lesson_plan` (knowledge_checks section) and ensure  
   placement will emit `kind: quiz` lessons.  
6. Self-lint: every question → outcome ID/label.  

---

## Verify

- [ ] ≥1 knowledge check defined for the course  
- [ ] Each question maps to an outcome  
- [ ] Quiz lessons appear in outline order (after the lessons they assess, when module-scoped)  
- [ ] Doctrine lint clean  
- [ ] No check without a preceding teaching lesson in that module (except course capstone)  

---

## Handoff

→ **`course-resources`** (if check references a job aid)  
→ **`course-placement`** (emit quiz lessons in `modules[].lessons[]`)  
→ Guardians: Hotel if trading judgment items; Tango for load  

Missing KC on a “complete” package → **Red** `missing_stage` / shape incomplete.  
