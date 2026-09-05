# Analyzer Algo Alert — Full Agent Bench Plan v4.1

**Date:** 2026-09-05  
**Plan revision:** **v4.1** · **gated-plan** · **UNSTAMPED**  
**Mode:** plan only. No application code. No stamp. No promotion of the proposed line.  
**Canonical filename:** `docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v4.1.md`  
**Owner (orchestration):** Juliet  
**Board:** [`agents/p-az-algo/`](../agents/p-az-algo/)  
**Future stamp (not this file):** a new GO token. **`AZALGO-W0` does not cover this work.**

Product law is **v2.3.3**. P0 spec close is done. Constants are stamped (**DL-671**). Dev bootstrap is repaired (**DL-672**). This file sequences the remaining work. It is **not** BUILD AUTHORITY.

---

## 0. What changed vs v4.0

v4.0 sequenced a **v2.3.2 RETURN**. Its punch list was verified against the file — eight of eight staleness claims were true, including row 20's PaR. v2.3.3 closed them as E44–E48.

Two resolutions **differ from what v4.0 assumed:**

| v4.0 assumed | v2.3.3 / DL-671 |
|---|---|
| E41 unit is a Coach branch (a) vs (b). **P5 waits on the pick.** | **Not a branch.** Options (a) and (b) both scaled the threshold to a quantity that moves the wrong way. A fraction of `H` grows as the margin it gates shrinks — 0.7% warning window at the 75% gate; no constant repairs a wrong denominator. Law is `REGIME_NEAR_FRAC × max(p × headroom, at_risk)`, stamped **0.10**, dwell **> 1 tick**, AT-ALGO-50 rewritten. `REGIME_NEAR_PCT` retired; the old key **aborts boot**. **P5 no longer waits on a unit pick.** |
| `MOVE_HORIZON_MIN` is a starting constant Coach must stamp; P0b blocked until then. | **Stamped 3.** Slice named: `Γ = −$28/pt²`, `H = 60%` of a 30-wide $300-debit fly — not "the" horizon. §14.5 fits `(HORIZON_MIN, P_BASE)` jointly. **P0b goldens are unblocked.** |

Fixture **27c** is split out of the golden sheet: it gates **P5**, not P0b. The uncloseable-row problem is fixed in the spec.

v4.0 is kept on disk. It is **not this DAG.** A v3.0 plan was cited in v4.0; it is **not on disk** as a landed file and is not this DAG.

---

## 1. Readiness banner

**PRODUCT-LAW DRAFT. BUILD AUTHORITY SUSPENDED.**

| | |
|--|--|
| Law | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.3.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.3.md) sha1 `16cad43826f223e80409bfdc05d2bd4f694764fe` · commit `c3db7f5` |
| Review that P0 closed | [`docs/Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.2-Review.md`](./Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.2-Review.md) · **RETURN 2026-09-04** · punch list accepted in v2.3.3 |
| Constants | **DL-671** — `MOVE_HORIZON_MIN = 3` (slice named) · `REGIME_NEAR_FRAC = 0.10`. Starting constants under E8, not findings. OD-ALGO-11 **closed**. OD-ALGO-7 **value** closed; the joint §14.5 fit remains open. |
| Dev bootstrap | **DL-672** · commit `db9c37b`. `.env.example` and `requirements.txt` now describe what the code requires. Fresh checkout boots (77 routes). Suite **1429 passed / 9 failed / 6 skipped**; the 9 are environmental (no market-data mounts, parquet, lab-wiki checkout, media write). v4.0 P1 preconditions that assumed a working template were **wrong then and are right now**. |
| Prior GO | [`agents/go/AZALGO-W0.md`](../agents/go/AZALGO-W0.md): “**STAMPED GO** — 2026-09-03. Spec v2.2.2 **BUILD AUTHORITY**.” Does **not** carry forward. |
| v2.0 P1 | [`agents/p-az-algo/gate-reports/P1-G.md`](../agents/p-az-algo/gate-reports/P1-G.md): “**PASS** · **Spec:** AZ-ALGO v2.2.2 sha1 `b757ba3f…`.” **Not coverage of this model.** |
| Prior plan | [`…Plan-v4.0.md`](./Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v4.0.md) sequenced the v2.3.2 RETURN. **Not this DAG.** Keep on disk. |
| E1–E48 | **Stand. Not reopened.** |
| Proposed line | Labelled *proposed* until §14 has evidence. **Both lines paint.** This plan does not promote. |

