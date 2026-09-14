# PPL0-W0 — GO Token

**Program:** Practice Position Lifecycle (B0 correctness)  
**Plan:** [`docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Practice-Position-Lifecycle-Full-Agent-Bench-Plan-v1.1.md) **v1.1** (Advisor review: SOUND)  
**Spec:** [`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md`](../../Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md) **v0.1.1 BUILD AUTHORITY**  
**Board:** `agents/p-practice-position-lifecycle/`  
**Machine:** StudioTwo (`StudioTwo.local`). Never MiniTwo / DudeTwo. Never `git add -A`.  
**Token file:** `agents/go/PPL0-W0.md`  
**Date drafted:** 2026-09-14  

**Status:** **STAMPED GO** — 2026-09-14. Coach decisions below. Chat is not the stamp; this file is (**DL-328**). Gate name **PPL0-G**.

**DL:** **DL-702** (this stamp + AGENTS.md fourth-tree seating)

---

## Coach's decisions (2026-09-14)

Two decisions had no default and needed Coach. Both are now made:

| # | Decision | Coach's call |
|---|---|---|
| **Fourth active tree** | Run this work concurrently with the three existing build jobs (LIM, QFRIC, XS), or wait? | **RUN NOW.** Seat Practice Position Lifecycle as a fourth active program. Guardrails in plan §3 keep it isolated |
| **Delete behavior** | Permanent delete with a warning, or build an undo/trash-bin? | **PERMANENT + kit warning dialog.** No trash-bin this round; undo can be added later if wanted |

**Required alongside this stamp:** the AGENTS.md active-program line is updated to add
**Practice Position Lifecycle** beside LIM / QFRIC / XS, in the same body of work as this stamp. (This is
what the "fourth active tree" decision above authorizes.)

---

## All other decisions — silent defaults accepted

Coach reviewed none of these individually; they take the plan's recommended default. Named here so
the record is honest:

| Item (plain English) | Default taken |
|---|---|
| Two words for the two "incomplete" cases (**OD-21**) | **partial-residual** (a scale-out that left some open) vs **unfinished cycle** (an import with a missing end). Kept separate, not merged |
| The 30-day hold limit (**OD-23**) | **Stays 30 days.** It's a guard against a typo pairing trades a year apart, not a lesson to teach members |
| Which lot a partial close consumed (**OD-24**) | **Show which open it hit** (oldest first). No lot-picker menu |
| Gate behavior on file imports (**OD-25**) | Member-typed closes get the four safety checks; **file imports do NOT get hard-blocked** for a missing open (the coverage window explains those later) |
| **OD-19** | Permanent + kit warning. Soft-trash **not this board** |
| **campaign_phase_reports.py** | **Out** of PPL2 |

**Still genuinely blocked — no default, and correctly so:** **OD-9** import coverage-window, **OD-22** declarations store, and **FI-PPL-1** day-book/blotter agreement. These only matter at PPL4 and will come back to Coach before that phase starts. Nothing about them blocks the work starting now.

---

## What this stamp authorizes

- **PPL0** to complete: fold the reviewer/Grok amendments into the spec (→ spec v0.1.1), record the
  decision-log entry, place the seeds, and pass the PPL0 gate.
- Then **PPL1** (the test-lock step) and **PPL2** (the actual read-model fix — the cheap, high-value
  one) to run in sequence, each stopping at its gate for verification.
- **PPL3** and **PPL4** follow their own gates; PPL4 returns to Coach for the three blocked items
  above before it starts.

## What this stamp does NOT authorize

- No product code until PPL0's gate passes.
- No touching the matcher engine, the frozen Options Lab file, or the other three build jobs.
- No deploy. Nothing reaches MiniTwo/DudeTwo unless Coach names it separately.

---

## Stamp

- [x] **Coach:** I stamp PPL0-W0. Decisions above are mine. Seat the program in AGENTS.md in this
      body of work.

| Field | Value |
|-------|--------|
| Coach | Ernie (Coach) |
| Date | 2026-09-14 |
| Phrase | RUN NOW (fourth tree). PERMANENT + kit warning dialog (OD-19). Silent defaults for OD-21/23/24/25. |
| Result | **STAMPED GO** |
| Spec sha1 at stamp | `84601fd37386929f9aaf89d82161e42c8b3b7af4` (`Specs/FatTail-Labs-Practice-Position-Lifecycle-Spec-v0.1.md` content v0.1.1) |
| Plan sha1 at stamp | `275f783243da54ca7bb460e02214b9e47440c981` (plan v1.1) |
