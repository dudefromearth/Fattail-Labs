# Trade Log — Manual management design (as-built)

**Status:** As-built (2026-08-05)  
**Product Spec:** [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md) **§16**  
**Parents:** Practice domain SoR [`11-practice-domain-single-source.md`](./11-practice-domain-single-source.md) · Trade Log Spec v1.1 §4–§6  
**Route:** `/app/trade-log`  
**Doctrine:** Process-first · fail loud · Family B · no profit theater  

---

## 1. Intent

Manual entry is a first-class path for FatTail Practice — not a thin wrapper around import.
Members need to:

1. **Open** a structure quickly (strategy · center · width · net · time).  
2. **Close** that structure with honest pairing (or fail loud).  
3. **Trash** mistakes without leaving the blotter.  
4. **See state** (open / complete / orphan) without re-deriving it mentally.

Import (ToS/CSV) and **automated** fills (Strategy Lab process runtime, future bots) share
the same trade/leg tables and structure match engine, but **must not share the same
`entry_source` value**. **`entry_source`** records provenance so trash/edit policy and
audit can treat the three channels differently without guessing.

---

## 2. Layering

```text
┌─────────────────────────────────────────────────────────────┐
│  UI  TradeLogTable · TradeSheet · ImportSheet · page.tsx   │
│      prefs: localStorage last-used (not SoR)                 │
├─────────────────────────────────────────────────────────────┤
│  Client domain helpers  web/lib/tradeLog.ts                  │
│      structure build · matchOpenClose · issues · badges      │
│      (mirrors server structure/matching — must stay aligned) │
├─────────────────────────────────────────────────────────────┤
│  API  routes/trade_log/{trades,io,accounts,analytics}.py     │
├─────────────────────────────────────────────────────────────┤
│  Server SoR  trade_log_domain/  (Reports/Journal consumers)  │
│      structure_key · match_open_close · day_book · PnL       │
├─────────────────────────────────────────────────────────────┤
│  MySQL  member_trade_log_{accounts,trades,legs} + 081       │
└─────────────────────────────────────────────────────────────┘
```

**Rule:** Server domain remains authoritative for Reports/Journal analytics. Client match
helpers exist for **interactive UX** (filter, preview, chips) and must use the same
structure-key / FIFO rules as `trade_log_domain`. Drift between them is a defect.

---

## 3. Data model additions (081)

| Column | Type | Meaning |
|--------|------|---------|
| `entry_source` | `VARCHAR(16)` NOT NULL DEFAULT `manual` | **`manual`** \| **`import`** \| **`automated`** |
| `trash_reason` | `VARCHAR(64)` NULL | Reserved for soft-trash / audit; hard-delete is current path |

| Write path | `entry_source` | Meaning |
|------------|----------------|---------|
| `POST /trades` (member sheet) | **`manual`** (default) | Typed / structure form |
| Import commit (ToS, CSV, pack, paste) | **`import`** (forced) | File or paste adapter — **not** automation |
| Strategy Lab process runtime / bots | **`automated`** (required when those writers ship) | Labs automation opened/closed the fill |
| Legacy | `machine` normalized → **`automated`** | Migration `082` |

**Invariant:** Never stamp Strategy Lab fills as `import`. Never stamp file imports as `automated`.

---

## 4. Open ↔ close semantics

### 4.1 Structure key (summary)

Same as Practice SoR: account · strategy · underlier · expiry · GCD-normalized
strike/qty/right legs. **Side and pos_effect ignored** so open and close reverse legs match.

### 4.2 Unmatched open

An open fill (majority `TO_OPEN`) with no paired close within the hold window
(`MAX_STRUCTURE_HOLD_DAYS` = 30). Drives:

- Status=Open via title-bar Autofilter (Open:N chip **removed**, TLAF2 / **DL-586**)  
- Row Close / Trash  
- Sheet Actions block  
- Bulk select (`Select opens`)  

### 4.3 Close pairing gates (UI)

