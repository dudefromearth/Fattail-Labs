# FatTail Labs — Trade Log Autofilter Book Universe Spec v0.1

**New slice.** Not a silent reopen of TLAF. Does **not** replace Spec v0.1.1 except
where this file names the universe law.

**Addendum to** [`FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md`](./FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md)

| | |
|---|---|
| Status | **BUILD AUTHORITY** — Coach **GO SPEC DL-591** · mechanic **B** · **O1 DL-590** · **O2/O3 DL-591** · **GO TLAB1** |
| Date | 2026-08-25 |
| Relationship | TLAF shipped client-filter of **loaded pages**. This slice is the **account book** as Autofilter universe |

**Scope.** Trade Log Autofilter only. Touches: blotter list fetch + distinct-value
source. **Not** Journal. **Not** Records. **Not** Find and Badge rewrite (it already
filters server-side). **Not** Account / Expiry / Right / Entry source / Adherence
columns. **Not** unparking Autofilter Spec v0.2.

**Product intent (Coach).** Autofilter must filter the **full account book**,
including years not on the initial page (e.g. 2022+). Client-only on loaded rows
does **not** meet that intent.

v0.1.1 said: “Read-only. Filters what is already loaded.” That sentence described
the TLAF cut. This slice **changes the universe**, not the menus.

---

## 1. Evidence (as-built bounds)

### Fetch bounds (code)

| Bound | Value | Where |
|-------|--------|--------|
| Blotter first page | **80** | `PAGE_LIMIT` `web/app/app/trade-log/page.tsx` |
| Server page default | **80** | `_TRADE_PAGE_DEFAULT` `server/routes/trade_log/common.py` |
| Server page max | **200** | `_TRADE_PAGE_MAX` |
| `full=1` cap | **10 000** | `_TRADE_BOOK_LIMIT` — not used by Trade Log Autofilter today |
| Order | newest `exec_at` first | `_load_member_book_page` |
| Load-more | cursor + `has_more` | same |
| Autofilter apply (TLAF cut) | `applyAutofilter(trades, …)` on the loaded page | superseded by this slice |
| Autofilter apply (this slice) | `autofilterToListQuery` → `GET /trades` list params; **no** client membership apply | `trade-log/page.tsx` |
| Distinct days / strategies / symbols / Status | `GET /distincts?blotter=1&account_id=` (`blotter_distincts`) | account **trades**, not F&B positions |

Find and Badge **already** has full-book distincts (`trade_distincts`) and server
AND-filters (`years` / `months` / `days` / `strategies` / `symbols` / `campaigns`
on `GET /api/me/trade-log/trades`). Trade Log Autofilter **reuses** those list
params and adds `statuses`. Distincts are a **separate grain** (`blotter=1`).

### Book size (2026-08-25)

**MiniTwo production** `member_trade_log_trades`:

| Book | n | Span |
|------|---|------|
| All trades | 1 752 | 2022–2026 |
| Account **Default** (id 1) | **1 543** | **2022-09-06 → 2026-08-17** |

Default account by year: 2022 **204** · 2023 **578** · 2024 **144** · 2025 **526** · 2026 **91**.

**First page (80 newest) on that account:** **80 / 80 in 2026**, span
**2026-04-01 → 2026-08-17**. Distinct exec days: **35** on the page vs **442** in
the book.

So Autofilter Exec time today cannot offer 2022, 2023, 2024, or most of 2025.
Picking a 2022 day is impossible; those **204** fills are off-page, not absent.

**Local `labs` (StudioTwo)** largest 0DTE books ~**1 476** fills, same 2022–2026
shape; first 80 span late-2025 through 2026 only.

`full=1` (cap 10 000) would hold today’s Default book in one payload. The blotter
was deliberately lazy (80 + load more) to keep browser memory bounded.

---

## 2. Three mechanics (Coach picks — no default in the body)

| Option | What it does | Fits “2022+ in Autofilter”? | Cost |
|--------|----------------|-----------------------------|------|
| **A — All-time load** | `full=1` (or loop load-more until `has_more` false) then keep client `applyAutofilter` | Yes, until n exceeds `_TRADE_BOOK_LIMIT` | ~1.5k trades in RAM today; fights lazy blotter; 10k cap is a silent cliff |
| **B — Server-side filter** | Distincts from SQL on the **account book**. Autofilter picks drive `GET /trades` (`years`/`days`/`strategies`/`symbols`/`campaigns` already exist). Page is still 80 of the **filtered** set | Yes | Reuses Find and Badge list filters; Status is not in that SQL (see OPEN) |
| **C — Hybrid** | Distincts from the full book; **rows** still only the unfiltered first 80, client-apply | **No** — menus would show 2022, apply would match **zero loaded rows** (A8 lie) | Cheapest, dishonest |

**Closed — O1 (Coach DL-590).** **B** — server distincts + server filter. Blotter
shows a **page of the filtered book**, not client-only on the first 80. Reuse Find
and Badge list params where they already exist (`years` / `days` / `strategies` /
`symbols` / `campaigns`). **C is rejected. A is rejected for this GO.**

Juliet opinion (history, discarded as a pick): B.

---

## 3. One stream (B)

Autofilter `FilterMap` is the **only** standing filter of membership in the set.
The list endpoint returns pages of that set. Do **not** client-`applyAutofilter`
again on the response as a second gate.

`shown/total` (**O2**): shown = rows on **this page** of the filtered set;
total = full-book **match count** while Autofilter is on. Unfiltered: page size /
full book count.

Load more appends the next page of the **same** Autofilter query.

Playbook `<select>` and Adhere locate already query the server — they **compose**
(AND) with Autofilter. Account chrome stays load scope.

O3 select-time (campaign window vs days) can stay client-side on **distincts**,
not on the missing-page problem.

O4 clean visit stands.

---

## 4. Closed

Coach questions kept. **O1**, **O2**, and **O3** are answered.

| # | Item | Answer |
|---|---|---|
| **O1** | Mechanic A / B / C | **B.** A rejected. C rejected. **DL-590** |
| **O2** | `shown/total` grain | **Closed DL-591:** shown = this page of the filtered set; total = full-book match count. Unfiltered: page size / full book count |
| **O3** | Status | **Closed DL-591:** full-book (server filter + distincts), same as Campaign/Symbol/Strategy. If that cannot be honest, **stop** — do not silently ship page-local Status under a book UI |

Juliet opinions (history): match_count on the list payload (now O2). Status
page-local (Coach **rejected** — O3 is full-book).

---

## 5. Acceptance (after GO SPEC + O1)

| # | Case | Expect |
|---|---|---|
| U1 | Open Autofilter on a book that has 2022 fills | Exec time offers 2022 (not only the first page’s days) |
| U2 | Filter Exec time to a 2022 day that has fills | Those trades **appear** (not empty-but-valid) |
| U3 | First paint without Autofilter | Bounded blotter (**80** — A rejected) |
| U4 | Filter on + shown/total | Honest vs the **book**, per O2 |
| U5 | Journal / Records | Untouched |
| U6 | Find and Badge | Still its own server Autofilter; not rewritten |
| U7 | One stream | No client filter disagreeing with the fetch |

---

## 6. Out of scope

Journal Autofilter. Records. Other deferred columns. Schema/migration unless India
proves a distincts index is required (opinion: existing columns suffice). MiniTwo
until named. Rewriting Find and Badge.

---

**Coach Content Law:** v0.1.1 text is not deleted. The “already loaded” sentence is
**named here** as the law this slice replaces for Trade Log Autofilter’s universe.
