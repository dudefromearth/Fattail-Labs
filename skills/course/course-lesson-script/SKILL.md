---
name: course-lesson-script
description: >
  Write plan-locked Course lesson VO scripts (and optional trailer script) for
  product_line=course — voice-trained, FILL IN safe, coverage-matrix complete.
  Use when producing script stage, Romeo course VO, or /course-lesson-script.
---

# course-lesson-script

**Type:** Course component  
**Owner:** Romeo  
**Package stage:** `script`  
**Board sub_stage:** `script`  
**Handoff contract:** [`Specs/FatTail-Labs-Handoff-Contract-v1.0.md`](../../../Specs/FatTail-Labs-Handoff-Contract-v1.0.md)  
**Craft sources:** Labs plan-lock + CGE `scriptwriter` patterns (voice, FILL IN, sous-chef, anti-fragile lists)  

---

## Purpose

Write scripts that **implement November’s lesson plans beat-for-beat** — teach and hold  
attention **in Coach’s (or cast’s) real voice** — without inventing outcomes or claims.

You are the **sous-chef**: chop and prep. Coach seasons with real stories and final numbers.  
First draft is always **v1 / proposal-state**, not render-final.

---

## Inputs

| Required | Source |
|---|---|
| `lesson_plan` | `course-lesson-plan` / approved blueprint snapshot |
| `research_pack` | claims map (`course-research`) |
| Cast policy | card `cast_id` / cast registry when multi-presenter |
| `blueprint_approved` | must be true |

| Strongly recommended | Source |
|---|---|
| `voice_profile` | package artifact (see § Voice profile) |
| Sample transcripts | `inputs_md` / studio samples for cast |

| Optional | Source |
|---|---|
| External script seed | Public YT script path — **voice/story color only**, not claim authority |
| `handoff_v1` from plan | Prefer machine-readable inputs_resolved |

**Fail loud if:** no lesson plan; blueprint unapproved; `inputs_missing` non-empty on inbound handoff.  
**Do not** write orphan course VO.

---

## Outputs

### 1. Artifact stage `script` (markdown; multi-lesson pack OK)

Per lesson (and trailer if required):

- Format: `course_lesson`  
- Lesson slug / plan reference  
- Timing target  
- **VO text** (section headers = plan beats)  
- Lightweight on-screen / B-roll callouts (full edit pass = `course-lesson-edit`)  
- Cast assignment (registry name)  
- **Coverage matrix:** plan beats → script sections  
- **Claims map:** sentence/claim → research claim id or `[FILL IN: …]`  
- Doctrine self-lint notes  
- **FILL IN index** (all unresolved markers)  

### 2. Optional artifact `voice_profile` (if created this run)

```text
VOICE PROFILE
- Rhythm: […]
- Signature phrases: […]
- Explains via: […]
- Energy/formality: […]
```

Store as package artifact (default per integration plan). Confirm in one line on later runs if already present.

### 3. Outbound `handoff_v1`

→ `course-lesson-edit` when live HeyGen path (preferred)  
→ `course-lesson-video` when map-only/fixture or edit skipped  

---

## Invariants

1. **Plan-locked** — cite plan lesson slugs/beats; no orphan VO.  
2. **Claims trace to research** — no new trading claims in prose.  
3. **Process outcomes only.**  
4. **One primary idea per lesson** — do not smuggle the whole course into one script.  
5. **Proposal-state** — not approved for render until gate / Coach lock allows.  
6. **Never invent numbers, names, or stats** — use `[FILL IN: description]` or research ids.  
7. **No default mid-roll monetization CTA** in lesson VO (pathway CTA lives in placement/header/resources unless plan explicitly requires a soft capacity line).  
8. **No Holy Trifecta / Icahn packaging requirements** inside course VO.  

---

## Voice profile (from CGE craft)

If no `voice_profile` exists for this cast/card:

1. Ask for or load 2–3 sample scripts/transcripts (or studio samples).  
2. Extract rhythm, signature phrases, explanation style, energy.  
3. Write `voice_profile` artifact; reuse next time.

If present: confirm in one line; do not re-extract.

**Spoken voice rules (VO body):**

- Conversational mid-length sentences; occasional short punch  
- Complete sentences only  
- Numbers always numeric (`1%`, `$500`, `6 weeks`)  
- No year stamps in spoken content — “right now” / “currently”  
- No robotic triple-beat cadence  
- No coaching spam: “level up,” “game-changer,” “delve,” “in today’s fast-paced world,” “in conclusion”  
- Plain vocabulary; formality matches profile  

---

## Anti-fragile over-generation

If a plan beat requires a list (N examples, N mistakes, N steps):

- Draft about **1.5 × N** candidates  
- Label: “Pick N — human cuts the rest”  
- Never silently trim to N yourself  

---

## Steps

1. **Validate inbound handoff** — require `lesson_plan_ref`, `research_pack_ref`, empty `inputs_missing`; confirm blueprint approved.  
2. Load plan; list all video (and VO) lessons.  
3. Load or create **voice_profile**.  
4. For each lesson:  
   a. List plan beats / outcomes.  
   b. Draft VO section-by-section (headers = beats).  
   c. Annotate claims → research ids or FILL IN.  
   d. Build coverage matrix.  
   e. Add light `[VISUAL: …]` only where numbers/claims need anchoring (dense notes → edit skill).  
5. Assign cast from registry / card.  
6. Draft trailer script if header requires trailer.  
7. Doctrine lint; compile FILL IN index.  
8. Write `script` artifact.  
9. Emit **handoff_v1** to edit (preferred live) or video.  

---

## Outbound handoff examples

### To edit (live HeyGen default)

```text
---
HANDOFF → course-lesson-edit
from: course-lesson-script
product_line: course
inputs_resolved:
  script_ref: artifact://script
  lesson_slugs: […]
  voice_profile_ref: artifact://voice_profile
inputs_missing: []
constraints: [blueprint_approved, plan_locked, claims_trace_to_research, one_primary_idea_per_lesson, process_outcomes_only, no_silent_publish, edit_brief_preferred_live]
artifacts_out_expected: [script_edit_brief]
human_gate: null
---
```

### To video (map-only / skip edit)

```text
---
HANDOFF → course-lesson-video
from: course-lesson-script
product_line: course
inputs_resolved:
  script_ref: artifact://script
  lesson_slugs: […]
inputs_missing: []
constraints: [blueprint_approved, plan_locked, claims_trace_to_research, one_primary_idea_per_lesson, process_outcomes_only, no_silent_publish, edit_brief_optional]
artifacts_out_expected: [video_package]
human_gate: null
---
```

---

## Verify

- [ ] `script` artifact present  
- [ ] Every plan video-lesson has script coverage (or explicit skip + reason)  
- [ ] Coverage matrix shows no critical beat missing  
- [ ] Cast named or explicit “TBD → Red at video”  
- [ ] Doctrine lint clean  
- [ ] No unattributed trading claims (research id or FILL IN)  
- [ ] FILL IN index listed for Coach  
- [ ] Voice profile present or explicit “generic cast voice”  
- [ ] Outbound handoff_v1 present; `inputs_missing` empty  

---

## Handoff

→ **`course-lesson-edit`** (Papa/Romeo) — **preferred** when video mode = live HeyGen  
→ **`course-lesson-video`** (Papa) — map-only, fixture, or edit explicitly skipped  
→ Guardians (Hotel/Tango) as sequenced before render  

Missing cast when live video required → **Red** `missing_cast`.  
