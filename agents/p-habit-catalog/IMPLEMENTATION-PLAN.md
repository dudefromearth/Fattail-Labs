# Implementation Plan — p-habit-catalog

**Canonical:** [`docs/Habit-Catalog-Full-Agent-Bench-Plan.md`](../../docs/Habit-Catalog-Full-Agent-Bench-Plan.md)  
**Spec:** [`Specs/FatTail-Labs-Habit-Catalog-Spec-v0.1.md`](../../Specs/FatTail-Labs-Habit-Catalog-Spec-v0.1.md)

---

## Mission

Ship Habit Catalog so Retro **helps** via named methodology: active stack, evidence,
coverage (no invented gaps), install → habit plans, Journey strip.

---

## Sequence

```text
HC0 GO → HC1 API spine → HC2 UI → HC3 Retro → HC4 Journal → HC5 Journey → HC6 CLOSE
```

Vertical slice after HC4: **size-reason** evidenced end-to-end.

---

## Assessment

After each HC*-G **PASS**: update board NEXT; re-rank residuals; no automatic start without Juliet board update.  
