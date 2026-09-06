# Quant Lab — Fill-Friction Model (ATRV v0.10 §3.7.1) — Full Agent Bench Plan v1.1

**Date:** 2026-09-06
**Plan revision:** **v1.1** — Grok review applied (`agents/p-quant-friction/evidence/QFRIC-plan-v1.0-review-grok.md`,
RETURN, seven defects, five disagreements). **No new law.** Every rule below restates ATRV v0.10 §3.7.1,
QLAB v0.3 §4.2/§4.5, or doctrine; where it seems to add one, that is a bug in this plan.
**Supersedes:** v1.0 (2026-09-06, `6490fa8`) — structure preserved; seven defects and three disagreements folded.
**Canonical filename:** `docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md`
**Owner (orchestration):** Juliet
**Authority:** Coach (GO SPEC / ship)
**W0 artifact:** `agents/go/QFRIC-W0.md` — **not stamped**
**Board:** `agents/p-quant-friction/`
**Governance:** `agents/bench/doctrine.md` · `AGENTS.md` · `agents/bench/spec-create-review-workflow.md`

---

## Changes from v1.0 — for the validator

Each was verified against the tree before it was folded; none was taken on the reviewer's word.

| # | Change | Why (verified) |
|---|---|---|
| **D1** | **F5 split.** `complex` uses the window hazard; **`legged` keeps the v0.9 per-snapshot constant** as a labelled contrast. The env key's *complex* meaning is P(fill within window); `.env.example` states both | As-built `_fill` applies `p_fill` per leg per side per snapshot (`simulate.py:96–128`). One key with one new meaning would move `legged` and fail P1-G's own byte-identical rule |
| **D2** | **Cell count = control-axis tuples only.** Entry pooling stays on `MAX_PATHS × 10`. **AT-QLAB-21 citation removed** from §9 | P2-1 v1.0 multiplied entry minutes into 64 — the DL-677 sweep is 167 entries and would 422. AT-QLAB-21 is the member-surface metric ban (QLAB §4.4), not the ceiling |
| **D3** | P1-G: **30 of the 31 stay; `test_target_exit_leaves_at_first_touch_and_says_so` is rewritten as AT-44** | That test (`test_quant_simulate.py:120`) *is* AT-ATRV-36, which P1-G supersedes; "31 green" and "36 superseded" could not both hold |
| **D4** | Suite criterion restated: **no new failure outside the classified nine; every quant AT green** | v1.0's "1461 + new pass, nine classified" was muddled (1,461 is the pass count; the nine are failures beside it). W-G had no classified exception and would have failed a truthful run |
| **D5** | **Complex-mode tax is `(limit − complex_mid)` + per-contract fees, per order side.** AT-16's eight-crossing arithmetic is the `legged` contrast. Recorded as an ATRV erratum for v0.11 (W-G); India/Sheldon confirm at W0 | A net-limit fill has no independent half-spread crossings; F11 "AT-16 stands" would have forced Alpha to invent a per-leg split |
| **D6** | **Cadence fact corrected:** 6,449 session snapshots on 2026-09-04 ≈ 3.6 s mean, not 2 s. **K = snapshots actually inside the window on that day**, both reported; never a global dt | Evidence header `session snapshots 6449 / T=20472`; 20,472 is the whole capture from 04:00 UTC. AT-42 at the wrong dt is a different tax |
| **D7** | **`regime_factor` scales fitted `P_fit` only; the unfitted hazard is never scaled.** AT-42 holds at every grid point | Otherwise `1−(1−h)^K = p` holds only at 1.0 and P1-G breaks on 0.5 / 0.75. Sheldon may re-stamp at W0-3 |
| **O-R3** | `limit.abs` gets a **declared chip set** for the page — Coach's width examples: **$0.30 · $0.50 · $1.00** — and the API keeps the $0.01 grid inside a named range (`$0.05 … $5.00`). W0-5/W0-6 tick the chips | "$0.01 grid" and "no free field" had no control grammar; 500 detents is not a control |
| **O-R4** | F2 gains the selling side: closing credit is marketable when **`limit ≤ complex_natural` (selling)** | Was "mirrored" and never written |
| **O-R5** | **Tick is declared data in `friction.py`** (`$0.01` for this XSP book), labelled; the store carries no tick rule | `meta.json` has quote scale, no tick; "the book's tick rule" does not exist to be read |

**Not changed:** DAG · isolation §4 · seating §12 · every locked law in §3.7.1 · B1–B5 · P4 gated off history · W-G not waiting on P4. O-R1 (grid endpoint) and O-R2 (§4.5 stays on the runner) agree with the plan as written.

---

**Law Delta reads:**

