# FatTail Labs — Trader Development Phase 4
## Optional Expansion — Only After Phases 0–3

**Status:** DRAFT v1.1 — Claude first pass + **OD locks applied** (Decision Addendum)  
**Supersedes:** v1.0 (2026-08-07 draft) — all v1.0 content preserved; deltas in §9  
**Type:** Optional product / commercial / architecture expansions — **trigger-based, never calendar-forced**  
**Parent:** [Trader Development Roadmap v1.1](./FatTail-Labs-Trader-Development-Roadmap-v1_1.md)  
**OD authority:** [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md)  
**Doctrine:** Do not start Phase 4 early to chase journal competitors · every expansion enters through the decision template (§6) · Refuse list survives all phases

---

## 1. Goal statement

Phase 4 is a **governed catalog of options**, not a backlog. Nothing here is required to
claim the trader-development category. Each candidate expands reach, revenue paths, or
convenience only after the Own spine (0–1) and Match hygiene (2) and person-deepening (3)
are real and used. The spec's job is to make the entry gates **measurable**, the decision
template **mandatory**, and the Refuse list **durable under commercial pressure** — the
moment a Phase 4 item is argued "for conversion," that argument is itself the signal to stop.

---

## 2. Entry gates (all must be true — now measurable)

| Gate | v1.0 signal | v1.1 measurable form (evidence for the decision log) |
|------|-------------|-----------------------------------------------------|
| Phase 1 | Playbook + Campaign used weekly | ≥ X dogfood/early members with ≥1 active-or-completed campaign **and** a playbook-linked trade in each of the last 4 weeks (X set by Coach; recorded with the trigger) |
| Phase 2 | Sync pilot stable; charts trusted | Sync error rate under agreed threshold across 4 consecutive weeks; zero unresolved quarantine older than 7 days; chart fail-loud incidents triaged |
| Phase 3 | Season retro path used | ≥1 completed **cadence retro carrying a completed campaign’s context** per active dogfood member (not a separate campaign-scoped retro product — OD-3.1) |
| Doctrine | No conversion-pressure theater | Tango/Sierra-capable review on the specific proposal finds no profit-theater framing |

Thresholds (X, error rate) are Coach-set **when the first expansion is proposed** and logged
with it — the spec fixes the *shape* of the evidence, not numbers invented today.

---

## 3. Expansion candidates (all kept from v1.0)

### 3.1 Second (and third) broker auto-sync
**Type:** product + ops · **Trigger:** >~30% of paid seats connected on broker #1 **or**
repeated documented demand for a missing #1 · **Effort:** Medium/venue · **Risk:** Medium.
Connected-only COGS and CSV fallback rules carry over unchanged. Architecture: connection
plane goes multi-provider; per-venue mappers; normalizer remains the only vendor-aware layer.

### 3.2 Process-language AI assist
**Scope:** journal session summary, retro draft questions, "which playbook rules might
apply?" · **Forbidden:** edge tips, win-rate predictions, "take profit here" — and any
silent write to any SoR. **Human confirm on every output that lands anywhere.**
**Trigger:** Playbook + campaign stable; agent stack capacity. **Architecture:** Agent Model
Interface; versioned prompts; guardrails in code not prompt (standing Journal doctrine).
**Risk:** Medium — hallucination → process lies; this is why confirm is structural.

### 3.3 Standalone Practice SKU
**Idea:** Practice-only tier (~$19–39/mo) vs full Navigator · **Trigger:** explicit Coach
strategy to enter the journal market without diluting membership · **Risk:** High
(positioning, support, cannibalization). Includes Log/Journal/Playbook/Campaign/Tags/charts;
sync on Pro sub-tier; live room + full library excluded or limited (TBD at proposal time).
**Architecture:** entitlement gates + feature flags on the same Family B stores — never a
forked Practice. Additional gate: membership/tier spec + commerce provider path must be
amended by spec, not improvised.

