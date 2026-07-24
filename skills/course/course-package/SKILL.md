---
name: course-package
description: >
  Validate and freeze the Course approval package (all required stages, no open
  blocks) and move card to awaiting_approval. Use when assembling approval package,
  Quebec package gate, or /course-package.
---

# course-package

**Type:** Course component  
**Owner:** Quebec  
**Package stage:** freezes `content_approval_packages`  
**Board status target:** `awaiting_approval`  

---

## Purpose

Ensure the Course has **everything required** for a human to Approve: complete stages,  
valid Course shape, guardians clear. Never publish.

---

## Inputs

Required stages for `course` (Production Package Spec):

| Stage | Skill |
|---|---|
| `research_pack` | course-research |
| `lesson_plan` | course-lesson-plan |
| `script` | course-lesson-script |
| `video_package` | course-lesson-video |
| `placement_proposal` | course-placement |
| `vision_alignment` | course-vision |

Also: no open **block** flags.

---

## Outputs

1. Package checklist result (complete / missing_stages)  
2. Frozen approval package snapshot (`pending`)  
3. Board transition → `awaiting_approval`  
4. Admin notification `board.awaiting_approval`  

---

## Invariants

1. **Complete package or no awaiting_approval.**  
2. **No forward past open block flags.**  
3. **Quebec never sets published.**  
4. **Shape is Course:** Header · Outline (module descriptions; lessons = video + markdown) ·  
   Knowledge Check · Resources — not silent Tutorial.  
5. Evidence recorded (who assembled, when).  

---

## Steps

1. Run package checklist for `product_line=course`.  
2. Shape-validate placement_proposal as Course.  
3. Confirm flags clear.  
4. If incomplete → **Red**, notify, stop.  
5. Freeze package; transition to `awaiting_approval`.  
6. Notify admins (existing notify path).  

---

## Verify

- [ ] `missing_stages` empty  
- [ ] Package row frozen pending  
- [ ] Status `awaiting_approval`  
- [ ] Notification emitted  
- [ ] Readiness **Green** (awaiting human is intentional, not a hold)  

---

## Handoff

→ **Human administrator:** Approve → place draft course · Reject / revision  

Member **publish** remains in-place admin on the course URL (outside this skill).  
