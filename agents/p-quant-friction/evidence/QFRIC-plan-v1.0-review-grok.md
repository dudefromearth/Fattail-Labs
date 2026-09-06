# Quant Lab Fill-Friction Bench Plan v1.0 — Review

**Date:** 2026-09-06
**Reviewer:** Grok (plan review against ATRV v0.10 §3.7.1, DL-678, QLAB v0.3, as-built DL-677)
**Artifact:** [`docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md`](./Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md)
**Plan commit (land):** `6490fa8`
**Token:** [`agents/go/QFRIC-W0.md`](../agents/go/QFRIC-W0.md) — **NOT STAMPED**
**Board:** `agents/p-quant-friction/`
**Status:** Review for Coach / Juliet — **not BUILD AUTHORITY, not a gate stamp**
**Verdict:** **RETURN** — do not stamp plan v1.0 Accept or §3.7.1 BUILD AUTHORITY until defects 1–7 are patched (plan v1.1 or labelled errata on the token)

Coach Content Law (doctrine §11 · DL-176): nothing of Coach's direction is dropped here. Objections sit beside the plan, labelled. Blocks below are **sequencing**, not edits to ATRV §3.7.1.

---

## Hashes (this pass)

| File | sha1 |
|---|---|
| `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` | `9e148f787d87b8eda6435f4b0ea3014814380a3f` — **matches** plan Law table and `QFRIC-W0.md` |
| `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md` | `fc3e7c92082bcabf47e0c75fb2055f0756bf6dde` |
| `Specs/FatTail-Labs-Quant-Lab-Topology-Spec-v0_3.md` | `04eba9ddd05edcf23db0dfd874e10705d34288fa` |

Evidence the design rests on is on disk: `docs/evidence/quant-spread-probe-XSP-2026-09-04.{txt,json}` — header `session snapshots 6449 / T=20472`.

---

## Executive verdict

| Seat | Verdict |
|---|---|
| **India — build readiness** | **RETURN.** The plan is a real bench plan (isolation, fail-closed, P4 gated off history, no product code before stamp). Three sequencing defects would make P1-G or P2-G fail against the plan's own rules, or would 422 the DL-677 entry sweep. |
| **Hotel — trading claims** | Fill law (complex order, window, null-bid, never better than the limit, unfitted = window probability) matches §3.7.1 and is pessimistic in the right shape. **Do not stamp** while F11 still requires AT-16's eight independent crossings on a net-limit fill. |
| **Juliet — plan craft** | B1 / B2 / B4 are the right blocks. W0-3 already asks the unfitted `p_miss_marketable` question. P2-1's `CELL_CEILING × entry pooling` is new law and product-breaking. |

The fill law itself is ready. The **plan's gates and P2 seed** are not.

---

## Confirmed (do not reopen)

| Claim | Check |
|---|---|
| ATRV v0.10 sha1 | Matches plan and token |
| §3.7.1 is DESIGN, not built | Spec header; DL-678: nothing in `server/quant/` changes under that entry |
| Token not stamped | `QFRIC-W0.md` Status **NOT STAMPED**; DL-328: chat *"looks great"* authorised drafting the plan, not building |
| B1: `AGENTS.md` names only LIM | Active-program line is Heatmap LIM (DL-651 · DL-652 · LIM7). Quant Lab was seated by DL-674; the line is stale |
| Spread probe numbers | Plan's rounded 14% / 35% / 69% and p50 $0.005 / p90 $0.010 match the evidence table (14.3 / 34.7 / 69.2; hs p50 0.005) |
| 31 quant tests | 7 API + 13 simulate + 11 store |
| `legged` as contrast, never default | ATRV §3.7.1 |
| Unfitted 0.85 is P(fill within window), not per snapshot | ATRV §3.7.1; 0.85 per snapshot over K=15 is near-certain |
| History never in the repo | OD-ATRV-13; plan B4; fail-closed §10 |
| W-G does not wait on P4 | Plan §0 / §5 |
| As-built sweep is **one cell**, not a study | `sweep_entries` docstring: *"Not a study (QLAB §4.5 registers those). A grid cell's worth of it."* |
| Paths bound already exists | `routes/quant.py`: `n_entries * ppe > MAX_PATHS * 10` → `TOO_LARGE` |

---

## Defects (fix before W0-0)

Defect = the plan contradicts itself, the spec, or the as-built tree. Cite is plan section unless noted.