**Blocked until P0b handwritten goldens exist and Coach issues a new GO token:** every `web/` edit of this model, every paint of the proposed line as this model, every clause-A Fold suggested, every live tick of this model.

**Coach must still stamp, in order:**

1. **Done.** Spec v2.3.3 (P0 close). Constants (**DL-671**).
2. Handwritten goldens (**P0b**) — fixtures **19–27**, **not 27c**. Re-record **1–8, 17, 18**.
3. A **new** GO token. Chat is not a stamp (**DL-328**). `AZALGO-W0` does not cover this.
4. OD-ALGO-8 / 9 on that token (defaults below if silent). OD-ALGO-1 is already **Guide**.
5. Tango freeze of the word **Budget** before P4 mounts that row.
6. **P0-visual** one-pager (this plan) before P5 paints approaching.
7. Fixture **27c** handwritten before P5 (separate sheet; `REGIME_NEAR_FRAC` is already stamped so the row is constructable).

DL-539: `AGENTS.md` still lists LIM as the only active program. First `web/` edit (P1) additionally needs a reassignment DL or three successive Coach OKs on the new token.

---

## 2. inputs_missing

**Empty.** Every file the brief named was on disk and opened. Spec v2.3.3 sha1 recomputed this pass: `16cad43826f223e80409bfdc05d2bd4f694764fe`.

| Required | Path | Used as |
|----------|------|---------|
| Product law | `Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.3.3.md` | Law. P0 closed. |
| Constants | `Architecture/00-decision-log.md` **DL-671** | Horizon 3, slice named. `REGIME_NEAR_FRAC` 0.10. |
| Dev bootstrap | **DL-672** · `db9c37b` | Template and pins a fresh machine can boot from. |
| Coach verbatim §0.1 / §0.2 | v2.3.3 seating + memo | History. **§0.2.14 / memo Part III.14 not implemented.** |
| Coach memo | `Specs/Arming and Trade Management Specification.md` | Advisory stance, no stops, gate, GEX-as-management, apex, legacy schedule. Part III.14 `trail_level = H − k × PaR` is **verbatim history**. |
| Strategy parent | `Specs/FatTail 0DTE Strategy Specification.md` | Defined-risk OTM fly; most clip small; top band is the validation error. |
| AZ-ALB v1.0 | `Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md` | Builder / holder. Does not implement Manager. |
| ALM v1.0 | `Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md` | House base on `/app/alerts`. Analyzer is a client. |
| Analyzer v0.2 | `Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md` | Host surface. |
| OT-EF / DL-309 | `Specs/FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md` | Representable or named state. No invented debit / greeks / `x_S`. |
| Keep-Warm v0.1.2 | `Specs/FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md` | Idle = no heavy resolve. Pulse is paint. |
| HI v1.0 | `Specs/FatTail-Labs-Human-Interface-Spec-v1.0.md` | Tokens / 44pt / floatable. |
| Trader Feed v0.1.3 | `Specs/FatTail-Labs-Trader-Feed-Spec-v0.1.md` | Host `algo-reason`. Not BUILD on its own. |
| North Star v1.2 | `Specs/FatTail-Labs-North-Star-Member-Ethos-Spec-v1.2.md` | Capacity over dependency. |
| Time Machine v0.7.4 | `Specs/FatTail-Labs-Options-Lab-Time-Machine-Spec-v0_7_4.md` | Demo is a clock. Playhead creation is rehearsal. |

Parents were read for **header, stance, and named constraints**. This plan does not re-derive them.

---

## 3. Open Coach items (branches — this plan does not pick)

| ID | Question | Default if silent | Blocks |
|----|----------|-------------------|--------|
| **OD-ALGO-1** | HUD Guide vs Stop | **CLOSED `Guide` at v2.3.2.** Payload `guide_print`. | — |
| **OD-ALGO-7** | Joint fit `(HORIZON_MIN, P_BASE)` at §14.5. Horizon **value** stamped 3 at the named slice (`Γ = −$28/pt²`, `H = 60%`) | Starting constants, not findings. §14.5 reports the pair at apex **and** wing, and at 40/60/80% of ceiling | Goldens **may** use 3. §14 is later. **Does not block P0b.** |
| **OD-ALGO-8** | HUD word for `p×headroom` | **Budget** (not Trail, not Drawdown). Tango freeze before the row mounts | P4 Budget row |
| **OD-ALGO-9** | `proximity_factor` / `extrinsic_factor` maps | **`p` stays an INPUT on goldens.** Do not invent maps | P2 injectable `p` |
| **OD-ALGO-10** | Clause-A / clause-B split as a §14 promotion gate | **Yes.** Handwritten 20/21/21b do not stand in for that report | §14, not this DAG |
| **OD-ALGO-11** | `REGIME_NEAR_FRAC` value | **CLOSED 0.10 (DL-671).** | — |
| **E41 unit** | Approaching threshold | **CLOSED by arithmetic (E45).** Not a Coach branch. P5 does not wait. | — |
| **Budget while `guide_raw < 0`** | Live dollar or hidden | **CLOSED.** Hidden / row does not mount (E46 · AT-ALGO-49b). | — |
| **FI-048** | Γ-conditional horizon | **OUT.** Modelling program. Do not smuggle. Horizon is a **constant key** | Any phase that makes horizon a function of `Γ` |