| Doc | Path | Status |
|---|---|---|
| **ATRV v0.10** | `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md` | **DRAFT.** v0.9 as built + **§3.7.1 design only.** sha1 at land `9e148f787d87b8eda6435f4b0ea3014814380a3f` (`9a9cf1f`). **Not BUILD AUTHORITY until Coach stamps `QFRIC-W0.md`.** |
| ATRV v0.9 | `Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_9.md` | The system as built on 2026-09-06 (DL-677). §3.7.0 is the placeholder this program replaces. |
| QLAB v0.3 | `Specs/FatTail-Labs-Quant-Lab-Topology-Spec-v0_3.md` | §4.2 no off-grid control, **64-cell ceiling** (OD-QLAB-8 stamped-pending) · §4.5 controls bind the **runner** · §5.1 order-free operators. |
| Evidence — spread probe | `docs/evidence/quant-spread-probe-XSP-2026-09-04.{txt,json}` | The measurement §3.7.1 rests on. Do not re-measure to start; re-run to confirm on any new day. |
| Evidence — built slice | `docs/evidence/quant-e2e-2026-09-06.md` · `quant-e2e-transcript.txt` · `quant-delta-*.txt` | DL-677 Delta packet (§7: suite 1461/9/5, nine classified). |
| Decisions | `Architecture/00-decision-log.md` | **DL-674** (Quant Lab seated) · **DL-677** (slice built) · **DL-678** (§3.7.1 drafted, controls directed). |
| Fill history | **Not in the tree, by design.** Coach's trading record (OD-ATRV-13). | Delivered to Sheldon out of band; **never committed**. |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.
**No product code until Coach stamps `QFRIC-W0.md` as BUILD AUTHORITY and W0-G PASS.**

Coach Content Law (doctrine §11 · DL-176): nothing of Coach's direction is dropped. Objections
sit beside the text, labelled. Blocks below are **sequencing**, not edits to §3.7.1.

---

## 0. Mission

Replace the placeholder fill model (flat `p_fill`, fills inside a half-spread that does not
exist, three independent legs) with **the order Coach actually sends**: a complex order at a
net limit, resting in the archived path, filled whole at its limit or not at all, subject to a
fill law whose **mechanics are declared and whose probabilities are fitted**. Put the six
controls on the page, each on its grid. Keep every DL-677 invariant: distribution not scalar,
no untaxed fill, no mean, byte-identical at any core count.

```text
BEFORE (DL-677 placeholder)                 AFTER (this board)
3 legs, each: p=0.85, mid ± U[.5,1]·hs      1 complex order @ net limit, window K snaps,
one snapshot, independent                   hazard h_k (unfitted: window-constant;
                                            fitted: P_fit(edge_ticks, one_sided, regime))
target exit = first mid touch               target exit = resting closing order, same law
null bid ignored                            sell leg into null bid never fills; abandoned @ $0
no controls                                 6 controls on declared grids, echoed, off-grid refused
```

**The build does not wait on the fill history; the fit does.** W-G may close in the unfitted
state and must say so on the token. A fitted curve is P4's exit, not W-G's.

```text
W0     Coach GO SPEC · Lima · India · Sheldon · Hotel · Tango · Echo · Kilo → W0-G
P0     Lima: DL stamp entry · AGENTS.md active-program line · ADMIN-GUIDE stub → P0-G
P1     Alpha: engine — friction.py, complex order, window, re-seat, null-bid law,
       unfitted hazard, resting target exit; Kilo AT-39/40/41/42/44 → P1-G
P2     Alpha: API — controls{} parse, CONTROL_OFF_GRID, assumptions.controls,
       grid endpoint, sweep cell ceiling → P2-G          ┐ parallel after P1-G
P3     Charlie · Echo · Tango: page controls on grids   ┘ → P3-G
P4     Sheldon · Kilo: the fit — gated on OD-ATRV-13 history → P4-G (may land after W-G)
W-G    Delta — AT-ATRV-39…44 (43 only if P4 landed), 15–22 regression, full suite
```

---

## 1. Locked (spec — not forks)

