# Trade Log Autofilter — Strategy column — Full Agent Bench Plan v1.0

**Date:** 2026-08-25  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-autofilter/`](../agents/p-autofilter/) — same board as TLAF; TLAF4 is **closed**  
**Canonical filename:** `docs/Trade-Log-Autofilter-Strategy-Column-Full-Agent-Bench-Plan-v1_0.md`  
**Spec (this packet):** [`Specs/FatTail-Labs-Trade-Log-Autofilter-Strategy-Column-Spec-v0_1.md`](../Specs/FatTail-Labs-Trade-Log-Autofilter-Strategy-Column-Spec-v0_1.md)  
**Spec status:** **BUILD AUTHORITY** — Coach **GO SPEC DL-587**. **O1** (order) and **O2** (codes vs labels) still OPEN. TLAS1 not fired.  
**Shipped law (do not reopen):** Trade Log Autofilter Spec **v0.1.1** · **DL-584** · **DL-586**  
**Parked:** Autofilter Spec v0.2 + [`docs/Autofilter-Full-Agent-Bench-Plan-v1.1.md`](./Autofilter-Full-Agent-Bench-Plan-v1.1.md) — journal, records, **the other five** deferred columns. **Not this GO.**  
**Governance:** `agents/bench/doctrine.md` · spec-create-review-workflow · DL-539

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta: **PASS / FAIL / BLOCKED** — never waived.  
**No product code until GO SPEC + O1 + O2 + GO TLAS1.** TLAS0 is reviews + inventory.

---

## 0. Mission

Add **Strategy** to the Trade Log title-bar Autofilter. One column. Same control.
Same stream.

```text
Shipped Autofilter (TLAF2)
  Exec time · Campaign · Symbol · Status
       + Strategy  (this packet)
  host ColumnDef only — shared engine untouched
  Find and Badge unchanged
  Help: four columns → includes Strategy
