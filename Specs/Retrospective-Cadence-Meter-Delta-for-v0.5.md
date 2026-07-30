# Delta packet — retrospective cadence as process signal

**For:** Journal Retrospective Spec v0.5 + Journey Experience Spec v1.1
**Status:** **FOLDED into Spec v0.5 + Journey Experience §4.1a** (India RT0-1, 2026-07-29)  
→ [`FatTail-Labs-Journal-Retrospective-Spec-v0.5.md`](./FatTail-Labs-Journal-Retrospective-Spec-v0.5.md)  
→ Journey Experience Spec §4.1a / §4.4  
Retained as historical decision packet.  
**Decisions landed here:** (1) gather→complete interval belongs to no retrospective (option C);
(2) retrospective cadence contributes to the process integrity meter;
(3) **Observer trial** may create retrospectives and is on the cadence meter;
**Activator is legacy** (self-directed, not advertised) — keeps technical access, not G1 focus.

---

## A. Journey Experience Spec v1.1 — meter deltas

### A.1 §4.1 row replacement

| id | Label | Signal |
|----|-------|--------|
| `retrospective` | Retrospectives | **Days since last completed retrospective, against the member's profile cadence horizon.** No longer `soon`. |

Remove the `soon` qualifier and the v0.2 reference.

### A.2 New §4.1a — Retrospective cadence meter

```
H = profile.retro_horizon_days
d = days since last COMPLETED retrospective
    (if none has ever been completed: days since practice_epoch)

d ≤ H        →  raw = 100
H < d < 2H   →  raw = round(100 × (2H − d) / H)
d ≥ 2H       →  raw = 0
```

Linear decay across one horizon, floor at zero. No new tunable beyond `H`.

**Only `completed_at` moves the clock.** A retrospective in `draft`, `gathering`, or
`ready` earns nothing — this is the entire lag signal. `abandoned` does not move the
pointer either, so abandoning leaves the clock running. Consistent with v0.4 §3.1.

**Empty rules** (meter excluded from `overall_raw_percent`, per Journey §4.1):

| # | Condition | Rationale |
|---|-----------|-----------|
| E1 | Member cannot create a retrospective | **Entitlement for create:** `observer-trial` plan **or** activator+ (legacy Activator / Navigator / admin). Free account with no trial plan: excluded. Never grade a member on a feature they cannot reach. See §E.2 (closed) |
| E2 | No completed retrospective **and** `d ≤ H` | One full horizon of grace before cadence counts at all. Consistent with G1 ("do not force week-1 retro") and with §4.2's no-day-one-Poor invariant |
| E3 | `practice_epoch` unresolvable | Nothing to measure from |

After E2 lapses the meter goes live on the decay curve — `d = H + 1` yields ~99, not a
cliff.

**Tenure:** §4.3 weighting applies unchanged, as with every meter.

**Bounded influence:** cadence is one of six meters in the raw average. At maximum it
moves `overall_raw_percent` by ~16.7 points and cannot by itself determine a grade band.
Worth stating in the spec so the Tango question in §E.1 is answerable on the arithmetic.

**Known and accepted tradeoff:** the meter measures completion cadence, not retrospective
quality. A member can stop the clock with a shallow retrospective. This is accepted rather
than mitigated — quality gating would require the system to judge the member's reflection,
which capacity-over-dependency forbids. Recorded so it is a decision, not an oversight.

### A.3 §4.4 — new profile column

`retro_horizon_days` is a **new column**, not a reuse of `grade_ramp_days`. See §E.1.

| Profile id | Persistence horizon | grade_ramp_days | **retro_horizon_days** |
|------------|--------------------|-----------------|------------------------|
| `observer_trial` | 6 weeks | 42 | **42** — **G1 primary** (Coach: trial may create retros) |
| `navigator_monthly` | 12 weeks | 30 | **30** — **G2 primary** |
| `navigator_annual` | 26 weeks | 90 | **90** — **G2 primary** |
| `activator` | 12 weeks | 30 | **30** — **legacy** self-directed path; not advertised; few signups |
| `alumni` | 12 weeks | 21 | **60** — proposal: library rhythm, not active trading loop |
| `free_observer` | 4 weeks | 14 | **n/a** — no trial plan, no create entitlement (E1) |
| `administrator` | 12 weeks | 30 | **30** |

**Coach-locked:** `observer_trial` 42, Navigator monthly 30 / annual 90.  
**Legacy:** Activator retains access and H=30 but is **not** a marketed tier.  
**Proposals:** alumni 60, administrator 30.

**Single source:** the nudge (v0.5 §7.5) and the meter read the same
`retro_horizon_days`. They must never diverge — a member nudged at day 31 and graded on a
different horizon will read the product as arbitrary.

---

## B. Retrospective Spec v0.5 — §4.1 replacement (scope decision)

Replaces v0.4 §4.1 in full.

```
scope_start = last_complete.completed_at    # half-open: strictly after
scope_end   = now (at gather)
```

**Decision (Coach, 2026-07-29):** activity between a retrospective's `scope_end` and its
`completed_at` falls into **no** retrospective window. This is deliberate, not an artifact
of the boundary choice. A member may legitimately take trades while writing up the prior
period, and forcing that activity into either window would impose a precision on a fluid
human process that the product does not want. The book closed is the book closed.

**No coverage indicator.** No "unreviewed activity" badge, no completeness score, nothing
that turns the interval into something the member must manage. Lag surfaces through the
cadence meter (§A.2) and nowhere else.

---

## C. Retrospective Spec v0.5 — §7.5 replacement

Replaces v0.4 §7.5 in full. The prior wording — *"a missed retro is not a process
integrity failure"* — is withdrawn; it would forbid the signal this decision relies on.

