---
name: course-lesson-edit
description: >
  Turn locked Course lesson VO into an editor production blueprint — on-screen text,
  cuts, emphasis, B-roll, retention-risk flags — before render. Use when producing
  script_edit_brief, Papa edit pass, or /course-lesson-edit.
---

# course-lesson-edit

**Type:** Course component (optional production pass)  
**Owner:** Papa (may be drafted by Romeo; Papa owns execution)  
**Package stage:** enriches `script` via artifact `script_edit_brief`  
**Board sub_stage:** `script` / pre-`produce`  
**Handoff contract:** [`Specs/FatTail-Labs-Handoff-Contract-v1.0.md`](../../../Specs/FatTail-Labs-Handoff-Contract-v1.0.md)  
**Craft source:** CGE `editor-notes` patterns (retention-prioritized, sparse where strong)  

---

## Purpose

Give HeyGen operators or human editors a **blueprint they can execute without guessing** —  
dense only where retention risk is real; never stock-spam; never silent dialogue rewrites.

---

## When to run

| Video mode | Default |
|---|---|
| **Live HeyGen** | **ON** (preferred) |
| **Map-only** (existing YT id) | **OFF** |
| **Fixture / stub** | **OFF** |
| Coach override | Always allowed |

If skipped: `course-lesson-video` consumes `script` alone (`edit_brief_optional`).

---

## Inputs

| Required | Source |
|---|---|
| `script` artifact | `course-lesson-script` |
| Locked VO intent | Coach or stage accepts proposal (or explicit “edit on draft” note) |

| Optional | Source |
|---|---|
| Lesson duration targets | `lesson_plan` |
| Existing graphics list | resources / studio |

**Fail loud if:** no script.  
**Do not** invent teaching claims or change outcomes.

---

## Outputs

Artifact **`script_edit_brief`** (markdown), per lesson:

1. Full VO with **inline** notes at point of use:  
   - `[TEXT ON SCREEN: 3–8 words]`  
   - `[CUT / JUMP]`  
   - `[EMPHASIS / PAUSE]`  
   - `[B-ROLL SUGGESTION: simple, owned/executable]`  
   - `[SUGGEST TIGHTENING: reason]` — never silent rewrite  
2. After each section: `RETENTION RISK — low|medium|high` + one-line why  
3. **EDITOR SUMMARY** block  

```text
---
EDITOR SUMMARY
Overall pacing target: [moderate talking-head / …]
Highest-priority sections: […]
Tools assumed: [HeyGen / human / Descript]
Graphics load: [list must-have cards]
Note: suggestions, not requirements — taste beats the blueprint.
---
```

Outbound **handoff_v1** → `course-lesson-video`.

---

## Invariants

1. **Annotate, don’t rewrite** — VO words stay unless Coach accepts SUGGEST TIGHTENING.  
2. **No stock-spam** — B-roll = diagrams, checklists, screen records creator already has.  
3. **Sparse by default** — silence between notes is OK on strong lines.  
4. **Priority order for note density:** (1) first ~30s of lesson, (2) practice/CFU or assessment-adjacent beats, (3) medium/high retention risk, (4) elsewhere.  
5. **No new claims.**  
6. **Process outcomes only** in on-screen text.  

---

## Steps

1. Validate inbound handoff (`script_ref`, empty `inputs_missing`).  
2. For each lesson in script pack: walk sections in order.  
3. Insert inline notes; score retention risk per section.  
4. Write EDITOR SUMMARY; list must-have graphics.  
5. Write `script_edit_brief` artifact.  
6. Emit handoff_v1 to `course-lesson-video`.  

---

## Outbound handoff

```text
---
HANDOFF → course-lesson-video
from: course-lesson-edit
product_line: course
inputs_resolved:
  script_ref: artifact://script
  script_edit_brief_ref: artifact://script_edit_brief
  lesson_slugs: […]
inputs_missing: []
constraints: [blueprint_approved, plan_locked, process_outcomes_only, no_silent_publish]
artifacts_out_expected: [video_package]
human_gate: null
---
```

---

## Verify

- [ ] `script_edit_brief` present when this skill ran  
- [ ] Notes are inline (not only a dump at end)  
- [ ] Every section has retention risk line  
- [ ] EDITOR SUMMARY present  
- [ ] No dialogue silently changed  
- [ ] Outbound handoff_v1 present  

---

## Handoff

→ **`course-lesson-video`** (Papa)  
