# FatTail Labs — Trade Log Spec v1.1

**Status:** AS-BUILT (v1.1 + harden appendix) — product surface live; formal Coach “approved”
label retained from p-trade-log delivery; **harden truth** in §15 (2026-07-29)  
**Date:** 2026-07-28 · **As-built notes:** 2026-07-29  
**Route:** `/app/trade-log`  
**Family:** B (member-private) · **Entitlement:** activator+ (administrators always)  
**Execution:** [`agents/p-trade-log/`](../agents/p-trade-log/) · harden [`agents/p-practice-harden/`](../agents/p-practice-harden/)

**Parents:**
- [`FatTail-Labs-Application-Framework-Spec-v1.0.md`](./FatTail-Labs-Application-Framework-Spec-v1.0.md) — Trade Log template, T-D5 process-first, Family B
- [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) — isolation, consent, aggregates
- [`FatTail-Labs-Human-Interface-Spec-v1.0.md`](./FatTail-Labs-Human-Interface-Spec-v1.0.md) — HIG density, stay-put  

**Sibling apps (integration contracts in §10):**
- **Journal** — calendar-day process log (Application Framework T-D3); domain Spec TBD
- **Reports** — multi-account **totals and charts** over Trade Log (and later Journal); product name replaces Statistics / interim “Records”; route `/app/reports`; domain Spec TBD

**Supersedes for product shape:** Trade Log MVP (migration `027_trade_log.sql` + form-first UI). Process fields retained; multi-leg multi-account model replaces storage and shell.

**UX references:** ToS Trade History multi-leg grouping · FatTail/MSC strategy menu (Basic + Spreads)

**Doctrine:** Process-first (T-D5). P&amp;L optional and neutral — never the product headline. No profit-claim marketing. Family B isolation absolute.

---

## 0. Agent Bench (mandatory execution path)

This Spec is implemented **only** through the FatTail Labs Agent Bench
([`agents/README.md`](../agents/README.md), doctrine in [`agents/bench/`](../agents/bench/)).

| Artifact | Path |
|----------|------|
| Project board | [`agents/p-trade-log/ORCHESTRATOR.md`](../agents/p-trade-log/ORCHESTRATOR.md) |
| Charter | [`agents/p-trade-log/CHARTER.md`](../agents/p-trade-log/CHARTER.md) |
| Seeds | [`agents/p-trade-log/seeds/`](../agents/p-trade-log/seeds/) |
| Gate reports | [`agents/p-trade-log/gate-reports/`](../agents/p-trade-log/gate-reports/) |

### 0.1 Hierarchy (this project)

| Role | Callsign | Duty on Trade Log v1.1 |
|------|----------|-------------------------|
| Final authority | **Coach** | Spec approval, ship/no-ship, arbiter |
| Orchestration | **Juliet** | Seeds, board, sequencing — does not code packets |
| Spec / architecture | **India** | Domain model, product boundary, Family B store shape |
| Backend | **Alpha** | Migrations, API, adapters parse, stats summary |
| Frontend | **Charlie** | Table-first shell, sheet, templates, import UI |
| Design | **Echo** | HIG density, sheet, blotter chrome |
| Security / privacy | **Mike** | Isolation, export/import trust, entitlements |
| Member psychology | **Tango** | Process-first copy; no profit-claim chrome |
| Curriculum accuracy | **Hotel** | Strategy labels / process framing honesty |
| Tests | **Kilo** | Isolation, multi-leg, import idempotency, stats |
| Gates | **Delta** | Phase-end evidence; no waived gates |
| Memory | **Lima** | Decision log + Spec status flips |

### 0.2 Invariants for all seeds

1. Touch **only** files listed in the active seed (change control).  
2. Evidence over assertion — curl, pytest, UI walkthrough.  
3. No implementation before India S0/S1 model review and Coach build approval.  
4. Family B: never leak cross-identity; Reports uses §10.2 only (or Privacy §4.1 for admin aggregates).  
5. Coordination through Coach or Juliet — no ad-hoc agent-to-agent scope expansion.

---

## 1. Intent

