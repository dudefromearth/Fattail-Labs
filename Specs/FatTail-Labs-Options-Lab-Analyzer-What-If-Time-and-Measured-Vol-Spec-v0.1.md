# FatTail Labs — Options Lab Analyzer What-If: Time Range & Measured Vol Spec v0.1

**Status:** **DRAFT · India fold** (2026-08-19). Not BUILD AUTHORITY until Coach Phase 5.  
**Date:** 2026-08-19  
**Type:** Product + client math Spec — amends Analyzer **What-if** (§1.11) only  
**Short name:** **AZ What-If T/σ** · **AZ-TM**  
**Filename:** `Specs/FatTail-Labs-Options-Lab-Analyzer-What-If-Time-and-Measured-Vol-Spec-v0.1.md`

**Parents (do not re-litigate):**

| Doc | Role |
|-----|------|
| Analyzer Spec v0.2.1 §1.11–1.12 | What-if knobs · A6 Enable · B4 override/RECON. Section title “Time machine” **inherits the rename** to What-if (TM-A1). |
| OT-EF Doctrine v1.1 · DL-309 / DL-396 | OPF-held chain is instrument truth; named failure |
| OPF Spec v0.2.1 **§3.7 · OPF29** | Single Labs τ: PM expiry instant **16:00 ET**; 1-minute floor |
| OPF Spec v0.2.1 **§6.7 · OPF31** | `what_if.vol_offset_pts` = **absolute IV points, additive** |
| 3D Surface App Spec **v0.1.8** | What-if = frozen-smile τ walk; Time machine = snap rebind. HUD parent for AZ-TM-3. |
| Human Interface Spec v1.0 | 44pt sliders · inspector groups (already shipped) |

**Amends:** Analyzer §1.11 Time offset `0…72 h` and Vol offset `−30…+30 pts` **as member domain and display**. Enable, Spot %, Reset, B4 RECON=`override` stay. Does **not** amend OPF §3.7 τ or OPF31 wire units.

**Audience:** Coach · India · Hotel · Echo · Charlie · Kilo.

**India fold (this revision):** TM-B1, TM-B2 blocking; TM-A1…A4 advisory. See §10.

---

## 0. Coach intent (Phase 0 — preserved verbatim)

> I want you to fix the problems with the What-If controls so that the Time slider has the **correct range** and the Volatility slider actually **simulates measured volatility** not just make shit up.

Success:

1. Time cannot offer hours the position does not have (tradable last-trade clock).  
2. Vol is a scenario around **vol the market printed on the held chain**, displayed as that number — not an unanchored ±30 band that never shows measured or scenario %.

---

## 1. Problem (as-built)

### 1.1 Time — invented 72-hour rail

| As-built | Fact |
|----------|------|
| Slider | `min=0 max=72 step=1` hours (`AnalyzerControlsColumn` Time row) |
| Apply | `tauYears0 − hours / (365.25 × 24)` per bound leg (`localBookCurves.ts`) |
| τ clock | `fractionalT` ≈ OPF PM **16:00 ET** (client copy of OPF29) |
| Surface What-if HUD | `TimeHud` walks **Now → Expiry** on remaining τ (`elapsed` 0…1). As-built chrome still says “Time machine” — Surface spec **forbids** that label for a frozen-smile walk (v0.1.8 §4.6). |

A 0DTE SPX fly at 10:00 ET still trades until **16:15** last print (~6.25 h). The Analyzer still offers **72 h**. Extra travel is silent (tau floors). The control **lies about tradable remaining**.

**Two clocks (do not collapse):**

| Clock | Instant | Owner |
|-------|---------|--------|
| **Last trade** | Index 16:15 ET · equity 16:00 ET | Slider **remaining** (this spec) |
| **Settlement / τ** | OPF §3.7 PM **16:00 ET** (SPXW / 0DTE / index PM) | OPF29 — **not this spec** |

16:15 is last trade. 16:00 is the settlement instant the model’s τ is measured to. They are two facts, not a bug.

### 1.2 Vol — unanchored range and mute display (math is OPF31)

