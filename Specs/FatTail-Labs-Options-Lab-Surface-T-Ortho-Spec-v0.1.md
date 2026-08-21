# FatTail Labs — Options Lab Surface T Ortho Spec v0.1

**Status:** DRAFT — Coach 2026-08-21. **v0.1.4** Surface is a simple alternate of the Analyzer canvas; T Ortho is the surprise Easter Egg inside Surface (**DL-509**). **v0.1.3** TO-B1: What-if does not rewrite the historical path. Not BUILD AUTHORITY until Coach Phase 5.  
**Type:** Product Spec — Surface **addendum** (Options Lab). Named-view **T Ortho**.  
**Short name:** **OL-TO**  
**Route:** `/app/options-lab/surface`  
**Filename:** `FatTail-Labs-Options-Lab-Surface-T-Ortho-Spec-v0.1.md`

**Parents (normative where noted):**

| Doc | Role |
|-----|------|
| [3D Surface App Spec v0.1.8](./FatTail-Labs-Strategy-Lab-3D-Surface-App-Spec-v0.1.8.md) | Host app · named-view detent **T Ortho** · What-if HUD ≠ Time-machine snap |
| [OPF Spec v0.2.1](./FatTail-Labs-Options-Pricing-Foundation-Spec-v0_2.md) | Sheet · τ · per-leg IV · package |
| [OT-EF](./FatTail-Labs-Options-Lab-OPF-Truth-and-Elegant-Failure-Doctrine-v1.1.md) · **DL-309** | Representable or named state · no invented strikes |
| [Keep-Warm v0.1.2](./FatTail-Labs-Options-Lab-Analyzer-Viewport-Keep-Warm-Spec-v0.1.md) | Last paint · Working / Away / Idle · no 1s heavy resolve |
| [HI Spec v1.0](./FatTail-Labs-Human-Interface-Spec-v1.0.md) | Dark work-surface **tokens** — **no raw hex** in feature chrome |
| North Star v1.2 · doctrine learner-capacity | **Sacred Invariant #8** (Labs copy: process outcomes, **never profit claims**) — AZ-ALB §7 names the same law |

**Not in this spec:** [AZ-ALGO](./FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) — Analyzer-only. T Ortho has **no algo alert, no trail**. Do not carry that machinery here.

**Does not:** implementation plan · Analyzer 2D host-contract · MSC code · a second market WebSocket · importing `TimeOrthoEggPanel` as law.

**Review protocol:** findings are **BLOCKING** (invariant / law / system) or **ADVISORY** (opinion). Risk language may not promote an advisory into a constraint. Coach Content Law: nothing in §0 is removed.

---

## 0. Coach intent (do not drop)

**Problem statement, verbatim:**

> a trader lives in price-and-time (their candle chart); the risk graph lives in P&L-and-price. T Ortho puts the trade on the trader's native plane.

**Projection, verbatim:**

> orthographic down the τ axis — spot on one axis, time on the other, IV as color/contour, member's live position path drawn across the contour map. Easter egg placement in the Surface app.

**Host and surprise, verbatim (2026-08-21):**

> The surface should be a simple alternate view of the Canvas in the Analyzer.

> And the T Ortho is a surprise view within the Surface. An Ester Egg view.

Recorded as **intent**. Surface is not a second product. T Ortho stays a
**surprise / Easter Egg** named view inside Surface. **DL-509**.

**What-if machine, verbatim:**

> real-time trade walk across the contour map.

**Squawk agent, verbatim:**

> observation only — narrates sheet geometry, IV shift since entry, τ burn, contour distance. Never instruction, never "what to do." Same boundary as the Journal agent. T Ortho has no algo alert, no trail — that machinery is Analyzer-only (AZ-ALGO); do not carry it into this spec.

**Parents, verbatim:** 3D Surface App Spec v0.1.8, OPF v0.2.1, OT-EF, Keep-Warm, HI Spec v1.0 (dark work-surface tokens — no raw hex).

**As-built, verbatim:** Do not import TimeOrthoEggPanel chrome assumptions into new work; check as-built first.

**Copy, verbatim:** Sacred Invariant #8 applies to any member-facing copy in T Ortho.

---

## 1. Job

T Ortho is the **trader’s native plane** for a live listed position: **spot × time**, with **IV as color/contour**, and the **member’s path** drawn on that map.

The 2D risk graph remains **P&L × price**. ISO/RISK named views remain the tent in three-space. T Ortho does **not** replace those. It is the named-view detent that answers: *where is this trade on the chart I already think in?*

**What-if** on this map is a **real-time trade walk** (Surface What-if HUD: τ / vol / spot % — frozen-smile walk). It is **not** Surface Time-machine snap rebind (App Spec v0.1.8 §4.6). **TO-B1:** the walk is a **scenario cursor** on a re-sampled **contour**. The historical **path is fact** and is not re-painted (§4).

