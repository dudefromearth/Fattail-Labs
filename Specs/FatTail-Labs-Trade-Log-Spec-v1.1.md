# FatTail Labs — Trade Log Spec v1.1

**Status:** AS-BUILT (v1.1 + harden appendix + **manual management** + **§17 campaign badge**) — product surface live  
**Date:** 2026-07-28 · **As-built notes:** 2026-07-29 · **Manual management:** 2026-08-05 · **Campaign registry/badge:** 2026-08-09  
**Route:** `/app/trade-log`  
**Family:** B (member-private) · **Entitlement:** Observer trial / Navigator Practice gate (DL-193)  
**Execution:** [`agents/p-trade-log/`](../agents/p-trade-log/) · harden [`agents/p-practice-harden/`](../agents/p-practice-harden/) · campaign chrome co-owned with [`agents/p-campaign-structured-practice/`](../agents/p-campaign-structured-practice/)  
**Design architecture:** [`Architecture/15-trade-log-manual-management.md`](../Architecture/15-trade-log-manual-management.md)

**Parents:**
- [`FatTail-Labs-Application-Framework-Spec-v1.0.md`](./FatTail-Labs-Application-Framework-Spec-v1.0.md) — Trade Log template, T-D5 process-first, Family B
- [`FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md`](./FatTail-Labs-Member-Data-Privacy-Spec-v0.1.md) — isolation, consent, aggregates
- [`FatTail-Labs-Human-Interface-Spec-v1.0.md`](./FatTail-Labs-Human-Interface-Spec-v1.0.md) — HIG density, stay-put  

**Sibling apps (integration contracts in §10 · campaign badge in §17):**
- **Journal** — calendar-day process log (Application Framework T-D3); domain Spec TBD
- **Reports** — multi-account **totals and charts** over Trade Log (and later Journal); product name replaces Statistics / interim “Records”; route `/app/reports`; domain Spec TBD
- **Practice Campaign** — [Member Campaign Spec v1.3](./FatTail-Labs-Member-Campaign-Spec-v1_3.md) owns the **campaign registry** and stamp rules; Trade Log is a **passive host** for badge chrome only (§17)

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

Compatible with **Journal**, **Reports**, and **Practice Campaign** without merging UIs or stores in v1.1:

| App | Owns | Trade Log relationship |
|-----|------|------------------------|
| **Trade Log** | Fills, legs, accounts, positions projection | Source of trade structure + optional process fields per trade; **hosts** campaign badge chrome (§17) |
| **Journal** | Day / session narrative on a calendar | May **link** to trades; shared process vocabulary |
| **Reports** | Totals, rollups, and **charts** across **all** (or selected) accounts | **Consumes** Trade Log via private aggregate APIs — never a second fill store; this is where the book is **totaled and charted**; **no campaign scoreboard chrome** (DL-257) |
| **Practice Campaign** | Campaign **registry**, window eligibility, panel/radar, memory | Trade Log **reads** registry for dispense + chip label; stores only stamp ids on trades |

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
| `status` | yes | `active` \| `archived` (**retire** in member chrome — same storage value until a rename migration, if ever) |
| `badge_color`, `sort_order`, `notes_md` | no | |
| `retired_at` | no | Optional clock when status enters `archived` (add when UI ships Retire; nullable additive) |

| ID | Rule |
|----|------|
| A-1 | Max **10** `active` accounts per identity; 11th → 422 |
| A-2 | **Retire = archive, never delete history.** Archive frees an active slot. Hard-delete only if zero trades (or explicit cascade confirm) — permanence doctrine third application (Playbook → Campaign → Accounts). Retired account: off active chrome by default; **readable** in history/reports; **exportable**; **can be un-retired** (`archived` → `active`). Trades, campaigns, journal stamps **untouched**. |
| A-2a | **Open campaigns soft gate (not hard block).** On retire, surface `planned`/`active` Practice campaigns scoped to this account (and optionally unbound actives the member used here). Offer clean path (complete/abandon first) or **retire anyway** (campaigns stay open — name the difference). Never block solely for open contracts. Concept authority: [Member Campaign Concept Spec §4.9](./FatTail-Labs-Member-Campaign-Concept-Spec-v1.0.md). |
| A-2b | **Unstamped trades are not a gate.** Retirement never requires retroactive `practice_campaign_id`. |
| A-3 | **Default account auto-provisioned** on first Trade Log access: label `Primary`, venue provisional (`unset`). **Venue is chosen on first import** (adapter maps: thinkorswim → `thinkorswim`, native → `fattail`, …) **or first trade create** (user picks broker/sim/FatTail). No assumed broker. Catalog includes `fattail` (canonical book) and real venues. **Does not** auto-create a Practice campaign (Campaign Spec §4.3 / §1 — platform never signs the contract). |
| A-4 | Positions never net across accounts |
| A-5 | Import commit requires `account_id` with venue set |
| A-6 | Optional “All active” log view; account + venue columns |
| A-7 | Optional “Show retired” in account chrome; default hides `archived` from pickers and suite filters |

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
| `entry_source` | **Provenance — three channels (never conflated).** See table below. Migrations `081`–`082`. |
| `practice_campaign_id` | **Campaign badge stamp** — FK into the campaign registry (§17). Required on every create path (server resolve to ledger if omitted). Permanent wear until explicit redirect. |
| `stamped_by` | Badge provenance: `member` \| `memory` \| `migration` \| `import` (Campaign Spec L2/L3). Chip tiering only — never conduct. |
| `playbook_entry_id` | Optional link to Playbook scrapbook entry (Own spine); independent of campaign stamp |
| `trash_reason` | Optional chip code when product records a trash intent (column reserved; hard-delete still removes the row) |
| `created_at`, `updated_at` | Audit line on sheet |

