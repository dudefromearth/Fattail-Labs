# Campaign Structured Practice — Full Agent Bench Plan v1.0

**Date:** 2026-08-08  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-campaign-structured-practice/`](../agents/p-campaign-structured-practice/)  
**Product law (model inversion):** [`Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.0.md`](../Specs/FatTail-Labs-Member-Campaign-Structured-Practice-Spec-v1.0.md)  
**Source narrative:** [`docs/Campaign-Model-Change-Structured-Practice-Instances-Bounds.md`](./Campaign-Model-Change-Structured-Practice-Instances-Bounds.md)  
**Substrate (amended):** [`Specs/FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md`](../Specs/FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md) — §4.5 lifecycle **reaffirmed for charters**; optional/unstamped/unbound + interim §4.7a **superseded** where they conflict  
**Prior board (do not re-open unless regression):** [`agents/p-campaign-lifecycle/`](../agents/p-campaign-lifecycle/) — signature/amend/renew **landed** for member charters  
**Trade Log:** [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) — stamp path, accounts, import  
**Guide:** `/guide` · **as-built only** (F1)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · first-principles · AGENTS.md  

**Spec review (stamp-ready):** F1 fill-time variance · F2 import→ledger · F3 expectancy cross-check · End-campaign Tango gate — **folded into Spec**. This plan is **execution law** after Coach **W0-0 GO** (including §13 dispositions or explicit deferrals).

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates are **PASS / FAIL / BLOCKED** with evidence — **never waived**.

---

## 0. Mission

Ship the **model inversion**: practice is **born structured**.

| Pillar | Meaning |
|--------|---------|
| **Genesis** | Every account creates a **ledger** campaign in the same act (furniture, never signed) |
| **Stamp** | Every trade has a campaign; choice pre-answered by **last-pair memory** |
| **Instance** | One campaign ↔ one account; instantiate = **copy**; names unique forever |
| **Restamp** | Trades move between same-account campaigns; never across accounts |
| **Bounds** | Structured ranges (process + statistical panel); **witnessed, never enforced** |
| **Ledger ≠ charter** | Ledger absorbs the unconsidered; charters keep full §4.5 lifecycle |

**Doctrine:** Umpire (mandatory but frictionless) · day atom · Sacred #8 · Goodhart wall (no Journey from bounds/variance) · Family B · evidence over assertion · Guide as-built · no waived gates · declare files before touch · standalone repo (no MSC).

**Design invariant:** *Members are not free to have no campaign; they are free to never think about campaigns.*

---

## 1. Locked decisions (from Structured Practice Spec)

| ID | Decision | Spec anchor |
|----|----------|-------------|
| **L1 Genesis** | First Practice-suite touch → **default account** + ledger (§2.1); every account create → ledger; not list-GET | §2 Law 1 · §2.1 · §3 · #1–2 |
| **L2 Stamp required** | No unstamped **trades**; default = memory / ledger. **Journals optional** (OD-1.4) | §2 Law 2 · #4 |
| **L3 Memory** | Last (account → campaign) pair; server-side; same-account only | §2 Law 3 · #3 |
| **L4 Instance** | `account_id` NOT NULL; instantiate = copy not link | §2 Law 4 · #5 |
| **L5 Restamp** | Same-account only; cross-account 4xx | §2 Law 5 · #4 |
| **L6 Names** | Unique per identity forever incl. archive; auto-suffix | §2 Law 6 · #6 |
| **L7 Bounds** | All-bands ranges; witness not block; critical surfaces once | §2 Law 7 · #8–9 |
| **Ledger doctrine** | Never signed; no bounds/panel/lifecycle terminal; not in Archive | §3 · #7 |
| **Variance history** | Bounds **in force at fill time**; amendments never rewrite history | §5.4 · #16 |
| **Import** | No “none/unstamped”; default → **ledger**; memory not consulted/updated | §6 · #15 |
| **D3 stands** | GET campaign list never creates | #14 |
| **Goodhart** | No Journey reads of bounds/variance/panel | #10 |
| **F1 Guide** | As-built only; feature copy with feature PR | Sacred |
| **End copy** | Storage `abandoned`; surface **End campaign** / **Ended early** = **Tango gate** (not inherited fact) | §6 |

### 1.1 Coach dispositions required at GO (Spec §13)

W0-0 must either **lock** or **explicitly defer** each item (defer = out of v1 ship path with seed note):

| # | Question | Recommended default (if Coach silent, **block W0-G** until written) |
|---|----------|---------------------------------------------------------------------|
| 1 | Existing `is_default` → ledger or charter + fresh ledger? | **Become ledger** |
| 2 | NULL-account campaigns migration fallback | Unanimous stamps → else default account + report |
| 3 | n-floor authority | Hotel floor; member may raise only |
| 4 | Sharpe v1 | **Defer** |
| 5 | Restamp v1 scope | **Single-trade** first; bulk = later seed if GO |
| 6 | Size-floor vs Blueprint probe | Member sets floor (no probe tag v1) |
| 7 | Frame grid v1 cells | Sparse: house styles × short/medium only |
| 8 | Strategy-type scope | **Trail** if leg classification is new machinery; other scopes ship |

### 1.2 Bench seating (normative)

| ID | Amendment |
|----|-----------|
| **S1** | **Kilo** co-agent on every seed that lands testable surface (see phase tables) + phase **K-gates**. No Delta product gate without Kilo pack. |
| **S2** | **W0-4 Charlie:** strip live Guide of unbuilt structured-practice promises (ledger, every-trade-stamps, panel, bounds) until those PRs land. |
| **S3** | **Mike** co-agent on schema, stamp provenance, memory, import, pack (Family B). |
| **S4** | **W0-G cold-start:** phase seeds must be **files on disk** before W0-G PASS. |
| **S5** | **Tango** owns: ledger naming · outside charter · panel clinical register · End campaign doctrine · import path labels · ban list (violation/max/target/threshold as primary grammar · unlock · Journey). |
| **S6** | **Hotel** heavy: style × horizon frames · band semantics · n-floors · R:R structural · win definition · structure taxonomy · Sharpe keep/kill · expectancy cross-check. |
| **S7** | **India** keep/kill: ledger column shape · bounds table · variance **(a) temporal derive vs (b) stamp-at-fill** under §5.4 · memory storage · derive-vs-store panel. |
| **S8** | **p-campaign-lifecycle** remains closed substrate; do not re-litigate signature/amend/renew for charters unless regression. |

---

## 2. Full bench roster

### 2.1 Authority & orchestration

| Callsign | Role |
|----------|------|
| **Coach** | GO, ship/no-ship, §13 dispositions, product conflicts |
| **Juliet** | Board, seeds, sequencing — **never executes product packets** |
| **India** | Model boundaries; migrations shape; variance mechanism; no dual-write truth; veto on Spec contradiction |

### 2.2 Platform execution

| Callsign | Role |
|----------|------|
| **Alpha** | Migrations; ledger ensure; stamp required; memory API; name law; restamp; bounds CRUD; variance eval; import paths; pack 1.3 |
| **Charlie** | Library ledger chrome; charter vs ledger detail; bounds editor; panel view; instantiate UX; restamp UI; Guide per feature PR |
| **Echo** | Trade-sheet density; panel design; suffix preview; import sheet paths; library pin |
| **Mike** | Family B on ledger/bounds/memory/stamps/pack; import name collision |
| **Foxtrot** | Only if deploy/migrate order or env paths change |

### 2.3 Quality, member, trading doctrine

| Callsign | Role |
|----------|------|
| **Delta** | All gates; ternary; evidence; **requires Kilo packs** |
| **Kilo** | Characterization for Spec §10 #1–16 (+ phase greps) |
| **Lima** | DL model inversion; Concept Spec v2.0 surgery notes; Guide parity; pack schema bump |
| **Tango** | Vocabulary + ban greps; End-campaign doctrine; ledger naming |
| **Hotel** | Frames grid; band doctrine; n-floors; R:R; win def; taxonomy; expectancy note |

### 2.4 Not seated

Golf · content studio · prop/coach counterparty · Journey meters · Marketing Campaign Workflow · MSC.

---

## 3. Sacred invariants (all seeds)

1. Standalone repo — no MSC imports.  
2. Config fail-loud.  
3. Family B — every row scoped by `identity_id`.  
4. **Umpire** — structure mandatory, friction zero on happy path; **no hard process block** of fills for bound breach.  
5. **Day atom** — campaign wraps; does not replace Scientific Protocol.  
6. **Ledger ≠ signed charter** — platform never fabricates signature.  
7. **Goodhart** — bounds / variance / panel / range state ≠ Journey input.  
8. **No profit theater** on campaign surfaces.  
9. **No unlocks** for scores.  
10. **Guide as-built only** (F1).  
11. **GET list never creates** (D3).  
12. **Variance = bounds at fill time** (§5.4).  
13. **All-bands grammar** — ranges, not max/target primary vocabulary.  
14. **Witness, never tackle** — trade always logs as it happened.  
15. **Signature permanence** for charters (lifecycle board law).  
16. Evidence over assertion; declare files; no waived Delta gates.  
17. Documentation parity same body of work as ship.

---

## 4. As-built vs program (honest)

### 4.1 Landed substrate (do not rebuild)

| Item | Status |
|------|--------|
| Campaign CRUD · multi-active · capital · goals · cover | **LANDED** |
| Signature · amendments · Renew · pack 1.2 · Open/Archive · End campaign UI | **LANDED** (`p-campaign-lifecycle`) |
| `is_default` flag · ensure-on-import-ish paths | **LANDED** — **to be replaced** by genesis ledger |
| Unstamped trades allowed | **LANDED** — **to be removed** (Law 2) |
| Unbound campaigns (`account_id` NULL) | **LANDED** — **to be abolished** (Law 4) |
| §4.7 prefill cascade | **LANDED** — **to be replaced** by last-pair memory |
| Bounds / panel / ledger kind / name uniqueness forever | **NOT LANDED** |
| Stamp provenance · restamp · import→ledger | **NOT LANDED** |

### 4.2 Program target (this board)

| Item | Phase |
|------|--------|
| India model lock + §13 dispositions written | **W0** |
| Migration: ledger marker · account NOT NULL · name unique · bounds table · stamped_by · memory · data sweep | **M1** |
| Domain: genesis ledger · stamp required · memory · name law · ledger lifecycle guards · restamp | **M2** |
| Trade Log + import stamp paths | **M2 / M3** |
| Bounds API + variance §5.4 mechanism | **B1** |
| Process clauses witness at fill + quiet line | **B2** |
| Statistical panel + n-floor + critical surface | **B3** |
| Hotel frames style × horizon (sparse) | **B4** |
| Library/editor ledger vs charter · panel · instantiate · restamp UI | **U1–U3** |
| Pack model ≥ 1.3 | **X1** |
| Concept Spec v2.0 surgery notes + Guide + DL | **Z** |

---

## 5. Phases, seeds, gates

### Phase W0 — Program lock

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **GO** on this plan + seating S1–S8 + **§13 dispositions locked or deferred in writing** |
| **W0-1** | India | Keep/kill write-up: ledger column (`is_ledger` vs `kind`); bounds table; variance (a) vs (b) under §5.4; memory storage; panel derive-only; strategy-type phasing |
| **W0-2** | Hotel | Frame grid v1 cell list (sparse); n-floor defaults table; R:R basis confirm; win definition; Sharpe defer/ship; expectancy note for authors |
| **W0-3** | Tango | Vocabulary map: **default account** label (`Primary` / member chrome); ledger title pattern (`Default — {account}`); End campaign doctrine proposal; ban list for bounds chrome; import path labels (ledger / pick / new — no none) |
| **W0-4** | Lima | DL slot for model inversion; Concept Spec surgery checklist pointer; Export Spec bump plan note |
| **W0-5** | Juliet | **Materialize all phase seeds** as cold-start files (S4) |
| **W0-6** | Charlie | Guide strip: no member-visible “every trade stamps / panel / ledger furniture” until feature PRs |
| **W0-G** | Delta | Plan lock; dispositions written; Guide as-built; cold-start seeds on disk; S1–S8 seating |

### Phase M1 — Schema + migration honesty

| Seed | Agent | Intent |
|------|-------|--------|
| **M1-0** | India | Final DTO freeze from W0-1 (columns, enums, indexes) |
| **M1-1** | Alpha · Mike · **Kilo** | Migration(s): `account_id` NOT NULL path; ledger marker; title uniqueness support; `member_practice_campaign_bounds`; trade `stamped_by`; last-pair memory table/prefs; **sweep unstamped → ledger** with `stamped_by=migration`; bind NULL accounts per disposition; name suffix collision fix; existing `is_default` → ledger per disposition |
| **M1-G** | Delta · Kilo · Mike | Zero data loss; Family B; migration dry-run; #11 |

### Phase M2 — Domain core (Laws 1–6)

| Seed | Agent | Intent |
|------|-------|--------|
| **M2-0** | Alpha · Mike · **Kilo** | **Default-account genesis (§2.1):** ensure default account (`Primary`) at first Practice-suite touch (Trade Log / Campaign / import entry points — idempotent Family B); **not** campaign list-GET alone. **Kilo** #1 account half |
| **M2-1** | Alpha · Mike · **Kilo** | Genesis ledger: on **every** account create (incl. default-account ensure) → ledger in same act; ledger lifecycle guards (no complete/end/pause/renew/delete); never sign ledger; title per Tango; **Kilo** #1–2, #7 |
| **M2-2** | Alpha · Mike · **Kilo** | Stamp required on **trade** create/update only; last-pair memory read/write; same-account validation; **Kilo** #3–4. **Do not** require journal `practice_campaign_id` |
| **M2-3** | Alpha · **Kilo** | Name law on create/rename/renew/instantiate; suffix algorithm; archive reserves names; **Kilo** #6 |
| **M2-4** | Alpha · **Kilo** | Instantiate-to-account (copy); restamp same-account (single-trade v1); cross-account 4xx; **Kilo** #4–5 |
| **M2-5** | Alpha · **Kilo** | **Hard-gate audit (C):** search/remove any landed hard rejection of stamps for term window / bounds (incl. interim §4.7a-style 422 on expired `ends_at`). Fills after `ends_at` must **log** with window **variance**, not 4xx. **Kilo** regression: trade after campaign `ends_at` → 200 + variance signal |
| **M2-G** | Delta · Kilo · Mike | Laws 1–6 + §2.1 account genesis; #1 fully achievable; no Journey imports |

### Phase M3 — Import + Trade Log surfaces (server)

| Seed | Agent | Intent |
|------|-------|--------|
| **M3-1** | Alpha · Mike · **Kilo** | Import: remove unstamped path; no selection → ledger; memory not consulted/updated; pick/new paths; **Kilo** #15 |
| **M3-2** | Alpha · Charlie (API contract) | Trade sheet / create-trade: campaign always present, pre-filled by Law 3 memory (or ledger). **Journal stamping remains optional (OD-1.4); Law 2 applies to trades only** — do not invert journal composer into mandatory campaign classification |
| **M3-G** | Delta · Kilo | Import + create-**trade** stamp law; journal still optional stamp |

### Phase B1 — Bounds schema API

| Seed | Agent | Intent |
|------|-------|--------|
| **B1-0** | India · Hotel | Attribute enum + dimensions; critical one-per-campaign rule; n_floor storage |
| **B1-1** | Alpha · Mike · **Kilo** | CRUD bounds on **charters only**; post-sign bound change → amendments; ledger rejects bounds; Family B |
| **B1-2** | Alpha · India · **Kilo** | **Variance mechanism implement** (a or b per W0-1) with §5.4 history stability; **Kilo** #16 |
| **B1-G** | Delta · Kilo · Mike · India | Bounds + variance history tests |

### Phase B2 — Process witness at fill

| Seed | Agent | Intent |
|------|-------|--------|
| **B2-1** | Alpha · Hotel · **Kilo** | Evaluate process clauses at fill (risk, size, concurrent, scopes, window); quiet variance payload in API response; **never 422 for bound/term breach**. Reaffirm M2-5: no hard-gate on `ends_at` — window variance only. **Kilo:** fill after `ends_at` logs successfully |
| **B2-2** | Alpha | Strategy-type classify or unclassified-tolerant (per disposition #8) — trail if new machinery |
| **B2-G** | Delta · Kilo · Hotel | #8 process side; both sides of band; no term 422 regression |

### Phase B3 — Statistical panel (server + read model)

| Seed | Agent | Intent |
|------|-------|--------|
| **B3-1** | Alpha · Hotel · **Kilo** | Derive panel readings (never store); n-floor “gathering”; structural R:R at entry; win rate def; critical surface flag (no auto-status) |
| **B3-2** | Alpha · **Kilo** | Optional expectancy cross-check diagnostic (not Journey); Sharpe omit if deferred |
| **B3-G** | Delta · Kilo · Hotel | #8–9 statistical side |

### Phase B4 — Starting frames (doctrine transmission)

| Seed | Agent | Intent |
|------|-------|--------|
| **B4-1** | Hotel · Tango · Charlie | Sparse style × horizon frame catalog; prefill bounds on charter create; provenance which frame seeded (optional field) |
| **B4-G** | Delta · Hotel · Tango | Frames skippable; ranges only; no horizon enum column |

### Phase U1 — Library + ledger chrome

| Seed | Agent | Intent |
|------|-------|--------|
| **U1-1** | Charlie · Echo · Tango · **Kilo** | Ledger pinned/distinct in Open; absent from Archive; no lifecycle toolbar on ledger detail |
| **U1-G** | Delta · Echo · Tango · Kilo | #7 UI |

### Phase U2 — Bounds editor + panel UI

| Seed | Agent | Intent |
|------|-------|--------|
| **U2-1** | Charlie · Echo · Tango · Hotel · **Kilo** | Charter bounds editor (ranges); panel range bars; gathering states; critical surface once; clinical copy |
| **U2-G-Tango** | Tango | Ban greps: violation, max/target/threshold primary, unlock |
| **U2-G-Echo** | Echo | Density + panel readability |
| **U2-G-Hotel** | Hotel | Band semantics match doctrine |
| **U2-G-Kilo** | Kilo | UI + API parity |
| **U2-G** | Delta | Requires specialist rows |

### Phase U3 — Trade sheet · restamp · instantiate · import UI

| Seed | Agent | Intent |
|------|-------|--------|
| **U3-1** | Charlie · Echo · Tango | Trade sheet always shows campaign (memory prefill); quiet outside-charter line |
| **U3-2** | Charlie · Echo | Restamp affordance (scope per disposition #5); instantiate “start from existing” |
| **U3-3** | Charlie · Echo · Tango | Import sheet: ledger / pick / new — **no none** |
| **U3-G** | Delta · Echo · Tango · Kilo | Happy path zero extra keystrokes; #15 UI |

### Phase X1 — Pack / export

| Seed | Agent | Intent |
|------|-------|--------|
| **X1-0** | India · Lima | practice-campaign schema **≥ 1.3**; bounds; ledger flag; trade stamped_by |
| **X1-1** | Alpha · Mike · **Kilo** | Export/import round-trip; name collision suffix + report; **Kilo** #12 |
| **X1-G** | Delta · Kilo · Mike | Pack green |

### Phase Z — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z-1** | Lima · Charlie | Concept Spec v2.0 fold notes or surgery PR; Guide parity; DL model inversion entry |
| **Z-2** | Lima | Trade Log Spec note: unstamped path retired; A-2b update if needed |
| **Z-G** | Delta | Program PASS — all phase gates + Kilo packs + no Journey greps |

---

## 6. Gate matrix

| Phase | Gate | Agents | Evidence |
|-------|------|--------|----------|
| W0 | **W0-G** | Delta | GO; §13 written; W0-6 Guide; seeds on disk |
| M1 | **M1-G** | Delta · Kilo · Mike | Migration honesty #11 |
| M2 | **M2-G** | Delta · Kilo · Mike | Laws 1–6 API #1–7 |
| M3 | **M3-G** | Delta · Kilo | Import #15 + stamp required |
| B1 | **B1-G** | Delta · Kilo · Mike · India | Bounds + §5.4 #16 |
| B2 | **B2-G** | Delta · Kilo · Hotel | Process witness #8 |
| B3 | **B3-G** | Delta · Kilo · Hotel | Panel #8–9 |
| B4 | **B4-G** | Delta · Hotel · Tango | Frames |
| U1 | **U1-G** | Delta · Echo · Tango · Kilo | Ledger chrome |
| U2 | **U2-G-*** then **U2-G** | specialists → Delta | Panel UI |
| U3 | **U3-G** | Delta · Echo · Tango · Kilo | Trade/import/restamp UX |
| X1 | **X1-G** | Delta · Kilo · Mike | Pack #12 |
| Z | **Z-G** | Delta | Program close |

**No waived gates.**

---

## 7. Sequencing

```text
W0-G
  │
  ├─► M1* ──► M1-G ──► M2* ──► M2-G ──► M3* ──► M3-G
  │                              │
  │                              ├─► B1* ──► B1-G ──► B2* ──► B2-G
  │                              │              └─► B3* ──► B3-G
  │                              │              └─► B4* ──► B4-G   (Hotel may start after W0-2)
  │                              │
  │                              └─► U1* after M2-G (ledger chrome)
  │                                   U2* after B1-G + B3-G (needs panel API)
  │                                   U3* after M2-G + M3-G (stamp/import UX)
  │
  └─► X1* after M2-G + B1-G ──► X1-G ──► Z-G