| Gate | Why |
|------|-----|
| Matched open id | Prevent silent orphan or wrong pair |
| Same account | Prevent All-accounts mistakes |
| Unit qty equal | Full close default; partial only with confirm |
| No drift | Legs advanced must not silently rekey structure |

Overrides are **explicit checkboxes** — fail loud by default.

### 4.4 Delete order (locked)

| Target | Effect |
|--------|--------|
| **TO CLOSE** | May `DELETE` anytime. Paired TO OPEN becomes unmatched again |
| **TO OPEN with paired close** | **Blocked** — UI requires deleting the TO CLOSE first |
| **TO OPEN unmatched** | May `DELETE` (no close on book) |
| Bulk opens | Only **unmatched** opens (never paired opens) |

**Order rule:** always **delete close before open** when both exist.  
**Policy MM-1:** delete available on the blotter/sheet for book cleanup; future may further limit by `entry_source` (e.g. caution on `automated`).

### 4.5 Correcting times (errata)

Manual books often log late. Each fill has its own `exec_at`:

| Fill | Sheet label | Edit |
|------|-------------|------|
| TO OPEN | “TO OPEN — filled at” | `datetime-local`, **no max** (backdate OK) |
| TO CLOSE | “TO CLOSE — filled at” | same |
| Paired other | Read-only display + “Edit open/close date/time” | Opens the other trade sheet |

API: `POST`/`PATCH` with `exec_at` (`YYYY-MM-DDTHH:mm` or with seconds). Server `_parse_exec_at` accepts date-only (noon) and full datetime. Matching uses chronological order — wrong open/close times can break pairing; copy should prefer **real fill times**.

---

## 5. UI architecture

### 5.1 Blotter (`TradeLogTable`)

- ToS-style open/close block colors retained.  
- **Status** column: Open / Complete / Orphan close.  
- **Actions** column: Close · Trash on unmatched opens only.  
- **Autofilter** on the Trade history row (Exec time, Campaign, Strategy, Symbol, Status).  
  Blotter campaign `<select>` and **Open:N** chip **removed** (TLAF2). **Select opens**
  remains selection for bulk trash, not a filter. Practice date/campaign chrome is
  omitted on this page only. See §5.4.  
- Issue chips: missing net/legs/time, orphan close.  

### 5.2 Sheet (`TradeSheet`)

Two vertical zones with section headers and a **horizontal rule**:

1. **Actions** — lifecycle choices (close, paste, duplicate, trash, match preview).  
2. **Trade details** — account, structure or legs, order/net, process.  

**Structure-first create** is default for option spreads; **legs advanced** is secondary
and collapsed. **Order / Net / Debit-Credit** sit with details but **above** the legs
disclosure so members never hunt economic fields inside advanced chrome.

### 5.3 Defaults & chrome (not SoR)

| Store | Key | Data |
|-------|-----|------|
| localStorage | `ft.tradeLog.lastUsed.v1` | last account, underlier, width, right, strategy, units |
| sessionStorage | `ft.tradeLog.duplicateTemplate` | one-shot duplicate open legs |

Logout does **not** clear last-used (browser preference). Family B product data remains
server-side only.

### 5.4 Autofilter (TLAF2 as-built · Spec v0.1.1 · Strategy TLAS1 · Book TLAB1 · Help TLAB2)

Standing blotter filter is **one title-bar Autofilter** (`data-testid="trade-log-autofilter"`).
Shared engine `web/lib/autofilter`; host columns `web/lib/tradeLogAutofilter.ts`.
Find and Badge uses the same menus; it is not the blotter filter.

