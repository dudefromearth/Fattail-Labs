# GO token — Quant Lab Fill-Friction W0

**ID:** `QFRIC-W0`
**Program:** Quant Lab — Fill-Friction Model (ATRV v0.10 §3.7.1): complex order at a net limit, resting window, re-seat, null-bid law, six gridded controls, fitted probabilities
**Plan:** [`docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md`](../../docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.0.md) **v1.0**
**Spec:** ATRV **v0.10 DRAFT** — [`Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md`](../../Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md) — §3.7.1 **design only**
**Board:** `agents/p-quant-friction/`
**DL:** **DL-678** (§3.7.1 drafted, controls directed) · **DL-677** (slice built) · **DL-674** (Quant Lab seated) · DL-679 (this stamp — Lima drafts at W0-1)

**Status:** **NOT STAMPED** — 2026-09-06. ATRV v0.10 §3.7.1 is **DRAFT**. Plan v1.0 **proposed**. **No product code.** Seeds for W0 and P0 exist; P1 seeds are written when W0-G passes.

**DL-328:** Delta gates this program by **this file**. Chat is not a stamp. Coach's *"looks great"* (2026-09-06) authorised **drafting the plan**, not building.

---

## Preconditions (file must name these)

| Check | Value |
|---|---|
| Plan revision | **v1.0** |
| Spec | ATRV v0.10 — file at land `9a9cf1f` |
| Spec sha1 (whole file, at land) | `9e148f787d87b8eda6435f4b0ea3014814380a3f` |
| Spec sha1 (whole file, at stamp) | — (Lima, W0-1) |
| Plan sha1 (at stamp) | — (Lima, W0-1) |
| Evidence the design rests on | `docs/evidence/quant-spread-probe-XSP-2026-09-04.{txt,json}` (`73aef4d`) |
| Placeholder being replaced | ATRV v0.9 §3.7.0 · `server/quant/simulate.py` `_fill` / `resolve_exit` as of `2025ac6` |
| Regression baseline | `legged` mode output for seed 7 on XSP 2026-09-04 — **must not move** (plan F9, P1-G) |
| Fill history | **Never in the repo.** Delivered to Sheldon out of band (OD-ATRV-13). P4 fires on delivery; W-G does not wait |
| Active-program line (`AGENTS.md`) | Names Heatmap LIM only — **stale vs DL-674**. Resolved at P0 by reassignment DL **or** three OKs below (plan B1) |

---

## Coach dispositions

**OD-ATRV-12 — null-bid mark basis** (Sheldon stamps; Coach may pre-empt)
- [ ] **Keep vendor `ask/2`; label `mark_basis`; count null-bid legs per mark** *(spec default · measured immaterial on 2026-09-04)*
- [ ] Withhold the mark when any leg's bid is null

**OD-ATRV-13 — fill history** (Coach)
- [ ] Broker export — format: ________
- [ ] Remembered orders (≥ 12), first curve only, labelled in `fit_id`
- [ ] Not yet — W-G closes **unfitted** and says so

**OD-ATRV-14 — regime dial**
- [ ] Declared control {0.5, 0.75, 1.0} until a VIX column exists *(default)*

**O1 — where the grids live**
- [ ] `GET /api/me/quant/controls` serves the grids *(recommended)*
- [ ] Constants in `quantApi.ts` mirrored from `friction.py`

**O6 — `window_s` grid**
- [ ] {10, 20, 30, 60} *(plan)*
- [ ] Drop 60

**B1 — active program**
- [ ] Reassignment DL at P0 naming Quant Lab active alongside LIM *(recommended)*
- [ ] Three successive OKs below before P1's first edit

| # | Date | Coach OK |
|---|---|---|
| 1 | — | [ ] |
| 2 | — | [ ] |
| 3 | — | [ ] |

---

## W0-0 STAMP

- [ ] ATRV v0.10 §3.7.1 **BUILD AUTHORITY** — Coach, date/initials: ________
- [ ] Plan v1.0 **Accept** — Coach: ________
- [ ] Dispositions above ticked

## Reviews (W0-1…7)

| Seed | Agent | Verdict | Date | Report |
|---|---|---|---|---|
| W0-1 | Lima | — | — | — |
| W0-2 | India | — | — | — |
| W0-3 | Sheldon | — | — | — |
| W0-4 | Hotel | — | — | — |
| W0-5 | Tango | — | — | — |
| W0-6 | Echo | — | — | — |
| W0-7 | Kilo | — | — | — |

## Gates

| Gate | Verdict | Date | Report |
|---|---|---|---|
| W0-G | — | — | — |
| P0-G | — | — | — |
| P1-G | — | — | — |
| P2-G | — | — | — |
| P3-G | — | — | — |
| P4-G | — | — | — |
| W-G | — | — | — |