**Adherence:** `followed` \| `partial` \| `broke` \| `unknown` (shared with Journal).

**Campaign stamp (summary):** See **§17**. Trade Log does not define campaigns; it stores the stamp and displays the badge.

#### `entry_source` catalog (locked)

| Value | Label (UI) | Who writes it | Not the same as |
|-------|------------|---------------|-----------------|
| **`manual`** | Manual | Member structure form / legs sheet / duplicate template | — |
| **`import`** | Import | ToS / CSV / canonical pack / paste import adapters | Not automation |
| **`automated`** | Automated | **Strategy Lab process runtime** (deployment instance fills) and **other future Labs automations** | Not file import; not member typing |

- Default on `POST /trades`: **`manual`**.  
- Import commit: forces **`import`**.  
- Strategy Lab / bots: must stamp **`automated`** (never `import`, never silent `manual`).  
- Legacy synonym: `machine` → normalize to **`automated`** (migration `082`).

**entry_source (MM-1):** v1 **trash is universal** (any open/close fill may be deleted by the owner). Later product may restrict trash/edit for **`automated`** fills; store source now so policy does not guess. **Import and automated remain distinct** for audit and future policy.

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
| Select | Checkbox on **unmatched opens** (bulk trash) | same |
| Exec time | First row of block | same |
| Strategy | Catalog + source chip when not manual: **Import** (sky) · **Automated** (violet) | STOCK / FUTURE / CRYPTO |
| Status | **Open** · **Complete** · **Orphan close** badge | same |
| Campaign | **One campaign chip** per trade (first leg row) — title from registry; tap filters (§17) | same stamp |
| Side | per leg | per leg |
| Qty · effect | `+1 TO OPEN` | qty + effect or BUY/SELL |
| Symbol | underlier | ticker / root / pair |
| Exp / Strike / Type | option fields | — / asset badge |
| Price / Net | fill; net on first row | fill |
| Actions | Row click opens drawer; **delete only in drawer** (not on row) | — |

**Grouping:** one trade = one block; shared meta on first row; open green / close red tint (**not** win/loss).

**Open strip:** header chip **Open: N** filters to unmatched opens (`listUnmatchedOpens` / same FIFO structure match as domain). **Select opens** selects all unmatched for bulk trash.

**Validation chips (row):** `No net` · `No legs` · `No time` · orphan close (fail loud, process honesty).

**Positions (secondary):** single account; derived open book; click → trade sheet. Primary open management is blotter + sheet (not a separate Positions mode requirement for manual management).

---

## 6. Slide-out panels

| Panel | Content |
|-------|---------|
| Trade | See **§16 Manual trade management** — Actions (top) · Trade details (bottom); structure-first entry; close path |
| Import | Target account → adapter → file/paste → preview → commit (`entry_source=import`) |
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

### 15.3 List / isolation / performance (H0 + lazy blotter)

| Rule | As-built |
|------|----------|
| Legs on list/export | Batch `IN (...)` via `_load_legs_for_trades` — not N+1 |
| **Blotter list (default)** | **Paginated** newest-first: `limit` default **80**, max 200; `cursor` + `has_more` / `next_cursor` — **lazy load** keeps browser memory bounded |
| **Full book** | `?full=1` or analytics routes only (capped 10000 server-side) — **not** default for `/app/trade-log` |
| **Unmatched opens** | `GET /api/me/trade-log/opens` — server match on full book, returns **opens only** (Open:N filter / create gate) |
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