---

## 4. Plan patches (added by this plan, not by the spec)

These are isolation and evidence rules. They do **not** invent product law. They are **§8 added-by-plan**. Any packet that treats them as optional has not isolated the phases.

### 4.1 `regime_fold_enabled` default **false** on the P2 payload

`algoHoldFold.ts` **computes** both clauses every tick. The payload carries `fold_clause` as law (AT-ALGO-42 / 43 / 58).

A **plan-only** boolean on that payload, `regime_fold_enabled`, defaults **false**. While false:

- clause A is evaluated and recorded (headless goldens 20 / 26 / 27 still assert it);
- **Fold suggested is not emitted from clause A** to any member surface, adapter, or Feed;
- clause B may still emit Fold suggested once P4 has a paintable `guide_level`.

**P5** sets `regime_fold_enabled: true` only after **AT-ALGO-50** and fixture **27c** pass.

This is **not** a `LABS_ALGO_*` key. Appendix A remains the only env-key list. A packet that adds `LABS_ALGO_REGIME_FOLD_ENABLED` has invented a spec key.

### 4.2 `HostPnLChart` layer flags and testids

The host is a canvas (`data-testid="pnl-chart-host"`). Isolation cannot be a grepped string inside a bitmap. The host element carries **layer flags** so P3 / P4 / P5 can be asserted without reading pixels:

| Attribute | Values | First phase allowed to set a live value |
|-----------|--------|-----------------------------------------|
| `data-algo-layer-high-water` | `on` \| `off` | P3 |
| `data-algo-layer-legacy` | `on` \| `off` | P3 |
| `data-algo-layer-proposed` | `on` \| `waiting` \| `off` | **P4** (`waiting` = E38 below-zero / missing invert / missing samples) |
| `data-algo-layer-overlay` | `on` \| `off` | P4 (default **off**) |
| `data-algo-hud` | `four` \| `five` \| `off` | P4 (`four` below zero; `five` only when Budget may mount) |
| `data-algo-hud-budget` | `mounted` \| `absent` | P4 (`absent` while `guide: below zero` — AT-ALGO-49b) |
| `data-algo-guide-regime` | `clear` \| `approaching` \| `off` | **P5** |
| `data-algo-regime-fold` | `enabled` \| `disabled` | **P5** (`disabled` until AT-ALGO-50) |

Existing `data-algo-phase`, `data-algo-side`, `data-algo-hud-fourth` stay. P3 must not set proposed / regime / budget to a live value. A P4 packet that sets `data-algo-guide-regime` to anything but `off` has shipped AZALGO-REGIME early.

### 4.3 P6 strictly after P5

v4.0 allowed P6 after P4 “if the Feed only names B.” That split is not isolable: the house prompt and allowlist are one artifact. A sentence that names approaching or A-fold before the visual law exists is the E41 defect in prose.

**P6 does not start until P5-G PASS.** B-only sentences wait with A-fold sentences.

### 4.4 One-page Guide-object visual law — **P0 deliverable** (blocks P5, not P0b)

Spec §9.6 states the object. It does not freeze the token, the touch fallback, or the one-viewport composition. Echo authors **one page**, Tango and India review, Hotel signs the dwell arithmetic against fixture 27c:

`agents/p-az-algo/evidence/AZALGO-REGIME-visual-law.md`

Must include, and nothing else:

- two states only: **clear** / **approaching**;
- tokenized; **not** a number, **not** a %, **not** colour-alone, **not** hover-only;
- HUD fallback on a touch viewport (AT-ALGO-50);
- dwell **> 1 tick** before Fold suggested from A;
- A-only chrome while `guide_raw < 0`: `guide: below zero · A live` after P5, never before;
- E15 ceiling: one viewport, Feed off, overlay off, three verticals max.

This is **not** a spec revision. It is the picture P5 is allowed to paint. **P1–P4 do not wait on it. P5 does.**

