# GO token — Quant Lab Fill-Friction W0

**ID:** `QFRIC-W0`
**Program:** Quant Lab — Fill-Friction Model (ATRV v0.10 §3.7.1): complex order at a net limit, resting window, re-seat, null-bid law, six gridded controls, fitted probabilities
**Plan:** [`docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md`](../../docs/Quant-Lab-Fill-Friction-Full-Agent-Bench-Plan-v1.1.md) **v1.1**
**Spec:** ATRV **v0.10** — [`Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md`](../../Specs/FatTail-Labs-Archive-Traversal-API-Spec-v0_10.md) — §3.7.1 **BUILD AUTHORITY as of W0-0 below**
**Board:** `agents/p-quant-friction/`
**DL:** **DL-678** (§3.7.1 drafted, controls directed) · **DL-677** (slice built) · **DL-674** (Quant Lab seated) · **DL-679** (this stamp)

**Status:** **W0-0 STAMPED** — 2026-09-06. Coach: *"execute the build plan"* then *"go all the way through unless there is a problem."* Dispositions ticked as the plan's recommended defaults (Coach did not name an alternative). **P4 skipped** — OD-ATRV-13 "Not yet"; W-G closes unfitted.

**DL-328:** this file is the stamp. Chat authorised the stamp; the ticks are recorded here.

---

## Preconditions (file must name these)

| Check | Value |
|---|---|
| Plan revision | **v1.1** |
| Spec | ATRV v0.10 — file at land `9a9cf1f` |
| Spec sha1 (whole file, at land) | `9e148f787d87b8eda6435f4b0ea3014814380a3f` |
| Plan v1.0 review | `docs/Quant-Lab-Fill-Friction-Bench-Plan-v1.0-Review.md` + `agents/p-quant-friction/evidence/QFRIC-plan-v1.0-review-grok.md` — **RETURN**, D1–D7 folded into plan v1.1 |
| Spec sha1 (whole file, at stamp) | `9e148f787d87b8eda6435f4b0ea3014814380a3f` |
| Plan sha1 (at stamp) | `4d3d4030fd9bd4a0590dd7c77087e2ba5ea9501c` (v1.1) |
| Evidence the design rests on | `docs/evidence/quant-spread-probe-XSP-2026-09-04.{txt,json}` (`73aef4d`) |
| Placeholder being replaced | ATRV v0.9 §3.7.0 · `server/quant/simulate.py` `_fill` / `resolve_exit` as of `2025ac6` |
| Regression baseline | `legged` mode output for seed 7 on XSP 2026-09-04 — **must not move** (plan F9, P1-G) |
| Fill history | **Never in the repo.** OD-ATRV-13: **Not yet.** P4 does not fire. W-G closes unfitted. |
| Active-program line (`AGENTS.md`) | Resolved at P0 by **reassignment DL** (B1 recommended path). Three-OK log unused. |

---

## Coach dispositions

**OD-ATRV-12 — null-bid mark basis** (Sheldon stamps; Coach may pre-empt)
- [x] **Keep vendor `ask/2`; label `mark_basis`; count null-bid legs per mark** *(spec default · measured immaterial on 2026-09-04)* — Coach GO 2026-09-06 (recommended)
- [ ] Withhold the mark when any leg's bid is null

**OD-ATRV-13 — fill history** (Coach)
- [ ] Broker export — format: ________
- [ ] Remembered orders (≥ 12), first curve only, labelled in `fit_id`
- [x] Not yet — W-G closes **unfitted** and says so — Coach GO 2026-09-06

**OD-ATRV-14 — regime dial**
- [x] Declared control {0.5, 0.75, 1.0} until a VIX column exists *(default)* — Coach GO 2026-09-06

**O1 — where the grids live**
- [x] `GET /api/me/quant/controls` serves the grids *(recommended)* — Coach GO 2026-09-06
- [ ] Constants in `quantApi.ts` mirrored from `friction.py`

**O6 — `window_s` grid**
- [x] {10, 20, 30, 60} *(plan)* — Coach GO 2026-09-06
- [ ] Drop 60

**B1 — active program**
- [x] Reassignment DL at P0 naming Quant Lab active alongside LIM *(recommended)* — Coach GO 2026-09-06
- [ ] Three successive OKs below before P1's first edit

| # | Date | Coach OK |
|---|---|---|
| 1 | — | [ ] unused; B1 is the reassignment DL |
| 2 | — | [ ] |
| 3 | — | [ ] |

---

## W0-0 STAMP

- [x] ATRV v0.10 §3.7.1 **BUILD AUTHORITY** — Coach, 2026-09-06, directed *"execute the build plan"* / *"go all the way through unless there is a problem"*
- [x] Plan v1.1 **Accept** — Coach: same direction (v1.0 RETURN folded)
- [x] Dispositions above ticked

## Reviews (W0-1…7)

| Seed | Agent | Verdict | Date | Report |
|---|---|---|---|---|
| W0-1 | Lima | PASS | 2026-09-06 | `agents/p-quant-friction/evidence/W0-1-lima.md` |
| W0-2 | India | PASS | 2026-09-06 | `agents/p-quant-friction/evidence/W0-2-india.md` |
| W0-3 | Sheldon | PASS | 2026-09-06 | `agents/p-quant-friction/evidence/W0-3-sheldon.md` |
| W0-4 | Hotel | PASS | 2026-09-06 | `agents/p-quant-friction/evidence/W0-4-hotel.md` |
| W0-5 | Tango | PASS | 2026-09-06 | `agents/p-quant-friction/evidence/W0-5-tango.md` |
| W0-6 | Echo | PASS | 2026-09-06 | `agents/p-quant-friction/evidence/W0-6-echo.md` |
| W0-7 | Kilo | PASS | 2026-09-06 | `agents/p-quant-friction/evidence/W0-7-kilo.md` |

## Gates

| Gate | Verdict | Date | Report |
|---|---|---|---|
| W0-G | PASS | 2026-09-06 | `agents/p-quant-friction/gate-reports/W0-G.md` |
| P0-G | PASS | 2026-09-06 | `agents/p-quant-friction/gate-reports/P0-G.md` |
| P1-G | PASS | 2026-09-06 | `agents/p-quant-friction/gate-reports/P1-G.md` · 40 quant tests |
| P2-G | PASS | 2026-09-06 | `agents/p-quant-friction/gate-reports/P2-G.md` · residual: API restart curl |
| P3-G | PASS | 2026-09-06 | `agents/p-quant-friction/gate-reports/P3-G.md` · residual: browser walk |
| P4-G | SKIP | 2026-09-06 | OD-ATRV-13 Not yet; no history in tree |
| W-G | PASS | 2026-09-06 | `agents/p-quant-friction/gate-reports/W-G.md` · **unfitted close** |
