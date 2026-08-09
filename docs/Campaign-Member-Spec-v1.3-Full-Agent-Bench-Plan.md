# Member Campaign Spec v1.3 — Full Agent Bench Plan

**Date:** 2026-08-09  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-campaign-structured-practice/`](../agents/p-campaign-structured-practice/) *(retitle to window-model board if Coach prefers; reuse seats)*  
**Product law:** [`Specs/FatTail-Labs-Member-Campaign-Spec-v1_3.md`](../Specs/FatTail-Labs-Member-Campaign-Spec-v1_3.md)  
**Supersedes execution law:** [`docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.2.md`](./Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.2.md)  
**Folded directives:** Window model · Prescribed Panel · Six Controls (`docs/Campaign-Panel-v1-The-Six-Controls.md`)  
**Companion (minimal amendment):** Trade Log Spec — passive participant (§9 of Spec v1.3)  
**Lifecycle substrate (closed):** [`agents/p-campaign-lifecycle/`](../agents/p-campaign-lifecycle/) — sign / amend / renew / archive for **charters** only  
**Queued out:** D6 convexity / vol gauge (vol OD)  
**Guide:** as-built only (F1)  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md)

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.

---

## 0. Mission — the direction

**Three ideas (Spec §2):**

1. **You direct a trade into a season** (stamp = membership).  
2. **The season’s window decides what it can accept** (fill time inside `[starts_at, ends_at]` — membership law, not variance).  
3. **The book each fill came from is immutable fact** (account never rewrites; campaigns are interpretation).

**Campaign = special window into the book(s).** Panels and the six controls belong on **every charter**. Positions/trades are **seen in a campaign only if they carry that campaign’s badge** (exclusive membership). The ledger absorbs undirected practice; charters are deliberate seasons.

| Pillar | Spec | Ship meaning |
|--------|------|----------------|
| **Window model** | L4 · L5 | Charters are **account-free**; eligibility = fill-time ∈ window; any account’s fills may join |
| **Direction** | L2 · L3 · L6 | Every trade stamps one campaign; memory pre-answers; one badge, no share |
| **Ledger** | L1 · §3 | Per-account furniture; no panel/radar; always fallback |
| **Prescribed panel** | §5 | **All six controls on every charter** — report only; admin dials; no Add-bound form |
| **Campaign Journey** | §6 | Six-axis radar + T0→present scrub; big shape = faithful |
| **Trade Log passive** | §9 | Badge · filter · redirect only — no campaign logic owned by Trade Log |
| **Witness** | §7 | Boundary breach logs + variance; never 4xx on log path |

**Design invariant:** *Structure is always present; deliberate structure is always optional. Witnessed, never forced or graded.*

---

## 1. As-built honesty (what to keep vs reverse)

### 1.1 Keep (closed or near-closed)

| Area | Status | Note |
|------|--------|------|
| Lifecycle sign / amend / renew / archive | **LANDED** | `p-campaign-lifecycle` |
| Ledger genesis, stamp resolve, memory table, `stamped_by` | **LANDED** | M1–M3 · migrations 102–104 |
| Bounds `role` + display domain | **LANDED** | 106 · 107 |
| House six seeds + panel API + CMP strip UI | **PARTIAL** | Panel on charter detail; admin dial open/close |
| Radar + scrub shell | **PARTIAL** | Journey shape API; fill window needs L4 alignment |
| Practice Context account + **campaign select** | **PARTIAL** | Bar ships campaign picker; default = ledger |
| Reports campaign scope | **PARTIAL** | `practice_campaign_id` on reports-book |

### 1.2 Reverse or re-scope (v1.2 → v1.3)

| As-built / v1.2 assumption | v1.3 law | Action |
|----------------------------|----------|--------|
| Charters **require** `account_id` (migration 103 / Law 4 instance) | **L5** charters account-free | India: nullable `account_id` for non-ledger; migration reverse; domain guards |
| Trading window = **variance** | **L4** membership — out-of-window **not stampable** | Picker filters; no variance note for window; remove “fill after ends_at logs OK” as product law |
| Multi-account = **instantiate copy** | **L5** one charter, fills from any book | Drop instancing-as-copy for account switch; redirect only |
| Free-form bounds editor / invitation empty panel | **§5** prescribed six | Done directionally; finish anatomy + every-charter ensure |
| Process clauses on surface | Deferred | Server witness only v1 |
| Trade Log owns campaign UX | **§9** passive badge | Badge + redirect + one filter system |

### 1.3 Gap map (Spec acceptance → work)

| Spec # (abbrev) | Gap vs as-built |
|-----------------|-----------------|
| 1–2 Genesis / ledger | Mostly green; reaffirm first-trade **starts_at** for ledger |
| 3–7 Direction / window / memory | **Core gap:** eligibility picker; memory fallback when window-ineligible; fill-time re-eval |
| 5 Account freedom | **Schema + stamp UI** — charters no account bind |
| 8–12 Lifecycle | Green substrate; name law / archive polish |
| 13–15 Panel | Six on every charter; admin-only; CMP geometry; no member Add-bound |
| 16–19 Journey | T0 = **window start**; celebrate-the-drift; no invitation mainline |
| 20–23 Witness | Window not variance; goal never variance; fill-time history |
| 24 Badge | **Not built** — blotter chip + filter + Direct to… |
| 25 Pack | Export partial; import eligibility + unbound charters |

---

## 2. Locked decisions (from Spec v1.3)

| ID | Decision |
|----|----------|
| **W1** | Window = membership. Picker never offers non-covering campaigns. Ledger always offerable. |
| **W2** | Fill time (exec), not entry time, decides eligibility. |
| **W3** | Charters: `account_id` NULL. Ledgers: bound to one account. |
| **W4** | Redirect moves stamp; never shares; never moves account. |
| **W5** | Six controls prescribed on every new charter (ensure seeds). |
| **W6** | Admin dials only (v1); members read report. |
| **W7** | Trade Log = facts + badge chrome; campaign logic lives in practice spine. |
| **W8** | Variance at bounds-in-force-at-fill; goals never variance. |
| **W9** | No Journey / Reports campaign chrome beyond optional stamp filter (DL-257: Reports stays aggregate — campaign select is Practice Context, not P&L hero). |
| **W10** | D6 out. |

### 2.1 Seating (S1–S9)

| ID | Rule |
|----|------|
| **S1** | Kilo on every testable seed (not gate-only). |
| **S2** | Guide as-built only. |
| **S3** | Mike on schema / pack / Family B. |
| **S4** | Seeds on disk before phase gate. |
| **S5** | Tango: report register, badge, End campaign, ledger labels. |
| **S6** | Hotel: six doctrine, decay, n-floors, Minimum Shape N, R:R basis. |
| **S7** | India: 103 reverse; variance mechanism; display domain; no dual truth. |
| **S8** | Lifecycle board closed for sign/amend/renew. |
| **S9** | Echo: CMP strips, radar fill, badge density, library. |

---

## 3. Roster

| Callsign | Role (this plan) |
|----------|------------------|
| **Coach** | GO, dispositions, ship/no-ship |
| **Juliet** | Board, seeds, sequence — never product packets |
| **India** | Schema reverse; eligibility; variance mechanism |
| **Alpha** | Domain + API + Trade Log stamp/badge glue |
| **Charlie** | Surfaces: panel, library, trade sheet, blotter badge |
| **Echo** | CMP anatomy, radar, badge density |
| **Mike** | Family B, pack, import |
| **Hotel** | Panel doctrine, decay, n-floors |
| **Tango** | Copy, badge vocabulary, End campaign |
| **Kilo** | Acceptance 1–25 characterization |
| **Delta** | Gates, ternary, evidence |
| **Lima** | DL v1.3 restatement; Trade Log Spec amendment note; Concept surgery |

**Not seated:** Golf · Journey meters product · Marketing Campaign Workflow · MSC · D6.

---

## 4. Sacred invariants

1. Standalone repo — no MSC.  
2. Config fail-loud.  
3. Family B.  
4. **Umpire** — never 4xx on trade log path for bound breach.  
5. Day atom.  
6. Ledger ≠ charter; **ledger no panel/radar**.  
7. Goodhart — no Journey input from panel/radar/badge conduct.  
8. No profit theater / archive aggregates.  
9. Guide as-built.  
10. D3 — list GET does not invent charters (ledger ensure only).  
11. **Window membership** — cannot stamp outside window.  
12. **One stamp per trade** — exclusive membership.  
13. **Big shape = faithful**.  
14. Evidence over assertion; no waived gates.  
15. Documentation parity with ship.

---

## 5. Phases, seeds, gates

### Phase W0 — Plan lock (v1.3)

| Seed | Agent | Intent |
|------|-------|--------|
| **W0-0** | Coach | **GO** on this plan; confirm 103 reverse + window membership; D6 out |
| **W0-1** | India | Keep/kill write-up: nullable `account_id` for charters; ledger CHECK; variance (a)/(b); display domain placement |
| **W0-2** | Hotel | Decay function; n-floor table; win definition; Minimum Shape N; R:R structural basis note |
| **W0-3** | Tango | Badge tiers (member / memory / ledger); End campaign; Reference range copy |
| **W0-4** | Lima | DL entry: v1.3 restatement + supersession of instance Law 4; Trade Log Spec amendment draft outline |
| **W0-5** | Juliet | Materialize all seeds cold-start |
| **W0-6** | Charlie | Guide strip — no premature window/badge promises |
| **W0-G** | Delta | GO written; dispositions; seeds on disk |

### Phase M0 — Schema reverse (window model)

| Seed | Agent | Intent |
|------|-------|--------|
| **M0-1** | India · Mike · **Kilo** | Migration: charters may have `account_id` NULL; ledgers retain NOT NULL (or app guard); existing charters: keep account as **last-known book** *or* clear per Coach note (recommend: **keep stamp history, clear charter.account_id** so L5 holds going forward) |
| **M0-2** | Alpha · **Kilo** | Domain: create/patch charter without account; ledger still requires account; instantiate-to-account **removed** or becomes “copy design only” without account bind |
| **M0-G** | Delta · Kilo · Mike · India | #5 · #7 schema half |

### Phase D — Direction + window eligibility

| Seed | Agent | Intent |
|------|-------|--------|
| **D1-0** | Alpha · India · **Kilo** | Stamp API: reject (or force ledger fallback) when fill time ∉ campaign window — **happy path never 422 for member typing**: picker pre-filters; API enforces fail-loud if forced |
| **D1-1** | Alpha · **Kilo** | Memory: if last campaign window-ineligible at fill → **silent ledger** (L3) |
| **D1-2** | Charlie · Echo · Tango · **Kilo** | Trade sheet picker: only covering windows + ledger; zero extra keystrokes on happy path |
| **D1-3** | Alpha · **Kilo** | Fill-time edit: re-eval; outside-window stamp → quiet redirect surface, **never auto-move** |
| **D1-G** | Delta · Kilo · Tango | #3–#6 · #20 window not variance |

### Phase P — Prescribed panel (every charter)

| Seed | Agent | Intent |
|------|-------|--------|
| **P1-0** | Alpha · Hotel | Ensure six seeds on **every** charter create + list/detail; remove free-form Add-bound routes from product UI (admin dial only) |
| **P1-1** | Charlie · Echo · **Kilo** | CMP strips (container width, 40% column if with radar); pointer = fills stamped to campaign ∩ window ∩ as_of; gathering below n-floor |
| **P1-2** | Alpha · **Kilo** | Admin PATCH only (`require_admin`); signed → amendment; members never see dial |
| **P1-G** | Delta · Kilo · Echo · Hotel | #13–#15 |

### Phase J — Campaign Journey

| Seed | Agent | Intent |
|------|-------|--------|
| **J1-0** | Hotel · **Kilo** | Decay pure + celebrate-the-drift regression |
| **J1-1** | Alpha · India · **Kilo** | Shape-at-T: fills [T0→T] where T0 = **window start**; bounds at T; six axes; ledger 404 |
| **J2-0** | Echo · Charlie · **Kilo** | Radar fills box; scrub; layout **controls 40% / radar 60%** |
| **J-G** | Delta · Kilo · Echo · Hotel | #16–#19 |

### Phase B — Trade Log badge (passive participant)

| Seed | Agent | Intent |
|------|-------|--------|
| **B1-0** | Charlie · Echo · Tango · **Kilo** | Blotter **one chip** per row; provenance tier (`stamped_by`); **no variance color** on chip |
| **B1-1** | Charlie · **Kilo** | Chip tap → set campaign filter (one system — Practice Context + table filter) |
| **B1-2** | Charlie · Alpha · Tango · **Kilo** | Detail **Direct to campaign…** → eligibility picker; redirect moves stamp |
| **B1-G** | Delta · Kilo · Echo · Tango | #24 |

### Phase X — Pack / import

| Seed | Agent | Intent |
|------|-------|--------|
| **X1-0** | India · Lima · Mike | Pack ≥ 1.3: bounds+role, ledger flag, nullable charter account, lineage |
| **X1-1** | Alpha · Mike · **Kilo** | Import unchosen → ledger; memory untouched; name suffix; eligibility on explicit target |
| **X1-G** | Delta · Kilo · Mike | #25 |

### Phase U — Library + retirement polish

| Seed | Agent | Intent |
|------|-------|--------|
| **U1-0** | Charlie · Echo · Tango | Ledger pinned Open, absent Archive; charters free of account chrome |
| **U1-1** | Charlie · **Kilo** | Retirement soft-gate open **charters** only |
| **U1-G** | Delta · Echo · Tango | Library honesty |

### Phase Z — Close

| Seed | Agent | Intent |
|------|-------|--------|
| **Z-1** | Lima · Charlie | DL + Trade Log Spec amendment PR; Concept Spec surgery notes; Guide after feature gates |
| **Z-G** | Delta | Program PASS — all gates + Kilo packs + Goodhart greps |

---

## 6. Sequencing

```text
W0-G
  │
  ├─► M0* ──► M0-G ──► D1* ──► D1-G ──┬─► P1* ──► P1-G ──► J* ──► J-G
  │                                    │
  │                                    ├─► B1* ──► B1-G   (badge after D1 picker)
  │                                    │
  │                                    └─► X1* after M0+D1 ──► X1-G
  │
  ├─► U1* after M0 (library)
  └─► Z* after J-G + B1-G + X1-G ──► Z-G