### D1 — F5 vs F9: one env key cannot change meaning and keep `legged` byte-identical

**Where:** plan §1 F5, §2 (`Params.p_fill`), P1-G, F9.

F5: `LABS_QUANT_FILL_P_UNFITTED` **becomes** P(fill within the window).
F9 / P1-G: `legged` output **byte-identical** to DL-677 seed 7.
As-built `_fill` (`server/quant/simulate.py`) applies `p_fill` **per leg per side per snapshot**.

If the key's meaning changes globally, `legged` moves and P1-G fails. If `legged` still uses per-snapshot 0.85, F5 is false.

**Required fold:** explicit split. **complex** uses window hazard (F5). **legged** keeps the v0.9 per-snapshot constant, labelled as contrast, and is **not** "the" meaning of the env key. `.env.example` says both.

### D2 — P2 counts entry pooling against the 64-cell ceiling

**Where:** F10, P2-1, §9 "AT-QLAB-21 / §4.2".

QLAB §4.2 / OD-QLAB-8 is a **per-bot ceiling on pre-studied catalog cells**. ATRV §3.7.1 applies 64 to **friction-control** combinations (`limit` offsets × 5 crossed with `window_s` × 4 = 20). As-built `/sweep` is every entry minute (`step` default 30 snapshots) with the paths bound above.

P2-1: *"`/sweep` counts control cells × entry pooling against 64 → `CELL_CEILING` 422"* would 422 the DL-677 entry sweep (on the order of 167 minutes ≫ 64). That is **new law**, and it is product-breaking.

**Required fold:** cell count = **control-axis tuples only**. Entry pooling stays on `MAX_PATHS × 10`. Do not cite **AT-QLAB-21** here — that AT is the Lab Bot member-surface metric ban (QLAB §4.4), not the ceiling.

### D3 — P1-G "31 + new tests green" vs AT-36 supersession

**Where:** §2, §5 P1-G, P1-2, AT map (AT-ATRV-36 superseded on P1-G).

One of the 31 is `test_target_exit_leaves_at_first_touch_and_says_so` (`server/tests/test_quant_simulate.py`). That **is** AT-ATRV-36. P1-G also says AT-36 is superseded and AT-44 takes its place.

Those two sentences cannot both be true unless that test is rewritten.

**Required fold:** the 31 stay except the AT-36 test, which becomes AT-44; `legged` byte-identical; the nine classified non-quant fails stay classified.

### D4 — "1461 + new pass, the nine still classified"

**Where:** P1-G; W-G says only "full suite".

1461 already **includes** those 9 as failures (`36f1e3a` evidence packet). "1461 pass" and "nine still classified" cannot both be the pass criterion. W-G currently has no classified exception — Delta would FAIL a truthful run.

**Required fold:** **no new fail outside the classified nine; all quant ATs green.** Name the nine as classified, not as a suite that must go green.

### D5 — F11 keeps AT-16/18 unchanged under a net-limit fill

**Where:** F11 vs F1; ATRV AT-ATRV-16 vs §3.7.1 complex fill.

AT-ATRV-16: a four-contract fly round-trip is **eight crossings**, not a net figure. Complex mode fills **whole at the limit** — the debit *is* the net figure; there are no independent half-spread crossings.

F11 says AT-16/18 "stand." P1-G then requires both a fill at the limit and eight crossings. Alpha would have to invent a per-leg split of a net fill.

**Required fold (India / Sheldon at W0):** for `complex`, friction vs mid is `(limit − complex_mid)` plus per-contract fees. AT-16's eight-crossing arithmetic is the **`legged` contrast** (and the §3.7 illustrative table), not the complex path.

### D6 — Cadence fact is wrong, and AT-42 depends on it

**Where:** plan §2 *"Cadence ~2 s in session (20,472 snapshots/day)."*

Evidence header: **session snapshots 6449 / T=20472**. 20,472 is the full day, not session. 6449 over RTH is ~3.6 s mean, not 2 s. SSR-MEXP T0 2 s is the write cadence, not this store's session count.

AT-ATRV-42: `1 − (1−h)^K = p` for every `K` on the grid **at the day's cadence**. If K is computed from the wrong dt, the unfitted model is a different tax.

**Required fold:** K from **the snapshots actually in that window** on that day (local dt); report both `window_s` and `K`; never a global 2 s.

