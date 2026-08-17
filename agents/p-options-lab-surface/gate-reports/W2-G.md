# W2-G — First-ship characterization list

**Verdict:** **PASS**  
**Date:** 2026-08-16  
**Agent:** Delta  
**Artifact:** `agents/p-options-lab-surface/characterization-list.md`  
**Seed:** `seeds/W2-1-delta-first-ship-list.md`  
**Depends:** W0-G  

This gate writes **this file only** (plus the list itself, authored this
wave). No product code. No tests added.

W2-G is the **first-ship set only**. Later rows do not block W3.

---

## Evidence

First-ship IDs present as headings in `characterization-list.md`:

`T-IV-1 T-IV-2 T-IV-3 T-IV-4 T-WIN-1 T-WIN-2 T-SMP-1 T-CAM-1 T-VW-1
T-VW-2 T-LM-1 T-LM-2 T-LM-3 T-LM-5 T-LM-6 T-TM-2 T-BOOK-1 T-GRID-1`

| Check | Evidence | Result |
|-------|----------|--------|
| All 18 first-ship IDs | grep `^### ID` — 18/18 | **PASS** |
| T-LM-1 cited to OPF29 | row: cite AT-L0-τ1/τ4, no second τ | **PASS** |
| T-TM-2 on bind path | row: “Not a snap-feed test” | **PASS** |
| T-BOOK-1 document-law | row: App Spec §4.7; do not document inverse | **PASS** |
| T-GRID-1 | nx=80 · nt=48 · DPR cap 2 · fail loud if unbounded | **PASS** |
| Later non-blocking | §2 names T-TM-1 T-TM-4 T-CON-1 T-CON-2 · “does not block W3” | **PASS** |
| No Backtest seed | `seeds/` has no backtest packet | **PASS** |
| No migration | no `migrations/*surface_inspect*` | **PASS** |

**Defects:** none.

W3-1 may fire (W0-G + W1-G + W2-G).
