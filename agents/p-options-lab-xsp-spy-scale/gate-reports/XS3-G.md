# XS3-G — SPY listed-snap policy

**Delta** · 2026-09-13 · plan v1.3 · OD-XS2 (a)

**PASS** — landed `8c5fd4f` (`test(options-lab): listed snap prefer-1 on dense $1 and sparse 20 grids`).

| Assert | Result |
|--------|--------|
| Dense $1 listed grid → snap 1 | PASS fixture |
| Sparse 20-grid → snap 20, never invent 1 | PASS AT-XS11 |
| Live SPY Create honest listed (prefer=1) | PASS `02-spy-listed-honesty.png` (744/764/784 when 1 unlisted) |
| Member copy: nearest listed wing, not “best” | PASS Tango phrase |
| Denser fetch / `fetch_step_floor` | **Not** implemented (NX2) |

Evidence: `gate-reports/xs4/helper-unit-tests.txt` (`listedWingChoices.test.ts`) · `02-spy-listed-honesty.png`.