### D7 — AT-42 vs `regime_factor`

**Where:** F7 (`regime_factor` multiplier on the hazard); AT-ATRV-42.

AT-42 requires the integral to equal `LABS_QUANT_FILL_P_UNFITTED` for every K. That only holds at `regime_factor = 1.0`. If the factor multiplies unfitted `h`, P1-G breaks on any other grid point.

**Required fold:** AT-42 is at `regime_factor = 1.0`, or unfitted `h` is not scaled by the dial (dial applies only to fitted `P_fit`). Sheldon stamps which at W0-3.

---

## Disagreements (Coach may discard)

These are not blocks. Labelled as the reviewer's.

| # | Item |
|---|---|
| **O-R1** | **O1 grid endpoint** (`GET /api/me/quant/controls`) is the right serving seam. Constants in `quantApi.ts` will drift. Not law until Coach ticks it; the plan already treats it as a tick. |
| **O-R2** | **Do not bolt QLAB §4.5 hypothesis-before-query onto the member Monte Carlo page.** That law binds the **study runner**. The page is the DL-677 demonstration. A 64-cell cap on *control* sweeps is enough discipline there. |
| **O-R3** | **`abs` on a $0.01 grid plus P3 "no free numeric field"** has no control grammar. QLAB §4.2: 9+ values need a snap control with no in-between detent — 500 detents is not a control. W0-5 / W0-6 should tick a **declared abs chip set** (e.g. 0.30 / 0.50 / 1.00 matching the 10%-of-width examples) or admit one snap field whose only resting values are the $0.01 grid inside a named range. Spec left this hole; the plan should not pretend P3 can ship "no free field" on `abs` as written. |
| **O-R4** | Selling `marketable` is "mirrored" in F2 and never written. For a closing credit: `limit ≤ complex_natural`. One line in F2, not a new control. |
| **O-R5** | Tick size is not in `meta.json`. "Book's tick rule" is not in the store. Declare `$0.01` for this XSP book in `friction.py` data, labelled. Do not read a rule that does not exist. |

---

## Spec gaps the plan already defers (not plan bugs)

| Gap | Where the plan handles it |
|---|---|
| Unfitted `p_miss_marketable` unnamed in §3.7.1 | W0-3 question 2 |
| `n_orders` display vs researcher-only | W0-3 question 5; spec only labels `n_orders: 20` |
| OD-QLAB-8 still **STAMPED-PENDING** | Plan treats 64 as law because ATRV §3.7.1 does; Coach tick at W0-0 is enough for this board |
| `one_sided` scalar vs `one_sided_legs[]` | P1-1 shape; Sheldon defines the covariate at W0-3 |

Do not re-open OD-QLAB-1, OD-2, or P2 DRAFT here.

---

## Isolation / B1

Touch list is tight enough for a DL-539 argument: DL-677 quant files + `.env.example` + `validate_quant_env` + Monte Carlo page. No LIM, no OPF, no `store.py` / `build.py` / archive.

**B1 still has to land before P1's first edit.** `AGENTS.md` is explicit: only LIM; three successive OKs otherwise. A reassignment DL at P0 (Quant Lab active **alongside** LIM; LIM untouched) is cleaner than the three-OK log. Do not start P1 on a chat "looks great" (plan B2 / DL-328 — correct).

P2 ∥ P3 after P1-G with P3-G needing the real API is the right DAG. P4 after-or-before W-G is the right split.

---

## What to tick, and in what order

On `agents/go/QFRIC-W0.md` (already listed): OD-ATRV-12 / 13 / 14, O1, O6, B1 path.

**Also, before "plan v1.0 Accept":** Juliet patches D1–D7 into **plan v1.1** or a labelled errata on the token (same pattern as `docs/OPF-Generation-Plane-Bench-Plan-v1.1-Errata.md`). Stamping v1.0 with P2-1 still multiplying entry minutes into 64 will ship a 422 on the only sweep the member has.

Then Coach stamps W0-0: §3.7.1 BUILD AUTHORITY + plan Accept (v1.1 or v1.0+errata).

---

## Document control

| Version | Date | Notes |
|---|---|---|
| **v1.0** | 2026-09-06 | Grok. Against plan v1.0 (`6490fa8`) and ATRV v0.10 (`9a9cf1f`). RETURN. Seven defects, five labelled disagreements. Fill law ready; gates and P2 seed not. |
