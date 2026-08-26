# Trade Log Autofilter — Book universe — Full Agent Bench Plan v1.0

**Date:** 2026-08-25  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-autofilter/`](../agents/p-autofilter/)  
**Canonical filename:** `docs/Trade-Log-Autofilter-Book-Universe-Full-Agent-Bench-Plan-v1_0.md`  
**Spec (this packet):** [`Specs/FatTail-Labs-Trade-Log-Autofilter-Book-Universe-Spec-v0_1.md`](../Specs/FatTail-Labs-Trade-Log-Autofilter-Book-Universe-Spec-v0_1.md)  
**Spec status:** **BUILD AUTHORITY** — **GO SPEC DL-591** · mechanic **B** · **O1 DL-590** · **O2/O3 DL-591** · **GO TLAB1**.  
**Do not reopen TLAF** as a silent bugfix. This is a **new slice** (universe law).  
**Parked:** Autofilter v0.2 journal/records. TLAS3 spec fold is unrelated.  
**Governance:** doctrine · spec-create-review-workflow · DL-539

TLAB0 reviews + evidence **done**. TLAB1 implements B.

---

## 0. Mission

Trade Log Autofilter filters the **account book**, including years not on the
first blotter page (Coach: e.g. 2022+). Client-only `applyAutofilter` on the
loaded 80 rows does not meet that intent.

```text
TLAF shipped: Autofilter menus + apply on loaded pages
  → universe = first 80 (newest)  → 2022 invisible
This slice: universe = account book
  O1 = B (server distincts + server filter). A and C rejected.
```

---

## 1. Isolation

| In | Out |
|----|-----|
| Trade Log list fetch + Autofilter distincts | Journal, Records |
| Existing `GET /trades` filter query params (Find and Badge already uses them) | Find and Badge rewrite |
| | Other deferred columns |
| | Unparking v0.2 |

---

## 2. Evidence (do not re-argue without new counts)

See spec §1. MiniTwo Default account **1 543** trades **2022-09-06 → 2026-08-17**.
First 80: **all 2026**, **2026-04-01 → 2026-08-17**. Page size **80** (max **200**).
`full=1` cap **10 000**.

---

## 3. Open items (Coach)

| # | Item | Blocks |
|---|------|--------|
| **O1** | A / B / C | **B (DL-590).** A rejected. C rejected. |
| **O2** | shown/total grain if B | **Closed DL-591:** this page / full-book match count. Unfiltered: page size / book count |
| **O3** | Status column full-book or page-local | **Closed DL-591:** full-book (server filter + distincts). Stop if not honest — no page-local Status |

Juliet opinion (history, discarded as a pick): match_count; Status page-local.

**GO TLAB1** = GO SPEC + O1 + O2 + O3 — **stamped DL-591**.

---

## 4. Roster

Coach · Juliet · India (one stream, reuse list filters vs new route, Alpha) · Delta  
Charlie · Echo (Filter on honesty) · Tango (empty vs missing-year) · Hotel (no hunt)  
Kilo · Lima · **Alpha** — **not idle** if B (distincts + match_count)

---

## 5. Critical path

```text
TLAB0  India/Echo-Tango/Hotel/Kilo reviews on the addendum + evidence
   ↓
GO SPEC + O1 (+ O2/O3 if B)
   ↓
TLAB1  implement chosen mechanic
   ↓
TLAB2  Help (Exec time is the book, not the page)
   ↓
TLAB3  Lima spec honesty + Delta close
```

---

## 6. Packets

### TLAB0 — Seat (no product code)

| Seed | Agent | Does |
|------|-------|------|
| `TLAB0-1-india` | India | Universe law; A vs B vs C; one stream; Status; Alpha |
| `TLAB0-2-echo-tango` | Echo + Tango | shown/total; 2022 in calendar then empty is a lie (C) |
| `TLAB0-3-hotel` | Hotel | Not a multi-year P&L hunt |
| `TLAB0-4-kilo` | Kilo | Re-quote page 80 / first-page year evidence |
| `TLAB0-G` | Delta | Reviews in-tree; no `web/` product diff |

### TLAB1 — B implement (GO TLAB1)

| Seed | Agent | Does |
|------|-------|------|
| `TLAB1-1-alpha` | Alpha | Account blotter distincts + `match_count`/`book_count` + Status filter (`blotter_status_by_id`) |
| `TLAB1-2-charlie` | Charlie | Autofilter drives fetch; menus from book distincts; shown/total O2 |
| `TLAB1-3-kilo` | Kilo | U1–U7 characterization + pytest |
| `TLAB1-G` | Delta | Evidence gate. Help **not** this packet |

### TLAB2 — Help + as-built (GO TLAB2)

| Seed | Agent | Does |
|------|-------|------|
| `TLAB2-1-lima` | Lima | Help: universe = account book; shown/total O2; Status full-book. App areas. Arch 15 §5.4. **DL-592** |
| `TLAB2-2-kilo` | Kilo | Catalog still published; search hits book/page/Status; old “loaded page” copy gone |
| `TLAB2-G` | Delta | Help + as-built. No product `web/`. TLAB3 **not** this packet |

### TLAB3 — spec close — not fired from TLAB2

---

## 7. First actions (Coach)

1. Read the addendum (§1 evidence, §2 table).  
2. **GO TLAB0** or skip to **GO SPEC** + **O1** = A / B / C.  
3. Do not fire TLAB1 from chat without O1.

---

## 8. Coach checklist

- [x] GO TLAB0 — **TLAB0-G PASS**  
- [x] GO SPEC — **DL-591**  
- [x] O1 = **B** server-side filter — **DL-590** (A and C rejected)  
- [x] O2 shown = this page; total = match count — **DL-591**  
- [x] O3 Status full-book — **DL-591**  
- [x] GO TLAB1 — **DL-591**  
- [x] GO TLAB2 — Help + as-built — **DL-592**

---

**Signed:** Juliet · Book universe addendum v0.1 · **GO SPEC DL-591** · **GO TLAB1** · **GO TLAB2 DL-592**. TLAB3 not fired.
