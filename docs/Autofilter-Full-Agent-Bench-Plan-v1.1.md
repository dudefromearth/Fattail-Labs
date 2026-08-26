# Autofilter Spec v0.2 — Full Agent Bench Plan v1.1

**PARKED (DL-586).** Not the active Autofilter program. Do not fire AF packets from
this plan. Active: Trade Log Autofilter Spec **v0.1.1** · plan
`docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`.

**Date:** 2026-08-25  
**Plan revision:** **v1.1** (refashioned on Spec **v0.2**; v1.0 targeted v0.1)  
**Canonical filename:** `docs/Autofilter-Full-Agent-Bench-Plan-v1.1.md`  
**v1.0 path** is a stub pointer — do not hash it as execution law.  
**Owner (orchestration):** Juliet  
**Authority:** Coach (GO / ship)  
**Board:** [`agents/p-autofilter/`](../agents/p-autofilter/)  
**Spec of this packet:** [`Specs/FatTail-Labs-Autofilter-Spec-v0_2.md`](../Specs/FatTail-Labs-Autofilter-Spec-v0_2.md)  
**Status of spec:** **PARKED** — DRAFT advisor. Bench gates **not run**. **Not BUILD AUTHORITY.**  
**Supersedes (as execution law):** [`docs/Autofilter-Full-Agent-Bench-Plan-v1.0.md`](./Autofilter-Full-Agent-Bench-Plan-v1.0.md) (v0.1 plan).  
**Governance:** [`agents/bench/doctrine.md`](../agents/bench/doctrine.md) · [`agents/bench/spec-create-review-workflow.md`](../agents/bench/spec-create-review-workflow.md) · [`AGENTS.md`](../AGENTS.md)

Specialists execute **only** via seeds. Coordination only through **Coach** or **Juliet**.  
Delta gates: **PASS / FAIL / BLOCKED** with evidence — **never waived**.  
**No product code until Coach stamps GO SPEC + remaining OPENs that the packet needs + GO AF1.** AF0 is reviews and inventory only.

---

## 0. v0.1 → v0.2 (what this plan absorbed)

Coach Content Law: v0.1 text is not deleted from the spec file (v0.2 supersedes it). This plan **does** drop v1.0 sequencing that v0.2 struck.

| v0.2 law | Plan consequence |
|----------|------------------|
| **DL-539 is satisfied by Coach naming the surfaces.** Naming *is* the authorization. Struck: a second Coach sign-off to work inside named surfaces. | No “chrome three-OK” to start Trade Log / journal / Campaign extract. Three OKs apply only if an agent reaches a surface Coach **did not** name. |
| **Must not reach Reports, Capital, Positions** without Coach’s direction. | Plan v1.0’s opinion “records = Reports” is **withdrawn**. Records stays OPEN (O1). AF4 waits. Trade Log and journal **proceed without O1**. |
| **§2.2 One cut per surface** | Button removal ships **in the same change** that mounts Autofilter on that surface. Not a later cleanup. |
| **One filtered stream out (§3, A18)** | Filter state lives **inside** the shared component. A surface must not keep Practice-context date/campaign filtering *and* Autofilter. Dual mechanism moved inward is still FAIL. |
| **`Open:N` identity rule (A16)** | If the chip stays, it **is** Status=Open — same state object, same clear path, same `shown/total`. A private chip filter is forbidden. |
| **Conflicts: three shapes (O3)** | Select-time · apply-time · **by class** (Grok). No default. |
| **Sticky filters (O4)** | If they persist: **own named key** and **own visible control**. Never silent merge into `ft.tradeLog.lastUsed.v1`. |
| **O1 blocks Records seeds only** | AF3 / AF5 do not wait on records identity. |
| **A16, A17, A18** | New acceptance rows. A17 = never both mechanisms in any commit. |

---

## 1. What this program is

Excel-style Autofilter, **already working** on Campaign **Find and Badge**. Extract it once. Drive the named tables from that one component. Delete the date and campaign **buttons under the nav** on those surfaces so there is **one filter system**.

