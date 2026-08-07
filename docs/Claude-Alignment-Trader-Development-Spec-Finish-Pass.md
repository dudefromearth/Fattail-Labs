# Alignment note for Claude — assessment of Coach’s instructions

**From:** Grok (roadmap author / competitive analysis co-author)  
**For:** Claude’s first pass finishing the Trader Development phase specs  
**Specs:** `Specs/FatTail-Labs-Trader-Development-Roadmap-v1.0.md` + Phases 0–4  
**Date:** 2026-08-07  

---

## 1. What Coach asked you to do

> Competitive analysis done → establish our **own space**, **differentiate**, create **relative parity** where we overlap.  
> **Finish each spec** so it is the **highest representation of the goal** for **usability** and **reliability**.

That is a **spec-completion** mandate, not a new strategy exercise. Strategy is largely locked; your job is to raise the phase docs from DRAFT sketches to **build-ready product/architecture authority**.

---

## 2. Assessment: the instructions are good

| Strength | Why it matters |
|----------|----------------|
| **Own space first** | Prevents a “clone TradeZella” finish |
| **Parity only where we overlap** | Match = hygiene (sync, charts, logging), not the product story |
| **Usability + reliability as quality bar** | Specs must be shippable, not visionary essays |
| **Per-spec finish** | Each phase stays a bounded change description |

**Gaps to close in your pass** (implied, not stated by Coach):

1. **Trader development doctrine** — explicit in our work; keep it as the non-negotiable north star  
2. **Match · Own · Refuse** — use it in every phase so scope doesn’t creep  
3. **As-built constraints** — Tag Manager v0.3, Trade Log, Export, Journey, Toughness, Massive, Family B already exist; finish *against* them  
4. **Acceptance / exit criteria** — make them testable (usability paths + reliability invariants)  
5. **Fail loud / no silent defaults** — Labs doctrine; reliability language must match  

---

## 3. Shared north star (do not redefine)

**Category:** Trader development OS inside membership — **not** trade development / edge analytics.

**Spine members should feel:**

```text
Playbook (who I am under risk)
  → Campaign (season of practice)
  → Trade Log + Tags + Journal (evidence)
  → Retrospective (face it)
  → Journey (am I becoming?)
  → Toughness (can I hold load?)
  → Courses / Live / Coach
```

**Competitive frame:**

| Mode | Meaning | Finish specs toward |
|------|---------|---------------------|
| **Own** | Alone / moat | Playbook-as-character, campaigns, process Tags, Retro, Journey, Toughness, doctrine |
| **Match** | Relative parity | Auto-sync, static charts, multi-leg log, portable data, thin process reports |
| **Refuse** | Do not design in | Tick replay, 600 charts, P&L AI edge coach, prop-firm core, win-rate-as-hero |

If a “highest usability” idea requires Refuse-class scope, **call it out and cut it** or park in Phase 4 with gates.

---

## 4. What “highest representation” means for *these* specs

### Usability (member can live the goal)

- One mental model; no dual “campaign” meanings without a bridge  
- Daily path short: label, log, journal, see season context  
- Empty states, progressive disclosure, process language (no profit theater)  
- Practice chrome carries shared context (account / date / active campaign as designed)  
- Playbook = rules of the **person**; not a backtest setup catalog  

### Reliability (system tells the truth under load)

- Family B isolation absolute  
- Additive import; portable `export_key`s; idempotent sync  
- Connected-only broker COGS; disconnect on churn  
- Fail loud on missing config / stale market data / bad multi-leg groups  
- Entitlements fail closed  
- Verification: acceptance criteria a human or agent can prove (UI path + API/tests)  

**Highest representation ≠ largest feature list.** It means the **smallest complete design** that fully serves trader development for that phase.

---

## 5. Phase intent (so you don’t re-sequence)

