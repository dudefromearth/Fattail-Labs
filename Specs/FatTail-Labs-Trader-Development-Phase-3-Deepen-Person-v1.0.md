# FatTail Labs — Trader Development Phase 3  
## Deepen the Person — Retro · Journey · Risk · Capacity Context

**Status:** DRAFT — Coach review  
**Type:** Product enhancement (integrates Own spine into review loop)  
**Horizon:** ~6–10 weeks after Phase 1–2 foundations  
**Value / Effort / Risk:** High / Medium / Low–Medium  
**Parent:** [Trader Development Roadmap v1.0](./FatTail-Labs-Trader-Development-Roadmap-v1.0.md)  
**Related:** Retrospective · Journey · Toughness · Habit plans · Practice Context · Massive (optional futures underliers)  

---

## 1. Summary

Phase 3 deepens **Alone** features so a **campaign season** is reviewed as **trader development**, not as a dump of trades.

| Workstream | Trader-dev question |
|------------|---------------------|
| Retro ↔ campaign/playbook | What did this season do to me as an operator? |
| Journey nudges | Am I drifting from the process? |
| Tag analytics v2 | Which behaviors am I repeating? |
| R-multiple / planned risk | Did I respect risk identity? |
| MFE/MAE (underlier) | How did I behave inside the hold? (process, not greed theater) |
| Futures underlier bars | Honest charts for ES/NQ-linked books |
| PWA polish | Can I practice daily on the phone? |

---

## 2. Problem

After Phase 1–2, members can **run** a season and **log** it. They still need:

- Ceremony that **closes** a season  
- Integrity feedback that **does not** require opening TradeZella  
- Risk language that fits **capital preservation**  
- Mobile habit for Journal / check-in  

---

## 3. Product change description

### 3.1 Retrospective × Campaign / Playbook

**Enhancement:**

- Start retro scoped to **campaign window** (or include campaign as gather context)  
- Report sections reference playbook breaches (adherence broke/partial counts)  
- Habit plans may propose “repair” habits from repeated process tags  

**Non-goal:** Auto-write playbook from AI without human confirm.

### 3.2 Journey coaching nudges

**Additional feature:** Meter-driven prompts on Journey / Member Home:

| Example trigger | Nudge style |
|-----------------|-------------|
| Routine down, trades up | Journal on trade days |
| Adherence broke streak | Revisit playbook before size-up |
| Live check-in cold | Presence is process |
| MT empty / Hard paused | Optional Toughness invite — never gated |

**Tone:** process coach, not edge coach. No “your EV would improve if…”

### 3.3 Tag analytics v2

**Enhancement:** Time series / cohorts:

- Process-tag rates over campaign vs prior  
- Co-occurrence (e.g. chased + broke) — careful, non-shaming framing  
- Still **no** win-rate-by-tag hero chart  

### 3.4 R-multiple / risk unit reports

**Additional feature:** If planned risk (or max loss) is captured on trade or playbook default:

- Distribution of R outcomes  
- Framed as **risk respect**, not profit maximization  

If planned risk not yet in schema, add **light field** on trade or playbook default size/risk note.

### 3.5 MFE / MAE (underlier-based)

**Additional feature:** Max favorable/adverse excursion using **underlier path** during hold:

- Defined-risk options: interpret carefully (structure risk ≠ underlier MAE)  
- Copy must not imply guaranteed optimal exits  

**Data:** Massive bars (Phase 2 chart stack).

### 3.6 Futures underlier data (optional thin add)

**When:** Member books with `future_option` need ES/NQ path for charts/MFE.

| In scope | Out of scope |
|----------|--------------|
| Massive Futures bars for ES/NQ (continuous/front) | Futures **options** chains |
| Chart + MFE support | Full futures daytrader product |

### 3.7 Mobile PWA polish

**Enhancement:** Journal session + live check-in + campaign badge usable on mobile Safari/Chrome; not a native store app.

---

## 4. Architectural change

| Area | Change |
|------|--------|
| Retro gather inputs | Include campaign_id / playbook stats in gather context DTO |
| Journey | Nudge rules config (fail loud if invalid); no second score store |
| Trade schema | Optional `planned_risk` / `risk_unit` if required for R reports |
| Market data | Optional Massive Futures entitlement + symbol map |
| Caching | Reuse Phase 2 bar cache for MFE |

No new “journey_scores” tables. DS-2: Journey remains derived.

---

## 5. Surfaces & acceptance

| Surface | Done when |
|---------|-----------|
| Retrospective | Campaign-season retro path works |
| Journey | At least 2–3 process nudges ship with clear copy |
| Reports | Tag v2 + R and/or MFE widgets (as data allows) |
| Trade chart | future_option books chart if futures bars enabled |
| Mobile | Critical path usable without desktop |

---

## 6. Dependencies

| Depends on | Why |
|------------|-----|
| Phase 1 Playbook + Campaign | Season review content |
| Phase 2 Charts (for MFE) | Underlier path |
| Phase 0–1 Tags | Analytics vocabulary |
| Toughness as-built | Nudges only; no new Hard program |

---

## 7. Out of scope

- Tick replay  
- AI edge recommendations  
- Prop firm dashboards  
- Futures options  
- Standalone SKU  

---

## 8. Exit criteria

1. Member can complete a **campaign season** and run a retro that speaks to playbook adherence and process tags.  
2. Journey surfaces at least one actionable **process** nudge without P&L shaming.  
3. Risk review (R and/or MFE) available with capital-preservation framing.  
4. Daily Journal/check-in workable on phone.  

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| MFE misread on multi-leg options | Strong copy + structure-aware caveats |
| Nudge fatigue | Few, meter-based, dismissible |
| Futures cost | Enable only if chart gaps proven |

---

## 10. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-3-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-3-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |

Gate prefix: **TD3-***. Prerequisite: **TD1-G** (+ TD2 charts for MFE).

---

## 11. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft |
| 2026-08-07 | Linked Agent Bench plan TD3 |
