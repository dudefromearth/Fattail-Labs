# FatTail Labs — Trader Development Phase 3
## Deepen the Person — Retro · Journey · Risk · Capacity Context

**Status:** DRAFT v1.1 — Claude first pass + **OD locks applied** (Decision Addendum); formal BUILD AUTHORITY pending Coach stamp  
**Supersedes:** v1.0 (2026-08-07 draft) — all v1.0 content preserved; deltas in §12  
**Type:** Product enhancement (integrates Own spine into the review loop)  
**Horizon:** ~6–10 weeks after Phase 1–2 foundations  
**Value / Effort / Risk:** High / Medium / Low–Medium  
**Parent:** [Trader Development Roadmap v1.1](./FatTail-Labs-Trader-Development-Roadmap-v1_1.md)  
**OD authority:** [Decision Addendum v1.1](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md)
**As-built contracts:** Retrospective Spec **v0.7.x** (gather-fixed scope; completed retros immutable under context — Practice Context v0.2 §4) ·
Journey Experience (derived meters — **DS-2: no second score store**) · Toughness/Hard as-built ·
Trade Log **v1.1** (`records/series` adherence_rate; optional `pnl_amount`) · Massive bar stack (Phase 2) ·
Member notifications pattern (`member_notify`, retro material-ready)
**Doctrine:** Season reviewed as **trader development**, not trade dump · nudges coach process, never edge · capital-preservation framing on all risk language · Hotel gate on every risk/excursion copy surface

---

## 1. Goal statement

After Phases 1–2 a member can run and log a season. Phase 3 gives the season a **closing
ceremony** and the member an **integrity mirror**: a retrospective scoped to the campaign
window that speaks in playbook and tag language; a few meter-driven Journey nudges that catch
drift without shaming; risk review framed as **risk respect** (R-multiples, and
underlier-based MFE/MAE with structure-honest caveats); and a phone-usable daily loop. The
deepening is of the *person* — every new number must survive the question "does this make the
trader more honest, or just more measured?"

---

## 2. User journeys

### 2.1 Season close — happy path

1. Campaign "September season" reaches `completed` (Phase 1).
2. Member starts a Retrospective; gather includes **campaign context inside the cadence
   retro** (OD-3.1 **LOCKED** — no forked campaign-only retro product).
3. The retro's report sections include: adherence mix vs the season's playbook scope
   (broke/partial counts), top process/behavior tags of the season, and — where data exists —
   R-distribution framed as risk respect.
4. Habit plan step may propose a **repair habit** drawn from repeated process tags (e.g.
   recurring `chased` → suggested pre-entry checklist habit). Member accepts/edits/declines —
   nothing auto-commits.
5. Completed retro is immutable under account/date context (existing v0.2 §4 rule — extends
   to campaign context unchanged).

### 2.2 Drift catch — nudge path

Member journals rarely while trade count rises → Journey/Member Home shows one dismissible
nudge: "Trades are outpacing your journal. A line per session keeps the record honest."
No badge shaming, no streak-loss theater, dismiss persists.

### 2.3 Failure paths