### 3.4 Mentor / coach view of Practice
**Scope:** consent-based coach read of campaign / adherence / journal summaries ·
**Trigger:** coaching ops need + Privacy Spec grants · **Risk:** High (Family B leakage).
**Rules:** fail closed; explicit per-surface grants; append-only audit of every coach read;
data-protection impact assessment before build (standing member-data requirement); revocable
by member at any time with immediate effect.

### 3.5 Futures underlier expansion
If not done in Phase 3: ES/NQ (+ limited list) bars for charts/MFE. **Still refuse** futures
options product.

### 3.6 Commission / fee models per venue
**Why:** honest equity path · **Trigger:** members dispute net vs gross in Reports ·
**Effort:** Medium. Framing stays capital-preservation honesty, not performance polish.

---

## 4. Architectural themes (kept)

| Expansion | Architecture notes |
|-----------|-------------------|
| Multi-broker | Multi-provider connection plane; per-venue mappers |
| AI assist | Agent Model Interface; prompt versioning; no silent SoR writes |
| Standalone SKU | Plans/entitlements; feature flags; marketing site; commerce via providers only |
| Coach view | Privacy grants; surface allowlist; append-only audit (existing privacy patterns) |

---

## 5. Still refuse (even in Phase 4 — kept verbatim)

Unless Coach explicitly reopens category strategy: tick/250ms replay as core · 300–600
generic analytics charts as marketing claim · prop-firm sync as primary ICP · win-rate-by-tag
as Journey hero · full multi-year OPRA tick lake · futures options surface.

---

## 6. Decision template (mandatory, per expansion — kept + tightened)

Recorded in the decision log **before** build:

1. **Trigger evidence** — the §2 measurements, attached, not asserted
2. **Value for trader development** — not vanity parity; one paragraph in spine language
3. **COGS / support load** — numbers with owner
4. **Privacy impact** — Family B analysis; DPIA where member data surfaces expand
5. **Kill criteria** — the observable that proves it wrong, and what "stop" means
6. **Refuse check** — explicit statement that nothing in the proposal is on the §5 list

## 7. Exit criteria (program-level, per expansion — kept)

1. Dogfood/pilot proves habit improvement or dual-sub reduction, **and**
2. Doctrine review (Tango/Sierra-capable) finds no profit-theater regression, **and**
3. Family B isolation tests pass.

---

## 8. Open decisions — **RESOLVED** (Decision Addendum v1.1)

| # | Lock |
|---|------|
| OD-4.1 | **Juliet (or Coach) proposes**; **Coach only approves** |
| OD-4.2 | **Per-expansion thresholds** when first proposed |

See [Decision Addendum](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md).

## 9. v1.0 → v1.1 ideas inventory (nothing silently dropped)

| v1.0 item | Disposition |
|-----------|-------------|
| All six candidates | Kept, none removed, none promoted |
| Entry gates | Kept; measurable evidence shapes added |
| Refuse list | Kept verbatim |
| Decision template | Kept; kill criteria sharpened; Refuse-check step added |
| Exit criteria | Kept verbatim |
| Coach-view risk posture | Kept; audit + DPIA + revocation made explicit per standing member-data requirements |
| AI-assist human-confirm | Kept; "no silent SoR writes" made structural |

## 10. Decision-log entry (draft, on approval)

> **Phase 4 Optional Expansion:** a trigger-gated catalog (multi-broker, process-language AI
> assist, standalone Practice SKU, coach view, futures bars, fee models) entered only through
> the mandatory decision template with measurable Phase 0–3 gates, kill criteria, and a
> standing Refuse list. Nothing here is required for the category claim; conversion pressure
> is a stop signal, not a trigger. No profit claims. Family B unchanged.

## 11. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-4-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-4-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |
| Decision addendum | [`FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) |

Gate prefix: **TD4-***. Prerequisite: **TD3-G** + per-expansion **TD4-0** GO.

---

## 12. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft (Coach/Grok) |
| 2026-08-07 | v1.1 Claude first pass — measurable gates, tightened template, proposal-rights OD |
| 2026-08-07 | v1.1a — OD locks + Agent Bench links (Decision Addendum) |
| 2026-08-07 | v1.1b — Phase 3 gate wording aligned to OD-3.1 (cadence retro + campaign context) |
