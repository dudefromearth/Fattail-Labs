---
name: course-lesson-script
description: >
  Write plan-locked Course lesson VO scripts (and optional trailer script) for
  product_line=course. Use when producing script stage, Romeo course VO, or
  /course-lesson-script.
---

# course-lesson-script

**Type:** Course component  
**Owner:** Romeo  
**Package stage:** `script`  
**Board sub_stage:** `script`  

---

## Purpose

Write scripts that **implement November’s lesson plans beat-for-beat** — teach and hold  
attention without inventing outcomes or claims.

---

## Inputs

| Required | Source |
|---|---|
| `lesson_plan` | `course-lesson-plan` |
| `research_pack` | claims map |
| Cast policy | card `cast_id` / cast registry when multi-presenter |

**Fail loud if:** no lesson plan. Do not write orphan course VO.

---

## Outputs

Artifact stage `script` (markdown; may be multi-lesson package):

Per lesson (and trailer if required):

- Format: `course_lesson`  
- Lesson slug / plan reference  
- Timing target  
- VO text  
- On-screen text / B-roll callouts  
- Cast assignment (registry name)  
- Coverage matrix: plan beats → script sections  
- Doctrine self-lint notes  

---

## Invariants

1. **Plan-locked** — cite plan lesson IDs/beats; no orphan VO.  
2. **Claims trace to research** — no new trading claims in prose.  
3. **Process outcomes only.**  
4. **One primary idea per lesson** — do not smuggle the whole course into one script.  
5. **Proposal-state** — not approved for render until gate allows.  

---

## Steps

1. Load plan; list all video (and VO) lessons.  
2. For each lesson: draft VO against beats; map coverage matrix.  
3. Assign cast from registry / card.  
4. Draft trailer script if header requires trailer.  
5. Doctrine lint; claims annotation to research IDs.  
6. Write `script` artifact (single pack or per-lesson with clear headings).  
7. Hand to Hotel/Tango as sequenced before Papa.  

---

## Verify

- [ ] `script` artifact present  
- [ ] Every plan video-lesson has script coverage (or explicit skip + reason)  
- [ ] Coverage matrix shows no critical beat missing  
- [ ] Cast named or explicit “TBD → Red at video”  
- [ ] Doctrine lint clean  

---

## Handoff

→ **`course-lesson-video`** (Papa)  
→ Guardians as required  

Missing cast when live video required → **Red** `missing_cast`.  
