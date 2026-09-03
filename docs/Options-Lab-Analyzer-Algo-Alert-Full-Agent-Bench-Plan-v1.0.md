# Analyzer Algo Alert — Full Agent Bench Plan v1.0

> **Working plan is v2.0.** [`docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md`](./Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v2.0.md) · token [`agents/go/AZALGO-W0.md`](../agents/go/AZALGO-W0.md).  
> **This file is the W1–W4 as-built record.** Do not execute remaining W5–W-G against it. Do not bolt a live-eval / PaR phase onto this DAG.

**Date:** 2026-08-20  
**Plan revision:** **v1.0.3** (OD-LLM Coach-opened · Demo + `mode` provenance · W4-0 re-sweep). **W1–W3 stand as executed — do not replace.**  
**Canonical filename:** `docs/Options-Lab-Analyzer-Algo-Alert-Full-Agent-Bench-Plan-v1.0.md`  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-az-algo/`](../agents/p-az-algo/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`AGENTS.md`](../AGENTS.md) · [`spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md)

**Primary law:**

| Doc | Path | Status |
|-----|------|--------|
| **AZ-ALGO Spec v1.0.2** | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Algo-Alert-Spec-v1.0.md) | **DRAFT** · B1/A1/A2 folded · floor **25** knobs-as-law · Recorded `mode` · **DL-472** · **DL-473** · **DL-482** · **DL-488** · W0-BA **DL-479** |
| AZ-ALB v1.0.10 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Alert-Builder-Spec-v1.0.md) | Type → Algo cites AZ-ALGO; AT-ALB-6 split |
| ALM v1.0 | [`Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md`](../Specs/FatTail-Labs-Alerts-Manager-Spec-v1.0.md) | `alert_class: algo` · hook §3.2 |
| Analyzer v0.2.1 §1.14 | [`Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md`](../Specs/FatTail-Labs-Options-Lab-Analyzer-Spec-v0_2.md) | Parent surface |
| OT-EF / DL-309 | Doctrine | No invented debit, trail underlier, greeks |
| Keep-Warm v0.1.2 | Viewport cadence | Idle = no heavy resolve; pulse is paint |
| HI Spec v1.0 | Tokens / 44pt / floatable Modal | Dark-pinned work-surface |
| Arch 28 | One **market** WS | No client Massive |

**Parents (do not re-litigate):**

| Doc / board | Role |
|-------------|------|
| **DL-472** | Algo = narrative trail, not a flatten. OTM debit fly. |
| **DL-473** | ALGO-B1 far-side re-invert · A1 monotone `f` · A2 pulse hysteresis |
| **DL-482** | Member knobs 75 / 75 / **25**. Defaults are placeholders; knobs are law. |
| **DL-484** | OD-LLM **opened**. Reason on the two trail stops. Four laws §3.1. |
| **DL-485** | Demo What-if Spot / Time / Vol. Supersedes OD-DEMO out. |
| **DL-486** | Analyzer Time Machine (AZ-ATM) is a **second Demo clock**. Not this board’s chrome. |
| **DL-488** | Recorded `mode: live \| demo_whatif \| demo_timemachine`. Fixtures parameterized. |
| `p-alerts` | Threshold Builder/holder/hook **already C1 PASS**. This program **fills Type → Algo**. Packet C2 (canvas **threshold** apply) is a **different** HostPnLChart job — India W4-0 names the handoff. |
| `p-az-viewport-2d` · `p-az-viewport-return` | Gesture + host life. W4 does **not** reopen left-drag pan / right-click menu. |
| Surface T Ortho egg | **Chrome reference only** — do not import `TimeOrthoEggPanel` or share its localStorage key |

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** — **never waived**.  
Coach overrule of a specialist finding is a **DL with reasoning**, not a waived gate.

**Juliet does not invent WHAT.** Coach wrote AZ-ALGO §0. India-shaped review landed B1/A1/A2 in v1.0.1. This plan only **sequences**.

---

## 0. Why this program exists

