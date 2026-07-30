# Advisor Gates — Journal Retrospective Spec v0.51

These gates must clear before the spec lands in the decision log.

**Canonical path:** `Specs/Advisor-Gates-Retrospective-v0.51.md`  
**Pairs with:** Spec **v0.5** (build authority) · Spec **v0.51** (cadence teaching-rhythm amendment) · Spec **v0.6** (as-built)

---

## Gate 1: Hotel (trading domain accuracy)

**Question:** MIN_INFERENCE_N = 20 trades / events before the system will render a comparison or deviation analysis. Is 20 the right threshold? Does it need to vary by asset class or strategy?

**Context:** v0.4 §7.2 and §7.5. The gate protects against small-sample illusion — five trades that happened to win don't prove a method works. Hotel has standing to raise or lower this based on zero-DTE vs swing vs position trading norms.

**Spec dependency:** §7.2 (book result comparison), §7.3 (deviations), §6.4 (what worked)

---

## Gate 2: Tango (member archetype and capacity)

**Question:** The tone of the small-sample banner (when `n < MIN_INFERENCE_N`) and the collapsed P&L section under demoralization risk.

When a member sees five trades, the system says something like "not enough data to compare yet" — invitational, not discouraging. When they see a loss, does collapsed P&L feel like the system protecting them (good) or hiding bad news (bad)?

**Context:** v0.5 §6 render order puts process integrity *before* P&L. The member sees what they did right first, then the book result. But a losing week hits hard. Copy and placement need to land that the process is the point, not the outcome.

**Spec dependency:** §6.2 (integrity driver copy), §6.6 (collapsed P&L placement and default)

---

## Gate 3: Mike (privacy and Family B isolation)

**Question:** Pre-market journal entries (intent, expected moves, pre_market_note field) are quoted verbatim in §6.5 "Expected vs actual." Those quotes stay Family B — member-private, never surfaced in Community or coaching boards. Confirm the isolation holds.

**Context:** v0.5 §6.5 and Journey §5. A member's pre-market thinking is intimate. It can't leak.

**Spec dependency:** §6.5 payload, Family B annotation on pre_market fields

---

## Gate 4: India (schema and schema placement)

**Question:** Where do member habit plans live? v0.4 §6.0 references them; the schema is TBD. Also: `retrospective_pnl_expanded` (boolean, defaults to 0) — should this be a prefs column or a direct field on identities?

**Context:** v0.5 §4.1 (new field added to meter profiles); §6.6 (collapsed P&L as default). No second source of truth for progress. Single append-only surface.

**Spec dependency:** schema for `member_habit_plans`, placement of `retrospective_pnl_expanded`

---

## Gate 5: Sierra (external and marketing use)

**Question:** Book performance copy from §6.6 — "You closed +2.34R on AAPL weeklies" — does this ever leave Family B for marketing, coaching boards, or testimonials? If yes, what anonymization rules apply? If no, state it.

**Context:** v0.4 §8 (sacred invariant: no profit claims). A member's P&L is theirs. It can be part of their story if they choose; it can't become your billboard.

**Spec dependency:** §6.6 and §8 (no reuse rules)

---

## Gate 6: Delta (evidence plan for R2b–R7)

**Question:** Implementation slices R2b through R7 land in sequence. Each needs characterization tests, live curl evidence, and schema changes documented. What's the shape of the evidence packet?

**Context:** v0.5 defines the behavior; implementation must prove it works. Delta gates the evidence.

**Spec dependency:** §13 (implementation slices), §14 (verification)

---

## Open — not a gate, needs a decision

**Observer entitlement:** v0.5 settles this — retrospectives available to Observer trial. No gate needed, it's your decision and it's recorded.

**Cadence as teaching signal:** v0.5 settles this — the meter is signal, not enforcement; members own the rhythm once they convert. No gate needed, it's settled.

*(v0.51 further locks teaching horizons: trial weekly H=7; alumni H=90 — DL-118.)*

---

## Deferred (not v0.5)

- **Cost-of-deviation counterfactual** — needs Hotel + Tango alignment on whether to show "if you had done X instead, you'd have +0.5R."
- **Agent provider choice** — MSC or external; HTTP-only boundary; decision-log item when decided.
- **Anti-gaming guard** — empty-retrospective reset clock; needs Tango (does it punish re-engagement?) and India (where does the check live?).

---

## Clearance matrix (filed 2026-07-29)

All six gates **CLEARED** during p-retrospective W0 / build. Spec v0.5 landed in the decision log (DL-081…087); program closed RT8-G (DL-117); v0.51 horizons applied (DL-118).

| Gate | Owner | Verdict | Where locked | Evidence |
|------|-------|---------|--------------|----------|
| **1 Hotel** | Hotel · India | **CLEARED** | `MIN_INFERENCE_N = 20` (no asset-class variance in v0.5) | Seed `RT0-2-hotel-sample-size.md` · DL-082 · Spec §0.2 / §6.6 / §21 |
| **2 Tango** | Tango · Hotel | **CLEARED** | Sample banner + collapsed book chrome + §19 glossary | Seed `RT0-3-tango-copy.md` · DL-083 · Spec §6.0 / §6.6 / §7.5 / §19 |
| **3 Mike** | Mike · India | **CLEARED** | Family B isolation; pre_market never public | Seed `RT0-4-mike-isolation-entitlement.md` · DL-084 · Spec §10.1 |
| **4 India** | India · Mike | **CLEARED** | `member_habit_plans` table (mig 047); `identities.retrospective_pnl_expanded` default 0 | RT0-1 fold · RT1-1 schema · DL-081 / DL-088 · Spec §9.2 / §9.3 |
| **5 Sierra** | Sierra · Tango | **CLEARED** | **No** — book performance never leaves Family B for marketing/SEO/testimonials | Seed `RT0-5-sierra-marketing.md` · DL-085 · Spec **§20** |
| **6 Delta** | Delta | **CLEARED** | Phase gates with characterization + gate reports | RT0-G…RT8-G PASS · seeds RT1-2…RT7-3 · `agents/p-retrospective/gate-reports/` |

### Evidence packet shape (Gate 6 — as run)

For each phase seed: completion criteria → reviewer APPROVED → Delta gate report with:

1. Checklist criteria mapped to Spec sections  
2. Live pytest / curl / file-read evidence (no “it should work”)  
3. Residuals listed (non-blocking)  
4. Verdict ternary: **PASS / FAIL / BLOCKED**  

Program characterization suite at close: `test_retrospectives` + `test_habit_plans` + `test_retrospective_agent` + `test_journey_scores` (**82 passed** at RT8-G).

### Deferred status (still open — Spec v0.6 §6 residuals)

| Item | Status |
|------|--------|
| Cost-of-deviation counterfactual | **Deferred** — not shipped |
| Agent provider (external LLM / MSC HTTP) | **Deferred** — local mode only (RT5) |
| Anti-gaming empty-retro clock | **Deferred** — not designed; cadence uses `completed_at` only |

### Document map

| Doc | Role |
|-----|------|
| **This file** | Advisor gate questions + clearance matrix |
| Spec v0.5 | Build authority (Coach GO) |
| Spec v0.51 | Cadence teaching horizons (weekly trial H=7) |
| Spec v0.6 | As-built product truth |
| Journey §4.1a / §4.4 | Meter formula + profiles |
| `Architecture/00-decision-log.md` | DL-081…118 |