| As-built | Fact |
|----------|------|
| Slider | `−30…+30` labeled **pts** |
| Apply | `σ' = max(ε, σ_leg + Δ/100)` — **this is OPF31** (`vol_offset_pts` additive absolute IV points). Not invented. |
| Base IV | OPF-held listed IV (`listedIvFromRow`) — already measured |
| Display | `+10 pts` — never shows 16.2% measured or 26.2% scenario |
| Range | Fixed ±30, unanchored to σ_m |
| Detent | 0 (no change), not measured ATM |
| Marks **VIX** field | In `useOpfRiskGraph` job key **only**. **Not** applied to local curves |

What’s broken is **range, display, detent**. The additive unit is law.

---

## 2. Ideas inventory

| ID | Idea | Disposition |
|----|------|-------------|
| C1 | Time slider has the **correct range** | **IN-SCOPE** — remaining to **last trade** |
| C2 | Vol slider **simulates measured volatility** | **IN-SCOPE** — σ_m detent, measured-derived range, % readout |
| C3 | Do not invent vol | **IN-SCOPE** — listed IV SoR + IV NO |
| A6 | Enable gates all knobs | **IN-SCOPE** (unchanged) |
| B4 | What-if → RECON `override` | **IN-SCOPE** (unchanged) |
| S1 | Surface HUD Now→Expiry | **IN-SCOPE** as What-if τ **grammar**; confirm HUD is What-if walk not Time-machine replay (TM-A1) |
| S2 | Surface HUD ±30 vol | **IN-SCOPE** — same **OPF31 scalar** as Analyzer after this packet |
| V1 | Marks VIX text field | **FLAGGED** — unused by local engine; not the vol SoR |
| T15 last-trade | Index 16:15 last trade for **slider remaining** | **IN-SCOPE** |
| T15 τ | Client τ to 16:15 | **OUT** — OPF29 16:00 unless OPF v0.2.x + DL |
| V5 ratio | Per-leg `σ' = σ × (σ_s/σ_m)` | **FLAGGED** — no OPF wire form; see OD-1 |
| RTH | Count only RTH hours | **DEFERRED** — BSM T is calendar |
| VV | Vol-of-vol / fitted sticky smile | **DEFERRED** |
| Spot% | −5…+5% spot | **OUT** — not in Coach request |

---

## 3. Law

### 3.1 Shared

| ID | Law |
|----|-----|
| **AZ-TM-0** | Enable still **gates** Time, Vol, and Spot % (A6). Reset clears all three + disable. |
| **AZ-TM-1** | Active Time or Vol (or Spot %) with Enable on → override banner + RECON **`override`** (B4). |
| **AZ-TM-2** | Empty shown book, or plane not ready → both sliders **disabled**; Time range 0; Vol shows named **IV NO** / **WAITING**, never a fake 16%. |
| **AZ-TM-3** | Analyzer Risk and Surface **share one What-if** τ walk and one vol scenario (AZ-VP-S2). The Surface control this binds is the **What-if HUD** (`TimeHud`: frozen-smile τ walk + vol + spot%). It is **not** the Surface Time-machine replay (snap rebind) and **not** a second playhead. Same `time_offset_hours` and `vol_offset_pts` (OPF31). Two different vol maths are a spec break. |
| **AZ-TM-4** | No invented strikes, no invented IV when the generation has none (OT-EF). |

Vocabulary (TM-A1): this spec says **What-if** everywhere. Analyzer §1.11’s heading “Time machine” **inherits that rename**. Surface spec v0.1.8: *Must not call the what-if τ playhead a time machine.*

### 3.2 Time — remaining to last trade; τ stays OPF