Coach (verbatim, compressed):

The Algo alert is a **dynamic trailing stop that does not stop the position out**. It talks. It binds an **OTM butterfly**. **+** flashes → Builder opens on Algo and describes the job. Wait for **75% of debit**, then trail at **75% of high-water**, ratcheting; trail **fraction** 75% → **25%** by last-trade **(defaults; member knobs are the law, DL-482)**, paced by **premium decay**. Two thin **dashed** verticals (assignable colors), optional overlay that densifies + pulses when spot threatens the trail; exit **records** and **stops** (position stays). Narrative window in T Ortho **grammar** (GEX; VP only if engaged; greeks / debit / gamma / probabilities). Job: stay in so a runner can run; don’t give back more than they should.

v1.0.1 (Coach stamp): a fly is **two-sided**. One trail **re-inverts** through the body (`side: near | far`). `f` never loosens while Armed. Pulse has hysteresis.

v1.0.3 (Coach): **OD-LLM opened** (DL-484). **Demo opened** (DL-485 / DL-486) with Recorded **`mode`** (DL-488). **W1–W3 stand.**

---

## 1. Mission

```text
W0     Remaining reviews (executed · W0-BA DL-479)
W1     Trail math (pure TS) + characterization          **EXECUTED · W1-G PASS**
W2     Builder Algo type · adapter family · + pulse     **EXECUTED · W2-G PASS**
W3     Narrative window (local sentences)               **EXECUTED · W3-G PASS**
W3-R   Reason narration + engine label (DL-484)         after W3-G · Tango before Bob quotes
W4-0   India HostPnLChart lock vs neighbors (re-sweep)  before W4
W4     Canvas dashed pair · overlay · pulse             after W1 + W4-0
W5     Kilo AT-ALGO-1…16 + engine + mode labels
W6     Lima honesty
W-G    Delta (evidence includes engine + mode)
```

**W1–W3 stand as executed.** Do not re-seed them. W3-R is **additive**. W4 still waits W4-0.

**First smoke (after the packet that claims it):**

| After | Smoke |
|-------|--------|
| **W1-G** | `npx tsx` fixtures: OTM debit fly eligibility; `f` monotone; near invert; body-cross → far; `U` collapse on far wing **records**; IV pop does not loosen `f`. |
| **W2-G** | Eligible fly → **+** pulses. Click → Builder Type **Algo**, description, Save **on**. Hook `alert_class: algo`. ATM/credit → Save off. |
| **W3-G** | Live algo → `analyzer-algo-narrative` visible. GEX off → no GEX sentences. VP off → no VP sentences. Far flip named. No profit claims. **EXECUTED.** |
| **W3-R-G** | Reason-on: AI copy is member-terms, bounded, named fallback. Every Recorded row has `engine: builtin \| ai_reasoned`. Conformance fixtures still bind **built-in only**. Tango APPROVED Reason copy **before** Bob quotes it. |
| **W4-G** | Armed → two thin dashed verticals. Overlay off by default. Threaten pulses with hysteresis. Exit freezes lines; position **not** closed. Invert-missing: no invented `x_S`; last paint may remain (**AT-ALGO-10** canvas). |
| **W-G** | AT-ALGO-1…16 evidence. Echo HIG. Kilo lint. No pan regression. **`engine` + `mode` labels on every Recorded fixture / holder.** |

---

## 2. Hard gates

