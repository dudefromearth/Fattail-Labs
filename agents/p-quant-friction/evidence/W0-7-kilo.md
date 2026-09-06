# W0-7 Kilo — test plan

**Verdict:** PASS · 2026-09-06

Fixture extensions: null-bid body at entry; one-tick wing; wide-ask null-bid outlier ($4.80 class).

| AT | Assert |
|---|---|
| 39 | every axis off-grid → `CONTROL_OFF_GRID`; on-grid echoed |
| 40 | whole at limit or not at all; fill price == limit |
| 41 | null-bid body → zero entry fills that instant; forced-exit abandonment named |
| 42 | `1-(1-h)^K = p` within 1e-9 for every window on the fixture, K from fixture snapshots, every `regime_factor` (unfitted h unscaled) |
| 44 | replaces `test_target_exit_leaves_at_first_touch_and_says_so`; touched vs filled |
| 16/18 complex | tax = (limit−mid)+fees per order side |
| F9 | `legged` byte-identical vs current `_fill` for seed 7 |
| D2 | 65 control tuples → CELL_CEILING; 167-entry sweep with 1 tuple still 200 |

No product code in this seed.
