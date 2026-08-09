# Accounts & Capital Stack — Full Agent Bench Plan v1.0

**Date:** 2026-08-09  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship) — **full Spec set APPROVED 2026-08-09**  
**Board:** [`agents/p-accounts-capital/`](../agents/p-accounts-capital/)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.

---

## 0. Product law (approved Specs — all in scope)

| Spec | Path | Role in program |
|------|------|-----------------|
| **Capital & Position Sizing v0.3** | [`Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md`](../Specs/FatTail-Labs-Capital-and-Position-Sizing-Spec-v0.3.md) | Rings, fungibility, composition, Accounts & Capital surface, solved size |
| **Funding & Defunding v0.2** | [`Specs/FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md`](../Specs/FatTail-Labs-Funding-and-Defunding-Spec-v0.2.md) | Cash movements; **owns** balance vs trading curves + master-DD **$ comparison** |
| **Staleness Awareness v0.1** | [`Specs/FatTail-Labs-Staleness-Awareness-Spec-v0.1.md`](../Specs/FatTail-Labs-Staleness-Awareness-Spec-v0.1.md) | Declared as-of / two clocks; display never demand |
| **Campaign Amendment — Top Level Is the Account v1.0.2** | [`Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md`](../Specs/FatTail-Labs-Campaign-Amendment-Top-Level-Is-The-Account-v1.0.md) | Abolish ledger furniture; undirected null stamp; present-only radar (scrub cut) |
| **Campaign Spec v1.3** (delta only) | [`Specs/FatTail-Labs-Member-Campaign-Spec-v1_3.md`](../Specs/FatTail-Labs-Member-Campaign-Spec-v1_3.md) | Fold amendment + radar present-only into as-built; companion capital stack |
| **Trade Log Spec v1.1** (amend) | [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) | Undirected badge empty; import null stamp; account **consume** only |

**Source proposals / review trail (historical):**  
`docs/FatTail-Labs-Capital-and-Position-Sizing-Model-v0_1_2.md` · Funding proposal · Staleness model · Top-Level Account amendment doc · Advisor review + response  

**Related boards (do not re-open closed work):**  
- [`p-campaign-structured-practice`](../agents/p-campaign-structured-practice/) — window model / panel / badge substrate (landed)  
- [`p-campaign-lifecycle`](../agents/p-campaign-lifecycle/) — charter sign/amend/renew (closed)  
- [`p-trade-log`](../agents/p-trade-log/) — blotter host (consume account APIs after move)

**Queued out (not this program):** Live broker buying-power **sync** (Capital P6 / Funding live path — OD until sanctioned feed) · D6 vol gauge · Marketplace.

---

## 1. Mission

Ship the **identity-level money surface** and the **honest capital stack** so Practice and Strategy Lab can both consume accounts without owning them — and so undirected trading no longer hides behind ledger furniture.

| Pillar | Spec law | Ship meaning |
|--------|----------|--------------|
| **Account is top level** | Amendment L1–L3, L6 | No genesis ledger; undirected = null stamp; memory no fallback object |
| **Accounts & Capital** | Capital §6 | Users menu; sole account write path; move off Practice |
| **Ring 1 + curves** | Funding §3 | Balance = start + fills + movements; trading = fill P&L only; master DD $ vs budget $ |
| **Composition** | Capital Ring 2 | Wrap one / wrap many / proportion; funding ≠ direction |
| **Staleness** | Staleness S1–S11 | As-of / two-clock; quiet; no trade-path demand |
| **Present radar** | Amendment §2.1 · Campaign §6 | Charter radar present-only; scrub **cut** |
| **Independence** | Capital C9 · DL-248–250 | Labs-only and Practice-only both see capital surface |

**Design invariant:** *Real money is campaign-blind. Structure is optional. Witnessed, never forced. Practice and Lab share the owner’s keys — neither holds them alone.*

---

## 2. As-built honesty

### 2.1 Keep

| Area | Status |
|------|--------|
| Trade Log accounts table + retire=archive | Landed |
| Charters account-free; six controls; present radar (UI) | Landed partial (v1.3 board) |
| Campaign stamp + memory tables | Landed — **reuse** for deliberate only |
| Reports equity / DD on account book | Landed — **re-base** on Funding curves for capital overview |
| Family B export keys pattern | Landed |

### 2.2 Reverse / move (critical)

