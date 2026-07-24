---
name: course-header
description: >
  Author or refine the Course HEADER (title, subtitle, description_md, level,
  trailer intent) for product_line=course. Use when filling course header fields,
  catalog copy from a plan, or /course-header.
---

# course-header

**Type:** Course component  
**Owner:** November (structure) · Sierra (public polish when catalog-bound)  
**Package stage:** (fields land in `placement_proposal` / placed course)  
**Shape field:** HEADER  

---

## Purpose

Produce the Course **HEADER** — half of the **Course Blueprint** (with Outline),  
which is the **first product that requires validation**.

```text
BLUEPRINT = HEADER + Outline  → human validates (min: descriptions)
```

Clear title, honest **description** (required), level, trailer intent — doctrine-safe.

**Primary path:** co-pilot chat or PUT via [`course-blueprint`](../course-blueprint/SKILL.md).  
This skill is the field-level procedure that fills the **structured header**  
(system of record). Chat is not the product.

---

## Inputs

| Required | Source |
|---|---|
| Card title + intent | card and/or chat transcript |
| Description content | AI draft or human — **must not stay empty** |

| Optional | Source |
|---|---|
| Outline draft | co-developed in same chat |
| Research pack | claims language |
| Existing catalog peers | prior art |

---

## Outputs

Header object (markdown notes and/or fields for placement JSON):

| Field | Rules |
|---|---|
| `course_title` | Specific; not clickbait; process-safe |
| `subtitle` | Optional one-liner |
| `description_md` | 150–400 words: problem → what you'll build → by the end you can… |
| `level` | beginner \| intermediate \| advanced |
| `trailer_video` intent | What the trailer must show; id filled later by video skill |

Doctrine: **process outcomes only**; capacity over dependency; flagship-first pathway  
language when this is stop-the-bleeding content.

---

## Invariants

1. Description teaches **outcomes**, not income.  
2. No profit claims, no “make it back.”  
3. Title matches curriculum scope (no bait-and-switch vs plan).  
4. Level is honest relative to pathway.  

---

## Steps

1. Prefer course outcomes from `lesson_plan`.  
2. Draft title/subtitle; align with card title or propose rename note.  
3. Write description_md (problem → build → outcomes).  
4. Set level; note prereqs in description if needed.  
5. Write trailer intent (30–90s: who it’s for + one process outcome).  
6. Sierra polish if this header will be public catalog copy.  
7. Store in plan update and/or placement draft fields; never invent modules here.  

---

## Verify

- [ ] Title + description_md non-empty  
- [ ] Description has outcomes language  
- [ ] Level set  
- [ ] Doctrine lint clean  
- [ ] Consistent with lesson_plan scope  

---

## Handoff

→ Stays inside **`course-blueprint`** until human Approves Blueprint  
→ Only after approval: scripts/video/KC/resources  
→ Eventually consumed by **`course-placement`**  
