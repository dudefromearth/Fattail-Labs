# PPL1-0 — Lock the as-built lies

**Project:** Practice Position Lifecycle  
**Agent:** Kilo  
**Depends:** PPL0-G  
**Feeds:** PPL1-G

## Intent

Add characterization tests **AT-PPL-2…9** (and AT-PPL-1 Keep) that **pass on current main** and **fail if the lie is gone**. No product behavior change.

See [`characterization-list.md`](../characterization-list.md).

## Files in scope

- `server/tests/test_trade_log_domain.py` (extend; do not weaken `test_partial_close_leaves_remaining_units_open`)
- `server/tests/test_trade_log.py` and/or new `test_practice_position_lifecycle.py` for GET `/opens`, POST, DELETE
- `server/tests/test_capital_positions.py` if needed for AT-PPL-3

## Out of scope

`matching.py` FIFO. Client product files. Migrations. LIM/QFRIC/XS/`AnalyzerPositionsList.tsx`.

## Invariants

PPL-1 Keep. Evidence over assertion. Tests must fail if someone “fixes” the lie in this PR.

## Done when

AT-PPL-1…9 exist and pass on HEAD behavior. PPL1-G can cite pytest output.