**Named (Coach):** Trade Log · records · journal · Campaign as **extract source and badge routing**.

**Nature:** read-only. Filters what is already loaded. Nothing mutates, nothing persists to the server, no schema, no migration.

---

## 2. Isolation (DL-539) — v0.2 wording

Coach named these surfaces; that **is** the authorization. Agents work inside them without a second ritual.

**Three OKs apply** if this component is proposed for a surface Coach has **not** named. **Out unless Coach directs:** Reports · Capital · Positions · Playbook · Retrospective · Symbols · Strategy Lab (except **read** Grid\|Table) · Options Lab · Wiki · AppChrome.

**Shared chrome is not a second authorization problem; it is an India seam.** Date and campaign controls today live in `PracticeContextBar`, mounted by `PracticeSuiteChrome` on **every** Practice suite page. Deleting them from the **bar itself** would strip unnamed apps. Spec §2 is “deleted from every **named** surface.” India names the technical seam in AF0 (prop / host). Unnamed suite apps **keep** today’s date/campaign chrome until Coach names them.

---

## 3. What is already shipped (do not rebuild)

| Piece | Path / proof |
|-------|----------------|
| Find and Badge AutoFilter | `web/components/trade-log/TradeFindTag.tsx` |
| When calendar hierarchy | `DateWhenFilter.tsx` · `web/lib/tradeLogWhenTree.ts` |
| Menu portal | `FilterMenuPortal.tsx` |
| Campaign Spec §9.2 | One filter system; badge = entry point; composes with Adhere locate |
| E2E | `web/e2e/trade-log-find.spec.ts` |
| Practice date/campaign chrome | `PracticeContextBar` · `practice-granularity` · `practice-campaign-select` |
| Trade Log blotter | `TradeLogTable.tsx` — blocks; badge tap; `Open:N`; `Select opens` |
| Blotter prefs (non-filter) | `web/lib/tradeLogPrefs.ts` — `ft.tradeLog.lastUsed.v1` |
| Journal calendar | `JournalCalendar.tsx` — E6 · E8 · E10 · E11 · E12 |
| Grid \| Table | Strategy Lab `PhaseRunDashboard.tsx` — **match**, do not invent |
| Help | `server/help_reference/app-areas.md` · **DL-363** |

**Extract. Do not rewrite.** Campaign Autofilter works.

**As-built defect to kill on named surfaces:** Campaign Find and Badge already has Autofilter **and** PracticeContextBar date/campaign. That is two mechanisms. AF2 cuts the buttons in the **same** change that treats Autofilter as the sole filter on that page (A17).

---

## 4. Open items — Coach must rule (spec §12)

No defaults in the spec. This plan does not invent them. Juliet may label an opinion; Coach stamps.

| # | Item | Spec | Blocks | Juliet opinion (discard freely) |
|---|------|------|--------|----------------------------------|
| **O1** | Which surface is “records” | §5, §12.1 | **AF4 only** | **No recommendation.** v0.2 forbids Reports unless you name it. Do not treat help’s “Records = Reports” as this program’s scope. |
| **O2** | `Open:N`: remove, or keep under the **identity rule** (A16)? | §4 | AF3 chip row | Identity-keep is lawful; a private chip is not. Remove is simpler. |
| **O3** | Conflicts: select-time, apply-time, or **by class**? | §8 | AF1 engine | **By class** is most precise and most to build. Select-time-only misses composition. Pick one in the DL. |
| **O4** | Persist across reload? | §8 | AF1 persist | If yes: own key + visible control. If no: clean visit. Never merge into `ft.tradeLog.lastUsed.v1`. |
| **O5** | Default list/boxes per surface; remembered? | §6.1 | AF5 | Journal opens **boxes**. List↔boxes memory is view-only, separate from O4. |

**GO AF1** needs O3 + O4 (engine). **GO AF3** needs O2. **GO AF5** needs O5. **GO AF4** needs O1. Trade Log and journal **do not wait on O1**.

---

