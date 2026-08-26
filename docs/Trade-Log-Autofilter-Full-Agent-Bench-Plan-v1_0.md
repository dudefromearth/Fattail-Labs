# Trade Log Autofilter — Full Agent Bench Plan v1.0

**Date:** 2026-08-25  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-autofilter/`](../agents/p-autofilter/)  
**Canonical filename:** `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`  
**Spec (this packet):** [`Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md`](../Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1_1.md) (v0.1 SUPERSEDED)  
**Spec status:** **BUILD AUTHORITY** — Spec **v0.1.1** · **DL-584** · **DL-586**. TLAF0–TLAF4 closed. Parent Autofilter v0.2 **parked**.  
**Parent (parked):** Autofilter Spec v0.2 + [`docs/Autofilter-Full-Agent-Bench-Plan-v1.1.md`](./Autofilter-Full-Agent-Bench-Plan-v1.1.md) — journal, records, six extra columns. **Not this GO.** This slice is the **active** Autofilter program.  
**Governance:** `agents/bench/doctrine.md` · spec-create-review-workflow · DL-539

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta: **PASS / FAIL / BLOCKED** — never waived.  
**No product code until GO SPEC + packet OPENs + GO TLAF1.** TLAF0 is reviews + inventory.

---

## 0. Mission

Ship **one Autofilter control on the Trade Log title bar** that filters the blotter in place, and **in the same change** remove the two controls it replaces.

```text
Campaign Find and Badge Autofilter (as-built)
  → extract SHARED component (column defs in, one filtered stream out)
  → Trade Log title bar: one control → filter surface
       Exec time (date) · Campaign · Symbol · Status
  → SAME COMMIT: blotter campaign <select> gone
       Practice nav date omitted on Trade Log only (after O1 report)
  → badge tap / ?campaign= → campaign COLUMN (not a private filter)
  → Open:N per Coach (identical to Status=Open, or gone)
  → shown/total + “Filter on”
