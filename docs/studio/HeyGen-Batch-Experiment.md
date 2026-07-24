# HeyGen batch size experiment — discover practical limits

**Status:** Active experiment (Coach-led)  
**Goal:** Find **practical concurrent batch size** and **optimal use case** for  
lesson-video production from an approved outline — not theoretical max.  
**Parents:** Cast-HeyGen Spec v1.1 · course-blueprint · heygen-video skill  

---

## 1. Hypothesis set

| H | Claim | How we falsify |
|---|---|---|
| H1 | Default **3** concurrent (`LABS_HEYGEN_MAX_BATCH`) is the sweet spot | 3 completes cleanly; 4 shows queue/fail/quality drop |
| H2 | **2** is safer when live queue is congested | 2 has lower wall-clock variance and fewer stuck `thinking` |
| H3 | Quality depends more on **prompt/brief** than on batch size (within 2–4) | Same batch size, better prompt → better score |
| H4 | Module-sized waves beat whole-course dump | Documented after 2–3 waves |

HeyGen skill guidance: submit **2–3 max** concurrent; larger waves risk long `thinking` stalls.

Labs default already: `LABS_HEYGEN_MAX_BATCH=3` (see `server/heygen_prod.py`).

---

## 2. Wave plan (this experiment)

| Wave | Concurrent jobs | Purpose |
|---|---|---|
| **A** | **3** | Baseline (current product default) |
| **B** | **4** | Stress one step above default |
| **C** | **2** | Back off; measure reliability / time variance |

**Do not change other variables between A→B→C** (see controls).  
After C, optionally re-run **one** lesson with an improved prompt (Wave D — prompt learning only).

---

## 3. Controls (hold constant)

| Control | Value for this experiment |
|---|---|
| Cast | One registry cast only (e.g. `dude-primary`) — same for all waves |
| Orientation | `landscape` (course lessons) |
| Product context | Same board card **or** same fixture pack below |
| Brief length | **150–400 words** per lesson (teaching brief, process-safe) |
| Mode | Prefer **live** for real limits; dry-run only validates plumbing (does not teach queue limits) |
| Network / machine | Same host (MiniTwo or local), same day window if possible |
| Prompt **template** | Fixed skeleton §5 until Wave D |

**Change only:** number of concurrent submits in the wave.

---

## 4. Fixture pack — three lesson briefs (extend to 4 for Wave B)

Use these as `script` / VO concept text (process outcomes only).  
Copy into a board card script artifact or produce payload so waves are comparable.

### Lesson 1 — `stop-the-bleeding-mindset` (~220 words)

Teach capital preservation as the first step. The learner should leave able to state why process comes before optimization, without any profit claim. Cover: bleeding vs thriving as sequence, not personality; risk defined before reward language; one weekly habit (review drawdown and rule adherence, not P&amp;L bragging). Tone: calm, adult, respectful of traders who are tired of hype. CTA: write one sentence defining your personal “stop the bleeding” rule.

### Lesson 2 — `define-risk-before-reward` (~240 words)

Define risk in plain language for a single strategy or structure the course will use. Outcomes: name max loss framing, invalidation, and “what would make me stand down.” Misconceptions: risk as “feeling scared,” risk as only position size. Include a short checklist the learner can reuse. No income language. Tone: instructional, checklist-friendly.

### Lesson 3 — `weekly-process-review` (~200 words)

Run a weekly process review: adherence, exceptions, one adjustment. Outcomes: complete a one-page review without turning it into a scoreboard of profits. Template fields: rules followed, rules broken, emotional triggers, next week’s single focus. Tone: coaching short-of-breath but dignified.

### Lesson 4 — Wave B only — `capacity-over-dependency` (~210 words)

Distinguish capacity (skills you keep) from dependency (signals you rent forever). Outcome: list two practices that build independence. Forbidden: guru-following as strategy. Tone: honest, anti-dependency, still warm.

---

## 5. Prompt template (fixed for Waves A–C)

Use the same skeleton for every lesson; only the lesson body changes.

```text
FORMAT: Educational course lesson, landscape 16:9, target 2–4 minutes.
TONE: Calm, process-first trading education. No profit claims, no income promises.
AVATAR: The selected presenter explains clearly to a tired intermediate trader.
SCRIPT (concept to convey — expand naturally, do not pad with silence):

[LESSON BRIEF 150–400 words here]

CRITICAL ON-SCREEN TEXT (display literally if used):
- Lesson title
- Any checklist labels from the brief

Use minimal, clean styled visuals. Blue, black, and white as main colors.
Leverage motion graphics as B-rolls and A-roll overlays when teaching checklists.
Include a short intro and clear close.
This script is a concept and theme to convey — not a verbatim transcript.
You have full creative freedom to expand and fill the duration naturally.
```

**Cast rule:** When `avatar_id` is set, never describe the face — “the selected presenter” only.