## 5. Juliet review (labeled)

Coach’s spec text stays. Nothing below deletes it.

### Blocking for *sequencing*

| # | Item |
|---|------|
| **B1** | Spec is **DRAFT**. India + Echo + Tango + Hotel → Coach **GO SPEC** → Lima DL → **then** GO AF1. This plan is not a spec stamp. |
| **B2** | **§2.2 / A17.** Button removal and Autofilter mount are **one change per surface**. Both mechanisms in any commit on that surface = FAIL. |
| **B3** | **One component (A15).** Extract from Find and Badge. Surface files supply column defs only. |
| **B4** | **A18.** One filtered stream out. Practice-context date/campaign must not keep filtering a named surface after cutover. |
| **B5** | Journal valence (E10) and fixed buckets (E11) travel. Filtered boxes must not renormalize. Hotel blocks if they do. |
| **B6** | Campaign badge tap **sets the Autofilter campaign column** (§7 / Campaign v1.3 §9.2). The control being replaced is not the control being tapped. |
| **B7** | Read-only. No migration, no `/api` filter query. If a seed wants a server change, it stops. |
| **B8** | **Reports / Capital / Positions are out** until Coach names them. O1 does not smuggle Reports in. |

### Opinion (Coach may discard)

| # | Item |
|---|------|
| **O-J1** | Filename `Specs/FatTail-Labs-Autofilter-Spec-v0_2.md` is already seated; Coach still “names the real ones” per spec header. |
| **O-J2** | Account selector in Practice chrome **stays**. Spec deletes date and campaign buttons, not the book picker. |
| **O-J3** | `Select opens` stays (not a filter). |
| **O-J4** | Help topic in AF6; App areas Trade Log / Find and Badge / Journal updated. Records help waits on O1. |

---

## 6. Mission (after stamp)

```text
Campaign Find and Badge Autofilter (as-built)
  → extract one component (column def in, one filtered stream out)
  → Campaign: buttons off in the same cut; badge tap → column filter; Adhere survives
  → Trade Log: whole-block filter; date/campaign columns replace nav buttons (same cut)
  → Journal: (none); list | boxes; dim non-matches; period bar tells the truth
  → Records: only after O1 names the surface; all-time default
  → shown/total + “Filter on”
  → fail-loud conflicts (shape = O3); empty-but-valid ≠ conflict
```

---

## 7. Critical path

```
GO AF0     reviews + inventory + GO SPEC + OPENs as needed
  AF0-1  India     A18 stream, PracticeContextBar seam, §9.2, Reports-out, Alpha idle
  AF0-2  Echo+Tango  HIG, dimming≠gradient, toggle, empty/conflict copy, O3 shapes
  AF0-3  Hotel     valence §6.4; buckets; no profit chrome
  AF0-4  Kilo      as-built inventory (including today’s dual chrome on Campaign)
       → AF0-G Delta
  Coach  GO SPEC + O2 O3 O4 (engine) · O5 (journal) · O1 (records, later)
  AF0-6  Lima      DL

GO AF1     extract one Autofilter; Campaign Find and Badge is the only consumer
           still has PracticeContextBar until AF2 — AF1 does not cut buttons yet

GO AF2     Campaign cutover: buttons off + Autofilter sole filter (same commit)
           badge → column; Adhere composition

GO AF3     Trade Log cutover (same commit: Autofilter + buttons gone)
           O2 chip; A2 whole-block; A3 badge

GO AF5     Journal cutover (does not wait on O1)
           O5 views; A5–A9, A13

GO AF4     Records — only after O1; not Reports unless Coach names Reports

GO AF6     Help + Guide
GO AF7     Lima as-built + Delta close (A1–A18)
```

AF1 may land **without** button removal on Campaign (extract only; consumer is already Autofilter). **AF2 is the Campaign cut** that satisfies A17 on that page. AF3/AF5/AF4 each satisfy A17 on their surface.

**Never:** four copies · buttons “until Autofilter is perfect” · second client-side filter · server-side filter · sort · saved sets · Reports/Capital/Positions · rewrite Find and Badge · red/green on Trade Log.

