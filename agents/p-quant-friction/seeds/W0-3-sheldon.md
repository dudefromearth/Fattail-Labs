# Seed W0-3 — Sheldon — fill law, unfitted hazard, fit method

**Project:** Quant Lab Fill-Friction (QFRIC) · **Agent:** Sheldon · **Phase:** W0 · **Feeds gate:** W0-G
**Read first:** `agents/bench/sheldon.md` · `agents/bench/doctrine.md` · `agents/bench/first-principles-doctrine.md`
**Law:** `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` §3.7.1 (DRAFT) · `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md` · `agents/go/QFRIC-W0.md`
**Evidence to read, not redo:** `docs/evidence/quant-spread-probe-XSP-2026-09-04.txt` · `docs/evidence/quant-e2e-2026-09-06.md`
**Invariants in force:** §2 sacred invariants (INSTRUCTIONS.md) · evidence over assertion · change control · **no product code in this phase**
**Out of scope:** any file under `server/` or `web/` · the store · the archive · the mark series · fill history (never in the repo)

## Review questions
1. **F4 shape.** Is a monotone logistic in `edge_ticks` with a one-sidedness term the right first family for `P_fit`? If not, name the family and why; the plan does not care which, it cares that it is monotone, fitted, and reproducible.
2. **F5.** Confirm `h = 1 − (1−p)^(1/K)` is the correct constant hazard for "P(fill within the window) = p" and that it is the honest unfitted meaning. State whether `p_miss_marketable` should share the unfitted constant or take its own (recommend).
3. **OD-ATRV-12.** Stamp: keep vendor `ask/2` labelled, or withhold. Cite the probe: ask ≤ $0.02 at p99 where bid is null; one outlier at $4.80.
4. **OD-ATRV-14.** Stamp the declared regime factor grid, or propose the realised-vol proxy the store can compute today.
5. **Admissibility.** State the `n_orders` (and date-range) threshold below which a fitted curve is **researcher-only** (absent from `display_legal[]`) and above which it may drive the member page. This line goes into P4's seed verbatim.
6. **Provenance.** Define `fit_id` precisely: which bytes are hashed (history file, every store `meta.json` joined, script version) so AT-ATRV-43's byte-reproducibility is testable.
7. Anything in §3.7.1 that would let a small fit be read as a law?

## Verdict
PASS / RETURN in `agents/p-quant-friction/evidence/W0-3-sheldon.md`; stamps on the token.