### 4.5 Golden sheet columns

Every P0b row records, in addition to the spec's "must record by hand":

| Column | Why |
|--------|-----|
| `HORIZON_MIN` | AT-ALGO-52 / 59. Default 3, slice named. |
| `WINDOW` | Estimation window. Default 20. Distinct from horizon. |
| `MOVE_SIGMA` | Default 1.0. |
| `fold_clause` | `regime` / `guide` / `—` (hold). Both-true → `regime` and `fold_clause_both: true`. |
| `H/ceiling` | Mid-`H` construction for 20/21/21b; gate for 27; 0% for 26. |

A row missing these is not a golden. Hotel does not invent maps to fill them.

### 4.6 §8 is two lists

**Landed-in-spec** vs **added-by-plan**. Do not carry v4.0's "stale / missing" list. That list was the P0 punch list and is closed.

---

## 5. Phase table

No implementation phase starts before **P0b handwritten goldens** and a **new GO token**. A phase that paints what a later phase owns is a defective plan.

### Isolation (explicit)

| Phase | Owns | Only gate | Must not |
|-------|------|-----------|----------|
| **P5 AZALGO-REGIME** | Approaching visual law, clause-A Fold suggested, A-only chrome while below zero, `regime_fold_enabled → true` | Fixture **27c** + **AT-ALGO-50** (with-line on 20). Clause A may not paint before this passes | Bundle into P4. Colour-alone / hover-only / number / %. Start because "the unit is stamped." |
| **P7 AZALGO-LIVE** | `algoEval.ts` / `tickAlgoAlert` live path | **AT-ALGO-18 + live-session transcript only** | Any other phase listing `algoEval.ts` as a touched file. A v2.0 k-line transcript |

```text
P0 spec close ✓ ──► P0b goldens ──► P1 ──► P2 ──► P3 ──► P4 ──► P5 ──► P6 ──► P7
                    P0-visual ──────────────────────────────────────────┘
                                                                         └── P8 may start after P3 (chrome only)
P5 does not start because P4 “needs a live tick.”
P6 does not start because P4 “has B-only sentences.”
P7 does not start because P5 “needs algoEval.ts.”
```

P0 spec close is **done**. It is not a work packet in this DAG.

---

### P0-visual — GUIDE-OBJECT ONE-PAGER (blocks P5 only)

| | |
|--|--|
| **Files** | `agents/p-az-algo/evidence/AZALGO-REGIME-visual-law.md` only. **No app code.** |
| **Agents** | Echo authors · Tango · India. Hotel signs 27c dwell against the page. |
| **Must already be true** | v2.3.3 on disk. `REGIME_NEAR_FRAC` stamped. |
| **Must not** | Invent a third state. Pick a colour as the sole signal. Reopen E41 as a branch. |
| **Gate** | Page on disk. P5 does not open without it. P1–P4 do not wait. |

---

### P0b — GOLDENS (Hotel, handwritten)

| | |
|--|--|
| **Files** | New sheet, e.g. `agents/p-az-algo/evidence/ALGO-B-v2.3.3-goldens.md`. **Do not overwrite** the v2.2.x k-line sheet. **Do not include 27c** on this sheet. |
| **Must already be true** | P0 stamped (it is). `MOVE_HORIZON_MIN=3` named as the slice (**DL-671**), not a finding. |
| **Must not** | Compute from code. Invent `p` maps. Nudge `p` so a row closes. Apex-at-peak as 20/21. Hold the sheet open on 27c. |
| **Gate** | Goldens on disk as **handwritten numbers**, not implementation output. Unconstructable 20 or 21b = finding against the spec — **stop**. |

See §7 for the Hotel procedure.

---

### P1 — CONFIG + RISK SIDE

| | |
|--|--|
| **Files** | `algoConfig.ts` · `algoMoveUnit.ts` · `algoProfitAtRisk.ts` |
| **ATs that gate** | 26 (fail loud; **`REGIME_NEAR_PCT` present → abort**; `REGIME_NEAR_FRAC` required) · 6d · 6e · 19 (risk side only) · 28 (no session clock in PaR) · 38 (`ALGO_K_` = 0) · 51 (signed `m_adv`) · 52 (keys separate) · **59** (√T dimensional) |
| **Must already be true** | New GO token · P0b sheet · Appendix A is the only key list · **DL-672** template boots (P1 is not a bootstrap-repair packet) |
| **Must not paint / invent** | Canvas, HUD, `algoEval.ts`, combination step, unsigned `m_adv`, expected move, `√WINDOW` as horizon, `LABS_ALGO_*` keys outside Appendix A |

