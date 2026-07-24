# HeyGen delivery-format experiment — how we hand work to Video Agent

**Status:** Active experiment (Coach-led)  
**Goal:** Learn **how to package** module content for HeyGen — not only *how many*  
jobs run at once (see concurrent batch experiment).  
**Parents:** [`HeyGen-Batch-Experiment.md`](./HeyGen-Batch-Experiment.md) · outline workspace · course-lesson-video  

---

## 1. Why this experiment

We can send HeyGen:

1. **Module outline only** (structure + short lesson blurbs)  
2. **Module outline + separate video scripts** (structure first, then VO packets)  
3. **Module outline with inline scripts** (one document: structure + VO per lesson)

Same cast, same lessons, same concurrent batch (prefer **2** for this study so format  
noise isn’t mixed with queue noise). Measure quality, doctrine fidelity, pacing, and  
how much “agent improvisation” we get.

---

## 2. Hypotheses

| H | Claim | Falsify if… |
|---|---|---|
| F1 | **Outline-only** is fastest to produce but weakest teaching fidelity | Outline-only scores ≥ separate scripts on outcome clarity |
| F2 | **Outline + separate scripts** is the best quality / control default | Inline or outline-only clearly beats it |
| F3 | **Inline scripts** is best *single paste* for small modules (≤3 lessons) | Separate packets still win on quality or editability |
| F4 | Video Agent expands vague outlines into claim risk more often | Doctrine flags higher on outline-only |

---

## 3. Three delivery formats (definitions)

### Format α — Module outline only

Deliver **structure + lesson intent**, no full VO.

```text
MODULE: Foundation
description: …
lessons:
  - slug / title
  - outcomes (2–4 bullets)
  - brief: 80–150 words (what to teach, not full VO)
  - free_preview?
```

**HeyGen job:** one create per lesson; prompt = module context + that lesson’s brief only.

### Format β — Outline, then accompanying scripts

**Step 1:** Same outline as α (can be the approved blueprint module).  
**Step 2:** Separate script packet per lesson (150–400 words VO concept, or full VO).

```text
# scripts/stop-the-bleeding-mindset.md
## Voiceover
…
## On-screen
…
## Beats (optional)
```

**HeyGen job:** prompt = short module header + **full script packet** (outline for context only).

### Format γ — Outline with inline scripts

One document: module + each lesson contains its script in place.

```text
MODULE: Foundation
description: …

### Lesson 1: …
outcomes: …
script: |
  (150–400 words VO concept)
on_screen: …

### Lesson 2: …
…
```

**HeyGen job:** prompt = full module doc **or** sliced “this lesson’s section + module description” (prefer **slice per lesson** so one idea per video).

---

## 4. Fixed module under test

Use the **same three lessons** as the batch experiment (Foundation module):

| slug | title |
|---|---|
| `stop-the-bleeding-mindset` | The stop-the-bleeding mindset |
| `define-risk-before-reward` | Define risk before reward |
| `weekly-process-review` | Weekly process review |

Full brief text: [`HeyGen-Batch-Experiment.md` §4](./HeyGen-Batch-Experiment.md).  
Canonical packs for copy-paste: [`experiments/fixtures/`](./experiments/fixtures/).

---

## 5. Run plan

| Phase | Format | Concurrent | Jobs |
|---|---|---|---|
| **P1** | α outline-only | **2** (then 1 if needed) | 3 lessons |
| **P2** | β outline + separate scripts | **2** | 3 lessons |
| **P3** | γ inline scripts | **2** | 3 lessons |

**Order:** P1 → P2 → P3 (or P1 → P3 → P2 if you want single-doc next).  
**Do not** change cast, orientation, or batch size mid-study.  
Log every job with `delivery_format`: `outline_only` | `outline_plus_scripts` | `inline_scripts`.

Optional: after winner is clear, re-run winner at batch **3** (tie to concurrent experiment).

---

## 6. Metrics (same jobs log + format fields)

Extend each JSONL line (or add fields):

| Field | Values |
|---|---|
| `delivery_format` | `outline_only` \| `outline_plus_scripts` \| `inline_scripts` |
| `prompt_chars` | length of prompt sent |
| `verbatim_feel` | 1–5 (did it feel like the script vs free improv?) |
| `structure_fidelity` | 1–5 (outcomes covered?) |
| `doctrine_score` | 1–5 |
| `edit_cost` | minutes you’d spend to re-prompt or fix |

Wave table: [`experiments/heygen-delivery-results.md`](./experiments/heygen-delivery-results.md).

---

## 7. Prompt skeletons by format

### α — Outline-only (per lesson)

```text
FORMAT: Course lesson, landscape, 2–4 minutes.
TONE: Process-first trading education. No profit claims.
MODULE CONTEXT:
  title: Foundation
  description: [module description_md]
THIS LESSON:
  title: …
  outcomes: …
  teaching_brief: [80–150 words]
AVATAR: The selected presenter teaches clearly.
Expand the teaching brief into a clear lesson. Do not invent profit claims.
One topic only. Minimal clean visuals (blue/black/white).
```

### β — Separate script (per lesson)

```text
FORMAT: Course lesson, landscape, 2–4 minutes.
TONE: Process-first. No profit claims.
MODULE: Foundation — [one-line description]
LESSON: [title] · outcomes: …
SCRIPT (concept to convey — expand naturally, no silence padding):
[150–400 word script body]
CRITICAL ON-SCREEN TEXT:
[list]
AVATAR: The selected presenter …
Style: minimal clean; motion graphics for checklists.
```

### γ — Inline (per lesson slice)

```text
FORMAT: Course lesson, landscape, 2–4 minutes.
The following is one lesson from a module document. Use ONLY this lesson’s script
as the teaching content; module description is context only.
---
[paste module description]
[paste this lesson’s title, outcomes, script, on-screen]
---
AVATAR: The selected presenter …
```

**Critical for γ:** still submit **one HeyGen job per lesson** (slice). Do not send all three scripts in one video.

---

## 8. Decision rules (after P1–P3)

| Winner pattern | Product default |
|---|---|
| β best quality | Blueprint outline + `course-lesson-script` artifacts → HeyGen |
| γ best quality & ops simplicity | Single `module_packet` artifact with inline scripts → slice → HeyGen |
| α “good enough” for drafts | Outline-only for dry-run / stub; never live flagship |
| α doctrine failures | Ban outline-only for live without Hotel/script lint |

Encode later in `course-lesson-video` skill + produce API (`packet_format`).

---

## 9. Relationship to batch-size experiment

| Experiment | Question |
|---|---|
| Batch 3→4→2 | How many jobs at once? |
| Delivery α/β/γ | What payload shape per job? |

Run delivery formats at **batch 2** first (cleaner). Then apply winning format at learned max batch.

---

## 10. Safety

- Process outcomes only.  
- Live credits: Coach ok before each phase.  
- No member publish from experiment renders without package gate.  