| Gate | Rule | Unblocks |
|------|------|----------|
| **W0-2 India** | **EXECUTED.** v1.0.1 B1/A1/A2 is law. W4-0 **re-sweep** (v1.0.3) re-quotes neighbors before W4. | — |
| **W0-4 Tango** | **EXECUTED** for W3 local copy. **W3-R scope gain:** Reason-narration copy and any **bot persona vocabulary reviewed before Bob quotes it.** | W3-R |
| **W0-5 Hotel** | Invented debit / trail underlier / greek / GEX wall = **FAIL**. Demo live-fire is **in** (DL-485) and must be `mode`-labeled (DL-488). | W3-R · W5 |
| **W1-G** | **PASS** (executed). Fixtures parameterized v1.0.2. | W2 · W4 |
| **W2-G** | **PASS** (executed). | W3 |
| **W3-G** | **PASS** (executed). AT-ALGO-9. | W3-R · W5 |
| **W3-R-G** | DL-484 four laws. `engine` on every record. Tango APPROVED before Bob. Conformance binds **builtin** only. | W5 |
| **W4-0 India** | **Re-sweep before W4 fires.** Quote today’s `p-alerts` C1-G **and** C2, `p-az-viewport-2d` Packet A / W-G, `p-az-viewport-return` current packet. If Packet A or C2 is **in flight** on `HostPnLChart.tsx`: **HOLD**. If C2 BLOCKED and Packet A W-G unfiled: **HOLD** (same as prior). Paint-only is not a skip of a live Packet A seed. | W4-1 |
| **W4-G** | AT-ALGO-5, 7, 8, **10 (canvas last-paint)**, 12, 16 (canvas). Pan/handles unaffected. | W5 |
| **W5-G** | AT-ALGO-1…16 + **`engine`** + **`mode`** evidence table. | W-G |
| **W-G Delta** | Ternary. Fail-closed on missing Echo HIG, missing ATs, invented marks, pan regression, **missing `engine` or `mode` on Recorded**. | Coach ship / MiniTwo **when asked** |

---

## 3. Locked (not ODs)

| ID | Decision | Source |
|----|----------|--------|
| **FP1** | Narrative trail. **Never** closes the position. | AZ-ALGO §1 · DL-472 |
| **FP2** | v1 eligibility = **long OTM debit butterfly** (`isOtmDebitButterfly`). | §3 |
| **FP3** | Member knobs: start / trail-stop / trail-end. Placeholders **75 / 75 / 25** (DL-482). Decay may tighten **early**. | §7 · v1.0.2 |
| **FP4** | **ALGO-A1:** `f(t) = min(f(t⁻), f_raw)` while Armed. | v1.0.1 |
| **FP5** | **ALGO-B1:** one trail; `side: near \| far`; re-invert through the body. Geometry mirrors, narration doesn’t. | DL-473 |
| **FP6** | **ALGO-A2:** pulse on 20% of `G`, off 25%. | v1.0.1 |
| **FP7** | Verticals = `x_H` (print at high-water) + T+0 invert of `S`. Overlay optional, default **off**, trail-color tint. | §7.4–7.5 · §8 |
| **FP8** | Waiting draws **no** geometry. Recorded freezes. Unpriceable → named state. | OT-EF |
| **FP9** | `alert_class: algo`, `kind: position`, `trigger.family: algo`. Hook only. | §5.3 |
| **FP10** | GEX/VP voices **omit-when-off**. Local copy is v1 SoR. | §9 |
| **FP11** | **Position**, never strategy. DL-309. One market WS. No MSC import. | Coach |
| **FP12** | W2/W3 **must not** edit `HostPnLChart.tsx`. W4 **draw only**. | AZ-ALGO §16 · ALB-B1 lesson |
| **FP13** | HIG conversion is packet work. W2-G / W3-G / W4-G FAIL on raw hex/`zinc` in **chrome**. Canvas **paint** colors are payload (AT-ALB-14 family). | HI · AZ-ALB |
| **FP14** | Juliet does not invent WHAT. Coach Content Law. Delta ternary. | Doctrine |
| **FP15** | Demo is **in** (DL-485 What-if · DL-486 Time Machine clock). Recorded `mode` provenance (DL-488). | v1.0.3 |
| **FP16** | **OD-LLM opened (DL-484).** Four laws: (1) AI decides **alert state**, never the **position**; (2) reasoning narrated in the **member’s terms**; (3) **bounded** with **named fallback** to built-in; (4) every record stamps `engine: builtin \| ai_reasoned`. Conformance fixtures bind **built-in only**. | v1.0.3 |