---

## 2. As-built (check first — not law)

Recorded so this spec does not accidentally bless the egg.

| As-built | Path | Honesty |
|----------|------|---------|
| Named detent **T Ortho** | `ViewsHud` `timeOrtho` · `applyFactoryView("timeOrtho")` | **Exists.** Camera is orthographic; eye along **value** (`y`), so the image plane is **strike × τ** (`x` × `z`). That **is** spot × time if the box maps those axes. Coach’s phrase “down the τ axis” is **preserved in §0**; as-built looking-direction is **along P&L onto (S, τ)**. |
| 2D tape underlay | `TimeOrthoLiveChart` | HLOC / session clock when the egg is on. **Not** an IV contour map. |
| Egg panel | `TimeOrthoEggPanel` | Glass, drag, session copy, optional `/session-note`, **position list**, capture, **tape prefs**. Mixes observation, book chrome, and chart settings. |
| Surface lock | `data-time-ortho` · `applyMapOverlay` · candles-off on the 3D mesh | Egg on locks the tent inspect to the map. |

**Law:** do **not** import egg chrome (position list, capture, candle-kind prefs, `bg-black/70`, shared `ft_options_lab_narrative_pos_v1`) into the **squawk** or the **contour**. As-built tape-under-tent may remain as a **FLAGGED** underlay until Coach seats the contour as the SoR picture.

---

## 3. Projection (normative)

| Axis / channel | Law |
|----------------|-----|
| **Spot** | Underlier / strike axis. Listed strikes **exact** (OC6a). No SPY→SPX cross-fill. |
| **Time** | Session / remaining-life clock of the **sheet** (OPF τ / last-trade honesty as the Surface already splits: What-if remaining last-trade vs OPF29 τ). Empty τ the structure does not have is not stretched (App Spec §5.3c must-not). |
| **IV** | **Color / contour** on that plane. Source = OPF-held **listed** IV on the bound generation (OT-EF). Missing IV → **named** (IV NO / WAITING), never a silent 0.20 or unlabeled VIX. |
| **Path** | The **live position** (Shown book on this symbol) as a polyline on the map: \((S(t), t)\) from entry (or first representable print) to now. **Historical facts.** Closed cards freeze at `closedAt`. What-if does **not** rewrite this polyline (**TO-B1**). |
| **Camera** | Orthographic. Easter-egg **placement** = existing Surface named-view **T Ortho**. |

**Contour meaning:** v1 contours are **IV** (Coach). Package **P&L height** stays on ISO/RISK. Do not smuggle tent-height into this map and call it IV.

**OT-EF:** no invented strikes, no invented IV cells, no lying path through a hole.

---

## 4. What-if machine

**Law:** real-time **trade walk across the contour map** (Coach §0).

**TO-B1 (Coach fold):** the historical polyline is **fact** and **never re-samples**. Re-sampling \((S(t), t)\) under scenario \(\sigma^\*\) would repaint tape that already happened — the lying-about-the-tape family OT-EF exists to prevent.

| Bind | |
|------|--|
| Knobs | Surface **What-if** Enable · Time · Implied vol · Spot % (Analyzer/Surface **one** walk — AZ-TM-3). |
| Contour | **Re-sample the sheet** at the scenario \((S^\*, \tau^\*, \sigma^\*)\). IV color/contour updates. |
| Path | **Inviolate.** The member’s \((S(t), t)\) record is not rewritten. |
| Cursor | What-if moves a **scenario cursor** (ghost marker / projected segment **from now**) across the re-sampled contour. The member sees where the trade **would sit** under the scenario — not a counterfactual history. |
| Not | Time-machine **snap rebind** (last-minute tape). Labeling a frozen-smile τ walk as Time Machine is already forbidden (App Spec). |
| Cadence | Keep-Warm Working / Away / Idle. Idle = no heavy resolve; **last paint** stays. |

---

## 5. Squawk agent (named)

A **named** observation surface on T Ortho. Not the egg.

### 5.1 Boundary (Coach — do not drop)

Observation **only**. Narrates:

- sheet geometry  
- IV shift since entry  
- τ burn  
- contour distance  

**Never** instruction. **Never** “what to do.” **Same boundary as the Journal agent.**

T Ortho has **no algo alert, no trail** — that machinery is Analyzer-only (AZ-ALGO); **do not carry it into this spec.**

### 5.2 Hotel’s guardian question

> Would a member be **worse** if they believed a wrong version of this?

A wrong IV shift, a lying contour distance, or a forecast wearing an observation jacket is **severity: high**. Invented geometry is **BLOCKING**.

### 5.3 Tango / Bob

