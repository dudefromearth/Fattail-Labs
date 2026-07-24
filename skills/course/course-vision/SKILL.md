---
name: course-vision
description: >
  Write Content Vision alignment notes for a Course package (product_line=course).
  Use when producing vision_alignment, Quebec vision check, or /course-vision.
---

# course-vision

**Type:** Course component  
**Owner:** Quebec (assembly) · Coach owns Vision doc  
**Package stage:** `vision_alignment`  

---

## Purpose

Prove this Course serves the living **Content Vision** and doctrine: stop-the-bleeding  
first where required, process outcomes, capacity over dependency, no pathway sabotage.

---

## Inputs

| Required | Source |
|---|---|
| Current Content Vision body | `content_vision` |
| Card intent + plan | card + `lesson_plan` |
| Package so far | stages present |

---

## Outputs

Artifact stage `vision_alignment` (markdown):

1. How this course serves the Vision (2–6 bullets)  
2. Pathway position (flagship / intermediate / advanced)  
3. Doctrine risks checked (profit language, dependency, scope creep)  
4. Residual concerns for human approver  

---

## Invariants

1. Vision document is binding context — not optional.  
2. Do not rubber-stamp: if misaligned, open flag or state blockers.  
3. Process outcomes only in alignment language.  

---

## Steps

1. Read current Vision.  
2. Map course outcomes to Vision pillars.  
3. Check pathway fit (especially capital preservation first).  
4. Scan plan/scripts for doctrine issues; open **block** if severe.  
5. Write `vision_alignment` artifact.  

---

## Verify

- [ ] `vision_alignment` artifact present  
- [ ] Pathway note explicit  
- [ ] Risks section present (even if “none”)  
- [ ] No open unexplained misalignment  

---

## Handoff

→ **`course-package`**  