| As-built | Approved law | Action |
|----------|--------------|--------|
| Genesis ledger on account create | Amendment L1 | Remove `ensure_ledger`; dispose furniture rows |
| Trade always resolves campaign | L2 undirected lawful | Null stamp allowed; resolve only when explicit/eligible memory |
| Memory → ledger | L3 | Clear pre-answer; undirected |
| Account CRUD in Practice / Trade Log settings | Capital C9 | Move to Accounts & Capital; delete parallel UI |
| Balance = start + fills only | Funding F2 | + cash movements |
| Master DD includes start / cash | Funding F3 · §3.4 | Fill P&L curve; $ vs budget $ |
| Ledger always in picker | Amendment | Deliberate campaigns only |
| “Ledger = full book” analytics | India re-express | Account scope or undirected filter |

### 2.3 Gap map (acceptance → phase)

| Cluster | Spec acceptance | Phase |
|---------|-----------------|-------|
| Spec lock + DL + residual ODs | All Specs approved | **W0** |
| Ledger abolition + undirected stamp | Amendment §§6–8 | **L\*** |
| Accounts & Capital shell + move CRUD | Capital §6 · P1 | **A\*** |
| Movements + curves + master DD $ | Funding §§3,10 | **F\*** |
| Composition + overcommit | Capital Ring 2 · Funding §5 | **C\*** |
| Staleness chrome | Staleness §§4–5,9 | **S\*** |
| Solved size presentation | Capital Ring 3 | **Z\*** (after Hotel formula OD) |
| Trade Log / Campaign UI parity | Trade Log §17 · Campaign fold | **T\*** (parallel after L) |
| Pack / export | Mike | **X\*** after F+L |
| Program close | Lima as-built + Delta | **Z-G** |

---

## 3. Locked decisions (Coach-approved Spec set)

| ID | Decision |
|----|----------|
| **AC1** | Full Spec stack above is **product law** (Coach approve 2026-08-09). |
| **AC2** | Account is top level — **no ledger furniture**. |
| **AC3** | Undirected trades: `practice_campaign_id` null. |
| **AC4** | Funding owns curves + master-DD **dollar meeting point** (Hotel sign on W0 if not already). |
| **AC5** | Trading curve = **Σ fill P&L only** (starts at 0). |
| **AC6** | Radar: **present-only** on deliberate charters; scrub/as-of-T **cut**. |
| **AC7** | Accounts & Capital under **users menu**; sole account write path. |
| **AC8** | Wrap = funding only; never direction. |
| **AC9** | Live broker BP sync **out** of this program (queued OD). |
| **AC10** | Furniture disposition default: **Option A soft-delete** (Amendment); hard-delete only if zero export refs. |
| **AC11** | Unstamp: `practice_campaign_id` null **and** `stamped_by` null. |

### 3.1 Residual implementer ODs (lock in W0 — do not re-open Spec mission)

| OD | Default for ship if Coach silent at GO | Owner |
|----|----------------------------------------|--------|
| **OD-T** Tolerance form % vs $ | Default **percent**; form flag in schema | Hotel · Coach |
| **OD-5** Wrap live vs snapshot | Default **snapshot** at compose time (overcommit + staleness work); live = later | India · Coach |
| **OD-F5** Starting balance as first movement | **Keep** separate starting_balance field v1; unification later | India |
| **OD-lat** Latitude free vs prescribed bands | Free-form v1 + optional suggestion copy | Hotel · Tango |
| **OD-size** Solved-size surface | Campaign detail quiet line + Accounts calculator later | Echo |
| **Hotel §3.4** | Already Spec text — Hotel **sign-off seed** in W0 | Hotel |

### 3.2 Seating (S1–S10)

| ID | Rule |
|----|------|
| **S1** | Kilo on every testable seed. |
| **S2** | Guide as-built only until feature gates land. |
| **S3** | Mike on schema, Family B, pack, BP credentials (when P6). |
| **S4** | Seeds on disk before phase gate. |
| **S5** | Tango: undirected/neutral; quiet overcommit; no shame staleness. |
| **S6** | Hotel: master-DD $ math; latitude; solved-size formula v1. |
| **S7** | India: no dual truth; ledger reverse; curves; composition schema. |
| **S8** | Echo: Accounts & Capital IA; as-of grammar; composition UI. |
| **S9** | Charlie: move Practice account chrome; Trade Log undirected; users-menu route. |
| **S10** | Alpha: domain/API; null stamp; movements; capital overview. |

---

## 4. Roster

