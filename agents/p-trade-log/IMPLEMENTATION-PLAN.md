# Implementation Plan — Trade Log v1.1

**Spec:** [`Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md`](../../Specs/FatTail-Labs-Trade-Log-Spec-v1.1.md)  
**Board:** [`ORCHESTRATOR.md`](./ORCHESTRATOR.md) · seeds TL0–TL6  
**Authority:** Coach approves this plan; bench executes; Delta gates each pass.

---

## 1. Goal

Ship a **usable first blotter**: multi-leg options trades, accounts (broker/sim), table-first UI, right slide-out — without waiting for full import adapters or Records charts.

**Out of scope until later passes:** thinkorswim parser polish, full Records app UI, Journal app UI, live broker APIs.

---

## 2. Pass map (what “done” means)

| Pass | Name | Bench seeds | Outcome | Est. |
|------|------|-------------|---------|------|
| **P1** | **Spine + blotter** | TL1 + TL2 (core) | Schema, API, table-first UI, sheet create/edit multi-leg, account switcher | **First ship cut** |
| **P2** | Portability | TL3 | Canonical export + native/csv import + Import sheet | |
| **P3** | Broker + positions | TL4 | thinkorswim import + Positions mode | |
| **P4** | Records + Journal hooks | TL5 | `records/summary` + `records/series`; `journal_entry_id` | |
| **P5** | Close | TL6 | Delta evidence + Lima docs | |

Coach “okay this plan” = authorize **P1** immediately; P2–P5 follow on separate okays or continuous after P1 PASS.

---

## 3. Pass 1 — detailed (approve & build)

### 3.1 Backend

| Item | Detail |
|------|--------|
| Migration `040_trade_log_v11.sql` | `member_trade_log_accounts`, `_trades`, `_legs`; migrate rows from `member_trade_log_entries` into default account as `NOTE`/prose trades; keep old table or drop after copy |
| Venues | Catalog constant in code (`thinkorswim`, `sim`, `paper`, …) |
| Accounts API | list/create/patch; enforce venue required; ≤10 active |
| Trades API | list (nested legs), get, create, patch, delete; `account_id` required on write |
| Auth | Existing activator+ + identity isolation |
| Tests | Isolation, account cap, butterfly create, legacy still readable/migrated |

### 3.2 Frontend

| Item | Detail |
|------|--------|
| Shell | Full-width log table first; no form above fold |
| Account switcher | Active accounts; Manage (minimal create); show `Label · venue` |
| Table | ToS-style trade blocks (exec, strategy, side, qty/effect, symbol, exp, strike, type, price, net) |
| Sheet | Right panel: strategy picker (Basic/Spreads + STOCK/FUTURE/CRYPTO), leg editor, process fields, save |
| Templates | Butterfly +1/−2/+1 seed; vertical 2-leg; single option |
| Stay-put | Save refreshes table; path stays `/app/trade-log` |

### 3.3 Explicitly **not** in P1

- Import/Export toolbar (stub disabled or hidden)  
- Positions mode  
- Records endpoints/UI  
- Journal attach UI  
- thinkorswim file parse  

### 3.4 P1 acceptance (evidence)

1. Migrate applies; pytest green.  
2. Create account with broker/sim; 11th active fails.  
3. Create butterfly (3 legs) via API + UI.  
4. `/app/trade-log` loads **table first**; sheet for new/edit.  
5. Member B cannot list Member A trades.  
6. Process fields save on trade.  

### 3.5 Files (P1 change control)

```
migrations/040_trade_log_v11.sql
server/routes/trade_log.py          # or trade_log/* split if cleaner
server/trade_log_catalog.py         # venues + strategies (optional)
server/tests/test_trade_log.py
server/tests/test_trade_log_v11.py  # new if preferred
web/app/app/trade-log/page.tsx
web/components/trade-log/*
web/lib/tradeLog.ts
```

---

## 4. Pass 2–5 (summary)

| Pass | Work |
|------|------|
| **P2** | `fattail.labs.trade_log` export; import detect/preview/commit; native + csv_generic; Import sheet |
| **P3** | thinkorswim adapter + fixture; Positions API/UI (single-account netting) |
| **P4** | `records/summary` + `records/series` (all-active default); apps slug `statistics`→`records` when hub ships; `journal_entry_id` |
| **P5** | Delta §12 checklist; decision log; Spec status flip if Coach ships |

---

## 5. Agent bench mapping

| Pass | Seeds | Agents |
|------|-------|--------|
| P1 | TL1, TL2 | Alpha, Kilo, Charlie, Echo (HIG glance) |
| P2 | TL3 | Alpha, Charlie |
| P3 | TL4 | Alpha, Charlie |
| P4 | TL5 | Alpha, Charlie |
| P5 | TL6 | Delta, Lima |

**TL0 (India):** Spec already Coach-directed; treat P1 as authorized under this plan approval. India may still file TL0 review in parallel without blocking P1 if Coach okays this document.

---

## 6. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Dual 038 migrations already | Use **039** only for trade log v11 |
| Legacy entry loss | Migrate 027 rows into NOTE trades on default account |
| Sheet a11y | Esc, focus trap, role=dialog |
| Scope creep (import) | Hard stop at P1 acceptance list |

---

## 7. Coach approval checklist

- [ ] **P1 scope** accepted (spine + blotter only)  
- [ ] **P2–P5** sequencing accepted  
- [ ] Proceed to implement P1 without separate TL0 wait  

**Approve with:** “P1 go” (or amend scope above).

---

## 8. Status

| Item | State |
|------|--------|
| Spec v1.1 | DRAFT landed |
| This plan | **P1 go** (Coach 2026-07-28) |
| P1 code | **Shipped locally** — migrate 039 + API + table UI; pytest trade_log 3 passed |
| P2 import/export | **Shipped locally** — native JSON + ToS CSV + Import sheet; pytest import 3 passed |
