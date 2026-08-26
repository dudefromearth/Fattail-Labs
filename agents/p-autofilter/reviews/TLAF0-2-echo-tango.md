# TLAF0-2 — Echo + Tango — Trade Log Autofilter

**Agents:** Echo · Tango  
**Date:** 2026-08-25  
**Spec:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md` (DRAFT)  
**Plan:** `docs/Trade-Log-Autofilter-Full-Agent-Bench-Plan-v1_0.md`  
**Isolation:** read-only. O3/O4 **opinions labeled** — not Coach answers.

---

## Echo — APPROVED for build (after GO SPEC)

**Title bar, not chip row.** Spec §1: one control on the Trade Log title bar opening a filter surface. As-built local title is the **Trade history** row (`TradeLogTable.tsx` 237–247) — suite chrome uses `hideTitle` (`trade-log/page.tsx:862`). Plan O-J1 is acceptable HIG host. Do not put a ▾ on every blotter column in this slice.

**Match Campaign menus, not Campaign header placement.** Find and Badge uses per-column `h-4 w-4` (16px) ▾ (`TradeFindTag.tsx:219–234`) + `FilterMenuPortal`. Extract **menu look** (portal, checkbox list, When year→month→day). Trade Log **launcher** is title-bar; Human Interface Spec ≥44 pt applies to **that** control. Do **not** restyle Find and Badge ▾ in TLAF1 (extract only).

**Filter on.** Cite Strategy Lab `PhaseRunDashboard.tsx` 585–603: amber chip, `shown/total` in title (`Filter on — ${sorted.length}/${rows.length} runs`), `data-filtered`. Carry that treatment on the Trade Log title bar when Autofilter is active (A9).

**Open:N if O2=keep:** must share Status=Open state, clear path, and `shown/total`. Visually a filter identity, not a second widget. If it looks like a shortcut with private `filterOpenOnly`, Echo **blocks** TLAF2.

**Opinion:** title-bar control should sit in the Trade history row, left of counts, not under Practice nav.

---

## Tango — APPROVED for build (after GO SPEC)

**A7 vs A8.** Conflict: name the two choices that cannot both be true. Empty-but-valid: “Nothing matched” + clear — not an error, not a blank table to reverse-engineer.

**O3 (opinion, not a ruling):** select-time grey-out prevents the blank-table failure members already have with silent chrome filters. Apply-time catches composition. Coach picks. Tango does not invent the stamp.

**O4 (opinion, not a ruling):** sticky filters without a visible control are “where did my data go.” Spec already: if persist, **own key + visible control**. Never `ft.tradeLog.lastUsed.v1`. Clean visit is the safer default for a first slice. Coach picks.

**Not a recommender.** Autofilter lists values **present in the loaded book**. No “best,” no “edge,” no ranked symbols.

**Capacity:** Filter on + shown/total is the honesty affordance. Without it, members conclude the book is empty (same failure as implicit date windows).

---

## Flagged

Campaign header ▾ is below 44 pt as-built. Out of this slice to enlarge it. Title-bar control on Trade Log must not copy that undersize.

Spec text not deleted.