| Failure | Required behavior |
|---------|-------------------|
| Campaign has zero trades/journal days | Retro renders honestly with empty-evidence copy — absence is information (CJ-5), never an error and never fabricated stats |
| Planned risk absent on trades | R widgets hidden with one-line explainer + where to capture it — never computed from a guessed denominator |
| Bars unavailable for MFE/MAE | Excursion section absent/fail-loud, mirroring Phase 2 chart rule |
| Nudge rules config invalid | Boot/config fail loud (platform invariant #2) — no silent no-nudge state |

---

## 3. Product design

### 3.1 Retrospective × Campaign / Playbook — OD-3.1 LOCKED

- Include **campaign as gather context** within the **existing cadence retro** model.
- **Do not** invent a separate campaign-scoped retro product type.
- Report sections reference playbook breaches: counts of `broke`/`partial` against the
  season's scoped entries; top tags of the window.
- Habit plans may propose repair habits from repeated process tags — **human confirm
  required**; no AI auto-writes to playbook or habits (kept from v1.0).

### 3.2 Journey coaching nudges — OD-3.3 LOCKED

**Rules are config** (versioned, admin-editable, fail loud on invalid), not code constants.
Ship **two** at first launch, each with: trigger, Tango/Hotel-approved copy, frequency cap,
dismiss persistence.

| Launch (locked first two) | Trigger sketch | Style |
|---------------------------|----------------|-------|
| Journal on trade days | Routine meter down while trade count up | Invitation, not debt |
| Revisit playbook | Adherence `broke` streak ≥ N (Tango sets N) | Process coach — no shame theater |
| Presence / Toughness | Optional later | Never membership-gated |

**Tone rules (binding):** process coach, never edge coach; no "your EV would improve…"; no
P&L reference; frequency-capped; every nudge dismissible with persistent dismissal.
**Capacity over dependency check:** nudges invite the routine — they never manufacture
return-visit pressure (no streak-loss framing, no countdown mechanics).

### 3.3 Tag analytics v2 — OD-3.4 LOCKED

- Process-tag rates over campaign vs prior window (time series) — **in v1**.
- **Co-occurrence out of first ship** (high shame risk) — Phase 3.1 / later with Tango GO.
- Still no win-rate-by-tag hero — Phase 0 §6.2 adjacency rule binds all widgets.
- Small-sample honesty: widgets state N and suppress trend language under a minimum window
  (threshold in config).

### 3.4 R-multiple / risk-unit reports — OD-3.2 LOCKED

- **Trade-level nullable `planned_risk`**; playbook default / `default_risk_note` is
  **prefill only**, never required to save a fill.
- Output: distribution of R outcomes for the window/season, framed as **risk respect**
  ("how often did losses stay inside planned risk") — never profit maximization, never
  "maximize R" coaching.
- Uses optional `pnl_amount` where present; absent data → hidden widget with explainer
  (§2.3), never imputed.

### 3.5 MFE / MAE (underlier-based)

- Max favorable/adverse excursion computed from **underlier path** during the hold
  (Phase 2 bar cache).
- **Structure-honest caveats are part of the feature, not a footnote** (Hotel gate):
  defined-risk options structures have risk defined by the structure, not the underlier —
  the widget must carry copy to the effect of "underlier excursion ≠ your structure's risk
  or value path" and must never imply an optimal-exit claim.
- SPX proxy labeling inherits Phase 2 doctrine.

### 3.6 Futures underlier data (optional thin add)

Enable **only if** `future_option` books block charts/MFE: Massive Futures bars for ES/NQ
(continuous/front) + symbol map. In: bars for chart + MFE. Out: futures options chains, any
futures-daytrader product surface. Trigger evidence recorded before enablement (Phase 4
decision-template pattern applied early).

### 3.7 Mobile PWA polish — OD-3.5 LOCKED

**Phone critical path:** Journal session (composer + tags), live check-in, active-campaign
badge, day strip. **Retrospective is desktop-first** — not required for PWA exit.
Acceptance is a named device walk, not "looks fine."

---

## 4. Architecture

| Area | Change |
|------|--------|
| Retro gather | Campaign/playbook stats join the gather-context DTO (scope fixed at gather per existing immutability rule) |
| Journey | Nudge rules config (versioned; fail loud); **no `journey_scores` table — DS-2 holds; nudges read existing derived meters** |
| Trade schema | Optional `planned_risk` per OD-3.2 — nullable, never required to save a fill |
| Market data | Optional Massive Futures entitlement + symbol map (config-gated) |
| Caching | Reuse Phase 2 bar cache for MFE — no second bar path |
| Notifications | Nudges reuse `member_notify` pattern where surfaced beyond page chrome |

---

## 5. Reliability invariants

| ID | Invariant |
|----|-----------|
| R-3.1 | Completed retrospectives remain immutable under every context including campaign |
| R-3.2 | No second score store; Journey stays derived (DS-2) |
| R-3.3 | Risk/excursion widgets render only from real captured data; absence → hidden + explained, never imputed |
| R-3.4 | Nudge config invalid → fail loud; every nudge dismissible; caps enforced server-side |
| R-3.5 | MFE/MAE and R copy carries structure/risk caveats on every render (not first-run only) |
| R-3.6 | PWA path degrades gracefully offline (clear failure, no silent data loss on composer) |

---

## 6. Acceptance criteria (Delta-checkable)

1. Complete a campaign → run a season retro whose report shows playbook breach counts + top tags for the window. (UI + fixture)
2. Zero-evidence season → honest empty retro sections, no fabricated stats. (fixture + UI)
3. **Two** nudges live (journal lag + playbook revisit): trigger fixtures fire them; dismissal persists; caps hold; copy matches Tango/Hotel-approved strings. (pytest + UI)
4. Invalid nudge config → boot/config failure, loud. (pytest)
5. Tag v2: campaign-vs-prior series render with N stated; suppressed under minimum sample; **no co-occurrence widget** in first ship. (fixture + UI)
6. R distribution renders only when `planned_risk` present; absent → hidden + explainer. (fixture + UI)
7. MFE/MAE renders with structure caveat copy on every render; missing bars → fail-loud absence. (UI walk)
8. `future_option` chart/MFE works iff futures bars enabled by config; disabled → honest absence. (fixture)
9. Phone walk (named device): journal turn + tag + check-in + campaign badge, end to end. (recorded walk)
10. No surface introduced this phase references P&L improvement, EV, or win-rate as guidance. (copy audit)

---

## 7. Dependencies

| Depends on | Why |
|------------|-----|
| Phase 1 Playbook + Campaign | Season review content |
| Phase 2 charts/bar cache | MFE path |
| Phase 0–1 tags habit | Analytics vocabulary with real data in it |
| Toughness as-built | Invite nudge only; no new Hard program |
| Retro cadence doctrine | Campaign as gather context inside cadence retro (OD-3.1 locked) |

## 8. Out of scope (kept from v1.0)

Tick replay · AI edge recommendations · prop-firm dashboards · futures options · standalone
SKU · auto-writing playbook/habits without human confirm.

## 9. Risks & mitigations (kept + extended)

| Risk | Mitigation |
|------|------------|
| MFE misread on multi-leg options | §3.5 caveat-as-feature + Hotel gate on copy |
| Nudge fatigue | Few, meter-based, capped, dismissible-persistent |
| Futures cost | Config-gated; enable only on proven chart gap with recorded trigger |
| R framing drifts to profit theater | "Risk respect" framing binding; copy audit in acceptance #10 |
| Season retro forks the retro model | OD-3.1 locked: campaign context only — no separate campaign-scoped retro product |

---

## 10. Open decisions — **RESOLVED** (Decision Addendum v1.1)

| # | Lock |
|---|------|
| OD-3.1 | **Campaign context inside cadence retro** (no fork) |
| OD-3.2 | **`planned_risk` on trade**; playbook prefill only |
| OD-3.3 | **Two nudges:** journal lag + playbook revisit |
| OD-3.4 | **No co-occurrence** in first ship |
| OD-3.5 | **Phone:** journal path; retro desktop-first |

See [Decision Addendum](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md).

## 11. Decision-log entry (draft, on approval)

> **Phase 3 Deepen the Person:** cadence retrospectives carrying **campaign context**
> (not a separate campaign-scoped retro product), speaking playbook + tag language;
> **two** config-driven, capped, dismissible Journey process nudges (journal lag + playbook
> revisit); tag analytics v2 series with sample-honest framing (no co-occurrence v1);
> risk-respect R reports on optional trade-level `planned_risk`; underlier MFE/MAE with
> binding structure caveats; optional config-gated ES/NQ bars; mobile PWA critical path
> (journal/check-in/badge; retro desktop-first). No second score store (DS-2), no AI
> auto-writes, no edge coaching. No profit claims. Family B unchanged.

## 12. v1.0 → v1.1 ideas inventory (nothing silently dropped)

| v1.0 item | Disposition |
|-----------|-------------|
| Retro × campaign/playbook + repair habits | Kept; human-confirm rule retained; shape elevated to OD-3.1 |
| Journey nudges table + tone | Kept; promoted to config-with-caps design; capacity-over-dependency check added |
| Tag analytics v2 (series, co-occurrence) | Kept; sample-honesty + OD-3.4 shame-risk decision added |
| R-multiple reports + light schema note | Kept; field home elevated to OD-3.2 |
| MFE/MAE + careful copy | Kept; caveat promoted from copy note to feature requirement (R-3.5) |
| Futures underlier thin add | Kept; config-gated + trigger-evidence rule added |
| PWA polish | Kept; named-device acceptance added; scope question OD-3.5 |
| §4 architecture rows (incl. "no journey_scores", DS-2) | Kept verbatim in force |
| All v1.0 out-of-scope + risks | Kept |

## 13. Agent Bench

| Artifact | Path |
|----------|------|
| Phase bench plan | [`Docs/Trader-Development-Phase-3-Agent-Bench-Plan.md`](../Docs/Trader-Development-Phase-3-Agent-Bench-Plan.md) |
| Full program plan | [`Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md`](../Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md) |
| Board | [`agents/p-trader-development/`](../agents/p-trader-development/) |
| Decision addendum | [`FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md`](./FatTail-Labs-Trader-Development-Decision-Addendum-v1_1.md) |

Gate prefix: **TD3-***. Prerequisite: **TD1-G** (+ TD2 charts for MFE).

---

## 14. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.0 draft (Coach/Grok) |
| 2026-08-07 | v1.1 Claude first pass — journeys, config-driven nudges, risk-respect framing hardened, acceptance, ODs |
| 2026-08-07 | v1.1a — OD locks + Agent Bench links (Decision Addendum) |
| 2026-08-07 | v1.1b — consistency: two nudges + cadence-context retro wording (Claude review) |