---

## 6. Metrics (record every job)

Log each render in  
[`docs/studio/experiments/heygen-batch-log.jsonl`](./experiments/heygen-batch-log.jsonl)  
(one JSON object per line).

| Field | Meaning |
|---|---|
| `wave` | `A` \| `B` \| `C` \| `D` |
| `batch_size` | Concurrent submits in that wave |
| `lesson_slug` | Stable id |
| `submitted_at` / `completed_at` | ISO timestamps |
| `wall_seconds` | completed − submitted |
| `status` | completed \| failed \| stuck_thinking \| cancelled |
| `session_id` / `video_id` | HeyGen ids |
| `stuck_thinking_15m` | true if still thinking &gt;15 min |
| `duration_target_s` / `duration_actual_s` | if known |
| `quality_score` | 1–5 human (see rubric) |
| `quality_notes` | free text |
| `prompt_version` | `v1-fixed` then `v2-…` after learning |
| `dry_run` | boolean |
| `error` | if any |

### Quality rubric (1–5)

| Score | Meaning |
|---|---|
| 5 | Teachable, on-doctrine, pacing good, would place as draft lesson |
| 4 | Minor issues (visual noise, slight drift) — acceptable with notes |
| 3 | Usable only after re-prompt |
| 2 | Wrong tone / claim risk / unusable structure |
| 1 | Failed craft or technical fail |

Also score: **doctrine** (process-only), **outcome clarity**, **visual clutter** (1–5 each optional).

### Wave summary (fill after each wave)

In [`docs/studio/experiments/heygen-batch-results.md`](./experiments/heygen-batch-results.md):

- Success rate  
- Median / max wall_seconds  
- Stuck count  
- Mean quality_score  
- Decision: keep / avoid this batch size  

---

## 7. Runbook (operator)

### Preconditions

1. `HEYGEN_API_KEY` set; cast ready (`docs/studio/cast/`).  
2. Course card with **approved blueprint** (or experiment card with script artifact containing the three/four briefs).  
3. Budget: `GET /api/admin/board/heygen/budget` — enough remaining for the wave.  
4. Note env: `LABS_HEYGEN_MAX_BATCH` (override per request via `max_renders` if UI/API allows).

### Wave A — batch 3

1. Produce **exactly 3** lessons (1–3), concurrent.  
2. Record submit times.  
3. Poll / Refresh HeyGen until done or 45 min.  
4. Log each job; fill wave summary.  
5. **Do not** start Wave B until A is logged.

### Wave B — batch 4

1. Same template; add lesson 4.  
2. Submit **4** concurrent (set max_renders=4 if needed).  
3. Log + summary. Especially watch stuck `thinking` and failure rate.

### Wave C — batch 2

1. Two lessons only (prefer re-run of L1+L2 with **same** prompts as A for apples-to-apples wall time, **or** two new briefs if credits tight — note which).  
2. Log + summary.

### Learning step (same day if possible)

1. Diff quality notes across A/B/C.  
2. Rewrite prompt skeleton → `prompt_version: v2-…`.  
3. Optional Wave D: batch **2 or 3** with v2 only — measure quality lift, not batch limit.

---

## 8. Decision rules (after data)

| Observation | Provisional policy |
|---|---|
| B (4) has more stuck/fail than A (3) | Keep **max batch = 3**; document 4 as unsafe |
| C (2) much more reliable, A flaky | Default **2** under load; 3 only when queue quiet |
| Quality ≈ same across 2–4 when prompts fixed | Optimize for **reliability**, not batch size |
| Quality varies wildly inside same batch | Prompt/brief is the lever — invest in co-pilot settle before produce |

Product defaults to encode later:

```text
LABS_HEYGEN_MAX_BATCH = <learned>
produce scope default = module (wave size ≤ max batch)
```

---

## 9. How this relates to “dump outline → all videos”

This experiment answers **concurrency**, not “whole course in one click.”  
Even if batch 3 is optimal, a 12-lesson course is still **four waves of 3**, each with poll.

Interactive settle (outline workspace, then optional per-module script chat) remains the quality path; this experiment only sizes the **produce** wave.

---

## 10. Safety

- Process outcomes only in all briefs.  
- Live jobs spend credits — Coach confirms before Wave B/C if budget is tight.  
- Prefer dry-run once to verify cast/plumbing, then live for the real study.  
- Never member-publish from experiment outputs without normal package gate.

---

## 11. Next after experiment

1. Update `LABS_HEYGEN_MAX_BATCH` default if evidence demands.  
2. Capture winning prompt skeleton in `skills/course/course-lesson-video` or cast README.  
3. Wire board UI: produce **module wave** with learned batch size.  
4. Run **delivery-format** study (outline only vs scripts vs inline):  
   [`HeyGen-Delivery-Format-Experiment.md`](./HeyGen-Delivery-Format-Experiment.md).  
