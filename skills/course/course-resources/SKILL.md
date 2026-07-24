---
name: course-resources
description: >
  Specify and attach Course resources (worksheets, templates, links) tied to lesson
  plan practice beats for product_line=course. Use when building resource inventory,
  course downloads, or /course-resources.
---

# course-resources

**Type:** Course component  
**Owner:** November (spec) · production/admin (files/links)  
**Package stage:** resources land in `placement_proposal` / course attachments  
**Shape field:** RESOURCES[]  

---

## Purpose

Produce Course **RESOURCES** — fourth member-facing surface:

```text
Header  ·  Outline  ·  Knowledge Check  ·  RESOURCES
```

Downloads/links are **first-class teaching content** tied to practice — not orphan PDFs.

---

## Inputs

| Required | Source |
|---|---|
| `lesson_plan` with `resource_inventory` | `course-lesson-plan` |

| Optional | Source |
|---|---|
| Existing media URLs / uploads | admin media pipeline |

---

## Outputs

Resource list for placement:

```json
{
  "resources": [
    {
      "title": "Drawdown journal worksheet",
      "kind": "link|file",
      "url": "https://…",
      "free_preview": true,
      "emoji": "📊",
      "description_md": "…",
      "tied_to": { "module": "…", "lesson": "…", "beat": "practice" }
    }
  ]
}
```

If plan has no resources: output explicit empty list with reason  
(`"no downloads required for this course"`).

---

## Invariants

1. Every resource ties to a plan beat or is rejected.  
2. Free_preview only when intentional (marketing + learning).  
3. No profit-claim worksheets.  
4. Files use governed media/upload paths — no random disk dumps.  

---

## Steps

1. Read resource_inventory from lesson plan.  
2. For each item: create link/file, write description_md.  
3. Mark free_preview per plan.  
4. Attach metadata for placement.  
5. If a practice requires a resource that is missing → **Red** until filled or plan revised.  

---

## Verify

- [ ] Inventory matched or empty-with-reason  
- [ ] Each resource has title + kind + purpose  
- [ ] `tied_to` present for non-empty list  
- [ ] Doctrine-safe copy  

---

## Handoff

→ **`course-placement`** (include `resources[]`)  