| ID | Law (ATRV v0.10 §3.7.1 unless noted) |
|---|---|
| **F1** | The unit is the **complex order**: legs, quantities, net limit, resting window, re-seat policy. Fills **whole at the limit or not at all**. **Never better than the limit.** |
| **F2** | Per snapshot in the window: `complex_natural`, `complex_mid` (vendor mid, OD-ATRV-12), `edge_ticks = (limit − complex_mid)/tick`, `marketable = limit ≥ complex_natural` when **buying** (opening debit) and **`limit ≤ complex_natural` when selling** (closing credit). **Tick is declared data in `friction.py` per book ($0.01 for this XSP book), labelled — the store carries no tick rule (O-R5).** |
| **F3** | **Null-bid law.** A sell leg whose bid is null → `complex_natural` undefined that snapshot → the order cannot fill. At a forced exit the long leg is **abandoned at $0** and named in `assumptions.abandoned_legs[]`. Not a control. |
| **F4** | Fill law: marketable → fills at limit with `1 − p_miss_marketable`; else hazard `h_k = P_fit(edge_ticks, one_sided, regime)`, monotone in `edge_ticks`. Window expiry → re-seat (`improve_ticks`, up to `max_reseats`) → cancel → `no_fill.entry`, path does not trade (AT-ATRV-17). |
| **F5** | **Unfitted state, `complex` mode:** `LABS_QUANT_FILL_P_UNFITTED` is **P(fill within the window)**, spread as constant hazard `h = 1 − (1−p)^(1/K)` where **K = the snapshots actually inside the window on that day** (both reported; no global dt — 2026-09-04 has 6,449 session snapshots ≈ 3.6 s mean). **`legged` keeps the v0.9 per-snapshot use of the same constant**, as the labelled contrast (D1). Response: `fill_model: unfitted_pessimistic`, `fit_id: null`. **0.85 per snapshot in `complex` is a defect.** The unfitted hazard is **never scaled by `regime_factor`** (D7). |
| **F6** | `exit_kind = target` = **resting closing order** from the fill instant at `(1 + pct/100) × debit`, same law. A touch that did not fill is reported (`exit.touched_at`, `exit.filled_at`), never treated as an exit. `exit_kind = time` = marketable closing order at `t_exit`, same window/re-seat, then cross to natural with F3. |
| **F7** | **Six controls, each on a declared grid, echoed verbatim in `assumptions.controls{}`; off-grid → `CONTROL_OFF_GRID`, never rounded or clamped.** `order_type ∈ {complex, legged}` · `limit ∈ {abs on the $0.01 grid within $0.05…$5.00} ∪ {offset ticks −1, 0, +1, +2, natural}` — **the page offers `abs` as a declared chip set $0.30 · $0.50 · $1.00 (Coach's width examples), the API accepts the full grid (O-R3)** · `window_s ∈ {10, 20, 30, 60}` · `reseat = improve_ticks ∈ {0,1} × max_reseats ∈ {0..3}` · `regime_factor ∈ {0.5, 0.75, 1.0}` — **multiplies fitted `P_fit` only (D7)** · fees = config. Defaults: complex · offset +1 · 30 · (1, 2) · 1.0. |
| **F8** | `P_fit` and `p_miss_marketable` are **not controls**. Fitted by Sheldon from Coach's fill history joined to the store (OD-ATRV-13); carried by `fit_id`, `n_orders`, date range; **byte-reproducible** from history + store. Un-joinable rows are refused, not imputed. |
| **F9** | `legged` mode is kept **as a contrast only**, labelled, never the default. |
| **F10** | QLAB §4.2: a sweep over controls counts **control-axis tuples** against the **64-cell ceiling**; **entry pooling is not a cell** and stays on the existing `MAX_PATHS × 10` bound (D2). §4.5: controls bind the **runner**. A sweep beyond the ceiling is refused, not truncated. |
| **F11** | Every DL-677 invariant stands: distribution not scalar (AT-19), seeded + byte-identical (AT-20/23), `stability` not SE (AT-21), `no_fill_rate` entry/exit (AT-22), no untaxed fill (AT-15), `display_legal[]` (AT-30), `fidelity` (AT-29). **Tax (AT-16/18) in `complex` mode is `(limit − complex_mid)` + per-contract fees, reported per order side (entry, exit), split friction vs fees — a net-limit fill has no independent crossings; the eight-crossing arithmetic is the `legged` contrast (D5). ATRV erratum recorded at W-G (v0.11).** |
| **OD-ATRV-12** | Null-bid mark basis — **keep vendor `ask/2`**, label it; **the mark series does not change under this board**. Sheldon stamps. |
| **OD-ATRV-13** | Fill history — source, schema (§3.7.1), custody. **Coach.** Never in the repo. |
| **OD-ATRV-14** | Regime dial — declared control until a VIX column exists (era-2). Sheldon · Foxtrot. |

**Measured (spread probe, do not re-measure to start):** OTM puts 2–10 from spot, half-spread
p50 **$0.005**, p90 $0.010; bid null **14% / 35% / 69%** at 2–5 / 5–10 / 10–20 OTM; where bid is
null, ask ≤ $0.02 at p99; ITM half-spread p50 $0.27. XSP 2026-09-04, 6,449 session snapshots.

---

## 2. As-built honesty (DL-677 — keep)

| Fact | Consequence for this board |
|---|---|
| `simulate.py` fills three legs independently, one snapshot, `mid ± U[.5,1]·half-spread` | P1 replaces the fill path; **`legged` survives as a labelled contrast** (F9). |
| `resolve_exit` finds the first mid-mark touch of the target | P1 turns it into a resting order (F6). AT-ATRV-36's touch semantics are **superseded on P1-G**; Lima records it (v0.11). |
| `Params.p_fill` is applied **per leg per side per snapshot** | F5: in `complex` it is P(fill within window); **`legged` keeps the per-snapshot use** so the contrast stays byte-identical. `.env.example` states both meanings (D1). |
| `sweep_entries` pools entries with its own MC per entry; `MAX_PATHS × 10` bound | Sweep gains a **cell count** for control axes (F10). The paths bound stays. |
| Store has no `bid_size`/`ask_size` (era-1) | Fidelity stays `era1_no_depth`. The law uses spread, one-sidedness, edge — all present. Depth is era-2. |
| Store has no VIX column | `regime_factor` is declared, not fitted (OD-ATRV-14). |
| 2026-09-04: **6,449 session snapshots** (≈ 3.6 s mean) inside a 20,472-snapshot capture from 04:00 UTC; cadence is uneven | `window_s` → `K` = **snapshots actually inside that window on that day**, both reported. K is not a constant and not `window_s / 2` (D6). |
| Vendor mid on null-bid = `ask/2`, immaterial on 2026-09-04 | Mark series unchanged (OD-ATRV-12). Any change is a **separate** declaration. |
| 31 quant tests; full suite 1,461 pass / 9 classified non-quant fails | Every gate: **30 of the 31 unchanged + the AT-36 test rewritten as AT-44 + new ATs, all green; no new failure outside the classified nine** (D3, D4). The nine stay classified, not fixed here. |
| `AGENTS.md` §active-program still names **Heatmap LIM** only | **B1.** Quant Lab was seated by DL-674; the line is stale. Lima resolves at P0 (reassignment DL) or the three-OK log on the token fills before P1 fires. |

---

## 3. Juliet review (labelled)

### Blocking for *sequencing*

| # | Item |
|---|---|
| **B1** | `AGENTS.md` names Heatmap LIM as the only active program. DL-674 seated Quant Lab; DL-677 built it. **P0 lands a reassignment DL naming Quant Lab active alongside LIM, or the DL-539 three-OK log on `QFRIC-W0.md` fills before P1's first edit.** This board touches only files created under DL-677 plus `.env.example`, `config.py` (quant's own validator), `docs/ADMIN-GUIDE.md` — no LIM file, no OPF file. |
| **B2** | ATRV v0.10 is **DRAFT**, not BUILD AUTHORITY. Sequential W0 reviews → Coach **GO SPEC** on `QFRIC-W0.md` → W0-G → P0. A chat "looks great" is not the stamp (DL-328). |
| **B3** | **OD-ATRV-12 must be ticked at W0** (keep vendor mid, label). Without it P1 cannot define `complex_mid` on a null-bid leg. Default stands if silent. |
| **B4** | **P4 is gated on history that does not exist in the tree and must never enter it.** Sheldon receives it out of band; the fit artifact (`fit.json`) carries parameters and provenance hashes only — **no order rows**. W-G does not wait for P4. |
| **B5** | Fidelity honesty: the model uses spread, one-sidedness and edge — **not depth**. No seed may claim queue position on era-1. |

