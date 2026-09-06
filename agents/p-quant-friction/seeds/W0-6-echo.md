# Seed W0-6 — Echo — grid controls chrome

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Echo · **Phase:** W0 · **Feeds gate:** W0-G
**Read first:** `agents/bench/echo.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Deliver
1. Chrome for six gridded controls on `MonteCarloLab.tsx` — segmented controls, not inputs; default marked; grid values visible at rest; disabled states named (e.g. `regime_factor` when the store has no VIX column — still a control, still declared).
2. The assumptions strip: `fill_model`, `fit_id`, window in seconds **and** snapshots, re-seat count, abandoned legs — on the face, not behind a tooltip.
3. `legged` behind a "contrast" affordance per Hotel/Tango.
4. Consistent with the DL-677 page (inline SVG, no chart lib, no headline number).
5. A sketch is enough; no code in W0.

## Verdict
Sketch + notes in `agents/p-quant-friction/evidence/W0-6-echo.md`; PASS / RETURN.