---

### P2 — REWARD SIDE + HOLD/FOLD (headless)

| | |
|--|--|
| **Files** | `algoProbability.ts` · `algoGexNorm.ts` · `algoHoldFold.ts` |
| **ATs that gate** | 6 · 6b · 6c · 6f · 19b (no `σ_T`) · 24 (`p` unmodulated, named) · 37 · 39 · 40 · 42 · 43 · 44 · 49 · **55** · **56** · **57** · **58** (`fold_clause` required) |
| **Must already be true** | P1 green vs the **new** sheet. `p` **injectable** (OD-ALGO-9). |
| **Payload** | `regime_fold_enabled: false` (**§4.1**). Clause A is computed; member-facing A-fold is not emitted. |
| **Must not paint / invent** | Any canvas. Maps for proximity/extrinsic. `$0` clamp. Missing-invert reused for below-zero. Floor applied to A. `regime_fold_enabled: true`. |

**Headless gate:** fixtures **20 / 21 / 21b / 26 / 27** pass. No paint. **27c is not this gate.**

---

### P3 — LEGACY + BINDING

| | |
|--|--|
| **Files** | `algoTrailMath.ts` · `AlertBuilderDialog.tsx` (knobs, one Reason, ALGO-N1) · adapter hook · `HostPnLChart.tsx` **legacy + high-water flags only** |
| **ATs that gate** | 1–5c · 8 (no flatten) · 9 · 10 · 11 · 14 · 16 · 20 · 21 · 23 · 25 · 29 · 30 · T1a |
| **Must already be true** | P2 headless. Keep-Warm idle law. OT-EF named state if unpriceable. |
| **Paint** | High-water + **muted legacy only**. Layer flags: high-water / legacy `on`; proposed / overlay / regime `off`; hud `off`. |
| **Must not paint / invent** | Proposed line. Approaching. Clause-A fold. Budget. Bounce trigger on Heatmap/LIM/Strike Turnover. Second Armed→In trade path. Orders. |

---

### P4 — PROPOSED LINE PAINT (still *proposed*)

| | |
|--|--|
| **Files** | `HostPnLChart.tsx` · HUD · `algoNarrate.ts` |
| **ATs that gate** | 7 · 15 · 17 (**state-conditional**) · **49b** · 22 · 31 · 35 · 41 · 46 · 46b · 47 · 48 · 53 · 54 |
| **Must already be true** | P3 legacy paints. Tango freeze of **Budget** before that row mounts. Cause short form max two tokens; collision → HUD. Overlay **off** by default. Layer flags from §4.2. |
| **Paint** | Proposed vertical labelled *proposed* when `guide_raw ≥ 0`. Caption: **“schedule (ratchets) vs live risk-vs-reward (breathes). Neither is primary.”** HUD: High · Profit · Given back · Guide. **Budget row ONLY when `guide_raw ≥ 0` and Tango has frozen the word.** Below zero: `data-algo-layer-proposed="waiting"`, `data-algo-hud="four"`, `data-algo-hud-budget="absent"`. |
| **Must not paint / invent** | Approaching object. Clause-A Fold suggested. Live Budget dollar while `guide: below zero`. Hover-only cause. `widened · high-water`. Promoting *proposed*. Setting `data-algo-guide-regime` to `clear` or `approaching`. Setting `regime_fold_enabled` true. |

---

### P5 — AZALGO-REGIME (own gate)

| | |
|--|--|
| **Files** | Guide-object regime state on the existing canvas (not a fifth widget). No `algoEval.ts`. |
| **ATs that gate** | **Fixture 27c (blocking)** · AT-ALGO-50 (fixture 20, with-line) · visual law on the P0-visual page |
| **Must already be true** | **P0-visual page on disk.** P4 proposed line paints when representable. `REGIME_NEAR_FRAC` stamped (it is). 27c handwritten on a **separate** sheet. |
| **May now** | `regime_fold_enabled: true`. Clause A produce Fold suggested. Guide row while below zero names A-only in process words: `guide: below zero · A live`. Override vs Reset named. Frozen snapshot survives override. E20 re-entry suppression named on the Guide row. `data-algo-guide-regime` = `clear` \| `approaching`. |
| **Must not paint / invent** | Clause A / approaching / Fold-suggested-from-A **before this gate**. A third untestable band. A fraction of `H` as the shipped unit. |

---

### P6 — REASON / FEED