```

**Read-only.** No schema, no migration, nothing to the server. Still filters **loaded**
trades.

**Can it be done?** **Yes.** v0.1.1 §3 deferred Strategy with **no redesign**. The bar
already renders `tradeLogColumns()`. This packet is a fifth `ColumnDef`, tests, help,
spec honesty.

---

## 1. Isolation (DL-539)

Coach named **Strategy** on Trade Log Autofilter; that **is** authorization inside it.

| In | Out |
|----|-----|
| Trade Log Autofilter host columns (`tradeLogAutofilter.ts`) + panel that already maps them | Account, Expiry, Right, Entry source, Adherence |
| Help Trade Log Autofilter + App areas Trade Log | Journal, Records, Reports, Playbook page, Retro, Options Lab, Wiki, AppChrome |
| Tests for Strategy on the blotter | Find and Badge **rewrite** (regression only) |
| | Playbook blotter `<select>` |
| | Server `strategies=` query on Trade Log list |

Three OKs apply only if an agent reaches a surface **not** in the left column.

**Do not unpark v0.2.** Strategy on Trade Log ≠ journal Autofilter.

---

## 2. Spec lock (execution law)

v0.1.1 laws **stand**. This packet adds:

| ID | Law | Spec |
|----|-----|------|
| **S-L1** | Strategy is a value-list column on the **existing** title-bar Autofilter | addendum §2 |
| **S-L2** | Host `ColumnDef` only. Nothing Trade-Log-specific inside `web/lib/autofilter` | §1 · S4 |
| **S-L3** | Values from the loaded book (`trade.strategy`). `(none)` if empty | §2 |
| **S-L4** | Whole trade blocks (trade-level field) | §2 · S2 |
| **S-L5** | AND across / OR within with the four shipped columns | S3 |
| **S-L6** | Find and Badge not rewritten | S5 |
| **S-L7** | Help no longer says the panel has only four columns | S6 |
| **S-L8** | Other five deferred columns stay absent | S7 |
| **S-L9** | O3 select-time · O4 clean visit · never `lastUsed` | v0.1.1 |

---

## 3. As-built (keep)

| Piece | Path |
|-------|------|
| Engine | `web/lib/autofilter/apply.ts` — AND/OR, `(none)`, `selectionGate` |
| Menus | `web/components/autofilter/{ValueFilter,DateWhenFilter,FilterOnMark}` |
| Host columns | `web/lib/tradeLogAutofilter.ts` `tradeLogColumns()` — four today |
| Title bar | `TradeLogAutofilterBar.tsx` `cols.map` — **already generic** |
| Page stream | `trade-log/page.tsx` `applyAutofilter(trades, autofilterCols, autofilter)` |
| Campaign labels | `Map` id → title (pattern for strategy code → catalog label if O2=labels) |
| Catalog | `Catalog.strategies: StrategyMeta[]` (`code`, `label`, `group`) already on the Trade Log page |
| Find and Badge | `TradeFindTag.tsx` COLS includes `strategy`; server `strategies=` — **out** |
| Help | `server/help_reference/trade-log-autofilter.md` heading **The four columns** |
| Blotter display | `TradeLogTable` Strategy column shows `trade.strategy` (code) |

---

## 4. Open items (Coach — addendum §4)

No defaults in the spec. This plan does not invent them.

| # | Item | Blocks | Juliet opinion (discard) |
|---|------|--------|--------------------------|
| **O1** | Order of the five columns | TLAS1 panel | Insert after Campaign: Exec time · Campaign · **Strategy** · Symbol · Status (parked v0.2 table). Append-as-fifth is lawful if Coach prefers zero reorder of the four. |
| **O2** | Codes vs catalog labels | TLAS1 reader + labels map | Tokens = stored code. Display catalog `label` when known (campaign-label pattern). |

**GO TLAS1** = GO SPEC + O1 + O2.

---

## 5. Juliet findings (labeled)

### Blocking for sequencing (not spec deletion)

| # | Item |
|---|------|
| **B1** | DRAFT addendum. Reviews → GO SPEC → then TLAS1. This plan is not a spec stamp. |
| **B2** | Do not reopen TLAF O1–O4 or remount a second Autofilter. |
| **B3** | Do not add Strategy as a blotter `<select>` or a chip. Title-bar panel only. |
| **B4** | Alpha idle unless India finds a server seam (none expected: loaded rows). |
| **B5** | Find and Badge e2e stays green. |

### Opinion (Coach may discard)

| # | Item |
|---|------|
| **O-J1** | `NOTE` rows (no legs) still have `strategy`; they belong in the list if loaded. |
| **O-J2** | No select-time incompatibility for Strategy vs campaign window. Date vs campaign stays the only structural gate. |
| **O-J3** | Help heading can become **The columns** (not “five columns” as a new magic number). |

---

## 6. Full bench roster

### Authority

| Callsign | Role |
|----------|------|
| **Coach** | GO SPEC, O1–O2, ship/no-ship |
| **Juliet** | Board, seeds, order — **never executes packets** |
| **India** | Host-only column; one stream; Alpha idle; v0.2 stays parked |
| **Delta** | Phase gates, evidence only |

### Execution

| Callsign | Role |
|----------|------|
| **Charlie** | Fifth `ColumnDef` + optional catalog labels; no engine fork |
| **Echo** | Fifth column in the **same** panel; not a chip row; ≥44 pt launcher unchanged |
| **Tango** | No “best strategy”; Filter on still the honesty mark |
| **Hotel** | Strategy is catalog/bookkeeping, not a hunt for winning butterflies |
| **Kilo** | S1–S7; Find and Badge regression; other deferred columns still absent |
| **Lima** | Help + spec v0.1.2 (or fold addendum) + DL + Arch 15 §5.4 one line |
| **Alpha** | Idle unless India un-idles |

---

## 7. Critical path

```text
TLAS0  reviews + inventory + GO SPEC
   ↓
TLAS1  host column + tests          FIRST (and only) product commit
   ↓
TLAS2  Help
   ↓
