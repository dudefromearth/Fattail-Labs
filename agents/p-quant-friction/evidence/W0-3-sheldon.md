# W0-3 Sheldon — fill law, unfitted hazard, fit

**Verdict:** PASS · 2026-09-06

1. **F4 family.** Monotone logistic in `edge_ticks` with a one-sidedness term is an admissible first family. Not fitted this GO (OD-13 Not yet).
2. **F5 / unfitted `p_miss_marketable`.** `h = 1 − (1−p)^(1/K)` is the constant hazard for P(fill within window)=p. **Unfitted `1 − p_miss_marketable = h`** — same per-snapshot hazard, so marketable and resting share one unfitted constant. Distinct `p_miss` waits on the fit.
3. **OD-12.** Keep vendor `ask/2`, label `mark_basis`, count null-bid legs. Probe: ask ≤ $0.02 at p99 where bid is null.
4. **OD-14.** Declared {0.5, 0.75, 1.0} on **fitted** `P_fit` only (D7). Unfitted hazard never scaled.
5. **Admissibility.** `n_orders < 12`: researcher-only, absent from `display_legal[]`. `12 ≤ n < 20`: first curve, labelled in `fit_id`, researcher-only on the member page. `n ≥ 20`: may drive the member page. This GO: no fit.
6. **Provenance.** `fit_id` = sha256(history bytes ‖ each joined `meta.json` sha256 ‖ script version). AT-43 when P4 fires.

No product code in this seed.