```

**Critical path:**  
`W0-G → M1-G → M2-G → M3-G → B1-G → B2-G → B3-G → U2-G → U3-G → X1-G → Z-G`

**Parallel after M2-G:** U1 ∥ B1; B4 after W0-2; X1 after M2+B1.

**Blocked without:**  
- M2-G before U3 stamp UX  
- B1-G + variance before B2  
- B3-G before U2 panel  
- §13 disposition #8 before B2-2 strategy-type depth  

---

## 8. Acceptance map (Spec §10 → seeds)

| Spec # | Seed completion |
|--------|-----------------|
| #1 Default account + ledger before first action | **M2-0** (account) · **M2-1** (ledger) · M1-1 |
| #2 New account → ledger | M2-1 · M1-1 |
| #3 Memory | M2-2 |
| #4 Stamp required · no cross-account | M2-2 · M2-4 · M3-2 (trades only) |
| #5 Instantiate | M2-4 · U3-2 |
| #6 Name law | M2-3 · X1-1 |
| #7 Ledger guards | M2-1 · U1-1 |
| #8 Bounds witness | B1 · B2 · B3 · U2 |
| #9 Critical surface | B3-1 · U2-1 |
| #10 Goodhart | All Kilo greps · Z-G |
| #11 Migration | M1-1 · M1-G |
| #12 Pack | X1-1 |
| #13 Multi-active charters | M2 (regression) |
| #14 D3 GET | M2-1 (ensure not on list GET) · Kilo |
| #15 Import → ledger | M3-1 · U3-3 |
| #16 Variance history | B1-2 · B2-G |

---

## 9. File ownership (indicative)

| Area | Paths |
|------|--------|
| Migrations | `migrations/10x_campaign_structured_practice*.sql` (next free NNN) |
| Campaign domain | `server/practice_spine_domain.py` · `server/routes/practice_spine.py` |
| Trade Log stamp | `server/` trade log domain/routes · import paths |
| Import / export | `server/import_domain.py` · `server/export_domain.py` |
| Tests | `server/tests/test_practice_spine.py` · new `test_campaign_structured_practice.py` · trade log stamp tests |
| Schema pack | `Specs/schemas/practice-campaign-v1.json` (+ version note) · Export Spec if needed |
| Campaign UI | `web/app/app/practice/campaign/**` · trade log components · `ImportSheet.tsx` |
| Frames | `web/lib/campaignFrames.ts` (or successor bounds frames module) |
| Guide | `web/app/guide/page.tsx` — **per feature PR only** |
| Specs | Structured Practice Spec as-built notes · Concept Spec surgery · Trade Log A-2b |
| Board | `agents/p-campaign-structured-practice/**` |

---

## 10. Out of program (do not expand this board)

| Item | Why |
|------|-----|
| Journey meters from panel/variance | Goodhart / DL-068 · #10 |
| Platform hard-block fills on bound breach | Law 7 / witness |
| **Mandatory journal campaign stamp** | Law 2 = trades only; OD-1.4 stands |
| Auto-abandon on critical range | Spec §11 |
| `template_campaign_id` lateral graph | Future OD |
| Full strategy-type classifier if disposition trails | #8 defer |
| Sharpe if Hotel defers | #4 |
| Bulk restamp if disposition is single-only | #5 |
| Prop / coach counterparty | Concept §7 |
| Marketing Campaign Workflow | Different product word |
| Rebuilding signature/amend/renew from scratch | Lifecycle board substrate |
| MSC coupling | Doctrine |

---

## 11. Coach GO checklist

- [ ] This bench plan accepted as execution law  
- [ ] S1–S8 seating accepted  
- [ ] Spec §13 dispositions **written** (lock or defer with seed impact)  
- [ ] F1–F3 Spec review fixes acknowledged as law  
- [ ] p-campaign-lifecycle treated as closed substrate  
- [ ] Explicit **GO** on W0-0  

**After GO, before W0-G:** Juliet materializes seeds; Charlie W0-6 Guide strip; India/Hotel/Tango W0 write-ups; Delta does not pass W0-G on stub tables alone (S4).

---

## 12. Risk register (for Delta / Coach)

| Risk | Mitigation |
|------|------------|
| Naive derive-on-read rewrites history | §5.4 normative; B1-2 + #16 mandatory |
| Import pollutes last charter | #15; memory not updated by import |
| Fabricated ledger signature | Ledger never signs; Kilo #7 |
| **#1 unachievable without account genesis** | Spec §2.1 + **M2-0** ensure default account at Practice touch; acceptance map split #1/#2 |
| Journal composer gated by Law 2 misread | M3-2 explicit: OD-1.4 optional journal stamp; trades only |
| Interim §4.7a hard term 422 if ever landed | **M2-5** audit/remove + B2-1/Kilo fill-after-ends_at |
| Guide ahead of as-built | W0-6 + F1 |
| Strategy-type holds whole bounds program | Disposition #8 trail |
| Migration data loss | M1-G zero-loss; `stamped_by=migration` |

---

## 13. Document history

| Date | Note |
|------|------|
| 2026-08-08 | **Review A–C:** default-account genesis §2.1 + M2-0; journal optional pin M3-2; hard-gate audit M2-5/B2-1; acceptance map #1 split |
| 2026-08-08 | Structured Practice Spec v1.0 stamp-ready (F1–F3) |
| 2026-08-08 | **Full Agent Bench Plan v1.0** — Seven Laws · ledger · stamp/memory · bounds/panel · import · pack; board `p-campaign-structured-practice` |

---

*Implementation starts only after Coach GO on W0-0 with §13 dispositions written.*
