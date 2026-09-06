# W-G — independent verification (second signature)

**Date:** 2026-09-06 · **Against:** `128b7ff` (plan v1.1 build, W-G PASS unfitted) · **By:** Juliet/Delta seat run from the linked-computer VM, not the builder's session
**Why this exists:** W0-1…7, P0-G…P3-G, W-G and the build landed in one commit by one actor. Coach authorised that (*"go all the way through unless there is a problem"*). Doctrine still wants a second pair of eyes on the evidence, so this is it. Verdict below is on the evidence, not the narrative.

## Verified true (commands run, output kept)

| Claim | Check | Result |
|---|---|---|
| 40 quant tests pass | `python3 -m pytest -q --noconftest -o pythonpath=. tests/test_quant_{friction,simulate,api,store}.py` (VM, Python 3.10) | **40 passed in 2.03 s** |
| `legged` byte-identical to pre-build (F9 / D1) | `simulate()` from `54824b1` vs `128b7ff` on the **real store**, XSP 2026-09-04, 762/767/772 put fly, seed 7, 400 paths, target +150%; `controls=None` and `order_type=legged` | sha256 of the response (minus labels) **`0daab9f3a56a97f2` all three**; `no_fill {entry 0.385, exit 0.362}` identical |
| K counted from the day, not a global dt (D6) | complex run, `window_s=30` | `K=8` (≈3.75 s cadence); `window_s=10` → `K=3` |
| Cell ceiling is control tuples only (D2) | `routes/quant.py:96–101, 314` | counts `controls_sweep` list; entry pooling untouched |
| `regime_factor` never scales unfitted `h` (D7) | `friction.py:170–171` | docstring + code |
| Tick declared as data (O-R5) | `friction.py:26` `TICK_BY_BOOK = {"XSP": 0.01}`; `tick_for` refuses undeclared books | ✓ |
| Null-bid abandonment at forced exit named (F3) | `simulate.py:253–273` | `abandoned[] {c, qty, at: 0.0, reason}` |
| No fitted parameter typed by hand; no history rows | grep `fit_id`, `load_fit` refuses without `fit_id`; no history file in tree | ✓ |
| Coach GO recorded on the token | `QFRIC-W0.md` W0-0 block | ticked with Coach's words; dispositions = plan defaults |

## Findings

**V-1 — Defect, factual (F1 as written and as built): a marketable order fills at its limit, not at the natural.** `simulate.py` complex path: `debit = ent.limit`. `_marketable()` exists in `friction.py:275` and is **never called**. On XSP 2026-09-04 at 10:00 the fly's mid is $0.37 and its natural ≈ $0.38; with Coach's `abs $0.50` chip the model charges **$0.50 on every path** — a real exchange fills a limit above the offer **at the offer**. This is not pessimism, it is a wrong price: the debit is overstated ~32%, and because the target exit is `+150% × debit`, the exit level moves too (bands went from ~$50 to ~$70 on the same trade purely from the fill-price rule). **Fold:** buy fills at `min(limit, natural_buy)`, sell at `max(limit, natural_sell)`; friction = fill − mid. "Never better than the limit" becomes "never better than the natural when marketable, never better than the limit when resting". One erratum line in ATRV v0.11 F1/§3.7.1, one line in `simulate.py`, one test. **Not fixed here — change control; declared for Coach's OK.**

**V-2 — Optimism by arithmetic (Hotel W0-4 q6): the defaults compound to a near-certain fill.** Unfitted `p = 0.85` is P(fill within one window); defaults `window 30 s · improve 1 · max_reseats 2` give three windows, so P(fill) = 1 − 0.15³ = **99.7%**. Measured: entry no-fill **0.5%** at defaults vs **13.75%** with `max_reseats 0`. Coach: *"sometimes it can take 10–30 seconds to fill"* and fills are missed. Options for Coach/Sheldon, either is one line: (a) `p` is P(fill over the order's whole life including re-seats) and the hazard is spread across all windows; (b) default `max_reseats = 0`. The build follows the plan as written; the plan under-specified this.

**V-3 — Gap the page should state: in the unfitted state, limit placement does not change fill probability.** With `_marketable` unused and the hazard flat, `offset −1` and `natural` fill at the same 85%/window. That is what "unfitted" means and it is labelled — but the chips imply a sensitivity that does not exist until P4. One sentence on the face (Tango). Also: `_marketable` is dead code and Kilo's matrix did not notice.

**V-4 — Process, for the record.** Seven review reports of 7–18 lines and six gate reports were produced by the same session that wrote the code, inside an hour. Authorised by Coach's direction; still the reason this file exists. Full characterization suite **not run** for this close (builder named it as a residual); only the 40 quant tests ran. Residuals stand as Grok named them: API restart, authenticated curl, browser walk.

## Verdict on the second signature

**PASS with named defect** — V-1 is a factual pricing error inside a labelled-unfitted model; it does not change the shape of what shipped (the law, the controls, the byte-identical contrast, the ceiling) but it must be fixed before any number from `complex` mode is shown to a member. V-2/V-3 are Coach dispositions, one line each. Until V-1 lands, `complex` output is **researcher-only** by this signature.
