---
name: course-create
description: >
  Orchestrate a full Course factory run: structured Course Blueprint (Header + Outline)
  with co-pilot chat, human Approve Blueprint first (system of record), then stage-based
  KC, resources, scripts, video, and final package for product_line=course.
  Use when starting course workflow, WFM course_create, or /course-create.
---

# course-create

**Type:** Course **workflow** skill (orchestrator)  
**Owner:** Quebec / Workflow Manager  
**Definition key:** `course_create`  
**Trigger:** Board `draft → queued` for `product_line=course` (hard contract when WFM live)  

---

## Purpose

Deliver a complete Course through **two validation gates**:

```text
1) BLUEPRINT (Header + Outline)  — first product that requires validation
      system of record: structured blueprint row (not chat log)
      co-pilot UX: AI chat (form fallback) · min bar: descriptions
      human Approves Blueprint → freezes input for production stages

2) FULL PACKAGE                  — final factory gate
      video + markdown · KC · resources · human Approves package → place draft
```

**Chat is not the project.** After gate 1, the factory advances by **skills/stages**,  
not by continuing a long-running chat into video.

Does **not** member-publish.

---

## Inputs

| Required | Source |
|---|---|
| Card `product_line=course` | board |
| `title`, `intent_md` | card (chat can enrich) |
| Active run or manual invocation | WFM / operator |

| Soft | Source |
|---|---|
| `cast_id` | required by video step if live |
| `inputs_md` | source materials for chat/research |

---

## Outputs

1. Approved **Course Blueprint** (Header + Outline)  
2. Full package stages + placement graph  
3. `awaiting_approval` for final human gate, or **Red** + notify on holds  

---

## Component skill sequence

| Step | Skill | Gate |
|---|---|---|
| 1 | [`course-blueprint`](../course-blueprint/SKILL.md) | **★ FIRST VALIDATION** — AI chat; min descriptions; human Approve Blueprint |
| 2 | [`course-research`](../course-research/SKILL.md) | After blueprint (or light research before chat — optional) |
| 3 | [`course-knowledge-check`](../course-knowledge-check/SKILL.md) | Only if blueprint approved |
| 4 | [`course-resources`](../course-resources/SKILL.md) | Only if blueprint approved |
| 5 | [`course-lesson-script`](../course-lesson-script/SKILL.md) | Only if blueprint approved |
| 6 | [`course-lesson-video`](../course-lesson-video/SKILL.md) | Only if blueprint approved |
| 7 | [`course-placement`](../course-placement/SKILL.md) | Full shape |
| 8 | [`course-vision`](../course-vision/SKILL.md) | |
| 9 | [`course-package`](../course-package/SKILL.md) | **FINAL VALIDATION** → awaiting_approval |

`course-header` and `course-lesson-plan` run **inside** `course-blueprint` (chat tools / structure).

**Hard rule:** Steps 3–9 must not start while `blueprint_status != approved`.

---

## Invariants

1. **Blueprint is the first validated product** — Header + Outline only.  
2. **Approved structured blueprint is system of record** — chat is co-pilot + provenance.  
3. **Minimum bar = descriptions** (course + every module).  
4. **AI chat is default co-pilot UX** for drafting; PUT/form is equal for truth.  
5. No scripts/video/KC detail/final package without **Approve Blueprint**.  
6. Downstream skills read **blueprint structure**, never chat transcript for modules.  
7. **Lesson = video + markdown** only enforced at final package gate.  
8. Never member-publish from this workflow.  
9. Green/Red after each skill; Red notifies owner + resolvers.  

---

## Steps (operator / worker)

1. Start run `course_create`.  
2. Enter **course-blueprint** (chat → min validate → human Approve).  
3. On approve, continue steps 2–9.  
4. Stop at final package human gate.  

---

## Verify (end-to-end)

### After blueprint gate

- [ ] Header description present  
- [ ] Every module has description_md  
- [ ] Lesson stubs present  
- [ ] `blueprint_status=approved`  
- [ ] Chat/AI provenance recorded when AI used  

### After final package gate

- [ ] Six package stages present  
- [ ] Teaching lessons have video_id + body_md  
- [ ] ≥1 knowledge check  
- [ ] Resources resolved  
- [ ] `awaiting_approval` + Green  
- [ ] No publish  

---

## Handoff

→ Human **Approve package** → place draft course  
→ Human **publish** for members  

---

## Deriving other types

| Type | First validated product (likely) |
|---|---|
| **Tutorial** | Header + single-lesson outline (same chat pattern) |
| **YouTube Long** | Header + video brief |
| **Campaign** | Funnel brief + lander outline |

Course blueprint is the pattern for “chat → describe → human validates structure first.”  
