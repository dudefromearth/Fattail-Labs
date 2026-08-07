# FatTail Labs — Trader Development Phase 4  
## Optional Expansion — Only After Phases 0–3

**Status:** DRAFT — Coach review  
**Type:** Optional product / commercial / architecture expansions  
**Horizon:** Post Phase 3; trigger-based, not calendar-forced  
**Value / Effort / Risk:** Variable / High / Medium–High  
**Parent:** [Trader Development Roadmap v1.0](./FatTail-Labs-Trader-Development-Roadmap-v1.0.md)  

---

## 1. Summary

Phase 4 items are **not** required to claim the trader-development category.  
They expand **reach, revenue paths, or convenience** after the Own spine and Match hygiene are real.

**Do not start Phase 4 early** to chase journal competitors.

---

## 2. Entry gates (all should be true)

| Gate | Signal |
|------|--------|
| Phase 1 | Playbook + Campaign used weekly by dogfood / early members |
| Phase 2 | Sync pilot stable; charts trusted |
| Phase 3 | Season retro path used at least once per active dogfood member |
| Doctrine | No pressure to add profit-theater features “for conversion” |

---

## 3. Expansion candidates

### 3.1 Second (and third) broker auto-sync

| | |
|--|--|
| **Type** | Product enhancement + ops |
| **Trigger** | >~30% of paid seats connected on broker #1 **or** repeated #1-missing demand |
| **Value** | Match breadth |
| **Effort** | Medium per venue |
| **Risk** | Medium (support, mapping) |
| **Note** | Still connected-only COGS; still CSV fallback |

### 3.2 Process-language AI assist

| | |
|--|--|
| **Type** | Additional feature |
| **Scope** | Journal session summary, retro draft questions, “which playbook rules might apply?” |
| **Forbidden** | Edge tips, win-rate predictions, “take profit here” |
| **Trigger** | Playbook + campaign stable; agent stack capacity |
| **Effort** | Large |
| **Risk** | Medium (hallucination → process lies) — human confirm required |

### 3.3 Standalone Practice SKU

| | |
|--|--|
| **Type** | Commercial + product packaging |
| **Idea** | Practice-only tier (~$19–39/mo) vs full Navigator |
| **Trigger** | Explicit Coach strategy to enter journal market **without** diluting membership |
| **Includes** | Log, Journal, Playbook, Campaign, Tags, charts; sync included on Pro sub-tier |
| **Excludes** | Live room, full course library (or limited) — TBD |
| **Risk** | High (positioning, support, cannibalization) |
| **Architecture** | Entitlement gates; same Family B stores |

### 3.4 Mentor / coach view of Practice

| | |
|--|--|
| **Type** | Product + privacy architecture |
| **Scope** | Consent-based coach read of campaign / adherence / journal summaries |
| **Trigger** | Coaching ops need; Privacy Spec grants |
| **Effort** | Large |
| **Risk** | High (Family B leakage) — fail closed, explicit grants, audit |

### 3.5 Futures underlier expansion

| | |
|--|--|
| **Type** | Data + product |
| **If not done in Phase 3** | ES/NQ (+ limited list) bars for charts/MFE |
| **Still refuse** | Futures options product |

### 3.6 Commission / fee models per venue

| | |
|--|--|
| **Type** | Product enhancement |
| **Why** | Honest equity path |
| **Trigger** | Members dispute net vs gross in Reports |
| **Effort** | Medium |

---

## 4. Architectural themes (when entered)

| Expansion | Architecture notes |
|-----------|-------------------|
| Multi-broker | Connection plane multi-provider; per-venue mappers |
| AI assist | Agent Model Interface; prompt versioning; no silent writes to SoR |
| Standalone SKU | Plans/entitlements; feature flags; marketing site |
| Coach view | Privacy grants; surfaces list; audit log (existing privacy patterns) |

---

## 5. Still refuse (even in Phase 4)

Unless Coach explicitly reopens category strategy:

- Tick / 250ms market replay as core  
- 300–600 generic analytics charts as marketing claim  
- Prop-firm sync as primary ICP  
- Win-rate-by-tag as Journey hero  
- Full multi-year OPRA tick lake  
- Futures options surface  

---

## 6. Decision log template (per expansion)

Before build, record:

1. Trigger evidence  
2. Value for **trader development** (not vanity parity)  
3. COGS / support load  
4. Privacy impact  
5. Kill criteria if wrong  

---

## 7. Exit criteria (program-level for any single expansion)

Expansion is “done” only when:

1. Dogfood or pilot proves habit improvement or dual-sub reduction, **and**  
2. Doctrine review (Tango/Sierra-capable) finds no profit-theater regression, **and**  
3. Family B isolation tests pass.  

---

## 8. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-4-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-4-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |

Gate prefix: **TD4-***. Prerequisite: **TD3-G** + per-expansion **TD4-0** GO.

---

## 9. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft |
| 2026-08-07 | Linked Agent Bench plan TD4 |