The Trade Log is the member’s **options-first trade blotter**: a permanent **log table** of strategy fills (multi-leg, ToS-style). The member **never leaves the log** for entry or detail — create/edit/import/account management use a **right slide-out**. Accounts are scoped to a **broker or sim** (max **10 active**). Data is portable via a **canonical document** and **platform adapters**.

Compatible with **Journal** and **Reports** without merging UIs or stores in v1.1:

| App | Owns | Trade Log relationship |
|-----|------|------------------------|
| **Trade Log** | Fills, legs, accounts, positions projection | Source of trade structure + optional process fields per trade |
| **Journal** | Day / session narrative on a calendar | May **link** to trades; shared process vocabulary |
| **Reports** | Totals, rollups, and **charts** across **all** (or selected) accounts | **Consumes** Trade Log via private aggregate APIs — never a second fill store; this is where the book is **totaled and charted** |

---

## 2. Non-goals (v1.1)

- Merging Trade Log + Journal into one Practice Log UI (product proposal; deferred)
- Broker live API sync (file import only)
- Real-time quotes / greeks
- Sharing, leaderboards, public blotters
- Admin examination UI (Member-Data-Privacy §4.2 later)
- Reverse-export to proprietary broker formats (canonical + generic CSV only)
- Cross-account or cross-member position netting

---

## 3. Information architecture

### 3.1 Route & shell

| Item | Spec |
|------|------|
| URL | `/app/trade-log` only (no `/new` route) |
| Deep links | `?account=` · `?id=` (opens sheet) · `?panel=import\|accounts` |
| Default paint | **Log table** full height — no form above the fold |
| Secondary mode | **Positions** (same shell; single-account open book) |
| Chrome | Account switcher (broker/sim) · Log \| Positions · Import · Export · + New trade |
| Panels | **One right slide-out** (~min(420px, 40vw)); Esc closes; log stays visible |
| Mobile | Bottom sheet; table primary |

**Stay-put:** save updates table in place; no full navigation away from the log.

### 3.2 Empty states

- No accounts → create account (label + **broker or sim** required); one-click helpers: “Primary · thinkorswim”, “Sim · generic sim”.
- Accounts, no trades → short copy + “Log a trade” opens sheet.
- Never ship the MVP long form as the first surface.

---

## 4. Domain model

### 4.1 Vocabulary

```
Identity
  └── Account[]     (≤10 status=active; venue = broker|sim required)
        └── Trade[] (fill group / strategy event)
              └── Leg[] (contract or single-asset fill line)
```

**Position (v1.1):** derived open quantity by instrument key within **one account**. Not a stored table.

### 4.2 Accounts (broker or sim required)

| Field | Required | Notes |
|-------|----------|--------|
| `label` | yes | e.g. IRA, ES paper |
| `broker` | **yes** | Venue catalog (live **or** sim) |
| `broker_label` | if other* | When `other` / `other_sim` |
| `currency` | default USD | |
| `status` | yes | `active` \| `archived` |
| `badge_color`, `sort_order`, `notes_md` | no | |

| ID | Rule |
|----|------|
| A-1 | Max **10** `active` accounts per identity; 11th → 422 |
| A-2 | Archive frees a slot; hard-delete only if zero trades or cascade confirm |
| A-3 | **Default account auto-provisioned** on first Trade Log access: label `Primary`, venue provisional (`unset`). **Venue is chosen on first import** (adapter maps: thinkorswim → `thinkorswim`, native → `fattail`, …) **or first trade create** (user picks broker/sim/FatTail). No assumed broker. Catalog includes `fattail` (canonical book) and real venues. |
| A-4 | Positions never net across accounts |
| A-5 | Import commit requires `account_id` with venue set |
| A-6 | Optional “All active” log view; account + venue columns |

#### Venue catalog (API field: `broker`)

**UI:** “Broker or sim”. **`venue_kind`:** `live` | `sim`.

**Live:** `thinkorswim`, `schwab`, `tastytrade`, `ibkr`, `tradestation`, `tradier`, `robinhood`, `etrade`, `fidelity`, `td`, `coinbase`, `binance`, `kraken`, `other_crypto`, `prop_firm`, `other`  

**Sim:** `sim`, `paper`, `thinkorswim_paper`, `ibkr_paper`, `tradestation_sim`, `other_sim`  

