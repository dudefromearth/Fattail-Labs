# Seed W0-7 — Kilo — test plan

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Kilo · **Phase:** W0 · **Feeds gate:** W0-G
**Read first:** `agents/bench/kilo.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Deliver a test plan (no test code in W0) covering
1. **Fixture extensions** to `server/tests/quant_fixture.py`: a body strike with null bid at the entry instant; a wing quoted one tick wide; a null-bid wing with a wide ask ($4.80 outlier); a strike admitted mid-window.
2. **AT-ATRV-40** whole-or-none: assert no path carries a subset of legs; assert `fill_price == limit` for every fill.
3. **AT-ATRV-41**: zero entry fills at the null-bid instant; forced exit names the abandoned leg at $0.
4. **AT-ATRV-42**: for every K derived from `window_s` grid at the fixture cadence, `1 − (1−h)^K == p` within 1e-9.
5. **AT-ATRV-44**: a target touched on the mid-mark and not filled reports `touched_at` and no `filled_at`.
6. **AT-ATRV-39**: engine + API matrices, every axis, every off-grid shape (`abs 0.505`, `offset +3`, `window 15`, `max_reseats 4`, `regime 0.9`).
7. **Regression**: `legged` output byte-identical to DL-677 for seed 7 on the fixture and on XSP 2026-09-04; AT-15…23, 29, 30 still green; 31 existing tests untouched.
8. **CELL_CEILING** at 65 cells; 64 passes.
9. **P4 synthetic history** fixture shape (never real rows) for AT-43.
10. Which of these run in the VM (`--noconftest -o pythonpath=.`) and which need the MacBook venv (conftest on). ▶ RUN ON labels on every command.

## Verdict
Plan in `agents/p-quant-friction/evidence/W0-7-kilo.md`; PASS / RETURN.