TLAS3  Lima close (spec honesty) + Delta
```

**Never:** journal/records · other five columns · Find and Badge rewrite · second Autofilter control · server Strategy filter on Trade Log load.

---

## 8. Packets and seeds

Seeds live in `agents/p-autofilter/seeds/`. TLAS1+ files are written **in the same body of work as that GO**, not before.

### TLAS0 — Seat (no product code)

| Seed | Agent | Does | Gate |
|------|-------|------|------|
| `TLAS0-1-india` | India | Addendum build-readiness; host-only; Alpha idle; v0.2 parked; one stream | TLAS0-G |
| `TLAS0-2-echo-tango` | Echo + Tango | Same panel, not a chip; no “best strategy” | TLAS0-G |
| `TLAS0-3-hotel` | Hotel | Strategy ≠ performance screen | TLAS0-G |
| `TLAS0-4-kilo` | Kilo | Inventory: `tradeLogColumns` keys; bar `cols.map`; help “four columns”; Find and Badge already has strategy | TLAS0-G |
| `TLAS0-G` | Delta | Four reviews; no `web/` product diff from this packet | — |
| Coach | **GO SPEC** · O1 · O2 | DL | |
| `TLAS0-5-lima` | Lima | DL after GO SPEC | after GO SPEC |

**TLAS0-G PASS when:** four reviews filed · O1/O2 quoted as Coach’s to stamp · no product code.

### TLAS1 — Column (first product commit)

**In:** `web/lib/tradeLogAutofilter.ts` (+ tests) · optional labels map on the bar from `catalog.strategies`.  
**Out:** shared `apply.ts` behavior change · Find and Badge · help (TLAS2) · other columns.

| Seed | Agent | Does |
|------|-------|------|
| `TLAS1-1-charlie` | Charlie | `ColumnDef` key `strategy`; order per O1; labels per O2 |
| `TLAS1-2-kilo` | Kilo | S1–S5, S7 unit/e2e; Find and Badge PASS |
| `TLAS1-G` | Delta | Strategy in panel; still one Autofilter; engine grep clean |

### TLAS2 — Help

| Seed | Agent | Does |
|------|-------|------|
| `TLAS2-1-lima` | Lima | `trade-log-autofilter.md` + App areas Trade Log. No journal. No profit claims. |
| `TLAS2-2-kilo` | Kilo | Concierge heading + search “strategy autofilter trade log” |
| `TLAS2-G` | Delta | File still published; search hits Strategy |

### TLAS3 — Close

| Seed | Agent | Does |
|------|-------|------|
| `TLAS3-1-lima` | Lima | Fold addendum into Spec **v0.1.2** so §3 lists Strategy as shipped and the other five remain deferred. Arch 15 §5.4 one line. DL. |
| `TLAS3-G` | Delta | S1–S7; named-surface grep still clean |

---

## 9. Acceptance → packet

| # | Packet |
|---|--------|
| S1 panel lists Strategy | TLAS1 |
| S2 whole-block filter | TLAS1 |
| S3 AND/OR with shipped columns | TLAS1 |
| S4 engine clean | TLAS1-G |
| S5 Find and Badge | TLAS1 |
| S6 Help | TLAS2 |
| S7 no extra deferred columns | TLAS1 + TLAS3-G |

---

## 10. Files (India TLAS0 may trim)

| Area | Paths |
|------|--------|
| Host | `web/lib/tradeLogAutofilter.ts` · tests |
| Bar / page | only if O2 needs a labels `Map` (`TradeLogAutofilterBar.tsx` · `trade-log/page.tsx` catalog) |
| Tests | `web/lib/tradeLogAutofilter.test.ts` · `web/e2e/trade-log-autofilter.spec.ts` |
| Help | `server/help_reference/trade-log-autofilter.md` · `app-areas.md` Trade Log |
| Spec | addendum now; v0.1.2 at TLAS3 |

**Do not open:** `apply.ts` unless a bug · journal · Find and Badge implementation · Practice chrome.

---

## 11. Gate protocol

1. Seed done → evidence (commands, greps, test output).  
2. Delta files `agents/p-autofilter/gate-reports/TLASn-G.md`.  
3. A second Autofilter control or a Strategy blotter `<select>` = **FAIL**.  
4. Unparking v0.2 journal/records from this packet = **FAIL**.

---

## 12. Invocation

```
Activate <Agent>. Project p-autofilter, seed <TLASn-…>.
Read agents/p-autofilter/seeds/<file>,
Specs/FatTail-Labs-Trade-Log-Autofilter-Strategy-Column-Spec-v0_1.md,
Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md,
docs/Trade-Log-Autofilter-Strategy-Column-Full-Agent-Bench-Plan-v1_0.md,
agents/bench/doctrine.md.
Touch only files the seed lists. End with the completion checklist
and evidence (commands + outputs).
```

---

## 13. First actions (Coach)

1. Read the addendum and this plan.  
2. **GO TLAS0** — fire `TLAS0-1-india` first.  
3. After TLAS0-G: **GO SPEC** + **O1** (order) + **O2** (code vs label).  
4. **GO TLAS1**. Do not fire from chat.

---

## 14. Coach checklist

- [ ] GO TLAS0  
- [x] GO SPEC (addendum header flips from DRAFT) — **DL-587**  
- [x] O1 order = after Campaign — **DL-588**  
- [x] O2 display = codes; catalog labels when available — **DL-588**  
- [x] GO TLAS1 — **TLAS1-G PASS**  
- [x] GO TLAS2 — **TLAS2-G PASS**  
- [ ] GO TLAS3  

---

**Signed:** Juliet · Strategy-column addendum v0.1 · **GO SPEC DL-587** · O1/O2 OPEN · awaiting those stamps then **GO TLAS1**.