| Callsign | Role |
|----------|------|
| **Coach** | GO, residual ODs, ship/no-ship |
| **Juliet** | Board, seeds, sequence |
| **India** | Schema, curves, reverse ledger, composition, no dual truth |
| **Alpha** | Domain + API |
| **Charlie** | Accounts & Capital UI; Practice removal; Trade Log host |
| **Echo** | IA, as-of chrome, composition, solved-size presentation |
| **Mike** | Family B, isolation, pack, export keys on reverse |
| **Hotel** | DD arithmetic sign-off; sizing formula; latitude |
| **Tango** | Copy: undirected, movements, staleness, overcommit |
| **Kilo** | Characterization packs per Spec acceptance |
| **Delta** | Gates ternary |
| **Lima** | DL cluster: capital stack + ledger supersession + radar present-only + Funding curves |
| **Foxtrot** | Deploy / migrate when ready |

**Not seated:** Golf · Marketing Campaign Workflow · MSC · Live BP broker adapter (queued).

---

## 5. Sacred invariants (this program)

1. Standalone repo — no MSC.  
2. Config fail-loud.  
3. Family B.  
4. **Umpire** — no 4xx on trade log for capital witnesses / bound breach.  
5. **No second store** of equity or witness events.  
6. **Campaign-blind master** — never join stamps to compute master DD.  
7. **Funding ≠ direction.**  
8. **Display never demand** (staleness).  
9. No profit theater.  
10. Goodhart — capital/panel conduct not Journey score input.  
11. Account write path uniqueness.  
12. Evidence over assertion; no waived gates.  
13. Documentation parity with ship.  
14. Parallel account UI after land = **blocking** defect.

---

## 6. Phases, seeds, gates

### Phase W0 — Plan lock + Spec ratification record

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **GO** on this plan; confirm AC1–AC11; residual ODs default or override |
| **W0-1** | Hotel | Sign Funding §3.4 dollar meeting point; note OD-T default; formula v1 sketch or defer Z |
| **W0-2** | India | Schema map: capital_prefs, movements, composition, ledger reverse disposition SQL; OD-5 default snapshot |
| **W0-3** | Tango | Vocabulary: undirected, fund/defund, as-of two-clock, overcommit lines (quiet) |
| **W0-4** | Lima | DL entries: Spec set approve; ledger supersession; radar present-only scrub cut; Funding curves |
| **W0-5** | Juliet | Materialize all seeds cold-start |
| **W0-6** | Echo | Accounts & Capital wireframe notes (users menu); no Practice account chrome after A |
| **W0-G** | Delta | GO written; ODs recorded; seeds on disk; Hotel sign on file |

### Phase L — Ledger abolition + undirected stamp (Amendment)

| Seed | Agent | Intent |
|------|-------|--------|
| **L1-0** | India · Mike · **Kilo** | Migration: stop genesis ledger; soft-delete/tombstone furniture; unstamp ledger trades (null stamp + null stamped_by); prove export_key safety |
| **L1-1** | Alpha · **Kilo** | Domain: no ensure_ledger on account create/list; resolve_trade → null when no explicit/eligible memory; create trade allows null |
| **L1-2** | Charlie · Tango · **Kilo** | Trade sheet picker: deliberate only + “No campaign”; blotter empty badge; undirected filter |
| **L1-3** | Alpha · Charlie | Import unchosen → null stamp; analytics without ledger-as-full-book |
| **L1-4** | Charlie | Library: no ledger pin; present radar only (already UI — verify) |
| **L-G** | Delta · Kilo · India · Tango | Amendment acceptance 1–9 |

### Phase A — Accounts & Capital surface + move CRUD

| Seed | Agent | Intent |
|------|-------|--------|
| **A1-0** | Charlie · Echo · Alpha | Route `/me/accounts-capital` (or Spec name); users menu entry; shell blocks |
| **A1-1** | Alpha · Mike · **Kilo** | Account APIs sole write path; starting_balance required path; retire soft gate on open **charters** |
| **A1-2** | Charlie | **Remove** account create/retire from Trade Log settings / Practice chrome (grep gate) |
| **A1-3** | Alpha · Charlie | Practice/Trade Log **read** accounts via same API; no dual write |
| **A-G** | Delta · Kilo · Mike · Echo | Capital §6 · acceptance account path uniqueness |

### Phase F — Cash movements + curves + master DD