Optional filter: **Live | Sim | All**.

### 4.3 Strategies

**Options (Basic + Spreads):** `SINGLE`, `VERTICAL`, `BUTTERFLY`, `CONDOR`, `STRADDLE`, `STRANGLE`, `IRON_FLY`, `IRON_CONDOR`, `CALENDAR`, `DIAGONAL`  

**Multi-asset / escape:** `STOCK`, `FUTURE`, `CRYPTO`, `CUSTOM`, `NOTE` (zero legs)

Template mismatch: keep label + warn (do not force CUSTOM).

### 4.4 Trade

| Field | Notes |
|-------|--------|
| `account_id` | Required |
| `exec_at` | Required |
| `asset_class` | `equity_option` \| `equity` \| `future` \| `crypto` \| … |
| `strategy` | Catalog code |
| `order_type` | LMT, MKT, … |
| `net_price`, `net_side` | DEBIT \| CREDIT \| null |
| Process (T-D5) | `setup_md`, `plan_md`, `rules_md`, `adherence`, `deviation_md`, `lesson_md` |
| `pnl_amount` | Optional neutral |
| `journal_entry_id` | Optional link to Journal (nullable until Journal ships) |
| `external_adapter`, `external_order_id` | Import idempotency |

**Adherence:** `followed` \| `partial` \| `broke` \| `unknown` (shared with Journal).

### 4.5 Leg

| Field | Notes |
|-------|--------|
| `side` | BUY \| SELL |
| `quantity` | Positive integer |
| `pos_effect` | TO_OPEN \| TO_CLOSE \| null |
| Instrument | By `asset_class` |
| `fill_price`, `fees` | |

**equity_option:** underlier, expiry, strike, right, optional multiplier  
**equity:** symbol · **future:** root/contract · **crypto:** symbol or base/quote  

### 4.6 Tables

```
member_trade_log_accounts
member_trade_log_trades
member_trade_log_legs
member_trade_log_import_batches
```

- `identity_id` on all rows.  
- Unique `(identity_id, account_id, external_adapter, external_order_id)` when external id set.  
- Legacy `member_trade_log_entries` → migrate to default account as `NOTE` or dual-read then drop.

---

## 5. Log table UX (ToS-style)

| Column | Options multi-leg | Stock / future / crypto |
|--------|-------------------|-------------------------|
| Exec time | First row of block | same |
| Strategy | Catalog | STOCK / FUTURE / CRYPTO |
| Side | per leg | per leg |
| Qty · effect | `+1 TO OPEN` | qty + effect or BUY/SELL |
| Symbol | underlier | ticker / root / pair |
| Exp / Strike / Type | option fields | — / asset badge |
| Price / Net / Order type | fill; net on first row | fill |

**Grouping:** one trade = one block; shared meta on first row; muted open-vs-close tint (**not** win/loss). Optional adherence chip on first row.

**Positions:** single account; derived open book; click → trade sheet.

---

## 6. Slide-out panels

| Panel | Content |
|-------|---------|
| Trade | Account, strategy template, legs, fill meta, process, Journal link |
| Import | Target account → adapter → file → preview → commit |
| Accounts | Create/rename/archive; broker or sim; cap messaging |

---

## 7. Canonical document `fattail.labs.trade_log`

### 7.1 Envelope

```json
{
  "format": "fattail.labs.trade_log",
  "model_version": "1.0",
  "exported_at": "ISO-8601",
  "source": { "adapter": "native", "adapter_version": "1.0" },
  "accounts": [
    {
      "id": "stable-export-id",
      "label": "IRA",
      "broker": "thinkorswim",
      "broker_label": null,
      "currency": "USD",
      "status": "active",
      "trades": []
    }
  ]
}
```

### 7.2 Invariants

| ID | Rule |
|----|------|
| C-1 | Legs ≥ 0 (`NOTE` = 0) |
| C-2 | Single-member document; isolation on import |
| C-3 | Strategy ∈ catalog or CUSTOM/NOTE |
| C-4 | Process block always present (may be empty) |
| C-5 | Adapters emit canonical; import consumes canonical |
| C-6 | Idempotency: account + adapter + broker_order_id (else hash) |
| C-7 | ≤10 active accounts after import unless mapping into existing |
| C-8 | Every trade under an account |
| C-9 | Venue ∈ catalog; other* needs `broker_label` |