| ID | Law |
|----|-----|
| **AZ-TM-T1** | Time **domain** is **Now → last trade on the pointer expiration**, not `0…72 h`. Member grammar matches Surface What-if: left = now, right = end of tradable session that day. |
| **AZ-TM-T2** | **Remaining (slider)** = wall time until **product last trade** on the shown book’s pointer expiration. Multi-exp book: remaining to the **soonest shown expiration**. Index (SPX · XSP · NDX · RUT and cash-settled index PM) **16:15 ET**. Listed equity / ETF **16:00 ET**. |
| **AZ-TM-T3** | **τ is not this slider’s clock.** τ follows OPF §3.7 / OPF29: PM expiry instant **16:00 ET** for SPXW / 0DTE / index PM; AM products use SOQ. Client `fractionalT` stays that settlement instant. **Do not** move τ to 16:15 in this packet. If Coach believes OPF’s 16:00 is wrong for PM index, that is an **OPF v0.2.x + DL** first — not an Analyzer amendment. |
| **AZ-TM-T4** | Slider range is `[0, remaining_last_trade]`. Member cannot request more **tradable** time than last trade. After last trade, remaining = 0; slider disabled. |
| **AZ-TM-T5** | Apply (OPF what-if time): `as_of' = as_of + elapsed`; recompute each leg `τ_ℓ = τ(exp_ℓ, as_of', settlement_ℓ)` per OPF §3.7. Equivalent: `τ' = max(τ_min, τ_leg − elapsed)` with **`τ_min = 1 minute`** (`1/365.25/24/60`, OPF §3.7). Forbidden: a 1-hour floor that flatlines the last hour of 0DTE. If a client floor is **ever** larger than 1 minute, model meta **must** set `final_hour_clamped: true`. |
| **AZ-TM-T6** | **Step:** 5 min when remaining ≤ 8 h; 15 min when remaining ≤ 24 h; 1 h otherwise. |
| **AZ-TM-T7** | **Readout (required):** scenario clock in ET **and** hours:minutes **left to last trade** after the advance. Not only `+12h`. Example: `11:45 ET · 4h 30m left`. |
| **AZ-TM-T8** | Outlook + epoch pin: existing pin law unchanged (time knob ignored while pinned). |

On index 0DTE, the thumb can still sit in 16:00–16:15 (last trade continues). τ is already at the OPF 1-minute floor after 16:00. That is lawful, not “clocks disagree.”

### 3.3 Vol — measured listed IV; OPF31 additive

| ID | Law |
|----|-----|
| **AZ-TM-V1** | **Measurement SoR** = OPF-held **listed IV** on each bound contract (`listedIvFromRow`). That is the only vol that exists. |
| **AZ-TM-V2** | **Measured ATM IV** σ_m = listed IV of the **nearest listed strike to spot** on the soonest shown expiration, **same right as the structure’s majority right** (call fly → call ATM; put fly → put ATM; mixed → call ATM). If that row has no IV → **IV NO**, slider disabled. |
| **AZ-TM-V3** | Member label **Implied vol**, in **percent** (16.2). Do not present the knob as raw “pts.” The **wire / engine unit** remains OPF31 `vol_offset_pts` (absolute IV points). |
| **AZ-TM-V4** | Slider is **absolute scenario IV** σ_s (percent). Default / detent = σ_m. Range = **`[0.5 σ_m, 2.0 σ_m]`**, then clamp to `[1%, 200%]`. The band is a **named multiple of the measurement**, not ±30 invented. |
| **AZ-TM-V5** | **Apply (this packet, OPF31):** `vol_offset_pts = (σ_s − σ_m) × 100` when σ is expressed in decimal? **No** — σ_m and σ_s in the UI are **percent** (16.2). Wire: `vol_offset_pts = σ_s − σ_m` (e.g. 19.4 − 16.2 = **+3.2 pts**). Each bound leg: `σ'_leg = max(ε, σ_leg + vol_offset_pts / 100)` with σ_leg decimal. Same scalar `/resolve` already accepts. **Smile-sticky ratio is not law here** (see OD-1). |
| **AZ-TM-V6** | **Readout (required):** `16.2% measured · 19.4% scenario` (both one decimal). If Enable is off, show measured only. |
| **AZ-TM-V7** | Expiration (intrinsic) **does not** change with σ_s. T+0 / scenario curve does. |
| **AZ-TM-V8** | Marks **VIX** field is **not** this knob and **does not** silently replace listed IV. Binding VIX → σ is a later spec. Until then VIX remains an override **label** (B4) only. |