| Law | As-built |
|-----|----------|
| One stream | Autofilter `FilterMap` drives `GET /api/me/trade-log/trades` (`autofilterToListQuery`). **No** client `applyAutofilter` membership on the page. Practice `campaignId` / date range do **not** fetch-filter the blotter. Account chrome remains load scope. Playbook `<select>` stays (server list param). |
| Universe | **Account book** (mechanic **B** · **DL-590/591**). Distincts: `GET /distincts?blotter=1` (account **trades** + Status). Not Find and Badge identity/positions. |
| shown/total | This page of the filtered set / full-book **match_count**. Unfiltered: page size / **book_count**. |
| Status | Full-book (`blotter_status_by_id` + list `statuses=`). Over `_BLOTTER_STATUS_BUDGET` (10 000) → 422, not page-local. |
| Columns | Exec time · Campaign · **Strategy** · Symbol · Status (**O1** after Campaign · **DL-588**) |
| Strategy tokens | stored `trade.strategy` codes; catalog **label** when present; never invent a label (**O2**) |
| TLAF O1 | `omitDateCampaignFilters` on Trade Log `PracticeSuiteChrome` only |
| TLAF O2 | Open:N / `filterOpenOnly` gone. Status=Open is the column |
| TLAF O3 | Select-time grey-out (`selectionGate`) |
| TLAF O4 | Clean visit — not `ft.tradeLog.lastUsed.v1` |
| Badge / `?campaign=` | `campaignColumnFilter` — campaign column, not a private filter |
| Adhere | Locate fetch + banner; composes with Autofilter |

Help: `server/help_reference/trade-log-autofilter.md` + App areas **Trade Log** /
**Find and Badge** (**TLAB2** · **DL-592**). Universe copy is the **account book**,
not the loaded page. Spec: `Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md`.
Book universe: `Specs/FatTail-Labs-Trade-Log-Autofilter-Book-Universe-Spec-v0_1.md`.
Parent Autofilter v0.2 **parked**.

**Flag:** Trade Log Spec v1.1 still names Open:N and a blotter campaign toolbar
filter. That product copy is superseded here for the shipped blotter. Do not
execute those sentences as current UI.

---

## 6. Structure builders (client)

`buildStructureLegs` implements FatTail teaching defaults:

| Strategy | Construction (open) |
|----------|---------------------|
| BUTTERFLY | Buy wing −W · sell 2× body · buy wing +W |
| VERTICAL | Long center · short wing (put: center−W) |
| SINGLE | Long center |
| CONDOR / IRON_* / STRADDLE / STRANGLE | Spec §4.3 family — see `tradeLog.ts` |

Close drafts reverse BUY/SELL and set `TO_CLOSE`.

---

## 7. API surface (relevant)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/me/trade-log/trades` | **Paginated** by default (`limit`/`cursor`); `full=1` legacy full page; `entry_source` |
| GET | `/api/me/trade-log/opens` | Unmatched opens only (server match; small payload) |
| POST | `/api/me/trade-log/trades` | Manual create; `entry_source` default **manual** |
| PATCH | `/api/me/trade-log/trades/{id}` | Edit |
| DELETE | `/api/me/trade-log/trades/{id}` | Trash open or close |
| POST | import commit | Forces **`import`** |
| (future) Strategy Lab runtime writers | Must set **`automated`** | Not import path |
| GET | analytics/* | Unchanged; uses domain match |

---

## 8. Non-goals (this design)

- Soft-delete / recycle bin (hard DELETE only).  
- Machine runtime writing fills (Strategy Lab process runtime — separate Spec).  
- Cross-account netting.  
- Live broker sync.  
- Profit-ranked open queue.  

---

## 9. Evolution

| Later | Depends on |
|-------|------------|
| Trash only if `entry_source=manual` (or allow import) | Product + MM policy; **automated** restricted first |
| Soft-delete with `trash_reason` retained | Migration + list filters |
| Partial close residual units in domain | match engine multi-lot |
| Server-side match preview endpoint | Optional; client mirror OK for v1 |
| Strategy Lab stamps `automated` on paper/live fills | Process Runtime PR4+ |

---

## 10. Document history

| Date | Note |
|------|------|
| 2026-08-05 | v1.0 as-built — manual management design; pairs Spec §16 |
| 2026-08-05 | v1.1 — `entry_source`: **manual · import · automated** (not machine); import ≠ automation |