**Version note:** A formal Spec **v1.2** may later merge §15–§16 into the body. Until then,
§15–§16 are **normative for as-built** Practice + manual management.

---

## 16. Manual trade management (as-built 2026-08-05)

**Purpose:** Members who **enter and edit fills by hand** (and who import ToS/CSV) need a
complete lifecycle: open → close or trash → honest pairing → less retyping. Machine-entered
fills will share the same schema; **trash policy may later differ by `entry_source`**.

**Design architecture:** [`Architecture/15-trade-log-manual-management.md`](../Architecture/15-trade-log-manual-management.md)

### 16.1 Structure matching (shared with Reports/Journal)

| Concept | Implementation |
|---------|----------------|
| Structure key | `server/trade_log_domain/structure.py` · client mirror `web/lib/tradeLog.ts` |
| FIFO open→close | `match_open_close` · `matchOpenClose` |
| Unmatched open | Open fill with no paired close within hold window |
| Orphan close | Close fill with no paired open |

Matching is **account-scoped** (key includes `account_id`). Process metrics and open book
use this SoR — not place memory / session chrome.

### 16.2 Structure-first entry (default create)

Default for option strategies (`BUTTERFLY`, `VERTICAL`, `SINGLE`, iron/straddle family, etc.):

| Field | Role |
|-------|------|
| Strategy | Catalog |
| Underlier, expiration | Instrument |
| Center strike, width | Structure (width N/A for SINGLE/STRADDLE) |
| Put/Call, units | As applicable |
| **Order, net, debit/credit** | Primary economic controls — **above** legs |
| Exec time | Required |

**Legs built automatically** via `buildStructureLegs` (client). Preview line shows
`B1 5725P · S2 5750P · …`.  

**Legs (advanced):** collapsed by default; expand only for custom structures. Once
expanded, save uses the explicit leg list even if collapsed again.

**Stock / future / crypto:** simple symbol · qty · fill (not structure).

**Last-used defaults:** `localStorage` key `ft.tradeLog.lastUsed.v1` — account, underlier,
right, width, strategy, units (browser only; not export SoR).

### 16.3 Sheet layout (normative chrome)

```text
┌ Header: Open · STRATEGY · underlier center · exp   |  Close · #id
│         entry_source · Created … · Edited …
├ Actions (section)
│  · Close / paste ToS / duplicate / trash (opens)
│  · Match preview (closes) · trash close (reopen)
├ ══ horizontal rule ══
├ Trade details (section)
│  · Venue banner if account.broker = unset
│  · Checklist chips (account, venue, time, structure, net)
│  · Account, strategy, exec time
│  · Structure block OR asset simple
│  · Order · Net · Debit/Credit  (+ $ / unit ×100 hint for equity options)
│  · Close confirm checkboxes (orphan, account, units, drift)
│  · Legs (advanced) collapsible
│  · Process notes (optional; on close encouraged lightly)
└ Footer: Cancel · Save  (⌘/Ctrl+Enter)
```

### 16.4 Open lifecycle actions

| Action | Behavior |
|--------|----------|
| **Enter closing order** | Prefill reverse legs `TO_CLOSE`, flip debit/credit; member sets net + time |
| **Paste ToS close** | Opens Import panel (adapter parse → commit `entry_source=import`) |
| **Duplicate as new open** | session template → create with same structure, blank net, `TO_OPEN` |
| **Delete TO CLOSE** | Allowed anytime on a close fill. After delete, paired TO OPEN becomes unmatched again |
| **Delete TO OPEN** | **Only if no paired close** (unmatched open). If a TO CLOSE exists, UI blocks delete and requires deleting the close first |
| **Delete order (locked)** | **Close first, then open** — never delete a paired open while its close remains |
| **Bulk delete opens** | Blotter multi-select **unmatched** opens only → confirm → delete each |
| **Edit / backdate `exec_at`** | Manual (and general) open **or** close fills: full **date + time** editable on the sheet. Backdating allowed — no “today only” max. Save via PATCH. Paired fill’s time shown with jump link to edit the other leg of the pair |

### 16.5 Close save gates (fail loud)

Before `POST` close fill:

| Gate | Default | Override |
|------|---------|----------|
| Structure pairs intended open | Required | “Allow orphan / unexpected pair” |
| Same `account_id` as open | Required | “Allow different account” |
| Unit qty (GCD) equals open | Required | “Allow unit size ≠ open” |
| No structure drift vs open | Required | “Allow structure drift” |

