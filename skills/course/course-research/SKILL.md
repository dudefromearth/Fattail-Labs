---
name: course-research
description: >
  Build a Course research pack (claims, sources, misconceptions, prior art) for a
  board card product_line=course. Use when producing research_pack, running Bravo
  work for a course, or /course-research.
---

# course-research

**Type:** Course component  
**Owner:** Bravo  
**Package stage:** `research_pack`  
**Board sub_stage:** `research`  

---

## Purpose

Turn card intent + inputs into a **claim-grounded research pack** so November and Romeo  
never invent facts or ignore prior Labs teaching.

---

## Inputs

| Required | Source |
|---|---|
| Board card `product_line=course` | `content_items` |
| `title`, `intent_md` | card |
| Seed materials | `inputs_md`, attachments, links, transcripts |
| Content Vision | current vision doc |

| Optional | Source |
|---|---|
| Acceptance criteria | `acceptance_md` |
| Target pathway / category | card notes |

**Fail loud if:** intent empty or zero usable sources and Coach did not waive research.

---

## Outputs

Artifact stage `research_pack` (markdown, structured):

1. **Sources** — list with links / IDs  
2. **Claims inventory** — claim → source (required for trading assertions)  
3. **Misconceptions** — learner traps to teach against  
4. **Prior art** — existing Labs courses/modules that overlap  
5. **Forbidden / risk list** — profit language, thin claims, out-of-scope topics  
6. **Glossary candidates**  
7. **Open questions** for Coach/Hotel  

---

## Invariants

1. Every claim has a source — no unattributed assertions leave research.  
2. Process outcomes only — quarantine profit-claim raw material.  
3. Misconceptions are assets, not footnotes.  
4. Prior art search is mandatory before net-new modules.  
5. Thin sources → list gaps; do not pad.  

---

## Steps

1. Read card intent, inputs, Content Vision.  
2. Collect and label sources.  
3. Extract claims; map each to a source.  
4. List misconceptions relevant to the skill being taught.  
5. Search existing catalog/pathway for overlap; note reuse vs new.  
6. Build forbidden/risk list (doctrine + accuracy).  
7. Enumerate open questions (Hotel may need to answer before plan).  
8. Write `research_pack` artifact on the card; set actor attribution.  
9. If trading claims present → flag for **Hotel** accuracy review before lesson plan.  

---

## Verify

- [ ] Artifact stage = `research_pack` present on card  
- [ ] Claims inventory non-empty when trading content, each with source  
- [ ] Prior art section exists (even if “none found”)  
- [ ] Open questions listed or explicitly “none”  
- [ ] No profit claims framed as usable copy  

---

## Handoff

→ **Hotel** (if trading claims) → **`course-lesson-plan`** (November)  

On failure / thin pack → card **Red** `hold_code=missing_inputs` or `step_failed`.  
