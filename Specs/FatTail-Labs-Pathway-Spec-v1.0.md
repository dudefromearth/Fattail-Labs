# FatTail Labs — Pathway Assessment Spec v1.0

**Status:** Approved as built (2026-07-21)
**Parent spec:** §3.3 (Trader Assessment) · §5.4 (dashboard pathway row)
**Positioning:** project memory / decision log — *sell the dream, sequence the
discipline*. The pathway is the mechanism: whatever a member answers, step 1 is
**First, Stop the Bleeding**.

---

## 1. Assessment (2 minutes, 4 questions)

| Key | Question | Answers |
|---|---|---|
| experience | How long have you been trading options? | new / some (<2y) / experienced (2y+) |
| account | Which describes your account lately? | bleeding / flat / growing |
| struggle | What's your biggest struggle? | risk (losses too big) / chasing (overtrading, revenge) / routine (inconsistent process) / edge (finding setups) |
| time | Time available per day? | minutes (<30m) / hour (30–90m) / more (90m+) |

Answers stored verbatim (`pathways.assessment_json`); retaking replaces the pathway.

## 2. Sequencing Rules (server-side, deterministic)

1. **`first-stop-the-bleeding` is always step 1.** Non-negotiable, all answer
   combinations.
2. experience = new → `options-foundations` next.
3. `zero-dte-essentials`.
4. struggle = chasing → `trader-psychology` early; struggle = routine →
   `the-trading-routine` early; struggle = risk → `sizing-and-capital-gates` early.
5. `butterfly-foundations`, then any of {sizing, psychology, routine} not yet placed.
6. `convexity-and-asymmetry`, `the-fat-tail-doctrine`.
7. `marketswarm-platform-primer` last (the tool after the doctrine).

Sequence is deduped, filtered to published courses only, and stored
(`course_sequence_json`).

## 3. API

```
GET  /api/me/pathway    session: saved assessment + sequence, each step overlaid with
                        live progress (percent, done, resume lesson) — derived from
                        lesson_progress at read time, never stored
POST /api/me/pathway    {answers} → validate keys/values, compute, upsert, return
```

## 4. UI

- `/pathway`: signed-out → prompt; no pathway → the assessment form; has pathway →
  numbered step list with course cards, progress bars, the first incomplete step
  highlighted **Start here**, and Retake (replaces).
- **Signup funnel**: registration now lands on `/pathway` ("2 minutes to personalize")
  instead of the catalog — the benchmark's post-signup assessment pattern, carrying
  the stop-the-bleeding routing.
- Dashboard gains a **Your Pathway** card: next step + progress, linking to `/pathway`.

## 5. Invariants

1. Step 1 is the flagship for every possible answer set (tested).
2. Progress overlay is derived, never denormalized.
3. Sequencing rules live server-side — the client only renders.