### Coach dispositions (tick on `QFRIC-W0.md`)

**OD-ATRV-12 — null-bid mark basis**
- [ ] **Keep vendor `ask/2`, label `mark_basis`, count null-bid legs per mark** *(spec default; recommended — measured immaterial)*
- [ ] Withhold the mark when any leg's bid is null *(would withhold most far-wing marks all afternoon)*

**OD-ATRV-13 — fill history**
- [ ] Broker export (source of record) — format: ______
- [ ] Remembered orders (≥ 12), labelled in `fit_id` — first curve only
- [ ] Not yet — **W-G closes unfitted, says so**

**OD-ATRV-14 — regime dial**
- [ ] Declared control {0.5, 0.75, 1.0} until VIX column *(default)*

**O1 — grid endpoint** (Juliet proposal, not in spec)
- [ ] `GET /api/me/quant/controls` returns the grids so the page never hardcodes them *(recommended; India confirms it is serving, not governing)*
- [ ] Grids shipped in `quantApi.ts` as constants, mirrored from `friction.py`

**DL-539 — three OKs, only if B1 is not resolved by reassignment DL**

| # | Date | Coach OK |
|---|---|---|
| 1 | — | [ ] |
| 2 | — | [ ] |
| 3 | — | [ ] |

### Opinions (Coach may discard)

| # | Item |
|---|---|
| **O2** | Board is `agents/p-quant-friction/`, not a reopening of `p-strategy-lab`/`strategy-lab-ux`. The store and builder are **not** in scope; a separate board if they move. |
| **O3** | P2 and P3 run in parallel after P1-G. P3 may build against P2's declared payload on fixtures; **P3-G needs the real API**. |
| **O4** | Foxtrot is **not seated** — no host change, no launchd, no collector touch. Era-2 collection starts Tuesday 2026-09-08 and this board does not go near it. |
| **O5** | The one-day demonstration (762/767/772 put fly, $0.36 debit, target +150%) is **re-run under the new model at P1-G** and reported beside the placeholder result **as two shapes**, not as "better/worse". |
| **O6** | `window_s` grid includes 60 s because Coach said 10–30 s is typical and misses happen; 60 is the "left it working" case. Drop it if Coach says nobody rests that long. |

---

## 4. Isolation