---

## 8. Agent roster

| Agent | Owns |
|-------|------|
| **Coach** | GO SPEC, O1–O5, ship/no-ship, naming further surfaces |
| **Juliet** | Board, seeds, sequencing; never implements |
| **India** | Component API; A18; PracticeContextBar seam; §9.2; no schema |
| **Echo** | HIG; dimming vs gradient; Grid\|Table; ≥44 pt; chip identity if O2=keep |
| **Tango** | Filter on; conflict/empty copy; sticky-filter psychology; three O3 shapes |
| **Hotel** | Journal valence; no profit language |
| **Charlie** | Extract + per-surface cutovers |
| **Kilo** | A1–A18; grep one component; Find and Badge e2e still pass |
| **Delta** | Phase gates |
| **Lima** | DL, help/guide, as-built |
| **Alpha** | **Idle** unless India finds a server seam |

---

## 9. Packets

### AF0 — Seat + review (no product code)

| Seed | Agent | Does |
|------|-------|------|
| `AF0-1-india` | India | Spec build-readiness; A18; PracticeContextBar seam; §9.2; Reports-out; Alpha idle? |
| `AF0-2-echo-tango` | Echo + Tango | Dimming vs E11; toggle; O3 three shapes; empty/conflict; Filter-on |
| `AF0-3-hotel` | Hotel | §6.4; A7/A8; filter chrome is not a performance score |
| `AF0-4-kilo` | Kilo | Inventory: Autofilter files, nav buttons, Open:N, badge tap, suite pages, **today’s dual chrome on Campaign** |
| `AF0-G` | Delta | Reviews in-tree; no code diff |
| Coach | **GO SPEC** · O2–O5 as ready · O1 when records is named |
| `AF0-6-lima` | Lima | DL |

**Done when:** GO SPEC logged · AF0-G PASS. O1 may remain open.

### AF1 — One component

Column def in: field, label, type (`value` \| `date`), reader. Owns distinct values, dropdown, AND-across / OR-within, **one filtered stream out**.

Lift `AutoFilter` + `DateWhenFilter` + `FilterMenuPortal` without visual rewrite. `(none)` on nullable columns. `shown/total` + “Filter on”. Conflict engine per O3. Persist per O4 (own key if sticky). Campaign Find and Badge consumes the extract; **e2e still PASS**. Buttons **not** removed in AF1 (that is AF2) — document in the seed so A17 is not claimed early.

**Gate AF1-G:** A15 (implementation exists once); A10/A11 engine tests; `trade-log-find.spec.ts` PASS; grep one Autofilter implementation.

### AF2 — Campaign cutover (A17 on Campaign)

**Same commit:** PracticeContextBar date+campaign **absent on Campaign pages**; Autofilter is the only filter; badge tap sets campaign column (A3); Adhere composition survives (A4). Account picker stays (O-J2).

**Gate AF2-G:** A1 (Campaign), A3, A4, A14, A17, A18.

### AF3 — Trade Log cutover

**Same commit:** Autofilter on blotter + nav date/campaign **gone**. Whole-block (A2). Columns per §4. Badge → campaign column (A3). `Open:N` per O2 (A16 if keep). `Select opens` untouched.

**Gate AF3-G:** A1 (Trade Log), A2, A3, A4, A10, A11, A14, A16 (if keep), A17, A18.

### AF5 — Journal cutover (not blocked on O1)

**Same commit:** Autofilter + buttons gone. `(none)` (A5). List\|boxes (O5, A13). Boxes: dim not remove, clickable, ≠ gradient, period bar honest (A6–A9). Map OFF = zero money chrome (A7). Buckets stable (A8).

**Gate AF5-G:** A5–A9, A13, A14, A17, A18. Hotel sign-off.

### AF4 — Records (blocked on O1)

Only after Coach names the surface. **Not Reports** unless that name *is* the ruling. All-time first load (A12). Same-cut Autofilter + buttons gone.

