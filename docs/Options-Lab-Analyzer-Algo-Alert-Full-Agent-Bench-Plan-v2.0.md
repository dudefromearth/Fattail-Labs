# Analyzer Algo Alert — Full Agent Bench Plan v2.0

**Date:** 2026-09-03  
**Plan revision:** **v2.0 UNSTAMPED**  
**Canonical filename:** `docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**W0 artifact:** [`agents/go/AZALGO-W0.md`](../agents/go/AZALGO-W0.md) — Delta reads **this file**, not chat (**DL-328**).  
**Board:** [`agents/p-az-algo/`](../agents/p-az-algo/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**This is a new plan.** It is **not** a W5 bolted onto v1.0.3.

| Record | Path | Role |
|--------|------|------|
| **Working plan** | this file **v2.0** | P0–P6. UNSTAMPED until `AZALGO-W0` is GO. |
| **W1–W4 as-built** | [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md`](./Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md) **v1.0.3** | Keep on disk. Do not execute remaining W5–W-G against it. Do not re-seed W1–W3. |

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **AZ-ALGO Spec v2.2.2** | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.2.md) | **PRODUCT-LAW DRAFT.** E1–E24. sha1 at land **`b757ba3f4b3816fcaebae857aeda70dff488ecdc`**. **Not BUILD AUTHORITY until `AZALGO-W0` is GO.** |
| AZ-ALGO v2.2.1 | [`…Spec-v2.2.1.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.2.1.md) | **SUPERSEDED as law.** Frozen text for fixtures **1–16** (sha1 `6f491ee8f240aa06418b8e813fdb3152ed60deb5`). |
| AZ-ALGO v2.0 | [`…Spec-v2.0.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v2.0.md) | SUPERSEDED. Arming memo seating. **DL-660**. |
| AZ-ALGO v1.0.16 | [`…Spec-v1.0.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) | SUPERSEDED as product law. **As-built** of W1–W4 (Demo-only trail). |
| Appendix B goldens | [`agents/p-az-algo/evidence/ALGO-B-appendix-b-goldens.md`](../agents/p-az-algo/evidence/ALGO-B-appendix-b-goldens.md) | Handwritten **1–18**. Hotel. Before any `algoProfitAtRisk.ts`. |
| OT-EF / DL-309 | Doctrine | No invented debit, trail, or greeks. Named state or representable. |
| Keep-Warm v0.1.2 | Viewport cadence | Idle = no heavy resolve; pulse is paint. |
| HI Spec v1.0 | Tokens / 44pt / floatable Modal | Dark-pinned work-surface. |
| Trader Feed v0.1.3 | TF · DL-514 · DL-517 | Host `algo-reason`. Allowlist only (E16). |
| Arch 28 | One **market** WS | No client Massive. |

**Spec status:** v2.2.2 **DRAFT**. **P0-0 GO** is the stamp on `AZALGO-W0.md`. Do not fire P1 until that file is GO **and** P0-G PASS.

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**Coach may overrule** a specialist finding via **DL entry with reasoning** — that is **not** a gate waive.

**Juliet does not invent WHAT.** Coach wrote AZ-ALGO §0. Hotel wrote goldens 1–18. This plan only **sequences**.

---

## 0. Why this program exists

v1.0.3 built a **Demo-only** narrative trail (W1–W4 PASS). Product law is now **v2.2.2**: Armed (no fill) → In trade → Managing; advisory **guide** never flatten; GEX as management; profit-at-risk (`Δ·m_adv + ½Γ·m_adv²`) with defensive `k`; dual teaching lines; live eval is law (**AT-ALGO-18**).

As-built `tickAlgoAlert` no-ops when `algo.demo === false`. That is a **fail** under v2, not a feature. E17 forbids folding live eval into another phase’s file table.

v1.0.3 cannot absorb PaR modules, the HUD **Guide** row, Trader Feed allowlist, or a dedicated live-eval gate. Stretching it would mix two products on one DAG.

---

## 0.1 Product decisions (this program)

Lock at P0-0 except where the token already records a disposal.

| ID | Decision | Source | State |
|----|----------|--------|-------|
| **A1** | Advisory guide. Never flatten. Debit bounds loss. | §0.2 · §1 | LOCK at GO |
| **A2** | States: Armed → In trade → Managing → Fold suggested (override returns Managing). | §4 | LOCK at GO |
| **A3** | HUD fourth row **Guide**. Payload `guide_print`. AT-ALGO-17 = Guide. | **OD-ALGO-1 DISPOSED** | **LOCKED** |
| **A4** | Computed line labelled **proposed** until Spec §14. Both lines paint. | E8 · AT-ALGO-22 | LOCK at GO |
| **A5** | PaR = `max(0, −pnl_change_adv)`. `trail_level = H − k×PaR` then E23 floor. | E1 · E10 · E23 | LOCK at GO |
| **A6** | `k = clamp(k_base × gamma_factor × proximity_factor, 1.0, 2.5)` defensive. Achievable `[0.84, 2.34]`. | E2 | LOCK at GO |
| **A7** | Live eval is **P5**. Only exit AT-ALGO-18. | E17 | LOCK at GO |
| **A8** | Appendix A keys fail-loud. No silent default. | AT-ALGO-26 | LOCK at GO |
| **A9** | Fixtures 1–16 frozen on v2.2.1 `6f491ee8…`. 17–18 on v2.2.2. | ALGO-B | LOCK at GO |
| **A10** | §14 validation is **not** this DAG’s close. This GO does not promote “proposed”. | §14 · E8 | LOCK at GO |

**OD-ALGO-2 / 3 / 4 stay open** (after §14.5 · trigger formula · six-vendor GEX). **OD-ALGO-5** (VP overlay FI-031) is out of this spec.

---

## 1. Mission

```text
P0  token + plan stamp · seeds on disk · goldens verified against landed spec
P1  algoConfig + algoMoveUnit + algoGexNorm + algoProfitAtRisk
    vs handwritten fixtures 1–18. No UI.
P2  gate, risk_taken incl. Batman, legacy trail, E23 floor
P3  canvas + HUD Guide + freeze-on-fold + muted legacy + reduced motion
P4  Trader Feed allowlist (algo-reason)
P5  LIVE EVAL — own phase — only exit AT-ALGO-18 (E17)
P6  docs, DL, close
```

**First smoke (after the packet that claims it):**

| After | Smoke |
|-------|--------|
| **P1-G** | `npx tsx` / vitest: fixtures 1–18 match the hand sheet. Fixture 2 PaR **128 > 72** fixture 3. Fixture 17 floor binds at 750, morning 700.48 unfloored. Fixture 18 PaR **144**. AT-ALGO-26 abort on missing key. No UI import. |
| **P2-G** | Gate on `risk_taken` (Batman per side; ambiguous paints nothing). Legacy `S=(1−g)×H` clock-only when `E(t)` null. Floor formula (c) only. `H` resets on side switch. Override suppresses re-fire `REENTRY_BARS`. |
| **P3-G** | HUD **High · Profit · Trail · Guide**. Freezes on Fold suggested. Proposed labelled *proposed*. Legacy muted. `prefers-reduced-motion` kills pulse. Position not closed. |
| **P4-G** | Feed host `algo-reason` mounts. Allowlist only. AT-ALGO-27 / 32. No hold/fold recommendation. |
| **P5-G** | **AT-ALGO-18 alone:** `tickAlgoAlert` evaluates on the live raw mark with `algo.demo === false`, proven with a live-session transcript. |
| **P6-G** | Docs parity. Spec still says *proposed*. §14 not claimed. |

---

## 2. As-built honesty

### 2.1 Keep (do not rebuild)

| Area | Path / fact |
|------|-------------|
| W1 trail math (v1 `f` / invert / pulse hysteresis) | Executed · W1-G PASS. Legacy path **kept** as the teaching line. Do not re-seed. |
| W2 Builder Algo type · adapter · **+** pulse | Executed · W2-G PASS |
| W3 narrative window | Executed · W3-G PASS |
| W4 canvas dashed pair + overlay | Executed · W4-G PASS (paint-only vs Packet A / C2) |
| `upsertAlert` `alert_class: algo` | As-built |
| One market WS · OPF-held chain | Arch 28 · DL-309 |
| Demo clock | DL-485 / DL-488 — Demo is a **clock**, not an eval gate |

### 2.2 Build (this program)

| Gap | Spec | Phase |
|-----|------|-------|
| GO token · plan stamp · seeds · goldens vs sha1 | §18 · Appendix B | **P0** |
| `algoConfig.ts` fail-loud Appendix A | AT-ALGO-26 | **P1** |
| `algoMoveUnit.ts` estimator + min-samples WAITING | E11 · AT-ALGO-6e | **P1** |
| `algoGexNorm.ts` percentile + empty-history | E5 · E11 · AT-ALGO-24 | **P1** |
| `algoProfitAtRisk.ts` PaR · k · E23 floor bind · E24 tie-break | E1 · E2 · E10 · E23 · E24 | **P1** |
| Gate · `risk_taken` · Batman · `H` reset · override re-entry · legacy `S` | E4 · E6 · E19 · E20 · AT-ALGO-5* | **P2** |
| HUD Guide · freeze-on-fold · muted legacy · reduced motion · both lines | E3 · E8 · E13 · E15 · AT-ALGO-17 | **P3** |
| Trader Feed allowlist | E12 · E16 · AT-ALGO-27/32 | **P4** |
| Live eval `algoEval.ts` / `tickAlgoAlert` live path | E17 · **AT-ALGO-18** | **P5** |
| DL · AGENTS · Arch pointer · help | docs parity | **P6** |

### 2.3 Explicit non-phases

| ID | Out |
|----|-----|
| **NX1** | Broker / Tradier / paper flatten |
| **NX2** | Expected move as a trail input (AT-ALGO-19 grep) |
| **NX3** | Encoding the bounce trigger as Heatmap / LIM / Strike Turnover (E14) |
| **NX4** | Analyzer VP overlay (FI-031) — OD-ALGO-5 out |
| **NX5** | Shipping proposed-only (hiding legacy) before §14 |
| **NX6** | Promoting “proposed” to “primary” in this DAG |
| **NX7** | Model-generated hold/fold recommendation (E16) |
| **NX8** | Inventing a Batman working side when ambiguous |
| **NX9** | BWB / condor / vertical as this algo |
| **NX10** | MSC Trailing / 0DTE placeholder tabs |
| **NX11** | Per-widget Massive or a second market WS |
| **NX12** | Touching `algoProfitAtRisk.ts` / `algoMoveUnit.ts` / `algoGexNorm.ts` **before P1** |
| **NX13** | Listing `algoEval.ts` in P1–P4 (E17) |
| **NX14** | Re-seeding W1–W3 · executing leftover W5–W-G on v1.0.3 |
| **NX15** | MiniTwo unless Coach asks a deploy |
| **NX16** | Fusing LIM / Strike Turnover / SVP into `k` |
| **NX17** | Opening a code file before `AZALGO-W0` is GO |

---

## 3. Open decisions

| # | Question | Owner | This stamp |
|---|----------|-------|------------|
| **OD-ALGO-1** | HUD Guide vs Stop | Coach | **DISPOSED: Guide** (token) |
| **OD-ALGO-2** | `k` constant vs regime | Coach, after §14.5 | Open. Constant `k_base` until fitted. |
| **OD-ALGO-3** | Entry trigger formula | Coach · Hotel | Open. `manual_confirm` under E9. |
| **OD-ALGO-4** | Six-vendor GEX into `gamma_factor` | Coach | Open. Percentile as specified. |
| **OD-ALGO-5** | Analyzer VP overlay | Juliet | **Out of this spec.** |

---

## 4. Roster & seating

| Callsign | Role |
|----------|------|
| **Coach** | P0-0 GO · OD-ALGO-* · ship/no-ship · §14 later |
| **Juliet** | Board · seeds · DAG · E17 isolation of P5 · DL-539 line |
| **India** | Spec integrity · sha1 · E1–E24 still in force · no geometry reopen |
| **Hotel** | Goldens 1–18 ownership · P1 arithmetic vs hand sheet · no invented structure |
| **Charlie** | P1 modules · P2 trail · P3 canvas/HUD · P5 live tick |
| **Echo** | HUD Guide · freeze · muted legacy · reduced motion · overlay |
| **Tango** | Copy freeze (Guide) · AT-ALGO-27 scan list · Feed process words · no forecast |
| **Kilo** | ATs per phase · P5 transcript for AT-ALGO-18 |
| **Delta** | Phase gates ternary. **P0-G reads `AZALGO-W0.md`.** |
| **Lima** | DL GO + sha1 · AGENTS · Arch pointer · help |
| **Mike** | No new trust boundary; live eval is existing mark path |

| Seat | Rule |
|------|------|
| **S1** | Juliet owns DAG · NX · P5 isolation |
| **S2** | India spec / hash / no E1–E22 reopen |
| **S3** | Charlie pure modules before UI |
| **S4** | Hotel goldens are the P1 oracle — implementation does not write them |
| **S5** | Echo HIG · HUD Guide · freeze |
| **S6** | Tango observation-only · Guide copy |
| **S7** | Kilo AT-ALGO* at the phase that owns them |
| **S8** | Delta all gates |
| **S9** | Lima DL + hash |
| **S10** | Seeds on disk before the phase gate |
| **S11** | No product code until GO |

---

## 5. Sacred invariants (this program)

1. No MSC. No client Massive. One market WS.  
2. **OPF-held dual-side chain only** (DL-309). Named state or representable.  
3. The algo **does not flatten**. Fold suggested is a tape post (E18).  
4. HUD fourth row is **Guide**. Key `guide_print`.  
5. Line is **proposed** until §14. Both lines.  
6. PaR ≥ 0. `trail_level < H` on every numeric fixture. Apex PaR **strictly larger** than wing (E1: 128 > 72).  
7. Floor formula **(c)** only. Not (a), not (b).  
8. Appendix A is the **only** key list. Missing key aborts load.  
9. Goldens handwritten **before** the modules exist. P1 tests consume the sheet; they do not author it.  
10. Fixtures 1–16 stay on v2.2.1 `6f491ee8…`.  
11. Live eval is P5. AT-ALGO-18 is that phase’s **only** exit.  
12. `algoEval.ts` is not a file of P1–P4.  
13. Time remaining reaches **only** the legacy floor, never `k` (E21).  
14. Coach Part II vocabulary is intent, not chrome (E12).  
15. Feed measurements only — no recommendation (E16).  
16. Delta ternary; Coach overrule needs DL.  
17. Docs parity at P6.  
18. P1 does not fire without `AZALGO-W0` GO **and** P0-G. DL-539 three-OK or reassignment if IKI remains the listed active program.  
19. Juliet does not invent WHAT.

---

## 6. Technical design (implementers)

### 6.1 Expected files

| Path | Action | Phase |
|------|--------|-------|
| `web/lib/options-lab/algoConfig.ts` | **New** — parse Spec Appendix A; throw naming the key | **P1** |
| `web/lib/options-lab/algoMoveUnit.ts` | **New** — realized-move estimator; min-samples → unmeasured | **P1** |
| `web/lib/options-lab/algoGexNorm.ts` | **New** — percentile window; empty / warming / unavailable | **P1** |
| `web/lib/options-lab/algoProfitAtRisk.ts` | **New** — `m_adv`, PaR, `k`, clamp, E23 `floor_active`, E24 at-body max | **P1** |
| `web/lib/options-lab/algoTrailMath.ts` | **Extend** — gate, `risk_taken` (Batman), legacy `S`, invert, threaten, `H` reset, override re-entry | **P2** |
| `web/components/options-lab/HostPnLChart.tsx` (and HUD) | High-water, proposed, legacy muted, overlay, HUD **Guide**, freeze on fold | **P3** |
| Trader Feed host `algo-reason` | Allowlist fields only | **P4** |
| `web/lib/options-lab/algoEval.ts` / `tickAlgoAlert` live path | **P5 only** | **P5** |
| Spec / Arch / DL / help | Lima · India | **P6** |

**Do not** dump PaR into `HostPnLChart`. Pure modules, one call site. **Do not** open these files before GO.

### 6.2 Dimensional law (P1)

| Quantity | Unit |
|----------|------|
| Δ | $/pt (package) |
| Γ | $/pt² (package) |
| `move_unit`, `m_adv` | pt |
| `H`, PaR, `trail_level`, `floor`, `proposed_raw` | $ |
| `k`, factors | dimensionless |

`m_adv` is the **signed** adverse displacement (Hotel). Per-share greeks reaching PaR are a **named state**, not a silent 100×.

```
pnl_change_adv = Δ·m_adv + ½Γ·m_adv²
PaR            = max(0, −pnl_change_adv)
k              = clamp(k_base × gamma_factor × proximity_factor, 1.0, 2.5)
proposed_raw   = H − k×PaR
floor_active   = remainingToDecayEnd ≤ LABS_ALGO_FLOOR_REMAINING_H   (default 1.0 h)
floor          = (1 − gMin)×H
trail_level    = proposed_raw                         if not floor_active
               = max(proposed_raw, floor)             if floor_active
```

At body, both directions are adverse; take the **larger** PaR (E24).

### 6.3 Sequence

```text
OPF-held fly + live (or Demo) mark
  → algoMoveUnit / algoGexNorm     // unmeasured → WAITING (proposed) / named GEX
  → algoProfitAtRisk               // PaR, k, floor (c)
  → algoTrailMath                  // gate, H, legacy S, fold, override
  → canvas + HUD Guide             // P3
  → Feed allowlist                 // P4
  → tickAlgoAlert live             // P5 — not before
```

### 6.4 Hotel goldens (already on disk)

| # | Claim |
|---|-------|
| 1 | Dimensional proof. PaR 80 $. trail 630 $. |
| 2 | Apex. PaR **128 $**. trail 808 $. |
| 3 | Same fly, wing. PaR **72 $**. E1: 128 > 72. |
| 4 | Put mirror of 1. |
| 5 | k **2.34**. trail 562.8 $. |
| 6 | k_raw 0.84 → clamp **1.0**. trail 670 $. |
| 7 | Interior k **1.8**. trail 606 $. |
| 8 | GEX unavailable. gamma_factor 1.0. line paints. |
| 9 | Δ/Γ unmeasured. proposed WAITING. legacy paints. |
| 10 | Batman working side resolved. |
| 11 | Batman ambiguous. no guide. |
| 12 | E(t) null. legacy S 550 $. clock-only. |
| 13 | 6 bars < MOVE_MIN_SAMPLES. proposed WAITING. |
| 14 | n_gex 12 < 30. warming chrome persists. |
| 15 | Side switch. H resets. |
| 16 | Override. no re-fire. `guide: overridden`. |
| 17 | Floor binds: proposed **750 $**; legacy 700 $; morning 700.48 unfloored. |
| 18 | At-body Δ=2. PaR_up 112 ≠ PaR_down 144. PaR **144 $**. trail 784 $. |

P1 **fails** if any numeric cell disagrees with this sheet.

---

## 7. Phase DAG

```text
Critical path:

P0 ──► P1 ──► P2 ──► P3 ──► P4 ──► P5 ──► P6
                      │              │
                      └── HUD/canvas ┘
                                     P5 must not start because P3 “needs a live tick”

Off path (never drawn into P5):

§14   validation / k fit / regime     — later program; E8 holds
FI-031 Analyzer VP overlay            — OD-ALGO-5
W5–W-G of v1.0.3                      — retired as leftover; ATs re-homed below
```

| Phase | Name | Depends | Exit |
|-------|------|---------|------|
| **P0** | Token · seeds · goldens vs landed spec | — | Coach P0-0 **then** P0-G |
| **P1** | Config + move + GEX-norm + PaR. **No UI.** | P0-G | P1-G |
| **P2** | Gate · Batman · legacy · floor | P1 | P2-G |
| **P3** | Canvas + HUD Guide + freeze + muted + reduced motion | P2 | P3-G |
| **P4** | Trader Feed allowlist | P3 (chrome copy may start after P0-0) | P4-G |
| **P5** | **LIVE EVAL** | P2 (math) · P3 (surface that would tick) | **P5-G = AT-ALGO-18 only** |
| **P6** | Docs · DL · close | P1–P5 | P6-G · Coach close |

**P0-G + P0-0 block all code.** P1 is the first file-touching implementation phase.

**P4 and P5 do not merge.** A Feed post is not live-eval evidence.

---

## 8. Phases, seeds, gates

Seeds live under [`agents/p-az-algo/seeds/`](../agents/p-az-algo/seeds/). **v1 W0–W6 seeds stay** as the W1–W4 record. Juliet writes **P0–P6 seeds after P0-0**. Do not invent a parallel board. Do not paste v1.0.2 + plan v1.0.3 into a P* seed.

### Phase P0 — Token, seeds, goldens verified

| Seed | Agent | Intent |
|------|-------|--------|
| **P0-0** | Coach | Stamp [`agents/go/AZALGO-W0.md`](../agents/go/AZALGO-W0.md). Spec v2.2.2 BUILD AUTHORITY. Plan v2.0 accept. OD-ALGO-1 already DISPOSED Guide. |
| **P0-1** | Juliet | P* seeds on disk. Cite spec v2.2.2 sha1 `b757ba3f…`. Cite goldens path. E17 P5 isolation in every seed. |
| **P0-2** | Hotel · India | Goldens 1–18 still match the landed spec. 1–16 still match v2.2.1 `6f491ee8…`. 17–18 still match E23 (c) and E24. No value rewritten. |
| **P0-3** | Lima | DL-663 stamp block ready (sha1, OD-ALGO-1, plan v2.0). |
| **P0-G** | Delta | Token is **GO**. sha1 on the token matches the spec file. Fixtures 1–18 on disk handwritten. Seeds P0–P6 named and present. No code opened. |

### Phase P1 — Pure calculation (no UI)

| Seed | Agent | Intent |
|------|-------|--------|
| **P1-0** | Charlie | `algoConfig.ts` + `algoMoveUnit.ts` + `algoGexNorm.ts` + `algoProfitAtRisk.ts`. No React. No `HostPnLChart`. No `algoEval.ts`. |
| **P1-1** | Kilo | Fixtures 1–9, 13, 14, 17, 18 as tests. AT-ALGO-6b/6c/6d/6e/19/26/28/33/34/24. |
| **P1-2** | Hotel | Arithmetic equals the hand sheet. E1 128>72. Floor (c) not (a)/(b). At-body max. Units. |
| **P1-G** | Delta · Hotel · Kilo | 1–18 green. Grep expected-move = 0 in these modules. Grep session-clock = 0 in `algoProfitAtRisk.ts`. |

### Phase P2 — Gate, Batman, legacy, floor wiring

| Seed | Agent | Intent |
|------|-------|--------|
| **P2-0** | Charlie | `algoTrailMath.ts`: `risk_taken`, Batman working_side / ambiguous, gate, legacy `S`, E23 apply, `H` reset, override `REENTRY_BARS`. |
| **P2-1** | Kilo | AT-ALGO-5 / 5b / 5c / 6 / 8 / 10 / 16 / 23 / 25 / 29 / 30. Fixtures 10–12, 15–16. |
| **P2-G** | Delta · Hotel | Gate per side. Ambiguous paints nothing. Legacy clock-only named. No flatten. |

### Phase P3 — Canvas + HUD Guide

| Seed | Agent | Intent |
|------|-------|--------|
| **P3-0** | Echo · Charlie | HUD **High · Profit · Trail · Guide**. Freeze on Fold suggested. Proposed labelled *proposed*. Legacy muted token. Overlay default off. |
| **P3-1** | Tango · Echo | Copy freeze Guide. AT-ALGO-27 scan list. No Stop on the fourth row. |
| **P3-2** | Charlie | `prefers-reduced-motion` kills pulse (AT-ALGO-31). Overlay density still conveys threat. |
| **P3-G** | Delta · Echo · Tango | AT-ALGO-7 / 17 / 22 / 31. Fourth row reads Guide. Position stays. |

### Phase P4 — Trader Feed allowlist

| Seed | Agent | Intent |
|------|-------|--------|
| **P4-0** | Charlie | Mount TF host `algo-reason`. §10.1 allowlist only. |
| **P4-1** | Tango | Process words. No wall/flip/pin as chrome. No hold/fold recommendation. |
| **P4-G** | Delta · Tango | AT-ALGO-R1…R8 as they still apply · AT-ALGO-27 · AT-ALGO-32. |

### Phase P5 — LIVE EVAL (E17)

| Seed | Agent | Intent |
|------|-------|--------|
| **P5-0** | Charlie | `algoEval.ts` / `tickAlgoAlert`: evaluate on live raw mark when `algo.demo === false`. Demo remains a clock. |
| **P5-1** | Kilo | **AT-ALGO-18 only.** Live-session transcript. Non-demo no-op is FAIL. |
| **P5-G** | Delta | **PASS iff AT-ALGO-18.** No other AT may pass this gate. |

### Phase P6 — Docs close

| Seed | Agent | Intent |
|------|-------|--------|
| **P6-0** | Lima | DL close · AGENTS · Arch pointer · help / member strings. Spec still *proposed*. |
| **P6-1** | India | Spec changelog if as-built drifted; hash still matches GO or new DL. §14 not claimed. |
| **P6-G** | Delta · Lima | Docs parity. NX5/NX6 still hold. |

---

## 9. Characterization (owned by phase, not a leftover W5)

v1 ATs that still hold keep their numbers. New ATs stay with the phase that can fail them.

| Phase | ATs |
|-------|-----|
| **P1** | 6b · 6c · 6d · 6e · 19 · 24 · 26 · 28 · 33 · 34 |
| **P2** | 5 · 5b · 5c · 6 · 8 · 10 · 16 · 20 · 21 · 23 · 25 · 29 · 30 · T1a |
| **P3** | 1 · 4 · 7 · 12 · 14 · 15 · 17 · 22 · 31 |
| **P4** | 9 · R1…R8 · 27 · 32 |
| **P5** | **18 only** |
| **As-built keep (already PASS; re-assert if the file is touched)** | 2 · 3 · 11 · 13 |

Hotel / India: no second pricer; no expected move; no silent 100×; no invented Batman side.

---

## 10. First-principles / Coach Content Law

1. Build on W1–W4. Do not rewrite the Builder or the dashed-pair grammar.  
2. Three genuine failures on PaR sign → return to E1 (adverse-move **loss**, apex widest). Do not “fix” by putting the guide above `H`.  
3. Sunk Demo-only eval is not an argument against P5.  
4. Evidence over assertion — P5 is a transcript, not a unit test of a stub.  
5. Coach Content Law: §0.1 and §0.2 stay. §0.2 wins where they name the same thing; v1 names map, they are not erased.  
6. The vision is Coach’s. Dual lines, Batman, live eval, Guide — not a smaller ship.

---

## 11. What “done” is not

- A green P1 against numbers the implementation invented.  
- HUD still saying Stop.  
- Live eval smuggled into P2 “because tickAlgoAlert was open”.  
- “Proposed” dropped from the label because it looked finished.  
- §14 cited as closed.  
- A chat “go” with `AZALGO-W0` still UNSTAMPED.

---

## 12. Changelog

| Ver | Date | Notes |
|-----|------|-------|
| **v2.0** | 2026-09-03 | New plan for AZ-ALGO v2.2.2. P0–P6. Live eval isolated (E17). HUD Guide (OD-ALGO-1). UNSTAMPED with `AZALGO-W0`. |
| v1.0.3 | 2026-08-20 | W1–W4 as-built record. Kept on disk. |