```

**Read-only.** No schema, no migration, nothing to the server.

**Prove the pattern** with four columns. Strategy, Account, Expiry, Right, Entry source, Adherence wait for a later slice — **no redesign** to add them.

---

## 1. Isolation (DL-539)

Coach named this slice; that **is** authorization inside it.

| In | Out |
|----|-----|
| Trade Log blotter | Records, Journal, list↔boxes |
| Practice nav **date** control — **report before removing** (may be shared) | Six deferred columns |
| Campaign **Find and Badge** as **extract source** only | Sorting, saved sets, server-side filter |
| | Reports, Capital, Positions, Playbook, Retro, Options Lab, Wiki, AppChrome |

Three OKs apply only if an agent reaches a surface **not** in the left column.

---

## 2. Spec lock (execution law)

| ID | Law | Spec |
|----|-----|------|
| **L1** | One title-bar Autofilter; not a chip row, not a sidebar | §1 |
| **L2** | One cut: mount + removal in the same change. Both mechanisms = defect, including “temporary” | §2 |
| **L3** | Shared component now, even for one surface. Nothing Trade-Log-specific inside | §4 · A12 |
| **L4** | Filter **trades not rows**. Leg match → whole block | §5 · A4 |
| **L5** | Badge tap sets **campaign column**. Not a second mechanism | §6 · A5 |
| **L6** | Adhere locate composition survives | §6 · A6 |
| **L7** | AND across columns, OR within. Excel | §7 |
| **L8** | `shown/total` + Filter on | §7 · A9 |
| **L9** | Conflicts fail loud and **name** the conflict. Empty-but-valid ≠ error | §7 · A7 · A8 |
| **L10** | If persist: own key + visible control. Never `ft.tradeLog.lastUsed.v1` | §7 |
| **L11** | If Open:N stays: **same state object** as Status=Open | §5 · A10 |
| **L12** | Select opens = selection tool, not a filter. Untouched | §5 |
| **L13** | Match Campaign Autofilter look/behaviour (HIG) | §8 |
| **L14** | **Ruling (Coach — stamp at O1).** After cutover, Trade Log has **one filtered stream**. Practice-context date/campaign must not keep filtering the blotter. Mechanic: ________ (omit nav date+campaign on Trade Log only / leave shared chrome and stop applying it / other). | A12 · A3 · O1 |

---

## 3. As-built (keep)

| Piece | Path |
|-------|------|
| Campaign Autofilter | `web/components/trade-log/TradeFindTag.tsx` |
| When calendar | `DateWhenFilter.tsx` · `web/lib/tradeLogWhenTree.ts` |
| Menu portal | `FilterMenuPortal.tsx` |
| Find and Badge e2e | `web/e2e/trade-log-find.spec.ts` |
| Practice date + campaign chrome | `PracticeContextBar` — **every** suite page (`practice-granularity`, `practice-campaign-select`) |
| Trade Log title | `TradeLogTable.tsx` “Trade history” row (suite `hideTitle`) |
| Campaign toolbar | `data-testid="blotter-campaign-filter"` |
| Open:N | same row; private `filterOpenOnly` today |
| Badge → campaign | `onCampaignFilter` |
| List also scoped by | `practiceContext.campaignId` / date in `trade-log/page.tsx` |
| Adhere locate | `journey-adhere-locate-banner` |
| Deep link | `?campaign=N` |
| Blotter prefs (non-filter) | `ft.tradeLog.lastUsed.v1` |

**Extract. Do not rewrite** Find and Badge.

**As-built dual mechanism on Trade Log today:** Practice chrome date/campaign **and** blotter campaign select **and** (optionally) Open:N. TLAF2 kills the replaced pair in one commit.

---

## 4. Open items (Coach — spec §11)

No defaults in the spec. This plan does not invent them. Answers land in spec **v0.1.1** at TLAF4 (see TLAF4-1-lima) so §11 does not stay permanently open.

| # | Item | Blocks | Juliet opinion (discard) |
|---|------|--------|--------------------------|
| **O1** | Is nav date chrome **shared**? Report before removing | A3 in TLAF2 | **Yes, shared.** Omit date (and campaign) **on Trade Log only**. Do not delete `practice-granularity` from Journal/Reports/Retro/Playbook. |
| **O2** | Open:N — remove, or keep as identity (A10)? | Chip in TLAF2 | Identity-keep is lawful; private chip is not. Remove is simpler. |
| **O3** | Conflicts — select-time or apply-time? | TLAF1 engine | Select-time prevents the blank table. Apply-time catches composition. Pick one. |
| **O4** | Persist across reload? | TLAF1 persist | Clean visit **or** own key + visible control. Never merge into `lastUsed`. |

**GO TLAF1** = GO SPEC + O3 + O4.  
**GO TLAF2** = TLAF1-G + O1 + O2.

---

## 5. Juliet findings (labeled)

### Blocking for sequencing (not spec deletion)

| # | Item |
|---|------|
| **B1** | DRAFT spec. Reviews → GO SPEC → then TLAF1. This plan is not a spec stamp. |
| **B2** | A11 / L2: title-bar Autofilter and button removal are **one Trade Log commit**. |
| **B3** | O1 report is **mandatory** before anyone removes nav date chrome. |
| **B4** | After TLAF2, `practiceContext` date/campaign must not still filter Trade Log rows. |
| **B5** | `?campaign=` and badge tap share the Autofilter campaign column. |
| **B6** | Alpha idle unless India finds a server seam. |
| **B7** | Find and Badge e2e stays green after extract. |

### Opinion (Coach may discard)

| # | Item |
|---|------|
| **O-J1** | Title bar = “Trade history” row (suite title is hidden). |
| **O-J2** | Account picker in Practice chrome **stays**. |
| **O-J3** | Blotter **playbook** `<select>` is a third filter **not named**. Do not remove in this slice. Flag for parent v0.2. |
| **O-J4** | On Trade Log, `practice-campaign-select` goes with the toolbar campaign select. Other suite pages keep it. |

---

## 6. Full bench roster

### Authority

| Callsign | Role |
|----------|------|
| **Coach** | GO SPEC, O1–O4, ship/no-ship |
| **Juliet** | Board, seeds, order — **never executes packets** |
| **India** | Component boundary, O1 seam, one stream, §9.2, no schema |
| **Delta** | Phase gates, evidence only |

### Execution

| Callsign | Role |
|----------|------|
| **Charlie** | Extract + Trade Log cut + title-bar control |
| **Echo** | HIG; one title-bar control; match Campaign menus; ≥44 pt |
| **Tango** | Filter-on copy; conflict vs empty; sticky-filter psychology |
| **Hotel** | No profit chrome; Adhere is locate, not a standing filter |
| **Kilo** | A1–A12 characterization; Find and Badge regression |
| **Lima** | DL, help, as-built |
| **Alpha** | Idle unless India un-idles |

---

## 7. Critical path

```text
TLAF0  reviews + O1 report + GO SPEC
   ↓