| | |
|--|--|
| **Files** | Trader Feed host `algo-reason`. House base on `/app/alerts`. |
| **ATs that gate** | R1–R8 · 27 · 32 · 36 (scoped, whole-word, named-state strings exempt) · 45 · 47 (canvas does not wait on the model) |
| **Must already be true** | **P5-G PASS.** No B-only shortcut. |
| **Must not paint / invent** | Hold/fold recommendation. *available* / *reachable* / *chance* / *probability* / *likely*. Forbidden set in the house-prompt editor. |

Feed is the **sentence**. Canvas cause does not wait on the model.

---

### P7 — AZALGO-LIVE (own gate; last)

| | |
|--|--|
| **Files** | `web/lib/options-lab/algoEval.ts` / `tickAlgoAlert` **only this phase** |
| **ATs that gate** | **AT-ALGO-18 + live-session transcript.** No other AT may pass this gate. |
| **Must already be true** | P2 math · P4/P5 surface that would tick. Demo remains a clock (TM v0.7.4). |
| **Must not** | Restore the v1 non-demo no-op. Count a v2.0 k-line transcript. List this file on P1–P6 or P8. |

---

### P8 — BATMAN / REARM chrome (advisory)

| | |
|--|--|
| **Files** | Binding chrome already in P3; this phase is the **named flags and tape** |
| **ATs that gate** | 20 (stale-fly, Save not blocked) · 21 (free-wing, no order) · 30 (`H` reset tape) |
| **Must already be true** | P3 resolver (E4 / E19). |
| **Must not** | Send an order. Guess `working_side` when ambiguous. Carry `H` across sides. |

May run after P3; must not delay P5–P7.

---

## 6. File list (do not add keys outside Appendix A)

| Path | Phase |
|------|-------|
| `web/lib/options-lab/algoConfig.ts` | P1 |
| `web/lib/options-lab/algoMoveUnit.ts` | P1 |
| `web/lib/options-lab/algoProfitAtRisk.ts` | P1 |
| `web/lib/options-lab/algoProbability.ts` | P2 |
| `web/lib/options-lab/algoGexNorm.ts` | P2 |
| `web/lib/options-lab/algoHoldFold.ts` | P2 (`regime_fold_enabled` defaults false) |
| `web/lib/options-lab/algoTrailMath.ts` | P3 |
| `web/lib/options-lab/algoNarrate.ts` | P4 |
| `HostPnLChart.tsx` / HUD | P3 legacy flags · P4 proposed / HUD flags · P5 regime flags |
| `AlertBuilderDialog.tsx` / `AnalyzerControlsColumn` / adapter | P3 |
| `web/lib/options-lab/algoEval.ts` | **P7 only** |
| `agents/p-az-algo/evidence/AZALGO-REGIME-visual-law.md` | P0-visual |
| `agents/p-az-algo/evidence/ALGO-B-v2.3.3-goldens.md` | P0b (no 27c) |
| `agents/p-az-algo/evidence/ALGO-B-v2.3.3-fixture-27c.md` | P5 evidence |

Any new `LABS_ALGO_*` key is a **spec revision**, not a build detail. `REGIME_NEAR_PCT` is retired; presence aborts boot.

---

## 7. Golden procedure (Hotel)

Hand-compute **before** `algoHoldFold.ts` exists. Implementation consumes the sheet; it does not author it. `p` is an **INPUT** on rows **5–8, 20, 21, 21b, 24**. Do not derive it.

**Columns on every row (§4.5):** `HORIZON_MIN`, `WINDOW`, `MOVE_SIGMA`, `fold_clause`, `H/ceiling`.

**Re-record** (inputs from v2.2.x sheet survive; guide values do not): **1–8, 17, 18** under `guide_raw = H − p×headroom`. Rows **5 / 6 / 7** recast onto `p`. **9–16** are state rows — not re-recorded.

**New / required rows on the P0b sheet:**