UI shows **“Will pair with open #…”** from `findOpenForCloseDraft` before save.

### 16.6 Partial close

v1 default: **full structure close** (unit qty must match). Partial / scaled units only with
explicit confirm. Domain FIFO still pairs one open to one close by structure key (GCD-normalized).

### 16.7 API / schema deltas

| Item | Detail |
|------|--------|
| Migration | `081` columns · `082` `machine`→`automated` |
| Create | Accepts `entry_source` (default `manual`; allow `automated` only from trusted automation callers later) |
| Import commit | Forces `entry_source=import` |
| Strategy Lab / automation writers | **Must** set `entry_source=automated` |
| Delete | `DELETE /api/me/trade-log/trades/{id}` — identity-scoped; legs CASCADE |

### 16.8 Client modules (as-built)

| Path | Role |
|------|------|
| `web/lib/tradeLog.ts` | Types, structure builders, match, issues, badges, dollar hint |
| `web/lib/tradeLogPrefs.ts` | Last-used entry defaults |
| `web/components/trade-log/TradeSheet.tsx` | Sheet layout + gates |
| `web/components/trade-log/TradeLogTable.tsx` | Blotter filter, actions, chips |
| `web/app/app/trade-log/page.tsx` | Wiring, bulk trash, duplicate template |

### 16.9 Acceptance (manual management)

1. Structure-first create saves multi-leg butterfly without editing legs.  
2. Unmatched open shows **Close** / **Trash** on row and Actions in sheet.  
3. Close without matching open fails loud unless orphan allowed.  
4. Trash close restores open unmatched state in blotter.  
5. Import trades show **Import** chip; manual create stores `manual`; automation must store `automated` (not import).  
6. Open:N filter and bulk trash only act on unmatched opens.  
7. Process notes optional; never required to save a fill.  
8. No win-rate / expectancy chrome on management surfaces.  
9. Blotter/sheet never label an import as Automated or an automation fill as Import.

---

## 17. Campaign registry & badge (passive participant)

**Authority split:** [Member Campaign Spec v1.3](./FatTail-Labs-Member-Campaign-Spec-v1_3.md) §2.1 (registry) + §9 (boundary) is product law for campaigns. **This section is the Trade Log host contract** — what the blotter and sheet must do. Campaign spine owns eligibility math, memory, panel, and lifecycle. Trade Log **never invents** campaigns, windows, or panel readings.

### 17.1 Intent

When a campaign is created (or a ledger is provisioned), it is **registered** in the campaign registry (`member_practice_campaigns`). Trade Log positions/trades use that registry to:

1. **Dispense** badges — show which campaigns a fill may join at `exec_at`.  
2. **Wear** badges — store the chosen campaign on the trade **forever**.  
3. **Display** badges — one chip per blotter row, resolved from the registry by stamp id.

Trade Log remains the system of record for **fills, accounts, times**. Campaign membership is **interpretation** layered on those facts.

### 17.2 Registry (read-only to Trade Log)

Trade Log does **not** own a parallel badge table. It **mounts** the registry via practice APIs:

| API (indicative) | Use |
|------------------|-----|
| `GET /api/me/practice/campaigns` | Library / filter options / chip title map |
| `GET /api/me/practice/campaigns/eligible?account_id=&exec_at=` | Sheet **dispense list** (L4 window + ledger) |
| Campaign create/lifecycle | Outside Trade Log UI (Practice Campaign surfaces) |

**Registry metadata the Trade Log cares about for chrome:**

| Field | Trade Log use |
|-------|----------------|
| `id` | Stamp value (`practice_campaign_id`) |
| `title` | Chip label (live lookup; rename renames chips) |
| `starts_at`, `ends_at` | Eligibility for **new** stamps only (via eligible API) |
| `status` | Terminal seasons drop out of dispense list; chips on old trades remain |
| `is_ledger` / `is_default` | Ledger always offerable; quieter chip tier when worn via memory/ledger |
| `account_id` | Ledger bound to book; charters unbound (any account’s fills may wear) |

### 17.3 Stamp on the trade (forever wear)

| Column | Law |
|--------|-----|
| `practice_campaign_id` | Required after resolve. **One campaign per trade** (L6). Legs inherit parent; no per-leg stamp. |
| `stamped_by` | `member` (explicit pick) · `memory` (L3 prefill / silent ledger fallback) · `migration` · `import` |

**Forever:** ending, archiving, or window-closing a campaign does **not** clear stamps on existing trades. History keeps its badges. Only **redirect** (explicit change of `practice_campaign_id`) moves membership — a move, never a share, never a silent peel.