| Phase | Type | Finish for |
|-------|------|------------|
| **0** | Product enhancement | Story + Tags productization + process filter; **no** new SoR |
| **1** | Product + architecture | Playbook + Campaign + links + adherence; **Own spine MVP** |
| **2** | Product + architecture | Charts + **one** broker sync + process reports; **Match hygiene** |
| **3** | Product enhancement | Season retro, Journey nudges, R/MFE, optional futures underliers, PWA |
| **4** | Optional | Only with entry gates; kill criteria; refuse theater |

**Order principle:** Own first → Match second → Deepen third. Don’t pull Phase 2 multi-broker or Phase 4 AI into Phase 1 for “completeness.”

---

## 6. Already-built facts (don’t respec from zero)

| Area | Reality |
|------|---------|
| **Tags** | Tag Manager v0.3 as-built — admin lexicon; members assign only; `trade`, `journal_session`, `retrospective`, `playbook_entry` |
| **Trade Log** | Multi-leg, adherence fields, ToS/CSV/native import, Practice pack export/import |
| **Journey / Toughness** | Live process compass + Hard programs |
| **Playbook** | Stub UI + export stub; Phase 1 makes it real |
| **Campaigns** | Coach adding architecture (practice/life-cycle seasons — **not** marketing Campaign Workflow) |
| **Market data** | Massive already Strategy Lab plane; Practice charts reuse |
| **Sync COGS** | ~$1.50/connected user — opt-in connect only |

Your finish pass should **integrate and tighten**, not invent a parallel tag system or second trade log.

---

## 7. Suggested deliverable shape per phase spec

For each of Phases 0–4 (and tighten the umbrella if needed), elevate to include:

1. **Goal statement** (one paragraph, trader-dev framed)  
2. **User journeys** (happy path + failure path) — usability  
3. **In / out of scope** (with Match/Own/Refuse tags)  
4. **Information architecture / data model** (if any)  
5. **API / surface contracts** (high level)  
6. **Reliability invariants** (isolation, idempotency, fail loud)  
7. **Acceptance criteria** (checklist, testable)  
8. **Risks & non-goals**  
9. **Dependencies & exit criteria**  

Keep tone consistent with existing FatTail Specs (status, parents, Family B, fail loud).

---

## 8. Alignment contract (Grok ↔ Claude)

| We agree | We push back if |
|----------|-----------------|
| Finish specs for **usability + reliability** at highest fidelity to **trader development** | Spec becomes a trade-journal clone |
| **Relative parity** only on Match items | Phase 0–1 bloated with sync/replay |
| Own spine is Playbook × Campaign × Tags × Journal → Retro → Journey → Toughness | “Campaign” confuses marketing vs practice season |
| Smallest complete design per phase | Kitchen-sink “v1” that can’t ship |
| Respect as-built Tag/Trade Log/Export/Privacy | Parallel vocabularies or second SoR |

---

## 9. One sentence for Claude’s first pass

**Raise each phase doc from directional DRAFT to build-authority quality so a team could implement a usable, reliable slice of trader development—owning formation, matching only logging/chart hygiene, and refusing trade-theater—without reopening competitive strategy.**

---

## 10. Spec paths (repo)

| Doc | Path |
|-----|------|
| Umbrella | `Specs/FatTail-Labs-Trader-Development-Roadmap-v1.0.md` |
| Phase 0 | `Specs/FatTail-Labs-Trader-Development-Phase-0-Foundation-Glue-v1.0.md` |
| Phase 1 | `Specs/FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1.0.md` |
| Phase 2 | `Specs/FatTail-Labs-Trader-Development-Phase-2-Match-Hygiene-v1.0.md` |
| Phase 3 | `Specs/FatTail-Labs-Trader-Development-Phase-3-Deepen-Person-v1.0.md` |
| Phase 4 | `Specs/FatTail-Labs-Trader-Development-Phase-4-Optional-Expansion-v1.0.md` |
| This alignment note | `Docs/Claude-Alignment-Trader-Development-Spec-Finish-Pass.md` |

---

## 11. Document history

| Date | Note |
|------|------|
| 2026-08-07 | Written for Coach to share with Claude before first finish pass |
