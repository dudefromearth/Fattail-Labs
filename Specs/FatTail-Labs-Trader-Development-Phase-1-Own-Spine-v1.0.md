# FatTail Labs — Trader Development Phase 1  
## Own Spine — Playbook · Campaign · Adherence

**Status:** DRAFT — Coach review  
**Type:** Product addition + **architectural change** (new member Practice objects)  
**Horizon:** ~3–6 weeks  
**Value / Effort / Risk:** Highest / Medium / Low–Medium  
**Parent:** [Trader Development Roadmap v1.0](./FatTail-Labs-Trader-Development-Roadmap-v1.0.md)  
**Related:** Strategy Lab Life Cycle (campaign phase) · Tag Manager (`playbook_entry`) · Trade Log · Practice Export · Practice Context  

---

## 1. Summary

Phase 1 ships the **Own** spine at MVP depth:

| Object | Trader-development meaning |
|--------|----------------------------|
| **Playbook** | Who I am under risk (rules I will not break) |
| **Campaign** | A season of *practicing* that identity |
| **Adherence link** | Did I keep the covenant on this fill? |

This is **not** trade development (no backtester, no edge optimizer).  
Trade Log remains **evidence**, not the hero.

---

## 2. Problem

| Gap | Effect |
|-----|--------|
| Playbook is “coming soon” stub | No durable “character under risk” SoR |
| Campaign architecture landing without Practice binding | Strategy Lab life cycle and Practice may diverge |
| Adherence exists on trades but is free-floating | Not scored against a book or season |
| Peers own “Strategies” as P&L slices | We must own **Playbook-as-character** first |

---

## 3. Product change description

### 3.1 Playbook v1 (additional feature)

**Member surface:** `/app/playbook` (replace stub)

| Capability | v1 scope |
|------------|----------|
| List / create / edit / archive entries | Yes |
| Title + body (rules, structure intent, size constraints) | Yes |
| Optional structured fields (asset class, structure codes) | Optional light schema |
| Tag with lexicon (`playbook_entry` object type — already in Tag Spec) | Yes |
| Export/import portable keys | Yes (Phase 1 or 1.1) |

**Non-goals v1:** Live rule engine, auto-block orders, Strategy Lab pack compile, P&L by setup.

### 3.2 Trading Campaign v1 (architectural + product)

**Intent:** Time-bounded **practice season**, not marketing campaign (`Campaign-Workflow-Spec` is acquisition — out of scope).

| Field (conceptual) | Purpose |
|--------------------|---------|
| `name` / title | Member language |
| `status` | planned · active · completed · abandoned |
| `starts_at` / `ends_at` (or open-ended active) | Season window |
| Optional `playbook_entry_id`(s) | Scope: only these rules this season |
| `identity_id` | Family B |

**Practice Context enhancement:** “Active campaign” selectable in Practice chrome (alongside account/date where applicable).

**Non-goals v1:** Full process runtime plugins, bot execution, multi-user campaigns, prop challenges.

**Alignment:** Strategy Lab Life Cycle “campaign” phase should **reference or share identity** with Practice campaign objects where possible — single mental model for the member. Detail in architecture note (§4).

### 3.3 Trade ↔ Playbook ↔ Campaign (product enhancement)

| Link | Behavior |
|------|----------|
| Trade → playbook entry | Optional link on create/edit |
| Trade → campaign | Optional; default active campaign if set |
| Blotter filters | By campaign, by playbook entry, by tag |
| Practice context bar | Active campaign badge |

### 3.4 Adherence vs Playbook (product enhancement)

Existing adherence enum (`followed` · `partial` · `broke` · `unknown`) stays.

**Enhancement:** When a playbook (or active campaign’s playbook) is in scope, prompt language becomes:

> Against your playbook: followed / partial / broke?

No automatic scoring required in v1 (manual is honest and low risk).

---

## 4. Architectural change

### 4.1 New Family B stores (illustrative)

```text
member_playbook_entries
  id, identity_id, title, body_md, structured_json?, status, export_key, timestamps

member_practice_campaigns
  id, identity_id, title, status, starts_at, ends_at, export_key, timestamps

member_practice_campaign_playbooks  (optional M2M)
  campaign_id, playbook_entry_id

member_trade_log_trades
  + playbook_entry_id NULL
  + practice_campaign_id NULL
```

Exact migration names and constraints: implementation seed; **fail loud** on missing FKs identity isolation.

### 4.2 Practice Context

Extend Practice Context Spec: **Campaign** as optional shared context (top chrome), not buried only in Trade Log.

### 4.3 Strategy Lab boundary

| Layer | Owns |
|-------|------|
| Practice campaign | Member practice season + evidence links |
| Strategy Lab campaign phase | Process/runtime evidence for packs (if separate) |
| Bridge | Shared IDs or explicit “linked campaign” — decide in weekend arch; document in Arch note |

**Invariant:** Member never maintains two unrelated “campaign” concepts without UI explanation.

### 4.4 Portability

Export Spec bump (v1.4 candidate):

- `fattail.labs.playbook` beyond stub notes → real entries  
- `fattail.labs.practice_campaign` or pack surface `campaign`  
- Trade links by portable export keys  

Import: additive only; open-campaign demotion rules if needed (mirror retro open-limit pattern).

### 4.5 Entitlement

Same Practice gate as Trade Log / Journal (Observer trial / Navigator). No new paid SKU in Phase 1.

---

## 5. Surfaces & acceptance

| Surface | Done when |
|---------|-----------|
| `/app/playbook` | CRUD live; tags assignable |
| Campaign UI | Create/activate/complete; appears in Practice context |
| Trade Log | Link + filter by playbook/campaign; adherence copy |
| Export | Round-trip keys for new objects (or documented follow-up 1.1) |
| Isolation | Family B: no cross-identity reads |

---

## 6. Dependencies

| Item | Phase |
|------|-------|
| Phase 0 Tags UX | Strongly preferred first |
| Weekend campaign architecture | Input to §4.3 |
| Tag Manager `playbook_entry` | Already specified |

---

## 7. Out of scope

- Broker auto-sync, trade charts (Phase 2)  
- Auto adherence AI  
- Marketing campaigns / ActiveCampaign  
- Futures options, replay  

---

## 8. Exit criteria

1. Member can define a playbook and open a campaign season.  
2. Trades can carry campaign + playbook + tags + adherence.  
3. Filters answer: “What did I do *in this season against this book*?”  
4. Story is Own: character → season → evidence — not edge charts.  

---

## 9. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Two “campaign” concepts (SL vs Practice) | Explicit bridge + single chrome label |
| Scope creep into process runtime | v1 = container + links only |
| Export lag | Ship product first; portability gate before Phase 2 complete |

---

## 10. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-1-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-1-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |

Gate prefix: **TD1-***. Prerequisite: **TD0-G** PASS.

---

## 11. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft |
| 2026-08-07 | Linked Agent Bench plan TD1 |
