# P2-G Delta

**Verdict:** **PASS** (characterization) · 2026-09-06

- `GET /api/me/quant/controls` serves grids (O1).
- Off-grid `window_s: 15` → 422 `CONTROL_OFF_GRID`.
- `controls_sweep` of 65 tuples → 422 `CELL_CEILING`.
- Entry sweep with one control tuple still 200 (D2).
- `LABS_QUANT_FILL_FIT_PATH` validated if set.

Real-server curl of the **new** process is owed on API restart (boot-once). Unauthenticated `/api/me/quant/days` was 401 on the prior process.