**In program (after W0-G):** `server/quant/friction.py` (**new**) · `server/quant/simulate.py` ·
`server/routes/quant.py` · `server/config.py` (**`validate_quant_env` only** — new optional key
`LABS_QUANT_FILL_FIT_PATH`) · `.env.example` · `server/tests/quant_fixture.py` ·
`server/tests/test_quant_friction.py` (**new**) · `server/tests/test_quant_simulate.py` ·
`server/tests/test_quant_api.py` · `web/lib/quantApi.ts` ·
`web/components/strategy-lab/MonteCarloLab.tsx` · `web/app/app/strategy-lab/montecarlo/page.tsx` ·
`scripts/quant-fit-fill.py` (**new**, P4) · `docs/ADMIN-GUIDE.md` (quant section) ·
`Architecture/00-decision-log.md` · `AGENTS.md` (P0, B1 only) · `Specs/…ATRV…v0_11.md` (W-G, as built) ·
this plan · board.

**Out unless Coach names it:** `server/quant/store.py` · `server/quant/build.py` ·
`server/quant/layout.py` · the demonstration store under `server/data/quant-store/` · the archive ·
`web/lib/options-lab/tmChainAtT.ts` (Time Machine) · Options Lab · Heatmap/LIM · OPF · collector ·
`infra/` · any host.

**Never:** fill history rows in the repo · a fill better than the limit · a mean ·
`--workers` > 1 · a change to the mark series under this board · a fitted parameter typed by hand.

---

## 5. Hard gates

| Gate | Rule | Unblocks |
|---|---|---|
| **W0-0** | Coach stamps **ATRV v0.10 §3.7.1 BUILD AUTHORITY** and **this plan v1.0**. OD-ATRV-12/13/14 ticked. O1 decided. | W0-1 |
| **W0-1 Lima** | sha1 of spec + plan on the token; DL-679 draft; **B1 disposition drafted** (reassignment DL text or three-OK log opened) | W0-2…7 |
| **W0-2 India** | Boundary: ATRV serves, QLAB governs — controls bind the runner (§4.5); grid endpoint (O1) is serving not governing; no second source of truth; files in §4 only | W0-G |
| **W0-3 Sheldon** | Fill law shape (F4), unfitted hazard (F5), fit method and provenance (F8), OD-12/14 stamps; **states what `n_orders` makes a curve admissible for display vs researcher-only** | W0-G |
| **W0-4 Hotel** | *"Would this make a member worse if they believed a wrong version?"* — never-better-than-limit, null-bid law, no depth claim on era-1, `legged` never default; the one-day rerun (O5) reported as two shapes | W0-G |
| **W0-5 Tango** | Control labels and grid presentation for a bleeding trader: no free field, no "recommended" value, `unfitted` visible on the face, abandoned legs named plainly | W0-G |
| **W0-6 Echo** | Grid controls chrome: segmented controls, defaults marked as defaults, assumptions strip; no chart lib; matches DL-677 page | W0-G |
| **W0-7 Kilo** | Test plan: fixture extensions (null-bid body at entry; one-tick wing; wide-ask null-bid outlier), hazard integral for every K, off-grid matrix, whole-or-none, resting target touched-not-filled, byte-identical rerun, cell ceiling | W0-G |
| **W0-G** | Token stamped; seven reviews in; **no product code**; B1 path chosen | P0 |
| **P0-G** | DL-679 landed; `AGENTS.md` active-program line truthful (or three OKs logged); ADMIN-GUIDE stub names the controls and the env key; **no product code** | P1 |
| **P1-G** | **AT-ATRV-39 (engine side), 40, 41, 42, 44**; AT-15, 17, 19–23 regression; **AT-16/18 in their complex-mode form (D5)**; 30 of the 31 unchanged, `test_target_exit_leaves_at_first_touch_and_says_so` rewritten as AT-44 (D3); `legged` result byte-identical vs DL-677 seed 7 (**the contrast is the regression test**); AT-42 at every `regime_factor` grid point (D7); O5 rerun attached as two shapes; **full suite: no new failure outside the classified nine, every quant AT green (D4)** | P2 · P3 |
| **P2-G** | AT-ATRV-39 (API side: `CONTROL_OFF_GRID` 422 on every axis incl. `abs` off the $0.01 grid or outside $0.05…$5.00, `assumptions.controls` echoed verbatim); grid endpoint or constants per O1; **sweep refuses above 64 control-axis tuples with `CELL_CEILING`; the DL-677 entry sweep (167 entries, one control tuple) still runs (D2)**; real-server curl (`FT_SESSION` exported, value never written) | P3-G |
| **P3-G** | Browser walk: every control on its grid, default marked, `fill_model` + `fit_id` on the face, abandoned legs shown, no free field, no headline number; tsc 0 errors in touched files; Tango copy frozen | W-G |
| **P4-G** | **AT-ATRV-43**: `fit.json` byte-reproducible from history + store; `fill_model: fitted_v1` with `fit_id`, `n_orders`, range; un-joinable rows refused; **no history rows in any artifact**; Sheldon's admissibility line honoured on `display_legal[]` | fitted state on the page |
| **W-G** | Fail-closed §10. AT-ATRV-39…42, 44 (+43 iff P4 landed); 15, 17, 19–23, 29, 30 regression, 16/18 complex-mode form; **full suite: no new failure outside the classified nine**; DL close; ATRV **v0.11 as built** with the AT-16/18 and AT-36 errata; **explicit statement of fitted vs unfitted at close** | ship |

