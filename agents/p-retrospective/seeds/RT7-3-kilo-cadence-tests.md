# Seed RT7-3 — Kilo: Cadence verification (delta §D.2)

**Project:** p-retrospective  
**Primary:** Kilo  
**Reviewers:** Alpha  
**Phase:** R7  
**Prerequisite:** RT7-1  

## Cases

10–17 from `Retrospective-Cadence-Meter-Delta-for-v0.5.md` §D.2  

## Completion criteria

- [x] Cases 10–17 covered (characterization)  
- [x] pytest green ×2  
- [x] Alpha APPROVED  

## Feeds

→ RT7-G  

---

## Evidence (2026-07-29 — Kilo RT7-3)

### Suite

```
tests/test_journey_scores.py  23 passed  (run 1)
tests/test_journey_scores.py  23 passed  (run 2)
```

### Cases (§D.2)

| # | Case | Test | Result |
|---|------|------|--------|
| 10 | Formula H / 1.5H / 2H exact | `test_rt73_d2_10_formula_exact_boundaries` (+ RT7-1 boundaries) | PASS |
| 11 | Open `ready` does not hold meter | `test_rt71_open_retro_does_not_move_clock` | PASS |
| 12 | `abandoned` does not move pointer | `test_rt73_d2_12_abandoned_does_not_move_clock` | PASS |
| 13 | E2 grace empty excluded from average | `test_rt73_d2_13_e2_grace_empty_excluded_from_average` | PASS |
| 14 | Free observer empty, never scored 0 | `test_rt73_d2_14_free_observer_empty_not_zero` | PASS |
| 15 | Maiden complete live at 100; no day-one Poor | `test_rt73_d2_15_maiden_complete_live_at_100` | PASS |
| 16 | Nudge + horizon same profile field | `test_rt73_d2_16_nudge_and_horizon_same_field` | PASS |
| 17 | Copy sweep no shame language; N1 + Not now | `test_rt73_d2_17_copy_sweep_no_marked_down` | PASS |

### Fix during seed

`RetroCadenceNudge.tsx` file-header comment listed banned words as examples (“overdue”, “penalty”), which failed the whole-file copy sweep. Comment reworded to “Invitational only — no shame framing (Tango N1).” No user-visible string change.

### Alpha: **APPROVED**

§D.2 10–17 characterization complete; formula/clock/empty/nudge/copy covered; no production logic change beyond comment hygiene for the sweep.
