# TLAF0-3 — Hotel — Trade Log Autofilter

**Agent:** Hotel  
**Date:** 2026-08-25  
**Spec:** `Specs/FatTail-Labs-Trade-Log-Autofilter-Spec-v0_1.md` §§5–7  
**Isolation:** read-only.

---

## Verdict

**APPROVED for build** (after GO SPEC). No journal boxes in this slice; valence carve-out is not in play. Filter chrome must stay **process / bookkeeping**.

---

## 1. Filter chrome is not a hunt

Exec time, Campaign, Symbol, Status are facts of the book. Copy and help must not say “find winning trades,” “show me the edge,” or rank by P&L. Status Open / Complete / Orphan close is **matching state**, not performance.

---

## 2. Adhere locate stays a locate view

As-built (`trade-log/page.tsx` 65–66, 173–184, 690–717):

> Journey Adhere pillar → meter complement (F2). Not standing chrome.

Banner `data-testid="journey-adhere-locate-banner"`:

> From Journey · showing trades that are not **followed** or **partial** · This is a locate view, not a standing Trade Log filter.

**Keep.** Composition with Autofilter (A6) must not turn this into a standing “broke trades” sort or a profit screen. Clear remains `journey-adhere-locate-clear`.

---

## 3. Open:N

If the chip stays, it is Status=Open **bookkeeping** (unmatched opens count), not a quality badge. Emerald filled state (`TradeLogTable.tsx:254–256`) already reads hotter than a filter identity — Echo/Tango if O2=keep. Hotel: no “winning opens.”

---

Spec text not deleted. O2/O3/O4 not answered here.