P2 and P3 in parallel after P1-G. **P4 whenever history lands; never blocks W-G.**

---

## 6. DAG

```text
W0-0 Coach GO SPEC + plan v1.0 + OD-12/13/14 + O1
  → W0-1 Lima sha1 + DL-679 draft + B1 path
  → W0-2 India ∥ W0-3 Sheldon ∥ W0-4 Hotel ∥ W0-5 Tango ∥ W0-6 Echo ∥ W0-7 Kilo
  → W0-G
       → P0 Lima DL + AGENTS.md + ADMIN-GUIDE stub → P0-G
            → P1 Alpha friction.py + simulate.py · Kilo tests → P1-G
                 ├─► P2 Alpha routes/quant.py + config → P2-G ─┐
                 └─► P3 Charlie/Echo/Tango page          → P3-G ┴► W-G
            (P4 Sheldon fit — fires on OD-ATRV-13 delivery, after P1-G; lands before or after W-G)
```

---

## 7. Packets

Seeds under `agents/p-quant-friction/seeds/`. Written by Juliet **as each phase opens**; a seed
that cannot be executed from cold is not finished. W0 and P0 seeds are written with this plan.

### W0 — review (no product code)

| Seed | Agent | Done when |
|---|---|---|
| `W0-0-coach-go.md` | Coach | `QFRIC-W0.md` W0-0 STAMP: §3.7.1 BUILD AUTHORITY, plan v1.0 accept, OD-12/13/14 ticked, O1 decided, B1 path |
| `W0-1-lima-hash.md` | Lima | sha1 of spec + plan on the token; DL-679 draft; B1 disposition drafted |
| `W0-2-india.md` | India | Boundary + isolation §4 + O1 as serving |
| `W0-3-sheldon.md` | Sheldon | F4/F5/F8 shape; OD-12/14 stamps; `n_orders` admissibility line; fit provenance hash definition |
| `W0-4-hotel.md` | Hotel | Optimism audit of §3.7.1; O5 reporting rule |
| `W0-5-tango.md` | Tango | Control copy; unfitted on the face; abandoned legs wording |
| `W0-6-echo.md` | Echo | Grid chrome; defaults marked; assumptions strip |
| `W0-7-kilo.md` | Kilo | Test plan matrix for AT-39…44 + fixture extensions |
| `W0-G-delta.md` | Delta | Token + seven reviews; no product code; ternary |

### P0 — docs (Lima · India)

| Seed | Agent | Done when |
|---|---|---|
| `P0-1-lima-dl.md` | Lima | DL-679 stamp entry; `AGENTS.md` active-program line names Quant Lab (B1) or three-OK log; ADMIN-GUIDE stub (controls, `LABS_QUANT_FILL_FIT_PATH`, what "unfitted" means to an operator); note AT-ATRV-36 supersession pending P1-G |
| `P0-2-india.md` | India | Docs match the tree. P0-G |

### P1 — engine (Alpha · Kilo)

| Seed | Agent | Done when |
|---|---|---|
| `P1-1-alpha-friction.md` | Alpha | **`server/quant/friction.py`**: `Controls` (grids as data, `validate()` → `CONTROL_OFF_GRID`), `complex_quotes(st, legs, t) → {natural, mid, one_sided_legs[], tick}` (F2/F3), `hazard_unfitted(p, K)` (F5), `Fit` loader (refuses when `LABS_QUANT_FILL_FIT_PATH` absent → unfitted), `rest_order(st, legs, side, limit, t0, controls, rng) → Fill \| NoFill` with window/re-seat (F1/F4). **Tick is declared per-book data in `friction.py` ($0.01, XSP), labelled (O-R5).** `K` = snapshots inside the window on that day (D6). `regime_factor` touches fitted `P_fit` only (D7). Complex-mode tax `(limit − complex_mid)` + fees per order side (D5). `simulate.py`: `order_type=complex` path; **resting target exit** (F6); `abandoned_legs`; `legged` path **untouched, per-snapshot constant kept** (F9, D1). No mean anywhere. RNG stays `f(seed, strategy_id, path_index)`. |
| `P1-2-kilo.md` | Kilo | `test_quant_friction.py` + fixture extensions: AT-40 whole-or-none · AT-41 null-bid body → zero entry fills at that instant; forced-exit abandonment named · AT-42 hazard integral for every window on the fixture, K counted from the fixture's snapshots, at every `regime_factor` grid point, within 1e-9 · AT-44 replaces `test_target_exit_leaves_at_first_touch_and_says_so` (D3) · AT-39 engine-side refusal · byte-identical rerun · **`legged` byte-identical to DL-677 for seed 7** · AT-15, 17, 19–22 regression · AT-16/18 complex form (D5) |
| `P1-3-alpha-rerun.md` | Alpha | O5: XSP 2026-09-04, 762/767/772 put fly, `abs $0.50`, `window 30`, `reseat (1,2)`, 2000 paths, seed 7 — under `complex` and `legged`, saved to `docs/evidence/quant-friction-rerun-2026-09-04.json`; reported as **two ECDFs**, no verdict |
| `P1-G` | Delta | Gate §5. **FAIL if** any fill is recorded better than the limit · hazard is per-snapshot 0.85 · `legged` output moved · a control is clamped · the mark series changed |

