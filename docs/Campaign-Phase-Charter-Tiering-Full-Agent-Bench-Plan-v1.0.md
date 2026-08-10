# Campaign Phase & Charter Tiering — Full Agent Bench Plan v1.0.1

**Date:** 2026-08-09  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship) — Spec **v1.0.1 ready for ratification**  
**Board:** [`agents/p-campaign-phase/`](../agents/p-campaign-phase/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.

---

## 0. Product law (in scope)

| Spec / doc | Path | Role |
|------------|------|------|
| **Campaign Phase & Charter Tiering Spec v1.0.1** | [`Specs/FatTail-Labs-Campaign-Phase-and-Charter-Tiering-Spec-v1.0.md`](../Specs/FatTail-Labs-Campaign-Phase-and-Charter-Tiering-Spec-v1.0.md) | **Primary law** — P1–P13, tiers, adoption, reports, enforcement, acceptance |
| Phase Model v0.2.3 | [`docs/Campaign-Phase-Model-v0_2.md`](./Campaign-Phase-Model-v0_2.md) | Narrative seven spokes (historical) |
| Charter Tiering Resolution (+_2) | [`docs/Resolution-Campaign-Charter-Tiering.md`](./Resolution-Campaign-Charter-Tiering.md) · [`_2`](./Resolution-Campaign-Charter-Tiering_2.md) | Big Three · dormant-until-adopted |
| Correlation Doctrine v0.2 | *(companion — full Spec when filed)* | Same-bet CR-10 · CR-3 · CR-12 **charter** · CR-4 out of this program |

**Companions (consume, do not re-open):** Capital v0.3 · Funding v0.2 · Campaign Spec v1.3 · Positions View · Trade Log v1.1 · Top-Level Account Amendment  

**Related boards (landed / do not re-litigate):**

| Board | Use |
|-------|-----|
| [`p-campaign-lifecycle`](../agents/p-campaign-lifecycle/) | Sign / amend / renew / terminal substrate — **extend** for Big Three gate + end-on-close |
| [`p-campaign-structured-practice`](../agents/p-campaign-structured-practice/) | Window, panel, radar — **keep**; definition **above** radar already partial |
| [`p-accounts-capital`](../agents/p-accounts-capital/) | Free cash / BP / `structure_risk_open` inputs — **consume** report formulas |
| [`p-trade-log`](../agents/p-trade-log/) | Blotter deep link / campaign filter — passive |

**Queued out of this program:**

- Full Correlation Doctrine formulas / account rollup chrome (only **placement** of Same-bet + CR-12 charter moment)  
- Lab “passed curation” strategy handoff list (after Deploy reports)  
- P&L-ranked prune candidates (P10)  
- Per-campaign correlation strip (P9)  
- Lab Pearson calculator (CR-4 — other Spec)  
- Live broker margin engine  
- Solved-size full calculator (Capital Z / Hotel — quiet line OK if formula already signed)

---

## 1. Mission

Ship the **campaign as a deliberate phase**: tiered charter (Big Three big; Same-bet optional/actionable; advanced dormant-until-adopted), **enforcement grammar** that preserves the umpire, **phase report aggregates** with pinned denominators, and **page zones** matching Spec §4 — without reopening ledger abolition or capital ownership.

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| **Big Three sign** | P2 · P3 · P4 | Allocation + max DD% + start required to activate; 422 on charter only |
| **Adoption law** | P6 · P11 | Optional dormant; post-sign adopt/un-adopt = amendment + version bump |
| **End at close** | P5 | Optional until complete/archive — then required |
| **Same-bet Tier 2** | P7 · P9 | Visible skippable; CR-12 once at create/pre-sign **not** per trade |
| **Phase reports** | P8 · P13 · §6 | Free cash · free margin (`structure_risk_open`) · realized DD% on **allocation** · strategy mix |
| **Prune** | P10 | Lifecycle + judgment only — no P&L prune rank |
| **Layout** | §4 | Definition (tiered) → report strip → radar → log → prune → retro → conclusion |

**Design invariant:** *Three fields make a charter that can size. Optional terms sleep until adopted. The log path stays clean. Reports aggregate; they do not invent a second bank.*

---

## 2. As-built honesty

### 2.1 Keep

| Area | Status |
|------|--------|
| Campaign lifecycle sign/amend/renew/terminal | Landed (`p-campaign-lifecycle`) |
| Window eligibility · panel six · present radar | Landed (`p-campaign-structured-practice`) |
| Definition **above** radar (layout reorder) | Landed partial (page order) |
| Amendments table as change log substrate | Landed |
| `charter_version`, `max_drawdown_pct`, allocation/strategy/retro columns | Migration **116** applied (domain/UI **partial or missing**) |
| Capital overview · positions valuation · per-account BP | Landed (`p-accounts-capital` / Positions View) |
| Undirected null stamp | Landed |

### 2.2 Build / fix (this program)

| Gap | Spec | Action |
|-----|------|--------|
| Big Three not gated on activate | P2–P3 | Domain + API 422; UI large fields |
| Max DD not enforced as % | P4 | Wire `max_drawdown_pct`; no $ form |
| End date not required on complete/archive | P5 | Gate complete/abandon/archive acts |
| Adoption/un-adoption silent | P6 | Amendment + version on post-sign adopt/clear |
| Same-bet not on form | P7 | Tier 2 UI + storage when Correlation copy ready (stub OK) |
| CR-12 missing / wrong timing | P9 | Prompt once at create/pre-sign — **never** trade create |
| Phase report strip missing | §6 | Free cash, free margin, realized DD% (allocation base), strategy mix |
| Tiered “More options” chrome | §2 | Echo + Charlie |
| Retro attach | Tier 3 | `retrospective_id` bind + deep link |
| Change log presentation | §8 | Rename/present amendments as Log |

### 2.3 Gap map (acceptance → phase)

| Spec acceptance cluster | Phase |
|-------------------------|--------|
| Spec ratify + DL locks + seeds | **W0** |
| Schema finalize + domain Big Three / version / adoption | **S*** (schema) |
| Sign/activate + complete/archive gates | **G*** (gates API) |
| Tiered definition UI | **U*** (UI definition) |
| Phase report strip | **R*** (reports) |
| Same-bet + CR-12 charter prompt | **C*** (correlation placement) |
| Log chrome + Trade Log link + retro + prune acts | **L*** (lifecycle chrome) |
| Layout zones parity + Kilo pack | **Z*** (close) |

---

## 3. Locked decisions (program)

| ID | Decision |
|----|----------|
| **CP1** | Spec v1.0.1 is product law on Coach GO (W0-0). |
| **CP2** | Big Three: capital allocation · max DD% · start date — sign gate. |
| **CP3** | Umpire: 422 charter only; trade path never blocked for charter gaps. |
| **CP4** | L-DD: max DD always **% of campaign allocation**. |
| **CP5** | L-End: end optional to start; **required to complete/archive**. |
| **CP6** | L-Adopt: dormant until adopted; post-sign adopt/un-adopt = amendment + version bump. |
| **CP7** | L-T2: Same-bet Tier 2 optional/actionable when adopted. |
| **CP8** | P13: campaign-strip realized DD% denominator = **campaign allocation**. |
| **CP9** | Free margin = BP − **`structure_risk_open`** (defined max loss); null if no BP; **never** name `margin_at_risk` in API. |
| **CP10** | P10: no P&L-ranked prune candidates in v1 (Coach ratify = bless advisor lean). |
| **CP11** | P9: no per-campaign correlation report strip; CR-12 = create/pre-sign only. |
| **CP12** | Definition above radar (already partial — finish tiered form). |
| **CP13** | Migration 116 columns are authoritative scaffold; India may rename only with DL. |

### 3.1 Residual ODs (W0 — defaults if Coach silent)

| OD | Default for ship | Owner |
|----|------------------|--------|
| **OD-SB** Same-bet exact prompt copy | Use Spec §2.2 indicative strings until Correlation Spec lands | Tango · Correlation |
| **OD-alloc-modes** UI labels for fixed/wrap/proportion/dynamic | fixed + dynamic note only in v1 if wrap UI not ready; schema stores full enum | India · Echo |
| **OD-free-cash-scope** account-free campaign report scope | Identity total free cash across modeled accounts when `account_id` null | Hotel · India |
| **OD-CR12-copy** CR-12 one-shot modal vs inline | Inline quiet banner on create form before Activate | Tango · Echo |
| **OD-title** default campaign title | “Campaign” + date or empty require title on sign | Tango |

### 3.2 Seating

| ID | Rule |
|----|------|
| **S1** | Kilo on every testable seed. |
| **S2** | Guide as-built only until gates say otherwise. |
| **S3** | Mike on Family B export keys for new charter fields. |
| **S4** | Seeds on disk before phase gate. |
| **S5** | Tango: Same-bet, More options, no shame skip, CR-12 never “stamp.” |
| **S6** | Hotel: P13 DD%; free cash; structure_risk_open; no prune P&L. |
| **S7** | India: no dual truth; adoption amendments; schema. |
| **S8** | Echo: Big Three density; Tier 2 inline; Tier 3 disclosure. |
| **S9** | Charlie: campaign page zones; Trade Log deep link. |
| **S10** | Alpha: domain gates + report API. |

---

## 4. Roster

| Callsign | Role |
|----------|------|
| **Coach** | GO, residual ODs, ratify Spec, ship/no-ship |
| **Juliet** | Board, seeds, sequence |
| **India** | Schema (116+), amendments for adopt, no dual truth |
| **Alpha** | Domain/API: sign gate, end-on-close, report strip, version |
| **Charlie** | Campaign page UI (tiered form, zones, links) |
| **Echo** | IA: Big Three, Same-bet, More options, report strip density |
| **Hotel** | DD% same base; free cash; structure_risk_open math |
| **Tango** | Copy: tiers, CR-12 wording, change log, prune acts |
| **Mike** | Export keys / pack fields for new charter columns |
| **Kilo** | Spec §10 acceptance pack |
| **Delta** | Gates ternary |
| **Lima** | DL: CP1–CP13 + prune + CR-12 timing + structure_risk_open |
| **Foxtrot** | Migrate/deploy when ready |

**Not seated:** Golf · Marketing Campaign Workflow · MSC · Live BP broker · full Correlation account rollup program.

---

## 5. Sacred invariants (this program)

1. Standalone repo — no MSC.  
2. Config fail-loud.  
3. Family B.  
4. **Umpire** — no 4xx on trade log for missing charter / Big Three / Same-bet.  
5. **No second store** of equity or witness events.  
6. **Campaign-blind master DD** stays off campaign strip (P13).  
7. **Funding ≠ direction.**  
8. **Display never demand** (Same-bet skip; CR-12 not on trades).  
9. No profit theater / P&L prune leaderboard.  
10. Goodhart — campaign phase reports not Journey score input.  
11. Evidence over assertion; no waived gates.  
12. Documentation parity with ship.  
13. No ghost defaults on optional attributes (P6).  
14. API forbids field name `margin_at_risk` (use `structure_risk_open` / `committed_risk`).

---

## 6. Phases, seeds, gates

### Phase W0 — Plan lock + Spec ratification

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **GO** on Spec v1.0.1 + this plan; bless CP10/CP11 advisor leans knowingly; residual ODs |
| **W0-1** | Hotel | Sign free cash · structure_risk_open · P13 allocation denominator |
| **W0-2** | India | Schema map on 116 + Same-bet storage; amend fields list; version bump rules |
| **W0-3** | Tango | Vocabulary: Big Three, More options, adopt/un-adopt, CR-12 “charter” not “stamp” |
| **W0-4** | Lima | DL: L-End, L-T2, L-DD, L-Adopt, P10 prune, P9 strip, P13, CR-12 timing, structure_risk_open |
| **W0-5** | Juliet | Materialize all seeds cold-start |
| **W0-6** | Echo | Wireframe: Big Three large; Same-bet Tier 2; More options; report strip; zone order |
| **W0-G** | Delta | GO written; ODs recorded; seeds on disk; Hotel/India/Echo notes on file |

### Phase S — Schema & domain substrate

| Seed | Agent | Intent |
|------|-------|--------|
| **S1-0** | India · Mike | Confirm/extend migration 116; Same-bet JSON; strategy_codes; capital_allocation_mode; retrospective_id; export keys |
| **S1-1** | Alpha | Serialize new fields; patch accepts Big Three + optional; version on amend |
| **S1-2** | Alpha · Kilo | Post-sign adopt/un-adopt → amendment + charter_version++ |
| **S1-G** | Delta | Schema + domain characterization green |

### Phase G — Gates (charter enforcement)

| Seed | Agent | Intent |
|------|-------|--------|
| **G1-0** | Alpha | Activate/sign requires Big Three → 422 else |
| **G1-1** | Alpha | Complete/archive requires end date → 422 else |
| **G1-2** | Kilo | Trade create undirected 200 without campaign; no CR-12 on trade path |
| **G1-G** | Delta | Enforcement grammar Spec §7 proven |

### Phase U — Tiered definition UI

| Seed | Agent | Intent |
|------|-------|--------|
| **U1-0** | Echo · Charlie | Big Three large typography; max DD% only |
| **U1-1** | Charlie · Tango | More options disclosure; dormant-until-set fields |
| **U1-2** | Charlie | Create + editor page wire Big Three into Activate/Save-sign path |
| **U1-G** | Delta | UI tier acceptance + no ghost defaults |

### Phase R — Phase report strip

| Seed | Agent | Intent |
|------|-------|--------|
| **R1-0** | Hotel · Alpha | Free cash formula (balance − open cost basis); scope OD-free-cash-scope |
| **R1-1** | Hotel · Alpha | Free margin = BP − structure_risk_open; null if no BP |
| **R1-2** | Hotel · Alpha | Realized DD% of **allocation** (P13); strategy mix counts |
| **R1-3** | Charlie · Echo | Report strip UI under definition, above radar |
| **R1-G** | Delta · Kilo | Report math + no margin_at_risk name |

### Phase C — Correlation placement (charter only)

| Seed | Agent | Intent |
|------|-------|--------|
| **C1-0** | India · Alpha | Same-bet storage (adopt/un-adopt) |
| **C1-1** | Charlie · Tango | Same-bet Tier 2 UI; skippable |
| **C1-2** | Charlie · Tango | CR-12 **once** on create/pre-sign — copy never “at stamp” |
| **C1-G** | Delta | P7/P9; no trade-path prompt; no campaign correlation strip |

*If Correlation Spec not filed: C1 uses Spec §2.2 indicative prompts; full CR math remains BLOCKED on other boards.*

### Phase L — Log, prune, retro, conclusion chrome

| Seed | Agent | Intent |
|------|-------|--------|
| **L1-0** | Charlie · Tango | Change log presentation (amendments) |
| **L1-1** | Charlie | Trade Log deep link `?campaign=` / filter |
| **L1-2** | Charlie | Lifecycle: prune = pause/complete/end only — no P&L rank UI |
| **L1-3** | Charlie · Alpha | Retro attach + open link |
| **L1-G** | Delta | Zones 4–7 Spec §4 |

### Phase Z — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z1-0** | Kilo | Full Spec §10 pack (all 15 acceptance cases) |
| **Z1-1** | Lima | As-built notes; Campaign Spec companion fold list |
| **Z1-2** | Foxtrot | Migrate/deploy checklist |
| **Z-G** | Delta | Program ternary PASS |

---

## 7. Critical path

```
W0-G → S1-G → G1-G → U1-G ∥ R1-G → C1-G → L1-G → Z-G
```

- **U** and **R** may parallel after **G**.  
- **C** may start after **S** (storage) but UI after **U** shell.  
- Do not start **Z** until Kilo pack green.

---

## 8. Seed file convention

```
agents/p-campaign-phase/
  CHARTER.md
  ORCHESTRATOR.md
  IMPLEMENTATION-PLAN.md   # points to this doc
  seeds/
    README.md
    W0-0-coach-go.md
    …
  gate-reports/
    README.md
```

Each seed: agent · phase · intent · invariants (P1–P13 + sacred list) · out of scope · completion = evidence in `gate-reports/`.

---

## 9. Gate evidence standard

| Gate | Evidence |
|------|----------|
| **PASS** | Spec IDs cited; pytest and/or UI proof; no umpire breach |
| **FAIL** | Gap named; re-seed |
| **BLOCKED** | External OD (e.g. Correlation full Spec) named; no fake green |

**Never waive** G1 (umpire) or R1 (denominator / structure_risk_open).

---

## 10. Spec §10 acceptance → seed map (Kilo)

| # | Acceptance (abbrev) | Primary seed(s) | Gate |
|---|---------------------|-----------------|------|
| 1 | Sign missing Big Three → 422; trade undirected 200 | G1-0 · G1-2 | G1-G |
| 2 | Max DD percent only | S1-1 · U1-0 · G1-0 | G1-G · U1-G |
| 3 | Complete/archive needs end date | G1-1 | G1-G |
| 4 | Unadopted strategy list: no outside-list witnesses | S1-2 · L1-2 | L1-G |
| 5 | Adopted list + outside stamp → witness path (not block) | S1-2 · G1-2 | G1-G |
| 6 | Same-bet skip; post-sign adopt → amend + version | C1-0 · C1-1 · S1-2 | C1-G · S1-G |
| 7 | Un-adopt goals after adopt → amend + version | S1-2 | S1-G |
| 8 | Free cash = balance − open cost basis | R1-0 | R1-G |
| 9 | Free margin = BP − structure_risk_open; never `margin_at_risk` | R1-1 | R1-G |
| 10 | No campaign correlation report strip | C1-G · R1-3 | C1-G · R1-G |
| 11 | No P&L prune-candidate rank | L1-2 | L1-G |
| 12 | Definition above radar | U1-2 · Z1-0 | U1-G · Z-G |
| 13 | Realized DD% denominator = allocation (P13) | R1-2 | R1-G |
| 14 | Trade create never shows CR-12 | G1-2 · C1-2 | G1-G · C1-G |
| 15 | CR-12 once at create/pre-sign only | C1-2 | C1-G |

**Z1-0** re-runs the full pack end-to-end before **Z-G**.

---

## 11. Risks

| Risk | Mitigation |
|------|------------|
| Implementer puts CR-12 on trade path | G1-2 + acceptance #14–15; Tango copy ban on “stamp” |
| Realized DD% vs peak confuses members | P13 hard; Hotel R1-2 |
| Ghost defaults on optional fields | P6; Kilo #4–7 |
| Free margin drifts to broker MM | CP9; forbid `margin_at_risk` string |
| Scope creep into Lab Deploy handoff | Queued out; Z does not require it |
| Migration **116** number collision (`116_campaign_definition_fields.sql` + `116_journal_day_net_map_pref.sql`) | **S1-0** India: confirm runner order / renumber journal day-net if needed; do not dual-write columns |
| Migration 116 columns present, domain incomplete | S1-0 + S1-1 owns completeness |

---

## 12. Board materialization checklist

| Artifact | Path |
|----------|------|
| Charter | `agents/p-campaign-phase/CHARTER.md` |
| Orchestrator | `agents/p-campaign-phase/ORCHESTRATOR.md` |
| Plan pointer | `agents/p-campaign-phase/IMPLEMENTATION-PLAN.md` |
| Seeds | `agents/p-campaign-phase/seeds/*.md` |
| Gates | `agents/p-campaign-phase/gate-reports/` |

**Next action after this plan lands:** Coach **W0-0 GO** (Spec v1.0.1 ratify + CP1–CP13 + residual ODs). No domain/UI ship code before **W0-G**.

---

## 13. Document history

| Version | Date | Change |
|---------|------|--------|
| **v1.0.1** | 2026-08-09 | §10 acceptance→seed map; dual-116 risk; board checklist; next = W0-0. |
| **v1.0** | 2026-08-09 | Initial plan for Spec v1.0.1 — phases W0→Z; CP1–CP13; seating; critical path. |

---

*Three fields make a charter that can size. Optional terms sleep until adopted. The log path stays clean. Reports aggregate. Prune is judgment. CR-12 is a charter moment — never a trade ambush.*
