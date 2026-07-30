# RT07-6-G — Interruption + forward-only cadence (PASS)

**Date:** 2026-07-30  
**Verdict:** **PASS**

## Deliverable

### Backend
- `period_was_interrupted()` — **requires prior complete**; maiden never interrupted; span > cadence + 2 slack
- `build_interruption_notice()` — Spec §9 copy:
  - "Your cadence was interrupted — no review completed for the week of … This one covers **8–25 July**, three weeks instead of one."
  - Tone: `stated_not_scolded` (no failed/neglected/lazy)
- Stamp `report.interruption` at gather; top-level `interruption` on serialize
- `set_retro_cadence_days()` — updates `identities.retro_cadence_days` + appends `member_retro_cadence_history`
- Profile GET/PATCH `retro_cadence_days` (null clears to meter-profile default)

### Frontend
- Interruption notice **before** ceremony step nav
- Uses structured `interruption.notice` when present
- Footnote: cadence stamped; later setting changes do not rewrite past periods

### Forward-only invariant (R6-3)
Changing cadence after a retrospective exists:
- Does **not** rewrite `cadence_days_at_period` on that row
- Writes history row for the new value

### Tests
```
pytest tests/test_retrospectives.py -q  # 46 passed
test_interruption_notice_copy_stated_not_scolded
test_period_was_interrupted_requires_prior
test_cadence_change_forward_only_does_not_rewrite_past
test_rt24_interruption_ui_source
```

### Evidence claims
| Claim | Evidence |
|-------|----------|
| Missed period produces §9 notice naming span | `build_interruption_notice` + UI `retro-interruption-notice` |
| Maiden not interrupted | `period_was_interrupted` returns False with no prior |
| Cadence change does not rewrite past adherence stamp | `test_cadence_change_forward_only_does_not_rewrite_past` |
| Not remedial tone | ban list in unit test + UI source |