### P2 — API + controls (Alpha · Kilo)

| Seed | Agent | Done when |
|---|---|---|
| `P2-1-alpha-routes.md` | Alpha | `routes/quant.py`: `controls{}` parsed on `/simulate` and `/sweep`; `CONTROL_OFF_GRID` 422 naming the axis and the grid; `assumptions.controls` echoed verbatim; grid endpoint per O1; `/sweep` counts **control-axis tuples only** against **64** → `CELL_CEILING` 422 (entry pooling stays on `MAX_PATHS × 10`, D2); `config.py`: `LABS_QUANT_FILL_FIT_PATH` optional, **validated if set** (file exists, parses, `fit_id` present) |
| `P2-2-kilo.md` | Kilo | AT-39 API matrix (every axis, every off-grid shape incl. `abs` off the $0.01 grid and outside $0.05…$5.00) · `CELL_CEILING` at 65 control tuples, **and the DL-677 167-entry sweep still 200** · fit path set-but-bad aborts boot · `assumptions.controls` byte-equal to request |
| `P2-G` | Delta | Real-server curl transcript; 422s named |

### P3 — page (Charlie · Echo · Tango)

| Seed | Agent | Done when |
|---|---|---|
| `P3-1-charlie-controls.md` | Charlie | `quantApi.ts` types (`Controls`, `FillModel`, `AbandonedLeg`); `MonteCarloLab.tsx` controls panel from the grid endpoint (or constants per O1) as segmented controls; **`abs` limit as the declared chip set $0.30 · $0.50 · $1.00 (O-R3)**; defaults marked; `fill_model`/`fit_id`/`window K` in the assumptions strip; abandoned legs listed; `legged` selectable only under a "contrast" label; no free numeric field for any control |
| `P3-2-echo-tango.md` | Echo · Tango | Chrome + copy per W0-5/W0-6; screenshots |
| `P3-G` | Delta | Browser walk against the real API |

### P4 — the fit (Sheldon · Kilo) — fires on OD-ATRV-13 delivery

| Seed | Agent | Done when |
|---|---|---|
| `P4-1-sheldon-fit.md` | Sheldon | `scripts/quant-fit-fill.py --history <path outside repo> --root <store>`: joins each order to the store at `sent_at` (refuses un-joinable rows), fits monotone logistic in `edge_ticks` with one-sidedness term, `p_miss_marketable`; writes `fit.json` = parameters + `fit_id` (sha256 of history bytes + store `meta.json` hashes + script version) + `n_orders` + range — **no rows**. Admissibility line applied to `display_legal[]` |
| `P4-2-kilo.md` | Kilo | AT-43 on a **synthetic** history fixture (real history never enters tests); byte-identical `fit.json` on rerun; refusal on un-joinable row; engine reports `fitted_v1` |
| `P4-G` | Delta | Provenance hashes verified; no history bytes in any artifact |

### W-G — close

| Seed | Agent | Done when |
|---|---|---|
| `WG-1-kilo.md` | Kilo | Full AT matrix §9; full characterization suite |
| `WG-2-lima.md` | Lima | DL close; **ATRV v0.11 as built** (AT-36 superseded, §3.7.0 retired, §3.7.1 → "as built"); ADMIN-GUIDE final; fitted/unfitted state named |
| `WG-delta.md` | Delta | Fail-closed §10; explicit non-claim: **no depth, no VIX fit, fitted only if P4 landed** |

---

## 8. Change declaration (declare again on each seed)

**New:** `server/quant/friction.py` · `server/tests/test_quant_friction.py` · `scripts/quant-fit-fill.py` (P4) ·
`docs/evidence/quant-friction-rerun-2026-09-04.json` · `agents/go/QFRIC-W0.md` · this plan · board.

**Modified:** `server/quant/simulate.py` (P1) · `server/routes/quant.py` (P2) · `server/config.py`
(`validate_quant_env`, P2) · `.env.example` (P2) · `server/tests/quant_fixture.py`,
`test_quant_simulate.py`, `test_quant_api.py` (P1/P2) · `web/lib/quantApi.ts`,
`web/components/strategy-lab/MonteCarloLab.tsx`, `web/app/app/strategy-lab/montecarlo/page.tsx` (P3) ·
`docs/ADMIN-GUIDE.md` (P0, W-G) · `Architecture/00-decision-log.md` (P0, W-G) · `AGENTS.md` (P0, B1 line only) ·
`Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_11.md` (W-G, new file).

**Not touched:** `store.py` · `build.py` · `layout.py` · demonstration store · archive · Time Machine ·
Options Lab · LIM · OPF · collector · `infra/` · any host · the mark series.

---

## 9. AT map