| # | Law |
|---|-----|
| **1** | Dimensional + **signed `m_adv`** proof. Units written out. AT-ALGO-6d · 51. |
| **19** | `H` not `U`. Same `U`, different `H` if that is AT-ALGO-40. |
| **20 / 21 / 21b** | **One fly.** **Mid-`H` (~60–70% of ceiling), not apex-at-peak.** 20 and 21 differ **only in `p`**. 21b may vary `U` and wing greeks (table is law; the "all three share one `U`" sentence is **struck**, E47). |
| **20 PaR** | Stated greeks `Δ=$5/pt`, `Γ=−$28/pt²`, `m_adv=−4` → **PaR = $244**, not $204. `$204` was `5(+4) + ½(−28)(16)` — the Δ term with an **unsigned** `m_adv`, an instance of **E39** inside the fixtures that prove E39. Relations survive: `$50 < $178 ≤ $244`. Write **$244**. Do not change `Δ` to rescue the old number. |
| **22a** | Five ticks at `T/5`; narrate on tick **5**, not tick 6. |
| **22b** | Widen-revert never posts; net tightening through reversal does. |
| **23** | `H` up → headroom **shrinks**, guide **tightens**. |
| **24** | `E(t)` null → `extrinsic_factor=1.0`, named, `p` still an input. |
| **25** | Wick. No *available* / *reachable*. |
| **26** | `headroom=0`, `guide_raw=H` exactly, both clauses, `fold_clause: "regime"`, `fold_clause_both: true`. |
| **27** | `guide_raw < 0` at the gate. WAITING, no invert, no $0 clamp, overlay off, B silent, A evaluated, `guide: below zero`. Budget **does not mount**. |

**Not on the P0b sheet:**

| # | Law | Where |
|---|-----|-------|
| **27c** | From 27, into an **A-fold** while `guide_raw` stays negative. `approaching` dwells **>1 tick**, then Fold suggested, `fold_clause: "regime"`. Threshold `0.10 × max(p×headroom, at_risk)`. | **P5 evidence sheet.** Constructable now that `REGIME_NEAR_FRAC` is stamped. Does not hold P0b open. |

20/21/21b construction note (spec, mid-`H`): apex-at-high-`H` pushes `PaR` above `P_MAX × headroom` so 20 and 21 both fold on A — a finding, not a golden to adjust. Keep `PaR` inside `(p_low × headroom, p_high × headroom]`.

If 20 or 21b cannot be built from the spec as written: **finding against the spec — raise and stop.**

---

## 8. AT punch list

Re-derived against v2.3.3 §17. **Checked the file. Assumed nothing landed from v4.0's list.**

### 8.1 Landed in spec (v2.3.3) — keep; do not re-derive

v1 ATs that still hold: **1–16 · 20–23 · 25 · 27–32 · T1a · R1–R8**.

Hold/fold and errata ATs now in §17:

| AT | Notes (file, not memory) |
|----|--------------------------|
| 6, 6b (`≤`, except 26), 6c, 6d, 6e, 6f | 6b strict except fixture 26 |
| 17 | **Rewritten (E46).** State-conditional HUD. Four below zero, five above. |
| 18 | Live eval. P7 only. |
| 19 (risk-side grep) · 19b (no `σ_T` on `p`) | |
| 24 · 26 · 33 · 34 · 35 | |
| 36 | **Rewritten (E47).** Whole-word. Exempt `gex: unavailable`, `p: extrinsic unavailable`, `guide: below zero`. Legacy `%` knobs legal. |
| 37–45 · 46 (five-tick) · 46b · 47 · 48 | Short-form cause is `tightened · high-water` (E47). |
| 49 | Below-zero **line** (fixture 27). |
| **49b** | **New.** Budget does not mount below zero. |
| 50 | **Rewritten (E45).** Dwell > 1 tick on **27c**. Threshold is `REGIME_NEAR_FRAC × max(p×headroom, at_risk)`. Fixture 20 is the with-line case. |
| 51 · 52 · 53 · 54 | 52 = keys separate. **Does not** assert √T scaling. |
| **55** | **New.** Missing invert does not suppress clause A. |
| **56** | **New.** E23 floor does not bind clause A. |
| **57** | **New.** Spot-unchanged verdict flip. |
| **58** | **New.** Fold payload completeness (`fold_clause`, `H`, `U`, `giveback`, `p×headroom`, `at_risk`, `move_unit`, `guide_raw`, `MOVE_HORIZON_MIN`). |
| **59** | **New.** √T dimensional: hold `WINDOW`, `HORIZON` 3 → 12, `move_unit` × **2.0**. |

**New fixture in spec:** **27c** (27-continuation). Gates **P5**, not P0b.