### 7.3 Export

- `.tradlog.json` (default) · CSV flat legs with `account_label` + venue  
- Scope = filters + account selection  

---

## 8. Adapters

```
file → detect/parse → canonical → preview → commit (account-scoped)
```

| Adapter | v1.1 |
|---------|------|
| `native` | required I/O |
| `csv_generic` | required I/O |
| `thinkorswim` | required import |
| tastytrade, ibkr, tradestation, schwab | later |

Server-side parse. No third-party upload of member files.

---

## 9. API

Base: `/api/me/trade-log/*` — session + activator+; `identity_id` constrained.

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST/PATCH | `/accounts` | Accounts; POST requires venue |
| GET | `/venues` | live + sim catalog |
| GET/POST | `/trades` | List/create (`account_id`) |
| GET/PATCH/DELETE | `/trades/{id}` | One trade + legs |
| GET | `/positions?account_id=` | Open book |
| GET | `/export` | Canonical or CSV |
| POST | `/import/detect` \| `/preview` \| `/commit` | Import |
| GET | `/adapters` | Adapter list |
| GET | `/records/summary` | Reports contract (§10.2) — multi-account totals (API path may rename to `/reports/*` when Reports ships) |
| GET | `/records/series` | Reports chart series (§10.2) |

**Journal bridge (when Journal ships):** `GET /trades?from=&to=` · `PATCH` set/clear `journal_entry_id`.

---

## 10. Integration: Journal & Reports

### 10.0 Naming

| Was | Now |
|-----|-----|
| Statistics | **Reports** |
| Interim “Records” | **Reports** (Coach 2026-07-28) |
| App slug | **`reports`** (migration `040` renames `statistics` → `reports`) |
| Route | `/app/reports` (`/app/statistics` and `/app/records` redirect) |

**Product intent:** Reports is where the member **totals and charts** the book — especially **across all accounts** (live + sim), not a second place to enter trades. Practice suite nav: Trade Log · Reports · Journal · Playbook.

### 10.1 Shared principles

| ID | Principle |
|----|-----------|
| I-1 | Separate stores in v1.1 — no merged journal+legs table |
| I-2 | Shared process vocabulary (adherence + process field names) |
| I-3 | Same identity isolation; Reports sees caller only (or Privacy §4.1 admin aggregates) |
| I-4 | Deep links: Journal → `/app/trade-log?id=`; Reports → Trade Log filters / trade id |
| I-5 | Process-first chrome; P&amp;L charts only if member opts in — never the sole hero metric |
| I-6 | Trade Log export valid alone; optional journal bundle later |
| I-7 | **Reports is multi-account by default** — totals/charts may include all active accounts, one account, or a multi-select; Trade Log Positions stay single-account |

### 10.2 Trade Log → Reports

Reports is a **read model** over Trade Log. It does **not** store fills.

#### Summary (totals)

`GET /api/me/trade-log/records/summary?account_ids=&from=&to=&venue_kind=`

- `account_ids` — omit or empty = **all active accounts** (default for Reports home); comma list or repeated query for subset  
- `venue_kind` — optional `live` \| `sim` filter  


```json
{
  "from": "date",
  "to": "date",
  "account_ids": [1, 2],
  "scope": "all_active" | "subset",
  "trade_count": 0,
  "by_account": [
    { "account_id": 1, "label": "IRA", "broker": "thinkorswim", "trade_count": 10 }
  ],
  "by_strategy": {},
  "by_adherence": {},
  "by_venue_kind": { "live": 0, "sim": 0 },
  "open_vs_close_fills": { "TO_OPEN": 0, "TO_CLOSE": 0 },
  "pnl_sum": null,
  "pnl_by_account": null
}
```

#### Series (charts)

`GET /api/me/trade-log/records/series?metric=&account_ids=&from=&to=&bucket=day|week`

Minimum metrics (v1.1 contract; Reports UI chooses which to plot):