TLAF1  extract shared component (Find and Badge still the only consumer)
       INTERNAL — not a deploy
   ↓
TLAF2  Trade Log cut — Autofilter on title bar + removals in ONE commit
       FIRST DEPLOY
   ↓
TLAF3  Help
   ↓
TLAF4  Lima + Delta close
```

**TLAF1 is internal** (extract; Find and Badge consumer only). **TLAF2 is the first deploy.**

**Never:** journal/records work · global delete of Practice date pills · four Autofilter copies · rewrite Find and Badge · server filter.

---

## 8. Packets and seeds

Seeds live in `agents/p-autofilter/seeds/`. TLAF1+ files are written **in the same body of work as that GO**, not before.

**TLAF1 is internal. TLAF2 is the first deploy.**

### TLAF0 — Seat (no product code)

| Seed | Agent | Does | Gate |
|------|-------|------|------|
| `TLAF0-1-india` | India | Spec build-readiness; **O1 report** (shared date chrome); omit-on-Trade-Log seam; one stream after cut; badge + `?campaign=`; playbook select out; Alpha idle | TLAF0-G |
| `TLAF0-2-echo-tango` | Echo + Tango | Title-bar control (not chip row); match Campaign menus; O3 copy; Filter on | TLAF0-G |
| `TLAF0-3-hotel` | Hotel | No “find winning trades”; Adhere honesty | TLAF0-G |
| `TLAF0-4-kilo` | Kilo | Inventory grep: nav date, both campaign selects, Open:N, badge, playbook, Autofilter files | TLAF0-G |
| `TLAF0-G` | Delta | Reviews in-tree; O1 quoted; no `web/` diff | — |
| Coach | **GO SPEC** · O1–O4 | DL | |
| `TLAF0-5-lima` | Lima | Decision log | after GO SPEC |

**TLAF0-G PASS when:** four reviews filed · O1 states shared-or-not with file evidence · no product code.

### TLAF1 — Shared component (internal, not a deploy)

**In:** Lift Autofilter + DateWhenFilter + FilterMenuPortal into a shared module (India names path). Column def: field, label, `value` \| `date`, row reader. One filtered stream. Conflict engine = O3. Persist = O4. `(none)` supported on nullable columns (journal later). Find and Badge **consumes** the extract; e2e unchanged.

**Out:** Trade Log title bar; button removal; journal.

| Seed | Agent | Does |
|------|-------|------|
| `TLAF1-1-charlie` | Charlie | Extract; Find and Badge wired to it |
| `TLAF1-2-kilo` | Kilo | `trade-log-find.spec.ts` PASS; grep one implementation; A7/A8 unit tests |
| `TLAF1-G` | Delta | A12 · A7 · A8 · A9 engine · Find and Badge green |

### TLAF2 — Trade Log cutover (A11) — first deploy

**Same commit, no exceptions:**

1. One Autofilter control on the Trade Log title bar (A1). Columns: Exec time, Campaign, Symbol, Status.  
2. `blotter-campaign-filter` **gone** (A2).  
3. Date under nav **omitted on Trade Log only** per O1 (A3). If Coach waives A3 (leave shared chrome), Trade Log **must still not apply** Practice date/campaign as a second filter (L14).  
4. Badge tap + `?campaign=` set campaign **column** (A5).  
5. Adhere composition (A6).  
6. Whole-block symbol filter (A4).  
7. Open:N per O2 (A10 if keep).  
8. `shown/total` + Filter on (A9).  
9. Account chrome stays. Playbook select stays (O-J3). Select opens stays (L12).

| Seed | Agent | Does |
|------|-------|------|
| `TLAF2-1-charlie` | Charlie | Title bar + removals + badge/`?campaign=` identity + one stream |
| `TLAF2-2-echo` | Echo | Visual review: one control, HIG, Filter on, no leftover toolbar campaign |
| `TLAF2-3-kilo` | Kilo | A1–A12 (as applicable) e2e/unit; Find and Badge still PASS. **Out-of-scope smoke (because nobody else is watching):** **Journal**, **Reports**, **Retro**, and **Playbook** each still **render date and campaign chrome** (`practice-granularity`, `practice-campaign-select`) after the omit-on-Trade-Log change. |
| `TLAF2-G` | Delta | A11 on **this** diff; no `blotter-campaign-filter`; Autofilter on title bar; four named suite pages still show date+campaign chrome |

### TLAF3 — Help

| Seed | Agent | Does |
|------|-------|------|
| `TLAF3-1-lima` | Lima | `server/help_reference/` Trade Log Autofilter + App areas Trade Log / Find and Badge. No journal/records. No profit claims. |
| `TLAF3-2-kilo` | Kilo | Help catalog + concierge heading tests |
| `TLAF3-G` | Delta | File present = published; search hits |

### TLAF4 — Close

| Seed | Agent | Does |
|------|-------|------|
| `TLAF4-1-lima` | Lima | Spec **v0.1.1** — record O1–O4 answers in the body so spec §11 is not permanently open. DL: this Trade Log slice is the **active** Autofilter program; parent plan [`docs/Autofilter-Full-Agent-Bench-Plan-v1.1.md`](./Autofilter-Full-Agent-Bench-Plan-v1.1.md) (Spec v0.2, journal/records) is **parked**. As-built Trade Log note. |
| `TLAF4-G` | Delta | A1–A12 on shipped surface; one component; named-surface grep clean |

---

## 9. Acceptance → packet

| # | Packet |
|---|--------|
| A1 title-bar Autofilter | TLAF2 |
| A2 no campaign toolbar button | TLAF2 |
| A3 no date under nav (Trade Log) | TLAF2 after O1 |
| A4 whole trade blocks | TLAF2 |
| A5 badge → column | TLAF2 |
| A6 Adhere | TLAF2 |
| A7–A8 conflict / empty | TLAF1 + TLAF2 |
| A9 Filter on | TLAF1 + TLAF2 |
| A10 Open:N identity | TLAF2 if O2=keep |
| A11 never both | TLAF2 **commit** |
| A12 shared component | TLAF1, recheck TLAF4 |

---

## 10. Files (India TLAF0 may trim)

| Area | Paths |
|------|--------|
| Extract | `TradeFindTag.tsx` · `DateWhenFilter.tsx` · `FilterMenuPortal.tsx` · `tradeLogWhenTree.ts` |
| Seam | `PracticeSuiteChrome.tsx` · `PracticeContextBar.tsx` · `practiceContext.tsx` |
| Trade Log | `web/app/app/trade-log/page.tsx` · `TradeLogTable.tsx` |
| Tests | `web/e2e/trade-log-find.spec.ts` · new Trade Log Autofilter tests |
| Help | `server/help_reference/app-areas.md` + new topic |

**Do not open:** journal pages, reports, campaign **pages** except Find and Badge extract, Options Lab, Wiki, AppChrome.

---

## 11. Gate protocol

1. Seed done → evidence (commands, greps, test output), not “should work.”  
2. Delta files `agents/p-autofilter/gate-reports/TLAFn-G.md`.  
3. Dual mechanisms on Trade Log in any TLAF2 commit = **FAIL**.  
4. Coach overrule of a specialist = **DL**, not a waived gate.

---

## 12. Invocation

```
Activate <Agent>. Project p-autofilter, seed <TLAFn-…>.
Read agents/p-autofilter/seeds/<file>,
Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md,
docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md,
agents/bench/doctrine.md.
Touch only files the seed lists. End with the completion checklist
and evidence (commands + outputs).
```

---

## 13. First actions (Coach)

1. Read the Trade Log spec and this plan.  
2. **GO TLAF0** — fire `TLAF0-1-india` first (O1 report).  
3. After TLAF0-G: **GO SPEC** + O3 + O4; stamp O1 + O2 before TLAF2.  
   **GO SPEC is the moment the header status “DRAFT — advisor, not BUILD AUTHORITY” flips.** Until that stamp the header stays DRAFT; after it, Lima records BUILD AUTHORITY (or Coach’s named equivalent) so the status field does not outlive its truth.  
4. **GO TLAF1**. Do not fire from chat.

---

## 14. Coach checklist

- [ ] GO TLAF0  
- [ ] GO SPEC (header status flips from DRAFT)  
- [ ] O1 date chrome = omit on Trade Log only / other ________  (fills L14)  
- [ ] O2 Open:N = remove / keep-as-identity  
- [ ] O3 conflicts = select-time / apply-time  
- [ ] O4 persist = clean visit / sticky (own key + visible control)  
- [ ] GO TLAF1 (after GO SPEC + O3 + O4)  
- [ ] GO TLAF2 (requires TLAF1-G + O1 + O2)

---

**Signed:** Juliet · Trade Log Autofilter Spec **v0.1.1** · plan `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md` · **TLAF4 closed** (DL-586).