---

## 4. Member experience

Keep the shipped What-if inspector group (44pt rows, Enable switch, Reset).

| Row | Treatment |
|-----|-----------|
| Time | Label **Time**. Trailing readout T7. Track min=0 max=remaining_last_trade. Ends: **Now** · **Last trade**. |
| Implied vol | Label **Implied vol**. Trailing readout V6. Track in % (one decimal). Detent at measured. |
| Spot % | Unchanged. |

No unanchored “±30 pts” as the member story. Disabled state is quiet, not a fake number.

Surface What-if HUD: same remaining grammar and same `vol_offset_pts`. Chrome label must say **What-if**, not Time machine (Surface v0.1.8 §4.6 — as-built `TimeHud` still says “Time machine”; that rename rides this packet if OD-2 is A).

---

## 5. Apply map (no new SoR; do not deepen OD-PF6)

**Acknowledgment (TM-A4):** `localBookCurves.ts` and client `fractionalT` are a **client sheet** on held IVs. OD-PF6 / DL-290: server remains SoR for lock / pack / RECON; live Analyzer 2D/3D picture is the client sheet. This packet **must not** add a second vol or τ unit that `/resolve` cannot express. What-if **units** stay OPF31 so a server resolve of the same book applies the same scalar.

| Surface | Today | After |
|---------|--------|--------|
| Analyzer Time/Vol sliders | 0–72 h · ±30 pts UI | remaining_last_trade · σ_s % (detent σ_m) |
| Wire | `time_offset_hours` · `vol_offset_pts` | **same fields** (OPF31) |
| `localBookCurves` | `volPts/100` add | **unchanged formula**; Δ from (σ_s − σ_m) |
| `fractionalT` / τ | 16:00 PM | **unchanged** (OPF29) |
| Surface What-if HUD vol | ±30 unanchored | same `vol_offset_pts` as Analyzer; range/display V4/V6 |
| Surface What-if HUD time | Now→Expiry elapsed 0…1 | remaining_last_trade domain; τ still OPF 16:00 |

Do not call Massive. Do not add a WebSocket. IV comes from the generation OPF already holds. **No** `/resolve` schema change in this packet.

---

## 6. Out of scope

- Spot % range or meaning  
- New OPF packs / server `/resolve` fields (`vol_scale`, `scenario_atm_iv`) — unless Coach picks OD-1 A and files an OPF delta  
- Moving OPF τ to 16:15  
- Rebinding Marks VIX to a vol model  
- RTH-only theta  
- Heatmap / VP / GEX  
- Surface **Time machine** (snap rebind)  
- Changing Enable / Reset / B4  
- Inventing IV when the generation has none  

---

## 7. Acceptance

| ID | Test |
|----|------|
| **AT-TM-1** | 0DTE, 10:00 ET, SPX: Time **slider max** ∈ (6 h, 6.5 h] (**16:15 last trade**), **not** 72. τ at that wall-clock is still OPF **16:00** settlement (not moved). |
| **AT-TM-2** | Equity 0DTE 10:00 ET: Time max ∈ (5.75 h, 6.1 h] (16:00 last trade = PM settlement). |
| **AT-TM-3** | Equity: drag Time to max → T+0 meets expiration (within 1-minute τ_min). Index: after 16:00, τ is at the 1-minute floor while last-trade remaining may still be > 0. |
| **AT-TM-4** | Calendar: Time max = last-trade remaining on the **front** shown exp. |
| **AT-TM-5** | Empty book: Time and Vol disabled; Vol does not show a number. |
| **AT-TM-6** | Vol readout equals listed ATM IV at detent (one decimal). |
| **AT-TM-7** | σ_s = σ_m + 5 (percent) → `vol_offset_pts = +5`; each leg IV += 0.05; expiry curve unchanged. |
| **AT-TM-8** | Missing ATM IV → IV NO, slider disabled (no 16% placeholder). |
| **AT-TM-9** | Enable off → offset not applied; measured still shown. |
| **AT-TM-10** | Enable + σ_s ≠ σ_m → RECON `override`. |
| **AT-TM-11** | Analyzer and Surface What-if HUD share the same `vol_offset_pts` after one change. |
| **AT-TM-12** | Member Vol label is **Implied vol** (percent). Engine still uses `vol_offset_pts`. |
| **AT-TM-13** | 0DTE at **15:30 ET**, Time at max of remaining: Analyzer T+0 **still moves** vs 15:00 (mirror OPF **AT-L0-τ4**; not a 1-hour floor). If a higher floor is configured, `final_hour_clamped` is set. |
| **AT-TM-14** | Same 15:30 fixture on the **Surface What-if** τ walk: mesh/sample still moves vs 15:00. The 1-minute floor applies wherever What-if τ is evaluated (not only `localBookCurves`). |