**Unit of wear:** the **trade** row. Product language may say “position wears the badge”; structure-matched open/close pairs may share narrative, but each fill row carries its own stamp field (typically same campaign via memory).

### 17.4 Surfaces (Trade Log only)

| Surface | Behavior |
|---------|----------|
| **Trade sheet — Campaign select** | Prefill by memory when eligible; else ledger. Options = eligible registry rows for `account_id` + `exec_at`. Empty selection → server resolve (never unstamped). |
| **Blotter — one chip** | Title from registry; optional provenance tier in tooltip/tone (`stamped_by`). **No variance / conduct color** on the chip. |
| **Chip tap** | Sets the **one** blotter campaign filter (same system as toolbar filter). |
| **Filter** | Named campaign = exact stamp match. Ledger/default filter may mean “full book” for that account (analytics honesty — stamp filter docs in Practice Context). |
| **Direct to campaign…** | Sheet/detail redirect → eligibility picker; PATCH stamp + memory update. |
| **Fill-time edit** | Re-evaluate eligibility for *choices*; out-of-window **existing** stamp → quiet surface, **never auto-move**. |
| **Import** | Unchosen → account ledger; explicit target must pass eligibility; memory not updated by import (Campaign Spec §11). |
| **Reports** | No campaign P&L hero. Optional Practice Context stamp scope only (DL-257). |

### 17.5 Non-goals (Trade Log campaign chrome)

- Owning campaign create/edit lifecycle, panel, or radar  
- A second badge definition store  
- Denormalized campaign title on the trade (v1: live registry lookup)  
- Per-leg stamping  
- Conduct / variance styling on blotter chips  
- Auto-stripping badges when a season ends  
- Blocking fill save with 4xx for bound breach (umpire — witness lives on campaign path)

### 17.6 Acceptance (badge host)

1. Create a charter in Practice → it appears on the sheet dispense list when fill time is inside its window.  
2. Every saved trade has `practice_campaign_id` set (ledger if no deliberate pick).  
3. Blotter shows **one** campaign chip per trade; tap filters; no variance color on chip.  
4. End / complete campaign → chip **remains** on historical trades; season no longer offered for **new** fills after `ends_at` / terminal (ledger still offered).  
5. Redirect moves stamp; no dual membership.  
6. Charters with `account_id` NULL accept stamps from any of the member’s accounts.  
7. `stamped_by` distinguishes member vs memory for chip tiering.  
8. Reports do not grow campaign scoreboard chrome.

### 17.7 Client / server touchpoints (as-built indicative)

| Path | Role |
|------|------|
| `server/practice_spine_domain.py` | Registry, eligibility, resolve stamp, memory |
| `server/routes/trade_log/trades.py` | Resolve on create/patch; never leave unstamped |
| `web/components/trade-log/TradeSheet.tsx` | Eligible picker mount |
| `web/components/trade-log/TradeLogTable.tsx` | Chip + filter |
| `web/lib/practiceSpineApi.ts` | `fetchCampaigns` / `fetchEligibleCampaigns` |

---

## 18. Version history

| Version | Notes |
|---------|--------|
| **v1.1 + §17** | Campaign registry & badge passive-participant amend; forever wear; dispense list; chip host. Companion: Member Campaign Spec v1.3 §2.1 / §9 (2026-08-09) |
| **v1.1 + A-2 retire** | Account **retire = archive** permanence; soft open-campaign gate (A-2a); unstamped not a gate (A-2b); show-retired (A-7); no auto-campaign on Primary (A-3). Concept: Member Campaign Spec §4.9 (2026-08-08) |
| **v1.1 + §16.1** | `entry_source`: **manual · import · automated** (Strategy Lab ≠ import); UI chips (2026-08-05) |
| **v1.1 + §16** | Manual management: structure entry, close/trash, match gates, entry_source, blotter open strip (2026-08-05) |
| **v1.1 + §15** | Practice harden H0–H2 domain SoR / analytics honesty (2026-07-29) |
| **v1.1** | Multi-leg ToS log, accounts (broker/sim, ≤10 active), canonical + adapters, Journal/**Reports** contracts, Agent Bench `p-trade-log` |
| **v1.0 (MVP)** | Process-only `member_trade_log_entries`; form-first UI — superseded for product shape |

---

*Where this Spec conflicts with MVP code, this document wins after Coach approval for build. Until then, production may continue to run MVP behavior. Campaign badge law: Campaign Spec v1.3 wins on registry/eligibility; this Spec wins on blotter host chrome.*