| `metric` | Meaning | Default available |
|----------|---------|-------------------|
| `trade_count` | Fills/trades per bucket | yes |
| `adherence_rate` | followed / (followed+partial+broke) per bucket | yes |
| `by_strategy_share` | stacked or multi-series strategy mix | yes |
| `pnl` | Cumulative or period P&amp;L | **only if** member opts into P&amp;L in Records |

```json
{
  "metric": "trade_count",
  "bucket": "day",
  "points": [{ "t": "2026-07-01", "v": 3, "by_account": { "1": 2, "2": 1 } }],
  "pnl_included": false
}
```

**Rules:**

- Multi-account totaling and charting is a **first-class Reports job**; Trade Log table remains the blotter.  
- `pnl_*` omitted/null unless opt-in (process-first).  
- Reports **must not** duplicate fill storage.  
- Live vs sim may be charted separately or combined; never imply sim P&amp;L is live performance in copy (Hotel/Tango).  

### 10.3 Trade Log ↔ Journal

| Direction | Behavior |
|-----------|----------|
| Journal day | List trades for date; “Open in Trade Log” |
| Trade sheet | Optional attach / create journal stub when Journal exists |
| Process prose | Prefer structure on trade, day narrative on journal |
| Adherence | Same enum; day adherence ≠ auto-rollup of trade adherence (Reports may show both) |

v1.1: `journal_entry_id` nullable; contract reserved for Journal Spec.

### 10.4 Practice hub / Apps grid (future)

- Insights section: **Reports** + Wiki (not “Statistics”).  
- If `/app/practice?mode=trades|days` lands, this Spec remains source of truth for **trades** mode.

---

## 11. Privacy & entitlements

- Family B; AF-B1 no admin back door.  
- Export = member portability.  
- Import parse on Labs server only.  
- activator+; observer 403 + membership CTA.  

---

## 12. Acceptance tests (evidence)

1. Table first on `/app/trade-log`.  
2. Account requires broker or sim; 422 if missing.  
3. Max 10 active accounts.  
4. Butterfly block ToS-style.  
5. STOCK / FUTURE / CRYPTO singles.  
6. Sheet for new/edit/import/accounts; path unchanged.  
7. Positions single-account only.  
8. Canonical export/import idempotent.  
9. thinkorswim fixture commit.  
10. `records/summary` (+ series) multi-account totals; P&amp;L omitted by default.  
11. Cross-member isolation.  
12. Process fields survive CRUD + export/import.  

---

## 13. Phasing (bench seeds)

| Phase | Seed(s) | Agents | Deliverable |
|-------|---------|--------|-------------|
| **S0** | TL0 | India (+ Echo/Tango/Hotel review) | Spec/architecture alignment; build approval |
| **S1** | TL1 | Alpha + Kilo | Accounts + trades/legs schema/API + isolation tests |
| **S2** | TL2 | Charlie + Echo | Table-first UI + sheet + templates + venue switcher |
| **S3** | TL3 | Alpha + Charlie | Canonical export + native/csv import |
| **S4** | TL4 | Alpha + Charlie | thinkorswim adapter + Positions |
| **S5** | TL5 | Alpha + Charlie | `records/summary` + `records/series`; Journal link field |
| **S6** | TL6 | Delta + Lima | Gate evidence + decision log + Spec status |

See [`agents/p-trade-log/ORCHESTRATOR.md`](../agents/p-trade-log/ORCHESTRATOR.md).

---

## 14. Open decisions (defaults)

| ID | Default |
|----|---------|
| D1 | Strategies §4.3 |
| D2 | First adapter: thinkorswim |
| D3 | Server-side parse |
| D4 | Template mismatch: warn, keep label |
| D5 | Active cap: 10 |
| D6 | Venue: broker **or** sim required |
| D7 | Records P&amp;L charts/totals off by default |
| D8 | Journal: link field only in v1.1 |
| D9 | Product name **Reports** (not Statistics); multi-account totals/charts home |

---

## 15. As-built harden notes (2026-07-29) — p-practice-harden H0–H2

**Purpose:** Spec honesty for the **shipped** Practice stack after architectural
hardening. §9–§10 remain the original v1.1 contract; this section records what is
**actually live** so agents do not invent or re-implement dual domain logic.