---

## 8. Open decisions (Coach)

These are Coach calls. India folded B1/B2 so the **implementable** path does not wait on an OPF delta.

1. **Vol apply**  
   - **A:** smile-sticky ratio `σ'_leg = σ_leg × (σ_s / σ_m)` — **blocked** until OPF grows `vol_scale` or `scenario_atm_iv` + DL. Cannot be expressed as the single scalar `what_if.vol_offset_pts` L4 `/resolve` accepts.  
   - **B (lawful in this packet · OPF31):** additive `vol_offset_pts = σ_s − σ_m` (percent points), σ_m detent, V4 range. **Silent / recommended** unless Coach opens an OPF delta.

2. **Surface What-if HUD vol**  
   - **A (recommended):** same OPF31 scalar and V4/V6 display this packet (AZ-TM-3).  
   - **B:** Analyzer only — **violates AZ-TM-3**.

3. **Last trade vs τ** — **not a disagreement.**  
   - **A:** move client τ to 16:15 — **blocked** without OPF §3.7 amendment + DL.  
   - **B (lawful state):** slider remaining = last trade (16:15 index / 16:00 equity); τ stays OPF 16:00. **Silent.**

---

## 9. Status

**DRAFT · India fold.** Coach Phase 5 (dispose OD-1; OD-2/3 default B/A as marked) → BUILD AUTHORITY → Lima DL amending Analyzer §1.11 (and Surface HUD label if OD-2 A) → Charlie.

No implementation until that GO.

---

## 10. Review fold (India 2026-08-19)

Blocking findings folded into law. Advisory folded as citations / ATs. **Coach Content Law:** original V5 ratio text is **not erased**; it sits as OD-1 A (FLAGGED). Original T3 “one clock 16:15 for remaining *and* τ” is **not erased**; it sits as OD-3 A (blocked without OPF).

| ID | Finding | Fold |
|----|---------|------|
| **TM-B1** | T3 moved τ expiry; OPF §3.7 / OPF29 owns 16:00 PM. Last trade 16:15 ≠ settlement. Client τ to 16:15 vs server `/resolve` at 16:00 is the AT-L3-RECON split. | T2 last-trade remaining; T3 τ stays OPF 16:00; OD-3 B is lawful. AT-TM-1 split slider vs τ. |
| **TM-B2** | V5 ratio has no OPF31 wire; as-built `+Δ/100` **is** OPF31. Broken = range, display, detent. | V5 additive OPF31; ratio = OD-1 A (needs OPF delta). AT-TM-7 additive. |
| **TM-A1** | Surface reserves “Time machine” for replay; What-if is frozen-smile τ walk. | Vocabulary What-if; AZ-TM-3 binds `TimeHud` as What-if HUD, not Time-machine replay. |
| **TM-A2** | Surface spec missing parent. | Parent table + §5 HUD row. |
| **TM-A3** | Cite OPF 1-minute floor; AT-L0-τ4 mirror. | T5; AT-TM-13 · **AT-TM-14** Surface. |
| **TM-A4** | Client `localBookCurves` / `fractionalT` vs OD-PF6 server-only v1. | §5 acknowledgment; do not deepen the split. |