| Seed | Agent | Intent |
|------|-------|--------|
| **F1-0** | India · Mike · **Kilo** | `member_account_cash_movements` migration; append-only + reverse |
| **F1-1** | Alpha · **Kilo** | Movements API; balance recompute = start + pnl + movements |
| **F1-2** | Alpha · Hotel · **Kilo** | Trading curve = Σ fill P&L only; realized_dd_dollars; tolerance_budget_dollars; W-Master-DD |
| **F1-3** | Charlie · Tango | Movements UI on Accounts & Capital; neutral copy |
| **F1-4** | Alpha · **Kilo** | Retirement final defund; retired fills remain on trading curve |
| **F-G** | Delta · Kilo · Hotel · India | Funding acceptance 1–10 |

### Phase C — Composition + overcommit

| Seed | Agent | Intent |
|------|-------|--------|
| **C1-0** | India · Alpha · **Kilo** | FundingComposition schema (wrap_one / wrap_many / proportion); OD-5 snapshot default |
| **C1-1** | Alpha · **Kilo** | W-Overcommit-total + W-Overcommit-source (snapshot); no auto cascade |
| **C1-2** | Charlie · Echo · Tango | Campaign allocation / composition UI; quiet overcommit lines on capital overview |
| **C-G** | Delta · Kilo · India | Capital Ring 2 · Funding §5 |

### Phase S — Staleness awareness

| Seed | Agent | Intent |
|------|-------|--------|
| **S1-0** | Alpha · India · **Kilo** | As-of on declared fields; balances_confirmed_at; derived oldest-link helper |
| **S1-1** | Charlie · Echo · Tango · **Kilo** | Two-clock display grammar; confirm-as-current; no trade-path interrupt |
| **S1-2** | Charlie · Tango | Honesty prompt (Accounts & Capital only; nudge budget) |
| **S1-3** | Alpha · Charlie | Solved-size provenance as-of line when size ships (or stub if Z later) |
| **S-G** | Delta · Kilo · Tango · Echo | Staleness acceptance 1–8 |

### Phase T — Trade Log + Campaign Spec fold (parallel after L-G)

| Seed | Agent | Intent |
|------|-------|--------|
| **T1-0** | Lima · India | Trade Log Spec §17 amend: undirected; import null; account consume |
| **T1-1** | Lima | Campaign Spec surgery notes toward v1.4 (ledger section remove) — Guide only after gates |
| **T1-2** | Charlie · **Kilo** | Practice Context / reports: no ledger default; undirected option |
| **T-G** | Delta · Lima | Spec parity |

### Phase Z — Solved size (optional v1 if Hotel ready) + close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z1-0** | Hotel · Alpha · **Kilo** | Solved-size formula v1 from allocation + latitude (or BLOCKED → defer) |
| **Z1-1** | Charlie · Echo | Presentation (inform only) |
| **Z1-2** | Lima · Charlie | Guide as-built strips |
| **Z-G** | Delta | Program PASS: all gates + Kilo packs + greps (no Practice account write; no ensure_ledger) |

### Phase X — Pack (after F-G + L-G)

| Seed | Agent | Intent |
|------|-------|--------|
| **X1-0** | Mike · Alpha · **Kilo** | Export movements + capital_prefs + composition; import ledger furniture → undirected |
| **X-G** | Delta · Mike | Round-trip |

---

## 7. Sequencing

```text
W0-G
  │
  ├─► L* ──► L-G ──┬─► T* (Trade Log / Campaign fold)
  │                │
  ├─► A* ──► A-G ──┤
  │                │
  └─► F* ──► F-G ──┼─► C* ──► C-G ──► S* ──► S-G ──► Z* ──► Z-G
                   │
                   └─► X* after F-G+L-G ──► X-G
```

**Critical path:**  
`W0-G → L-G + A-G + F-G → C-G → S-G → Z-G`

**Parallel after W0:** L ∥ A ∥ F (F needs A for UI entry point; F domain can start after A1-1 API exists).  
**Staleness:** after F (movements as-of) and A (confirm surface); before any BP self-report polish.  
**Composition C:** after F (balances true with movements).

**Blocked without:**

| Need | Before |
|------|--------|
| Hotel §3.4 sign | F1-2 Kilo freeze |
| Ledger reverse | Undirected Trade Log honesty |
| Account API sole write | A-G |
| Movements table | True Ring 1 + overcommit after cash |
| Snapshot composition default | C overcommit-source + S claim-age |

---

## 8. Acceptance map (all Specs → seeds)

