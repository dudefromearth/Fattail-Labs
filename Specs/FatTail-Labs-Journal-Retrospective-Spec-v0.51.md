# FatTail Labs — Journal Retrospective Spec v0.51

**Status:** **COACH AMENDMENT** — 2026-07-29 · lands on top of build-authority **v0.5**  
**Type:** Policy amendment (cadence teaching rhythms + signal-not-enforcement framing)  
**As-built product truth:** also reflected in **v0.6** (RT8) after this amendment is applied to code  
**Does not reopen:** Option C, MIN_INFERENCE_N=20, §10.1 create formula, §19 copy bans, §20 marketing  

---

## Amendment Summary

This version lands three decisions from Coach (2026-07-29):

1. **Retrospectives are immutable process, not gated features.** Observer trial gets full access. They're learning the process end-to-end.
2. **Cadence horizons are teaching rhythms, not hard rules.** Observer trial taught weekly (zero-DTE funnel). Navigators own the rhythm and adjust as their strategy requires.
3. **The meter is signal, not enforcement.** It reflects whether a member is closing loops at the taught cadence for their tier. Integrity is contextual — other meters provide the full picture.

---

## 4.1 — Scope boundary (decision)

```
scope_start = last_complete.completed_at    # half-open: strictly after
scope_end   = now (at gather)
```

Activity between `scope_end` and `completed_at` falls into no retrospective window. Deliberate — a member may legitimately trade while writing up the prior period. No coverage indicator, no unreviewed-activity badge. Lag surfaces through the cadence meter only.

---

## 7.5 — Cadence: teaching signal and nudge

Two distinct mechanisms.

### The nudge (never punitive)

When days-since-last-complete exceeds the profile horizon, the system may suggest starting a retrospective. Invitational copy only. No badge decay, no shame framing, no repetition beyond a persistent, dismissible surface.

### The meter (process signal)

Retrospective cadence contributes to the process integrity meter. It measures whether the member is closing loops at the *taught rhythm* for their tier:

- **Observer trial:** weekly (zero-DTE day-trading process)
- **Navigator monthly:** 30-day rhythm
- **Navigator annual:** 90-day rhythm (seasonal)

**Critical:** The meter is signal, not enforcement. A Navigator on a five-DTE strategy who does quarterly retros while maintaining strong routine, journaling, and live presence is not marked down by cadence alone. Integrity is contextual. The cadence meter is one of six meters in the grade; it cannot determine the outcome by itself.

Members own the rhythm once they convert. The taught cadence is what they learn first; they adjust as their strategy and life require.

---

## 7.5a — Meter definition (Journey integration)

```
H = profile.retro_horizon_days
d = days since last COMPLETED retrospective

d ≤ H        →  raw = 100
H < d < 2H   →  raw = round(100 × (2H − d) / H)
d ≥ 2H       →  raw = 0
```

Linear decay. Only `completed_at` moves the clock. Open, abandoned, or draft retrospectives earn nothing.

**Empty rules** (meter excluded from `overall_raw_percent`):

- No completed retrospective AND `d ≤ H` (one full horizon of grace)
- `practice_epoch` unresolvable

After the grace period lapses, meter goes live on the decay curve.

---

## Meter profiles — new field

| Profile id | Persistence horizon | grade_ramp_days | **retro_horizon_days** |
|------------|--------------------|-----------------|------------------------|
| `observer_trial` | 6 weeks | 42 | **7** |
| `navigator_monthly` | 12 weeks | 30 | **30** |
| `navigator_annual` | 26 weeks | 90 | **90** |
| `activator` | 12 weeks | 30 | **30** |
| `alumni` | 12 weeks | 21 | **90** |
| `free_observer` | 4 weeks | 14 | **n/a** |
| `administrator` | 12 weeks | 30 | **30** |

`retro_horizon_days` is a separate field. Never reuse `grade_ramp_days`.

**Note:** `grade_ramp_days` for Observer trial remains **42** (tenure / integrity extremes).  
Only the **cadence teaching horizon** is weekly (**7**).

---

## Entitlement

Retrospectives are available to all active members: Observer trial, Navigator, Activator. They are part of the taught process, not a tier unlock.

**Open:** `free_observer` — the post-trial non-convert on diminished access. Whether they retain the retrospective, and therefore whether the cadence meter applies to them at all, is not settled here. `retro_horizon_days` is `n/a` pending that decision.

*(As-built create gate remains Mike §10.1: admin OR activator+ OR active plan `observer-trial`. Free no-plan: no create / E1 empty.)*

---

## Implementation (R7 + v0.51 alignment)

- Add `retro_horizon_days` to meter profiles  
- Compute cadence meter per §7.5a definition  
- Update Journey §4.1a / §4.4: trial **H=7**, alumni **H=90**  
- Mark `retrospective` meter live (no longer `soon`)  
- Nudge copy stays invitational; no enforcement or shame language  
- Verification: cadence meter is one of six; at maximum it moves overall grade by ~17%; it cannot alone determine a band  

---

## Decision-log entry

Retrospective cadence is a process signal, not enforcement. Teaching rhythms: Observer trial weekly (zero-DTE process); Navigator monthly 30-day; Navigator annual 90-day. Members own the rhythm once they convert and adjust as strategy and life require. Meter reflects taught cadence; integrity is contextual — other meters (routine, journaling, live, learning) provide the full picture. Cadence meter cannot alone determine grade band. Nudge stays invitational, never remedial. No profit claims. Family B unchanged.

---

## Advisor gates

Companion packet: [`Advisor-Gates-Retrospective-v0.51.md`](./Advisor-Gates-Retrospective-v0.51.md)  
All six gates **CLEARED** (W0 RT0-2…RT0-G + build through RT8-G). Deferred items remain open.