**Gate AF4-G:** A1, A12, A14, A17, A18.

### AF6 — Help + Guide

`server/help_reference/` Autofilter topic + App areas for surfaces that shipped. `/guide` as-built. No profit claims.

**Gate AF6-G:** help tests; headings searchable.

### AF7 — Close

Lima DL + as-built. Delta: A1–A18 on shipped named surfaces; grep one component; no date/campaign testids on those pages.

---

## 10. Acceptance map (spec §11)

| # | Packet |
|---|--------|
| A1 | AF2, AF3, AF5, AF4 |
| A2 | AF3 |
| A3 | AF2 + AF3 |
| A4 | AF2 + AF3 |
| A5–A9, A13 | AF5 |
| A10–A11 | AF1 engine + each cut |
| A12 | AF4 |
| A14 | AF1 + each cut |
| A15 | AF1, recheck AF7 |
| A16 | AF3 if O2=keep |
| A17 | every cut commit |
| A18 | AF1 + each cut |

---

## 11. Keep / kill / non-goals

**Keep:** Find and Badge behaviour; When year→month→day; FilterMenuPortal; account picker; Select opens; Journal E6/E8/E10/E11/E12; PracticeContext date/campaign on **unnamed** suite apps.

**Kill on named surfaces, in the cut commit:** nav date buttons; nav campaign select; any second client-side filter (including leftover `practiceContext` date/campaign on that page).

**Not this plan:** sorting; saved sets; server-side filter; Reports / Capital / Positions; Playbook / Retro; rewriting Campaign Autofilter; TradeSheet/ImportSheet Drawer unification.

---

## 12. Files likely in play (India AF0 may trim)

| Area | Paths |
|------|--------|
| Extract | `TradeFindTag.tsx` · `DateWhenFilter.tsx` · `FilterMenuPortal.tsx` · `tradeLogWhenTree.ts` |
| Seam | `PracticeSuiteChrome.tsx` · `PracticeContextBar.tsx` · `practiceContext.tsx` |
| Trade Log | `web/app/app/trade-log/page.tsx` · `TradeLogTable.tsx` · `tradeLogPrefs.ts` |
| Campaign | `web/app/app/practice/campaign/page.tsx` |
| Journal | `web/app/app/journal/page.tsx` · `JournalCalendar.tsx` |
| Records | **unknown until O1** — do not open `web/app/app/reports/page.tsx` unless Coach names Reports |
| Tests | `web/e2e/trade-log-find.spec.ts` · new Autofilter tests |
| Help | `server/help_reference/app-areas.md` + new topic |

---

## 13. Invariants

1. UI fail-loud on contradictory filters (shape = O3).  
2. Process outcomes only — no profit claims.  
3. Evidence over assertion.  
4. Change control: files in the seed.  
5. DL-539: unnamed surfaces untouched (Reports / Capital / Positions included).  
6. Journal valence does not leak.  
7. Read-only; no MySQL.  
8. One filtered stream (A18).  
9. A17: never both mechanisms in one commit on a named surface.

---

## 14. First actions (Coach)

1. Read Spec v0.2 and this plan.  
2. **GO AF0** — fire `AF0-1-india` first.  
3. After AF0-G: **GO SPEC** + O3 + O4 (engine). O2 before AF3. O5 before AF5. O1 before AF4.  
4. **GO AF1** — do not fire from chat.

---

## 15. Coach checklist

- [ ] GO AF0  
- [ ] GO SPEC (v0.2 or renamed file)  
- [ ] O1 records = ________ (or leave open; Trade Log/journal still go)  
- [ ] O2 Open:N = remove / keep-as-identity  
- [ ] O3 conflicts = select-time / apply-time / by class  
- [ ] O4 persistence = clean visit / sticky (own key + visible control)  
- [ ] O5 default views + remember? = ________  
- [ ] GO AF1 (after GO SPEC + O3 + O4)

---

**Signed:** Juliet (plan v1.1 · Spec v0.2) · awaiting Coach GO AF0 / GO SPEC.
