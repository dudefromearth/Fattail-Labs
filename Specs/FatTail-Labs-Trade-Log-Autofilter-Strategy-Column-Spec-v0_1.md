# FatTail Labs — Trade Log Autofilter Strategy Column Spec v0.1

**Addendum to** [`FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md`](./FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md) (BUILD AUTHORITY · four columns shipped).  
**This file does not replace v0.1.1.** It names **one deferred column**.

| | |
|---|---|
| Status | **BUILD AUTHORITY** — Coach **GO SPEC DL-587** · **O1/O2 DL-588** · **GO TLAS1** |
| Date | 2026-08-25 |
| Parent (parked) | Autofilter Spec v0.2 names Strategy among many columns. That document stays **parked**. This addendum is Trade Log only |

**Scope.** Add **Strategy** to the Trade Log title-bar Autofilter. Surfaces: Trade Log
blotter Autofilter only. Touches outside program: **NONE**.

**Not this packet:** Account, Expiry, Right, Entry source, Adherence. Journal. Records.
Find and Badge rewrite. Playbook `<select>`. Server-side filter. Schema.

**Nature of the change.** Read-only. Same loaded stream. One more `ColumnDef` on the
host. Shared `web/lib/autofilter` does not grow Trade-Log-specific code.

---

## 1. Why this is legal without a redesign

Spec v0.1.1 §3:

> **Deferred to a later slice**, no redesign required to add them: Strategy, Account,
> Expiry, Right, Entry source, Adherence.

Coach naming Strategy **is** authorization for this column on Trade Log Autofilter
(DL-539). It does **not** unpark journal, records, or the other five columns.

As-built: `tradeLogColumns()` returns the four shipped columns; `TradeLogAutofilterBar`
already maps whatever that function returns. The panel does not hard-code four keys.

---

## 2. What ships

The Autofilter panel on the Trade history row lists **Strategy** as a value-list
column, same menus as Campaign / Symbol / Status.

- Distinct values = `trade.strategy` present on the **loaded** blotter (AND across
  columns, OR within). Empty / missing → `(none)`.
- A strategy match returns the **whole trade block** (strategy is trade-level meta,
  not a leg field).
- Filter on / `shown/total` / Clear / select-time conflicts / clean visit **unchanged**
  (O3 / O4 already closed on v0.1.1).
- Find and Badge already filters Strategy on the found set. Do **not** rewrite it.
  Do **not** make Trade Log Autofilter call Find and Badge APIs.

---

## 3. What does not change

| Stay | Why |
|------|-----|
| Exec time · Campaign · Symbol · Status | Shipped law |
| Badge / `?campaign=` → campaign column | A5 |
| Adhere locate | A6 |
| Select opens | not a filter |
| Playbook blotter `<select>` | still not named |
| Account chrome | load scope |
| Practice date/campaign omitted on Trade Log only | O1 |
| Open:N stays gone | O2 |
| `ft.tradeLog.lastUsed.v1` | never merge Autofilter |

---

## 4. Closed items (were OPEN)

Coach questions kept. Answers **DL-588**:

| # | Item | Answer |
|---|---|---|
| **O1** | Column **order** among the five | After Campaign: Exec time · Campaign · **Strategy** · Symbol · Status |
| **O2** | Codes vs catalog labels | Filter tokens = stored `trade.strategy`. Display catalog **label** when available; code alone if no label |

Juliet opinions (history): **O1** insert after Campaign. **O2** values = stored code;
show catalog label when known. Coach stamped both.

---

## 5. Acceptance

| # | Case | Expect |
|---|---|---|
| S1 | Open Autofilter on Trade Log | Strategy is a column in the panel |
| S2 | Filter Strategy = one code present in the loaded book | Only those trades; whole blocks |
| S3 | Strategy + Symbol (or Campaign, Status, Exec time) | AND across; OR within Strategy |
| S4 | Inspect `web/lib/autofilter` | Still no Trade-Log-specific readers |
| S5 | Find and Badge | Unchanged e2e |
| S6 | Help | Names Strategy; does not still say the panel has only four columns |
| S7 | Other deferred columns | Still absent |

---

## 6. Out of scope

Journal Autofilter. Records. The other five deferred columns. Sorting. Saved sets.
Server filter. Profit / “best strategy” chrome. MiniTwo unless named.

---

**Coach Content Law:** v0.1.1 text is not deleted by this addendum.