```

**Critical path:**  
`W0-G → M0-G → D1-G → P1-G → J-G → B1-G → Z-G`

**Parallel after D1-G:** P1 ∥ B1 ∥ X1.

**Blocked without:**

| Need | Before |
|------|--------|
| Nullable charter account | D1 multi-book stamps, U1 |
| Window eligibility | Badge redirect, import explicit target |
| Six-panel ensure | Journey six axes |
| Stamp + memory | Badge provenance |

---

## 7. Acceptance map (Spec §13 → seeds)

| Spec # | Seeds |
|--------|--------|
| 1–2 Genesis / ledger | M0 · D1 (regression M2) · P1-0 ledger no panel |
| 3–6 Direction / window / memory / fill-time | **D1-*** |
| 7 Any account + immutable book | **M0 · D1 · B1-2** |
| 8–12 Lifecycle / names / backfill | Lifecycle board + light regression |
| 13–15 Panel | **P1-*** |
| 16–19 Journey | **J-*** |
| 20–23 Witness | **D1-G · P1 · Kilo history** |
| 24 Badge | **B1-*** |
| 25 Pack | **X1-*** |

---

## 8. File ownership (indicative)

| Area | Paths |
|------|--------|
| Migrations | `migrations/10x_campaign_window_model.sql` (nullable charter account, constraints) |
| Domain | `server/practice_spine_domain.py` · `server/campaign_panel.py` · `server/campaign_alignment.py` |
| Eligibility | trade create/resolve · trade sheet picker |
| Analytics | reports-book campaign filter (landed partial) |
| UI panel | `web/components/practice/CampaignPanel.tsx` |
| Context | `web/lib/practiceContext.tsx` · `PracticeContextBar.tsx` |
| Blotter badge | `web/components/trade-log/TradeLogTable.tsx` · TradeSheet |
| Pack | `server/export_domain.py` · `import_domain.py` · schemas |
| Specs | Trade Log Spec amendment · Concept surgery · this plan |
| Tests | `server/tests/test_campaign_panel.py` · new `test_campaign_window.py` · badge tests |

---

## 9. Risk register

| Risk | Mitigation |
|------|------------|
| Reversing 103 breaks production charters | M0 migration: keep historical stamps; clear only charter.account_id; dual-read period |
| Window hard-block feels like gate | Tango: picker never shows invalid; silent ledger fallback; never modal wall |
| Free-form bounds UI regresses | P1-0 deletes product routes/UI; Kilo grep Add-bound |
| Badge becomes shame surface | No variance color; conduct only on panel |
| Reports becomes campaign scoreboard | Stamp filter only; no hero campaign P&L chrome |
| Double-count across campaigns | L6 exclusive stamp; Kilo redirect moves |
| Panel pointer empty | Window ∩ stamp ∩ pnl_amount; n-floor gathering honest |

---

## 10. Cold-start seed list (Juliet)

```
W0-0-coach-go-v1.3.md
W0-1-india-window-schema.md
W0-2-hotel-panel-doctrine.md
W0-3-tango-badge-vocab.md
W0-4-lima-dl-trade-log-amend.md
W0-5-juliet-materialize.md
W0-6-charlie-guide-strip.md
M0-1-nullable-charter-account.md
M0-2-domain-account-free-charters.md
D1-0-window-eligibility-api.md
D1-1-memory-fallback-ledger.md
D1-2-trade-sheet-picker.md
D1-3-fill-time-reeval.md
P1-0-ensure-six-every-charter.md
P1-1-cmp-panel-ui.md
P1-2-admin-dial.md
J1-0-alignment-decay.md
J1-1-journey-shape-window.md
J2-0-radar-layout.md
B1-0-blotter-badge.md
B1-1-badge-filter.md
B1-2-direct-to-campaign.md
X1-0-pack-schema.md
X1-1-import-ledger.md
U1-0-library-ledger.md
U1-1-retirement-charters.md
Z-1-docs-close.md
```

---

## 11. Recommended near-term order (after GO)

1. **W0-0 GO** written.  
2. **M0** reverse account-binding on charters (foundational).  
3. **D1** window eligibility + picker + memory fallback — *this is the “positions need the badge to be seen” spine*.  
4. **P1 + J** finish prescribed panel + journey (already started).  
5. **B1** blotter badge — *visibility law made legible*.  
6. **X1 / U1 / Z**.

---

## 12. Document history

| Date | Note |
|------|------|
| 2026-08-09 | **v1.3 Full Agent Bench Plan** from Member Campaign Spec v1.3: window model, account-free charters, prescribed six on every charter, Trade Log badge passive participant; honest keep/reverse vs v1.2 as-built |

---

*Implementation starts only after Coach **W0-0 GO**. An unwritten GO is a waived gate.*