### 7.5 Cadence — nudge and meter

Two distinct mechanisms. They share `retro_horizon_days` and nothing else.

**The nudge (never punitive).** When days-since-last-complete exceeds the profile horizon,
the system may suggest starting a retrospective. Invitational copy only. No badge decay,
no streak loss, no remedial or shame framing, no interstitial, no repetition beyond a
persistent, dismissible surface.

**The meter (process signal).** Retrospective cadence contributes to the process integrity
meter on the same footing as routine, learning, live presence, and adherence — it measures
whether the member closes a loop rather than only opens one. Definition: Journey
Experience Spec §4.1a.

**Invariants:**

1. Cadence is one meter among six. It can move the grade; it cannot alone determine it.
2. The grade describes the work, not the person (Journey §4.2). Tenure rules apply — a
   new member cannot be graded Poor on cadence.
3. Members without the entitlement are excluded from the meter, not scored zero.
4. Copy never links the grade to the nudge. The member is not told they are being marked
   down; they see a process meter that includes retrospectives, the same way it includes
   journalling.

---

## D. R7 definition + verification

### D.1 §13 slice R7 (replaces the one-line entry)

| Slice | Deliverable |
|-------|-------------|
| **R7** | `retro_horizon_days` on meter profiles; `retrospective` meter un-`soon` per Journey §4.1a; empty rules E1–E3; nudge and meter reading one horizon; `ProcessMeter.tsx` renders the sub-meter with existing grade chip treatment |

`server/journey_scores.py` — `process_meters` gains the cadence computation;
`resolve_meter_profile` gains the new field. Characterization tests in
`server/tests/test_journey_scores.py` per §D.2.

### D.2 Verification additions (append to v0.4 §14)

10. `d ≤ H` → raw 100. `d = 1.5H` → raw ≈ 50. `d ≥ 2H` → raw 0. Boundary cases at exactly
    `H` and exactly `2H`.
11. Open retrospective in `ready` for 20 days does **not** hold the meter up — clock runs
    from prior `completed_at`.
12. `abandoned` retrospective does not move the pointer; meter continues to decay.
13. New member, no completed retro, `d ≤ H` → meter `empty`, excluded from
    `overall_raw_percent` (assert the average denominator, not just the field).
14. Member below activator → meter `empty`, never 0.
15. Maiden journey completed → meter live at 100; grade cannot render Poor for a member
    inside the tenure ramp (§4.3).
16. Nudge threshold and meter horizon read the same profile field — assert equality rather
    than two constants that happen to match.
17. Copy sweep: no surface tells a member they were marked down for a late or missed
    retrospective.

---

## E. Open — needs a named decision

### E.1 `grade_ramp_days` was doing double duty (India / Coach)

v0.4 §7.5 sourced its cadence horizons — Observer 42d, Navigator monthly 30d, annual 90d —
from Journey §4.4. Those are the **`grade_ramp_days`** values, which are the tenure ramp
for grading. Semantically unrelated to how often a member should retrospect, and the reuse
produces results nobody intended: `alumni` would be nudged every 21 days (more often than a
Navigator), `free_observer` every 14.

This packet gives cadence its own column (§A.3). The values for observer and navigator are
unchanged, so nothing Coach stated moves — but the coincidence should not be load-bearing.

### E.2 Entitlement — **CLOSED (Coach, 2026-07-29)**

**Who can create retrospectives and sit on the cadence meter:**

| Population | Create retro | Cadence meter | Notes |
|------------|--------------|---------------|--------|
| **Observer trial** (`observer-trial` plan) | **Yes** | **Yes** (H=42, E2 grace) | **G1 primary.** Only advertised trial path into Navigator. |
| Free observer (no plan) | No | Empty (E1) | Previews only; no feature grading. |
| **Navigator** | Yes | Yes | **G2 primary** paid path. |
| **Activator** | Yes | Yes | **Legacy.** Self-directed traders; **not advertised**; few signups. Keep technical access; do not design G1/G2 marketing around this tier. |
| Alumni | TBD (likely read-only / rare) | Proposal H=60 if create allowed | Library, not active loop. |
| Administrator | Yes | Yes | Ops. |

**Agent analyze path:** may remain **Navigator + Activator (legacy) + admin** if cost is a concern; **derived dual report without agent** is enough for Observer trial to experience measure → review → adjust. **Coach may open agent to trial later** without changing create entitlement.

**Withdrawn:** pure “activator+ only” create gate that blocked Observer trial.  
**Product story:** G1 = Observer trial → Navigator. Activator is a quiet legacy self-serve tier, not a funnel step we promote.

---

## F. Decision-log entry (ready to land)

> **Retrospective cadence is process signal; inter-retrospective interval is unreviewed by
> design.** (1) Activity between a retrospective's `scope_end` and its `completed_at` falls
> into no retrospective window — deliberate, to avoid imposing machine precision on a fluid
> human process. No coverage indicator or completeness score is surfaced. (2) Retrospective
> cadence contributes to the process integrity meter: `retrospective` meter un-`soon`'d,
> computed as linear decay from the member's `retro_horizon_days` to twice that horizon,
> keyed strictly on `completed_at` so an open or abandoned retrospective earns nothing.
> Excluded (not zeroed) for members who cannot create retros and for members inside
> their first horizon. (3) Nudge/meter split — nudge invitational; meter is process signal.
> (4) `retro_horizon_days` own field (not grade_ramp_days). (5) **Observer trial may create
> retrospectives** (G1). **Activator is legacy** self-directed, not advertised; keeps
> technical access. Free observer without trial: no create. Agent may stay paid-tier only.
> No profit claims. Family B isolation unchanged.