**Not stale in v2.3.3** (v4.0's P0 list, now closed): AT-ALGO-17, E3 four-vs-five, AT-ALGO-36 substring, short-form `widened · high-water`, §14.5 “fit `p`”, row 20 PaR $204, `REGIME_NEAR_PCT = 2% of H` as the shipped unit.

### 8.2 Added by plan (not in the spec)

| Item | Phase | Asserts |
|------|-------|---------|
| **`regime_fold_enabled` default false** | P2 payload · P5 flips true | Headless 20/26/27 still compute A. Member-facing A-fold, adapter emit, and Feed A-fold are **absent** until P5-G. Not an Appendix A key. |
| **`HostPnLChart` layer flags / testids** | P3 / P4 / P5 | §4.2 table. P3 must not light proposed/regime/budget. P4 must not light regime. |
| **P6 after P5, strictly** | DAG | No B-only Feed shortcut. |
| **P0-visual one-pager** | P0-visual → blocks P5 | Token, touch fallback, dwell, E15 ceiling. |
| **Golden columns** | P0b | `HORIZON_MIN`, `WINDOW`, `MOVE_SIGMA`, `fold_clause`, `H/ceiling` on every row. |
| **27c on a separate sheet** | P5 | Does not sit on the P0b sheet. |

No further ATs are invented here. If a plan AT needs a spec number, that is a spec revision, not a P1 surprise.

---

## 9. Risks (named, not solved in this DAG)

1. **Clause A at high-`H` apex vs §14.3.** Even at stamped horizon 3, A always-fires at 80% of ceiling on the stated `Γ=−$28/pt²`. That is exactly the top-band cut §14.3 calls a worse line. This plan does not fit the pair. §14 reports A and B **separately** (OD-ALGO-10). A clause that does all the damage, or none, is a finding — not a golden to adjust.

2. **Session-net GEX ≠ local §0.2.8.** `gamma_factor` is a percentile of session-net GEX. Coach asked about gamma *around the position*, a heavy strike at the centre, air in the drift direction. A session can be net-positive while the body sits in a hole. Spec already names this (OD-ALGO-4). Do not present the scalar as the local read. Six-vendor comparison owns the upgrade — **not this DAG**.

3. **Two-line teaching inversion.** Legacy is muted and **ratchets**. Proposed is full weight and **breathes**. If the muted ratchet is read as the stop, members flatten on the beginner line and ignore the live one — or the reverse. Caption law (§9.3 / AT-ALGO-54) is load-bearing: *schedule (ratchets) vs live risk-vs-reward (breathes). Neither is primary.* P4 must ship that caption without hover.

4. **E38 × E41, now with a working denominator.** Modal Managing is A-only and `guide_raw < 0`. The 2%-of-`H` window is **gone**. 0.10 of `max(p×headroom, at_risk)` holds 14–28% across the span. P5 still does not start on P4 chrome: the warning has to **dwell**, and it has to be a state of the Guide object. Surprise A-fold remains the trust failure if P5 is bundled.

5. **Budget as authority.** `p×headroom` in dollars is the right quantity and an unvalidated model output. Hidden below zero. *Proposed* posture. Tango before P4.

6. **`regime_fold_enabled` is plan isolation, not law.** A builder who "just emits Fold suggested whenever A is true" has implemented the spec slogan and skipped P5. The flag exists so that skip is a **test failure**, not a review comment.

---

## 10. What this plan will not do

- Write TypeScript, invent goldens, or mark a phase READY because a formula looks right.  
- Call the proposed line primary, or hide the legacy line, before §14.  
- Treat `AZALGO-W0` or v2.0 P1–P4 PASS as covering this model.  
- Start P1 before P0b numbers are handwritten and a **new** GO token exists.  
- Paint clause A, approaching, or Fold-suggested-from-A before AZALGO-REGIME.  
- Paint a live Budget dollar while `guide: below zero`.  
- Clamp `guide_raw` to $0 or reuse missing-invert for below-zero.  
- Invent `proximity_factor` / `extrinsic_factor` maps, or a Γ-conditional horizon (FI-048).  
- Implement memo Part III.14 / §0.2.14 `H − k × PaR`. `ALGO_K_` greps to zero.  
- Encode the bounce trigger on Heatmap / LIM / Strike Turnover. A second Armed→In trade path while `manual_confirm` is set.  
- Flatten, stop out, or send a broker order.  
- Put expected move on the risk side, or Archive Lab `σ_T` into `p`.  
- List `algoEval.ts` on any phase but P7.  
- Keep `REGIME_NEAR_PCT` as a readable key (presence **aborts boot**).  
- Wait on an E41 unit pick that is no longer a branch.  
- Hold the P0b sheet open on fixture 27c.  
- Start P6 before P5-G.  
- Add `LABS_ALGO_*` keys outside a spec revision — including no env key for `regime_fold_enabled`.  
- Bundle P5 or P7 into a neighbor phase because a file was already open.  
- Treat DL-672 as in-scope product work. The template now boots; P1 is config + risk math, not another bootstrap packet.
