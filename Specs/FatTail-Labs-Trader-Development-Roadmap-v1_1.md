# FatTail Labs — Trader Development Roadmap v1.1

**Status:** **BUILD AUTHORITY** (Coach GO 2026-08-07 · DL-254) — OD locks in Decision Addendum  
**Supersedes:** v1.0 (2026-08-07)  
**Date:** 2026-08-07  
**Doctrine:** **Trader development**, not trade development  
**Parents:** North Star Member Ethos · Process Integrity · Trade Log v1.1 · Tag Manager v0.3 · Journey Experience · Hard/Toughness · Member Practice Export v1.3 · Strategy Lab Life Cycle v1.1 · Practice Context v0.2 · Continuous Journaling Direction (DL-191)  
**OD authority:** [`FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md)

---

## 1. Category claim (unchanged)

| Peers sell | FatTail sells |
|------------|---------------|
| Trading journal (analyze **trades** → find edge) | Trader development system (practice → become **reliable under risk**) |

**One-line edge:** Journals improve trades. FatTail develops **traders** — process, capacity,
and capital preservation as the operating system of membership.

---

## 2. Match · Own · Refuse (unchanged)

| Mode | Intent | Examples |
|------|--------|----------|
| **Match** | Hygiene so members do not dual-subscribe for logging | Auto-sync, static trade charts, multi-leg blotter, portable data |
| **Own** | Category claim — go alone | Playbook-as-character, trading campaigns, process Tags, Journal→Retro→Journey, Toughness, coaching membership |
| **Refuse** | Trade-development theater | Tick replay, 600 charts, P&L AI edge coach, prop-firm core, win-rate-as-hero |

---

## 3. Phased attack

| Phase | Doc | Intent | Effort | Risk |
|-------|-----|--------|:------:|:----:|
| **0** | [Phase-0 v1.1](./FatTail-Labs-Trader-Development-Phase-0-Foundation-Glue-v1_1.md) | Glue existing surfaces; Tags productized; process filter | Low | Low |
| **1** | [Phase-1 v1.1](./FatTail-Labs-Trader-Development-Phase-1-Own-Spine-v1_1.md) | Playbook · Campaign · adherence — Own spine MVP | Medium | Low–Med |
| **2** | [Phase-2 v1.1](./FatTail-Labs-Trader-Development-Phase-2-Match-Hygiene-v1_1.md) | Charts · one broker sync · process reports | Med–High | Medium |
| **3** | [Phase-3 v1.1](./FatTail-Labs-Trader-Development-Phase-3-Deepen-Person-v1_1.md) | Season retro · nudges · risk respect · PWA | Medium | Low–Med |
| **4** | [Phase-4 v1.1](./FatTail-Labs-Trader-Development-Phase-4-Optional-Expansion-v1_1.md) | Trigger-gated expansions only | High | Med–High |

**Operating cadence:** Own first → Match second → Deepen third → Refuse theater always.

---

## 4. Spine (member story — unchanged)

```text
WHO I AM          Playbook
I PRACTICE        Campaign (season)
WHAT I DID        Trade Log + Tags + Journal
I FACE IT         Retrospective
AM I BECOMING?    Journey
CAN I HOLD LOAD?  Toughness
I LEARN WITH      Courses · Live · Coach
```

---

## 5. Cross-phase decisions — **RESOLVED**

Full text: [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md).

| OD | Lock |
|----|------|
| **OD-1.1** Practice Campaign vs Strategy Lab Deploy | **A** — separate SoRs; Practice owns member word “Campaign”; SL keeps Deploy |
| **OD-1.3** Active campaigns | **Single** active campaign per identity |
| **OD-2.2** Broker sync provenance | **`entry_source = sync`** (fourth catalog value) |

---

## 6. Explicit non-goals (roadmap-wide — unchanged)

Tick / Level II replay race · 300–600 generic P&L chart suite · AI that optimizes edge/win
rate · multi-year full OPRA tick archive · futures **options** product surface (underlier
futures bars OK later) · standalone $99 "Ultra journal" positioning.

---

## 7. Success metrics (program)

| Metric | Signal | Evidence shape |
|--------|--------|----------------|
| Formation | Members describe Practice as operator practice, not "my journal" | Qualitative: dogfood interviews / support language |
| Dual-sub | Decline in need for Zella/TraderVue for daily logging | Dogfood self-report + sync adoption |
| Loop use | Weekly active use across Log + Journal + (Campaign\|Playbook) | Existing activity analytics — no new tracking surface required |
| Integrity | Journey/adherence used as review language in retros | Retro content references (Family-B-respecting count, not content mining) |

---

## 8. Agent Bench

| Artifact | Path |
|----------|------|
| Full multi-agent plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Phase bench plans | `Docs/Trader-Development-Phase-{0–4}-Agent-Bench-Plan.md` |
| Program board | [`agents/p-trader-development/`](../agents/p-trader-development/) |
| Claude alignment | [`Docs/Claude-Alignment-Trader-Development-Spec-Finish-Pass.md`](../Docs/Claude-Alignment-Trader-Development-Spec-Finish-Pass.md) |
| Decision addendum | [`FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) |

**Sequencing law:** Spec BUILD AUTHORITY (Coach stamp on Phase 0–1 minimum) → **TD0-0** → **TD0-G** → TD1+ implementation. No waived Delta gates.

---

## 9. Path to BUILD AUTHORITY

1. Accept Decision Addendum locks (this revision).  
2. Coach stamps **BUILD AUTHORITY** on Roadmap + Phase 0 + Phase 1 (and Phase 2–3 as ready).  
3. Lima logs DL entry from Addendum §8.  
4. Juliet opens TD0 seeds; Delta runs TD0-G.  

---

## 10. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 — phased roadmap from competitive audit + trader-development lock |
| 2026-08-07 | v1.1 — index updated to v1.1 phase specs; cross-phase OD roll-up; metrics evidence shapes |
| 2026-08-07 | v1.1a — OD locks via Decision Addendum; Agent Bench links; BUILD AUTHORITY path |