### 3.1 OD-LLM — four laws (Coach, DL-484)

| Law | |
|-----|--|
| **LLM-1** | The AI may change **alert state** (hold / fold the *trail record*). It **never** closes, orders, or mutates the **position**. |
| **LLM-2** | Reason output is **narrated in the member’s terms** (process, not bot jargon). Tango reviews copy **before Bob quotes it**. |
| **LLM-3** | Bounded. Fail → **named fallback** to the built-in trail engine. Never a silent empty reason. |
| **LLM-4** | Payload `engine: builtin \| ai_reasoned` on **every** Recorded row. Shared conformance set **binds built-in only**. |

**Silent remaining:**

| OD | Silent default |
|----|----------------|
| **OD-VP** | FI-031: VP voice remains omit-when-off (Analyzer has no VP overlay). |
| **OD-W4** | If C2 BLOCKED **and** Packet A is not live on the file: W4 may paint algo geometry; does not implement threshold apply. Live Packet A → **HOLD**. |

---

## 4. DAG

```text
W0 … W0-BA            **EXECUTED** (DL-479)
W1 math               **EXECUTED** W1-G
  ├── W2 Builder      **EXECUTED** W2-G
  │     └── W3 narrative **EXECUTED** W3-G
  │           └── W3-R Reason / engine   after W3-G
  └── W4-0 India re-sweep → W4 canvas (HOLD until queue clear)
W5 Kilo · W6 Lima     after W2-G + W3-G + W4-G (+ W3-R-G if fired)
W-G Delta
```

W1–W3 **stand**. W2 and W4 may still run in parallel **after** W4-0 (different remaining files). W5 after W2+W3+W4.

---

## 5. Packets

### 5.1 W0 — review (no code)

| Seed | Agent | Fire |
|------|-------|------|
| `W0-0-coach-plan-stamp.md` | Coach | First |
| `W0-1-lima-hash.md` | Lima | After W0-0 |
| `W0-2-india-parents.md` | India | After W0-1 |
| `W0-3-echo.md` | Echo | After W0-2 |
| `W0-4-tango.md` | Tango | After W0-2 |
| `W0-5-hotel.md` | Hotel | After W0-2 |
| `W0-6-victor.md` | Victor | After W0-2 |
| `W0-G-delta.md` | Delta | After W0-2…6 |
| `W0-BA-coach-build-authority.md` | Coach | After W0-G |

### 5.2 W1 — trail math

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W1-1-charlie-math.md` | Charlie | **New** `web/lib/options-lab/algoTrailMath.ts` (+ tests beside it). **No UI.** | Fixtures for §7 |

**Must implement:** `isOtmDebitButterfly` · `armCheck` · `H` ratchet · `f` running min (A1) · `S` · T+0 invert pick near/far · body-cross `side` · exit · threaten hysteresis (A2) · invert-missing named + P&L backstop.

**Fixture that would have failed pre-B1:** OTM call fly, spot through body, `U` collapses, near `x_S` never crossed → **must Recorded** with `exit_side: far`.

### 5.3 W2 — Builder, adapter, + pulse

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W2-1-charlie-builder.md` | Charlie | `AlertBuilderDialog.tsx` · `analyzerAlertsAdapter.ts` · `AnalyzerControlsColumn.tsx` (**+** only) · `OpfRiskAnalyzer.tsx` (wire only) | 1–4, 11, 13, 15 |
| `W2-2-echo.md` | Echo | Review W2 diff | HIG |
| `W2-G` | Delta | — | W2-G |

**+** pulse when `isOtmDebitButterfly`. Click seeds Type Algo. Description §5.1. Knobs §5.2. Save `trigger.family: algo`. **Do not touch `HostPnLChart`.**

