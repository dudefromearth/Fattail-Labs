# P1-G Delta

**Verdict:** **PASS** · 2026-09-06

Evidence: `cd server && .venv/bin/python -m pytest -q tests/test_quant_friction.py tests/test_quant_simulate.py tests/test_quant_api.py tests/test_quant_store.py` → **40 passed**.

- AT-39 engine (off-grid, echo) · AT-40 at-limit · AT-42 hazard integral · AT-44 touched vs filled.
- AT-36 test rewritten.
- `legged` byte-identical to uncontrolled path (seed 7, fixture).
- O5 two shapes: `docs/evidence/quant-friction-rerun-2026-09-04.json` (400 paths, no verdict).
- No fill better than the limit. Unfitted hazard is not per-snapshot 0.85 on complex. Mark series untouched.