**Design reference:** [`Architecture/11-practice-domain-single-source.md`](../Architecture/11-practice-domain-single-source.md)  
**Board:** [`agents/p-practice-harden/`](../agents/p-practice-harden/) · Gates H0–H2 **PASS**

### 15.1 Domain single source of truth

| Concern | Authoritative implementation |
|---------|------------------------------|
| Structure key / FIFO open→close | `server/trade_log_domain/` |
| Synthetic / estimated realized PnL | same (when `pnl_amount` null on closes) |
| Open-on-day / day book | same |
| Equity series + drawdown + stats numbers | same via `build_reports_book` |

Clients (**Reports**, **Journal**) **consume** HTTP read models. They must **not**
reimplement match/PnL domain (removed in H1). Presentation (histogram bins, money
formatting, HIG chrome) stays client-side.

### 15.2 Analytics API (as-built; supersedes default path for Reports/Journal)

Live under `/api/me/trade-log/analytics/*` (session + activator+; Family B identity):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/analytics/day-book?day=YYYY-MM-DD&account_id=` | Journal day book |
| GET | `/analytics/days-interest?from_day=&to_day=&account_id=` | Calendar interest days |
| GET | `/analytics/reports-book?account_id=&starting_capital=` | Reports equity / DD / stats |

- `starting_capital` is a **client preference** (localStorage); not a server ledger.  
- Effective PnL may be **estimated** when fills lack stored `pnl_amount` — process
  honesty; not a performance claim (Tango/Hotel).  
- Spec §10.2 `records/summary` and `records/series` remain the **process-first
  contract** for future totals/adherence metrics; **not yet** the primary path for
  the equity UI. Do not claim they are wired until a later seed lands aliases.

### 15.3 List / isolation / performance (H0)

| Rule | As-built |
|------|----------|
| Legs on list/export | Batch `IN (...)` via `_load_legs_for_trades` — not N+1 |
| Trade list limit | 10000 (full multi-year books; no silent small truncate) |
| Identity | Real sessions use claims `identity_id`; storage fallback for internal id `0` is **`LABS_ENV=dev` only** (401 outside dev) |
| Route layout | Package `server/routes/trade_log/` (`common`, `accounts`, `trades`, `analytics`, `io`) |

### 15.4 Practice suite nav (as-built)

Order: **Trade Log · Reports · Journal · Retrospective · Playbook**  
Canonical slugs: `web/lib/practiceSuite.ts` → `PRACTICE_NESTED_SLUGS` (Apps grid nests these).

### 15.5 Non-goals (harden / this Spec honesty)

- Live broker APIs.  
- Member productization of bench/ops scripts (`import_0dte_xlsx`, demo seeds) — see
  [`agents/p-practice-harden/OPS-VS-PRODUCT.md`](../agents/p-practice-harden/OPS-VS-PRODUCT.md).  
- Retrospective **content** (week roll-up, agent) — Journal-Retrospective Spec **P0 shell only**.  
- Formula changes without Coach-labeled seed (behavior freeze unless explicitly approved).  
- Virtualization/pagination of blotter — optional H4 only after Coach GO.  

### 15.6 Acceptance delta vs §12

| §12 item | As-built note |
|----------|----------------|
| 10 `records/summary` (+ series) | **Deferred** as primary Reports path; use §15.2 analytics until records aliases ship |
| Isolation / multi-leg / import | Covered by characterization suite (`server/tests/test_trade_log*.py`) |

**Version note:** A formal Spec **v1.2** may later merge §15 into §9–§10. Until then,
§15 is **normative for as-built** Practice harden.

---

## 15. Version history

| Version | Notes |
|---------|--------|
| **v1.1** | Multi-leg ToS log, accounts (broker/sim, ≤10 active), canonical + adapters, Journal/**Reports** contracts (multi-account totals & charts), Agent Bench `p-trade-log` |
| **v1.0 (MVP)** | Process-only `member_trade_log_entries`; form-first UI — superseded for product shape |

---

*Where this Spec conflicts with MVP code, this document wins after Coach approval for build. Until then, production may continue to run MVP behavior.*