### 5.4 W3 — narrative window

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W3-1-charlie-narrative.md` | Charlie | **New** Analyzer narrative panel · sentence builders · `OpfRiskAnalyzer` mount | 9 |
| `W3-2-echo-tango.md` | Echo + Tango | Review | chrome + copy |

Local deterministic sentences. Near vs far **structural** copy (§9.2). GEX/VP omit-when-off. Own localStorage key. Default seat **left of canvas**. HI tokens.

### 5.4b W3-R — Reason narration (additive, DL-484)

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W3-R-1-charlie-reason.md` | Charlie | Narrative + Recorded payload `engine` · Reason prompt path. **No** `HostPnLChart`. **No** flatten. | FP16 |
| `W3-R-2-tango.md` | Tango | Reason-narration copy; **bot persona vocabulary before Bob quotes it** | LLM-2 |
| `W3-R-G` | Delta | — | engine on every record; fallback named |

Does **not** reopen W3-1. Local sentences remain v1 SoR when Reason is off (`engine: builtin`).

### 5.5 W4 — canvas geometry

| Seed | Agent | Files | ATs |
|------|-------|-------|-----|
| `W4-0-india-lock.md` | India | No code. **Re-sweep today’s boards** before W4-1. | lock |
| `W4-1-charlie-canvas.md` | Charlie | `HostPnLChart.tsx` **draw** + props from Analyzer | 5, 7, 8, **10 (canvas last-paint)**, 12, 16 |
| `W4-2-echo.md` | Echo | Review | dashed / overlay / pulse |

Waiting: no lines. Armed: two thin dashed verticals + optional overlay. Recorded: freeze. Pulse paint-only. Invert-missing: **AT-ALGO-10** last-paint (no lying `x_S`). **Do not** change pan, handles, or threshold-alert apply menu.

### 5.6 W5 / W6 / W-G

| Seed | Agent |
|------|-------|
| `W3-R-1-charlie-reason.md` | Charlie (after W3-G) |
| `W3-R-2-tango.md` | Tango |
| `W5-1-kilo-ats.md` | Kilo (evidence: `engine` + `mode`) |
| `W6-1-lima.md` | Lima |
| `W-G-delta.md` | Delta |

---

## 6. Non-goals (NX)

| ID | Out |
|----|-----|
| **NX1** | Broker / Tradier / Close from this alert |
| **NX2** | ~~Demo mode~~ **OPEN** DL-485 / DL-486 — still NX: unlabeled demo that looks like a live Recorded |
| **NX3** | ~~LLM session-note as unbounded chat~~ **OPEN** DL-484 Reason only — still NX: AI that **closes the position**; unconstrained session-note (FI-032) stays flagged |
| **NX4** | Analyzer VP overlay (FI-031) — omit-when-off is enough |
| **NX5** | BWB / Batman / credit / ATM flies |
| **NX6** | Two simultaneous trail verticals (B1 option a-raw) — law is **re-invert** |
| **NX7** | Horizontal P&L rails (FLAGGED) |
| **NX8** | MSC Trailing / 0DTE / Break-Even tabs |
| **NX9** | Delete chrome · severity picker · Manager HTTP swap (Packet S stays on `p-alerts`) |
| **NX10** | Second market WebSocket · client Massive · MSC import |
| **NX11** | Reopen inspector rail / Autofit / Probability math |
| **NX12** | Product code before W0-BA |
| **NX13** | MiniTwo until Coach asks |
| **NX14** | Import `TimeOrthoEggPanel` |

---

## 7. AT → packet map

| AT | Packet |
|----|--------|
| AT-ALGO-1…4, 11, 13, 15 | W2 |
| AT-ALGO-6, 10 (math), 16 (fixture) | W1 |
| AT-ALGO-9 | W3 |
| Recorded `engine` · Reason fallback | W3-R |
| Recorded `mode` | W2 (Demo) + W5 evidence |
| AT-ALGO-5, 7, 8, **10 (canvas last-paint)**, 12, 16 (canvas) | W4 |
| AT-ALGO-14 | W2 + eval in W1/W4 |
| All 1…16 evidence table | W5 · W-G |

---

## 8. Characterization (Kilo)