| Spec | Acceptance | Seeds |
|------|------------|-------|
| Amendment 1–9 | L\* · T\* |
| Amendment #10 radar | Done Spec-side; L1-4 / UI verify present-only |
| Capital §11 | A\* · C\* · F\* |
| Funding §10 | F\* |
| Staleness §9 | S\* |
| Product independence | A1-0 · A-G |
| Grep: no Practice account write | A1-2 · Z-G |
| Grep: no ensure_ledger genesis | L1-1 · Z-G |

---

## 9. File ownership (indicative)

| Area | Paths |
|------|--------|
| Migrations | `migrations/1xx_accounts_capital_*.sql` (movements, capital_prefs, composition, ledger reverse) |
| Domain | `server/practice_spine_domain.py` · new `server/capital_domain.py` (or equivalent) |
| Trade log | `server/routes/trade_log/**` · `web/components/trade-log/**` |
| Capital UI | `web/app/app/me/…` or Spec route; users menu shell |
| Campaign UI | allocation / composition; library ledger removal |
| Pack | `export_domain.py` · `import_domain.py` |
| Specs | Trade Log amend; Campaign v1.4 notes; Guide after gates |
| Tests | `test_capital_*.py` · `test_cash_movements.py` · `test_ledger_abolish.py` · staleness unit |

---

## 10. Risk register

| Risk | Mitigation |
|------|------------|
| Reversing ledgers breaks production stamps | L1-0 soft-delete; unstamp with Kilo pack; dual-read period optional |
| Undirected feels “broken” | Tango neutral copy; Journey still works |
| Two curves confusing | Echo: witnesses first; curves advanced |
| Dual account UI remains | A1-2 grep **blocking** |
| Snapshot vs live wrap wrong default | OD-5 snapshot default; document |
| Master DD wrong after cash | F1-2 Kilo: withdraw ≠ DD; new account start ≠ recovery |
| Pack loses export_key | Soft-delete furniture; Mike gate |
| Scope creep into live broker | AC9 — out |

---

## 11. Cold-start seed list (Juliet)

```
W0-0-coach-go.md
W0-1-hotel-master-dd-sign.md
W0-2-india-schema-map.md
W0-3-tango-vocabulary.md
W0-4-lima-decision-log.md
W0-5-juliet-materialize.md
W0-6-echo-accounts-capital-ia.md
L1-0-ledger-reverse-migration.md
L1-1-domain-undirected-stamp.md
L1-2-trade-log-undirected-ui.md
L1-3-import-analytics-null.md
L1-4-library-radar-verify.md
A1-0-accounts-capital-shell.md
A1-1-account-api-sole-write.md
A1-2-remove-practice-account-chrome.md
A1-3-consumers-read-only.md
F1-0-movements-migration.md
F1-1-movements-api-balance.md
F1-2-trading-curve-master-dd.md
F1-3-movements-ui.md
F1-4-retire-final-defund.md
C1-0-composition-schema.md
C1-1-overcommit-witnesses.md
C1-2-composition-ui.md
S1-0-asof-chain-domain.md
S1-1-staleness-display.md
S1-2-honesty-prompt.md
S1-3-solved-size-asof-stub.md
T1-0-trade-log-spec-amend.md
T1-1-campaign-spec-surgery-notes.md
T1-2-practice-context-undirected.md
X1-0-pack-capital-movements.md
Z1-0-solved-size-formula.md
Z1-1-solved-size-ui.md
Z1-2-guide-asbuilt.md
```

---

## 12. Program close criteria (Z-G)

- All phase gates PASS with evidence files under `agents/p-accounts-capital/gate-reports/`.  
- Kilo packs green for Amendment · Capital · Funding · Staleness acceptance rows.  
- Grep: no Practice-side account write; no genesis `ensure_ledger_campaign` on account create.  
- Lima DL cluster landed.  
- Guide as-built only for shipped surfaces.  
- Live BP sync still **queued** with explicit OD — not silently half-built.

---

## 13. Document history

| Version | Date | Note |
|---------|------|------|
| **v1.0** | 2026-08-09 | Full program for approved Spec stack: Capital v0.3 · Funding v0.2 · Staleness v0.1 · Top-Level Account Amendment v1.0.2 · Trade Log/Campaign fold. Coach Spec set approval. Board `p-accounts-capital`. |

---

*The account is the book. Cash is life. P&L is trading. Campaigns are optional seasons. Practice and Lab share the owner’s capital surface — and write nothing without Accounts & Capital.*