Tango reviews **copy vocabulary** **before Bob ever quotes it**. Invariant **#8**: process facts, never profit claims, never “the trade will work.” Capacity over dependency.

### 5.4 Chrome (HI)

Dark-pinned **tokens**. No raw hex in feature chrome. Floatable/observation panel may exist; it is **not** `TimeOrthoEggPanel`. Own testid `surface-t-ortho-squawk`. Own storage key if dragged — do not share the egg’s.

### 5.5 Cadence

Local deterministic sentences from the **sheet + path**. Keep-Warm. Optional model enrichment is **out of v0.1** unless Coach opens it (do not copy the egg’s 3-minute `/session-note` by default).

---

## 6. Keep-Warm / one bus

| Law | |
|-----|--|
| Last paint | Leaving T Ortho / Surface does not blank the map. |
| Poll | Working vs Away vs Idle — Surface follows Keep-Warm spirit; do not add a per-widget Massive or extra WS (Arch 28). |
| Sheet | Local compute on held IVs (DL-419). |

---

## 7. Ideas inventory

| Idea | Seat |
|------|------|
| Native plane = price × time vs risk graph P&L × price | **IN-SCOPE** §0 · §1 |
| Orthographic · spot · time · IV color/contour · live path | **IN-SCOPE** |
| Easter egg = Surface T Ortho detent | **IN-SCOPE** |
| What-if = real-time walk on the contour | **IN-SCOPE** |
| Historical path inviolate; What-if = scenario cursor from now | **IN-SCOPE** · **TO-B1** |
| Squawk observation-only; same boundary as the Journal agent | **IN-SCOPE** |
| HI tokens, no raw hex | **IN-SCOPE** |
| Do not import egg chrome | **IN-SCOPE** |
| As-built HLOC tape underlay | **FLAGGED** — not the SoR picture; Coach seats contour |
| As-built egg position-list / capture / tape prefs | **OUT** of squawk |
| LLM session-note like the egg | **FLAGGED** |
| Analyzer-hosted T Ortho | **OUT** (Surface addendum) |
| Algo alerts / trail lines / AZ-ALGO eval | **OUT** — Analyzer only (`/app/options-lab/analyzer`) |

---

## 8. Out of scope

- Implementation plan / Charlie packets until Phase 5.  
- MSC import · extra market WebSocket · client Massive.  
- Inventing IV or strikes.  
- Instructional / “what to do” copy.  
- Replacing ISO/RISK tents.  
- FatTail Intelligence research (separate spec).  
- **Algo alerts** (Analyzer 2D only — AZ-ALGO).

---

## 9. Acceptance (when BUILD)

| AT | Criterion |
|----|-----------|
| **AT-TO-1** | T Ortho detent shows **spot × time** orthographic map with **IV contour** from OPF-held IV. |
| **AT-TO-2** | Live Shown path is drawn; unrepresentable cells are named, not invented. |
| **AT-TO-3** | What-if Enable **re-samples the contour** in real time (same knobs as Surface What-if). The **historical path does not move**. A **scenario cursor** (ghost / projected segment from now) shows where the trade would sit. Not snap rebind. Not a rewritten polyline. |
| **AT-TO-4** | Squawk: geometry, IV-since-entry, τ burn, contour distance. **No** instruction strings. |
| **AT-TO-5** | Chrome uses HI tokens; no raw hex in squawk/map chrome. Not `TimeOrthoEggPanel`. |
| **AT-TO-6** | Invariant #8: no profit claims in squawk. Tango vocabulary stamped before any Bob quote. |
| **AT-TO-7** | Keep-Warm: last paint remains; Idle is not 1s resolve. One market WS. |

---

## 10. Open decisions (not silent)

| OD | Question | Silent |
|----|----------|--------|
| **OD-TO-1** | As-built HLOC tape: underlay, replace, or hide when contour is SoR? | **None** — Coach seats at Phase 5 |
| **OD-TO-2** | Squawk local-only vs optional model | v0.1 **local** unless Coach opens |

---

## 11. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v0.1.4** | 2026-08-21 | Coach: Surface = simple alternate of Analyzer canvas; T Ortho = surprise Easter Egg inside Surface. Intent only. **DL-509**. |
| **v0.1.3** | 2026-08-20 | **TO-B1:** historical path is fact; What-if moves a scenario cursor on the re-sampled contour. AT-TO-3 both halves. |
| **v0.1.2** | 2026-08-20 | Coach squawk line: Journal agent only. **No algo alert, no trail** in this spec (Analyzer / AZ-ALGO). |
| **v0.1.1** | 2026-08-20 | Coach: Algo alerts are **Analyzer-only**. T Ortho does not run them. |
| **v0.1** | 2026-08-20 | Coach: native plane; ortho S×t IV contour; path; What-if walk; squawk observation-only. As-built egg/tape named, not imported. |