Prefer bind + display-state + **pure math** fixtures (`algoTrailMath.test.ts`). Canvas: host `dataset` where honest (`data-algo-side`, `data-algo-phase`) — do not scrape pixels for P&L.

**Must-have fixtures (W1):**

1. Symmetric long call fly, body > spot → eligible; body = ATM listed → not.  
2. Credit / short fly → not eligible.  
3. Arm at `U ≥ entry_pct · D` (knob **input**, not a baked 0.75).  
4. `H` ratchet; `S = f × H`.  
5. `E(t)` up (IV pop) does **not** raise `f` (A1).  
6. Near invert between spot and `x_H`.  
7. **B1:** spot through body, `U` falling, near `x_S` uncrossed → `side=far` then exit `exit_side=far`.  
8. Recross body → `side=near`.  
9. Invert missing → named, P&L backstop only then.  
10. Threaten: enter 0.20 `G`, leave 0.25 `G`.

---

## 9. Files (implementation, after W0-BA)

| Path | Packet |
|------|--------|
| `web/lib/options-lab/algoTrailMath.ts` + `.test.ts` | W1 |
| `web/lib/options-lab/algoTrailConformance.ts` | W1 (shared knobs) · W3-R (`engine`) · W5 (`mode`) |
| `web/lib/options-lab/algoNarrative.ts` + `.test.ts` | W3 · W3-R |
| `web/lib/alerts/analyzerAlertsAdapter.ts` | W2 (`family: algo`) |
| `web/components/options-lab/AlertBuilderDialog.tsx` | W2 |
| `web/components/options-lab/AnalyzerControlsColumn.tsx` | W2 (**+** pulse) |
| `web/components/options-lab/AlgoNarrativePanel.tsx` | W3 **new** |
| `web/components/options-lab/OpfRiskAnalyzer.tsx` | W2/W3/W4 wire |
| `web/components/options-lab/risk-graph/HostPnLChart.tsx` | **W4 only** |

---

## 10. Coordination

| Board | Rule |
|-------|------|
| `p-alerts` | Do not regress C1. Do not fire this board’s W4 as C2. Threshold apply stays C2. |
| `p-az-viewport-2d` | Pan/zoom/handles sacred. W4 paint must not steal pointer. **Packet A W-G is ahead of W4 in the HostPnLChart queue.** |
| `p-az-viewport-return` | Product code forbidden until that board’s W0-BA. Do not steal `OpfRiskAnalyzer` life. |
| `p-az-atm` | Time Machine **chrome** is a **later** HostPnLChart / toolbar claimant — behind Packet A W-G, **this** W4, and C2. Algo Demo may **consume** the ATM playhead clock (DL-486) without owning ATM chrome. |
| Analyzer residual | Layout / GEX / Probability stay there; this program **reads** GEX-on / range-on for omit-when-off. |

---

## 11. Changelog

| Ver | Date | Notes |
|-----|------|--------|
| **v1.0.3** | 2026-08-20 | **W1–W3 stand.** OD-LLM opened (DL-484, four laws). Demo opened (DL-485/486) with `mode` (DL-488). Tango W3-2 / W-G: Reason copy + Bob vocabulary. W-G evidence: `engine` + `mode`. W4-0 re-sweep (Packet A / C2 still unfiled → HOLD). Floor 25 / knobs-as-law. **DL-489**. |
| **v1.0.1** | 2026-08-20 | **ALGP-B1:** W0-2 quotes `p-alerts` C1-G **and** C2, `p-az-viewport-2d` W-G, `p-az-viewport-return` current packet (`OpfRiskAnalyzer` overlap named). Workflow template: neighbor-board artifact quotes. **ALGP-A1:** AT-ALGO-10 canvas last-paint on W4 / W4-G. |
| **v1.0** | 2026-08-20 | Full bench: W0 remaining review → W1 math → W2 Builder → W3 narrative → W4 canvas (lock) → W5/W6 → W-G. Law = AZ-ALGO v1.0.1. Demo/LLM/VP overlay NX. |
