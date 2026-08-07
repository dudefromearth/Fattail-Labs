# FatTail Labs — Trader Development Decision Addendum v1.1

**Status:** **BUILD AUTHORITY** (Coach GO 2026-08-07 · DL-254) — OD locks for implementation  
**Applies to:** Roadmap v1.1 + Phase Specs 0–4 v1.1  
**Authority:** Coach product direction via “do what you recommend” after Spec review  
**Parents:** Roadmap v1.1 · Claude Alignment note · Full Agent Bench Plan  

This addendum **resolves open decisions (ODs)** so Agent Bench seeds can proceed without re-litigating strategy. Phase Specs remain DRAFT until Coach stamps BUILD AUTHORITY; OD values below are the **working lock**.

---

## 1. Cross-phase locks (roadmap §5)

| OD | Resolution | Rationale |
|----|------------|-----------|
| **OD-1.1** Practice Campaign vs Strategy Lab Deploy | **Option A** — separate SoRs; member-facing word **“Campaign” owned by Practice only**; Strategy Lab keeps **Design · Curate · Deploy · Archive** | Clean stores; as-built Lab labels already avoid “Campaign” column; Option B link can be added later as nullable FK |
| **OD-1.3** Active campaigns | **Single active campaign** per identity at a time | Simpler chrome, clearer season story, simpler Phase 3/nudge triggers |
| **OD-2.2** `entry_source` for broker sync | **Add fourth value `sync`** — **same body of work:** (1) migration, (2) UI chip, (3) **Trade Log Spec version bump** (v1.2 **or** normative §17 amendment to the locked catalog table), (4) decision-log entry | Preserves locked Trade Log provenance law; do not conflate with Strategy Lab `automated`. Documentation parity is Invariant #6 — catalog amend is not “later.” |

---

## 2. Phase 0 locks

| OD | Resolution |
|----|------------|
| **OD-0.1** Story copy | **Progressive spine** until Phase 1 Playbook + Campaign are clickable; then flip to **full spine** line |
| **OD-0.2** Tag filter mechanism | **Option A** — server-side `tag_ids` / thin usage API; Family-B join; **no client post-filter** |
| **OD-0.3** Lexicon in Practice | **Yes** — empty states may link read-only Lexicon browse (`/resource`) as a teaching moment |

**Also locked:** Tag filter applies to **process widgets / counts only** — never adjacent P&L/win-rate (Phase 0 §6.2).

---

## 3. Phase 1 locks

| OD | Resolution |
|----|------------|
| **OD-1.1** | See §1 (Option A) |
| **OD-1.2** Structured fields | **Ship three optional fields** (`asset_class?`, `structure_codes?[]`, `default_risk_note?`) — unvalidated against markets |
| **OD-1.3** | See §1 (single active) |
| **OD-1.4** Journal ↔ campaign | **Phase 1 light** — optional `practice_campaign_id` on journal session when active campaign exists (default suggest, removable); seasons incomplete if only fills count |
| **OD-1.5** Export | **Portability green before Phase 2 exit** — prefer in-phase Export Spec v1.4; if residual, hard gate before TD2-G |

**Also locked:** Campaign may scope **0..n** playbooks (empty scope allowed). Archive playbook entries; no hard-delete when trades linked.

---

## 4. Phase 2 locks

| OD | Resolution |
|----|------------|
| **OD-2.1** Vendor + first broker | **First venue family: Schwab / thinkorswim-class** (member book). Aggregator: SnapTrade-class (or equivalent) with **connected-user** billing — exact vendor name in TD2-0 seed when contracted |
| **OD-2.2** | See §1 (`sync`) — **deliverables:** migration + chip + **Trade Log Spec catalog amend (v1.2 or §17)** + DL entry in one change set |
| **OD-2.3** Journal day chart embed | **Defer** — not required for Phase 2 exit |
| **OD-2.4** Connection UI | **Status in Practice chrome** (selection-adjacent); **management (connect/disconnect/OAuth) in Profile/settings** |

**Also locked:**

- One import pipeline (sync → existing import domain).  
- Quarantine ungroupable multi-leg.  
- Process fields never machine-filled.  
- Account mapping: member confirms once.  
- **COGS:** bill only seats with status allowing live connection. **`error`:** grace ≤ 7 days then auto-disconnect + revoke if unrecovered (no permanent billable error zombies).  

---

## 5. Phase 3 locks

| OD | Resolution |
|----|------------|
| **OD-3.1** Season retro shape | **Campaign as gather context inside cadence retro** — do not fork a second retro product model |
| **OD-3.2** `planned_risk` home | **Trade-level nullable field** with playbook `default_risk_note` / default as **prefill only** |
| **OD-3.3** Launch nudges | **Two first:** (1) journal lagging trades / routine, (2) playbook revisit after adherence broke streak — Toughness invite optional third later |
| **OD-3.4** Tag co-occurrence | **Out of first ship** — Phase 3.1 / later with Tango GO |
| **OD-3.5** PWA / phone critical path | **Journal + tags + check-in + campaign badge**; Retrospective **desktop-first** |

---

## 6. Phase 4 locks (process only)

| OD | Resolution |
|----|------------|
| **OD-4.1** Proposal rights | **Juliet (or Coach) proposes**; **Coach only approves** |
| **OD-4.2** Thresholds | **Per-expansion** when first proposed; logged with trigger evidence |

Refuse list remains absolute unless Coach reopens category strategy by Spec amend.

---

## 7. Agent Bench

| Artifact | Path |
|----------|------|
| Full plan | `Docs/Trader-Development-Full-Agent-Bench-Plan-v1.0.md` |
| Phase plans | `Docs/Trader-Development-Phase-{0–4}-Agent-Bench-Plan.md` |
| Board | `agents/p-trader-development/` |
| Alignment | `Docs/Claude-Alignment-Trader-Development-Spec-Finish-Pass.md` |

**Law:** No TD1+ implementation until **TD0-G** PASS. Specs need formal BUILD AUTHORITY stamp (Coach) on Phase 0–1 minimum before TD0-G.

---

## 8. Decision-log entry (draft for Lima)

> **Trader Development OD lock (v1.1 addendum):** Practice owns the member word *Campaign* (SL Deploy separate). Single active practice campaign. Broker sync provenance = `entry_source=sync`. Phase 0 progressive story copy + server tag filter (process counts only). Phase 1 optional journal campaign stamp; export green before Phase 2 exit. Phase 2 Schwab/ToS-class first venue; connection status in Practice / manage in settings; error grace then disconnect. Phase 3 cadence retro with campaign context; planned_risk on trade; two process nudges; no co-occurrence v1; phone = journal path. Phase 4 Juliet proposes / Coach approves. No profit theater. Family B unchanged.

---

## 9. Document history

| Date | Note |
|------|------|
| 2026-08-07 | v1.1 — Grok review recommendations accepted for implementation planning |
| 2026-08-07 | v1.1b — Trade Log Spec bump named as co-deliverable with `sync`; Claude consistency nits on Phases 2–4 |