| AT | Phase | Gated at | Note |
|---|---|---|---|
| AT-ATRV-39 | P1 / P2 | P1-G / P2-G | on-grid, echoed, `CONTROL_OFF_GRID` |
| AT-ATRV-40 | P1 | P1-G | whole at limit or not at all; never better |
| AT-ATRV-41 | P1 | P1-G | null-bid law; abandoned at $0 named |
| AT-ATRV-42 | P1 | P1-G | unfitted hazard integrates to `p` for every K |
| AT-ATRV-43 | P4 | P4-G | fit byte-reproducible; **only if history delivered** |
| AT-ATRV-44 | P1 | P1-G | resting target: touched vs filled |
| AT-ATRV-36 | — | — | **superseded on P1-G** (Lima records in v0.11) |
| AT-ATRV-15, 17, 19–23 | every gate | all | no untaxed fill, no partial credit, distribution, seed, stability, no-fill rate, schedule-independent |
| AT-ATRV-16, 18 | P1 | P1-G | **complex form (D5):** tax per order side, friction `(limit − complex_mid)` vs fees; eight crossings only in `legged` |
| AT-ATRV-29, 30 | every gate | all | `fidelity`, `display_legal[]` |
| AT-ATRV-37 | P2 | P2-G | sweep byte-identical, plus cell ceiling |
| QLAB §4.2 (OD-QLAB-8) | P2 | P2-G | 64 control-axis tuples, no off-grid rest; **not AT-QLAB-21, which is the member-surface metric ban** |

---

## 10. Fail-closed (W-G FAIL)

- A fill recorded **better than the limit**
- Hazard applied as `p` **per snapshot** in the unfitted state
- A control **rounded, clamped, or defaulted silently** off its grid
- A free numeric field for any control on the page
- `legged` as the default, or `legged` output moved from DL-677 for the same seed
- A sell leg filled into a **null bid**; a long null-bid leg marked at a fictional price at forced exit
- The **mark series changed** under this board
- A fitted parameter **typed by hand**; `fill_model: fitted_v1` without `fit_id`
- **Fill history rows** in any repo artifact, test, or evidence file
- Any claim of queue position / depth on era-1
- A mean, a headline number, a single quantile alone
- Sweep exceeding **64 control-axis tuples** silently — or **entry pooling counted as cells** (the DL-677 sweep must still run)
- `regime_factor` applied to the unfitted hazard
- A tick size read from a store field that does not exist
- `store.py` / `build.py` / the archive touched
- Product code before `QFRIC-W0.md` is stamped, or with B1 unresolved

---

## 11. Non-goals

- Depth / queue-position modelling (era-2, SSR-MEXP)
- A VIX-fitted regime (OD-ATRV-14, era-2)
- Sub-snapshot time-to-fill (AT-ATRV-14 still returns `SUB_INTERVAL_UNRESOLVABLE`)
- Changing the store, the builder, or the publish transport
- Any Options Lab / Time Machine change
- Making the fill model "fair" — it is pessimistic by law (§3.7)

---

## 12. Seating

| Agent | Role here |
|---|---|
| **Coach** | GO SPEC, OD-12/13/14, O1, B1 path, fill history custody |
| **Juliet** | This plan, board, seeds |
| **India** | Boundary; P0; every gate |
| **Sheldon** | Fill law shape, unfitted hazard, **the fit** (P4), OD-12/14 |
| **Alpha** | P1 engine, P2 API |
| **Charlie** | P3 page |
| **Echo** | P3 chrome |
| **Tango** | P3 copy; W0-5 |
| **Hotel** | W0-4 optimism audit; O5 reporting rule |
| **Kilo** | AT matrix, fixtures, P4 synthetic history |
| **Lima** | DL-679, B1, ADMIN-GUIDE, ATRV v0.11 |
| **Delta** | Every phase end |
| **Foxtrot** | **Not seated** (no host, no collector) |
| **Mike** | **Not seated** (auth unchanged: `require_session`) |

---

## 13. Document control

| Version | Date | Notes |
|---|---|---|
| **v1.0** | 2026-09-06 | Juliet. Against ATRV v0.10 §3.7.1 (DRAFT, DL-678). Spread-probe evidence. Coach: *"looks great, let's get a full agent bench build plan going."* |
| **v1.1** | 2026-09-06 | **Grok review applied — seven defects, three disagreements folded, no new law.** F5 split so `legged` stays byte-identical; cell count is control tuples only (the 167-entry sweep would have 422'd); the AT-36 test becomes AT-44; suite criterion is "no new failure outside the classified nine"; complex-mode tax defined (AT-16/18 erratum for v0.11); cadence fact corrected to the measured 6,449 session snapshots and K counted per window; `regime_factor` scales fitted `P_fit` only; `abs` chip set; selling-side marketable written; tick declared as data. |

**Next for Coach:** read §"Changes from v1.0"; tick **OD-ATRV-12/13/14**, **O1**, **O6**, choose the **B1** path, on
`agents/go/QFRIC-W0.md`; stamp W0-0 against **plan v1.1** or return.
