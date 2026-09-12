# DLG-W0 — Coach GO token · program `p-options-lab-create-edit-dialog`

**Plan:** `docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md`
**Spec:** `Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_13.md`
**sha1:** `453def888819d4565c09914622957a4ff3348dea` *(Delta only — computed from disk. Coach does not confirm this number.)*
**BUILD AUTHORITY:** Spec **v0.13** as of this re-stamp. v0.3–v0.12 remain baselines. **Consolidated DLG2.**
**Stamped by:** Coach (GO 2026-09-11; v0.13 re-stamp 2026-09-12)
**Date:** 2026-09-12

> Ticks below are Coach’s stamp. This file, saved, is the stamp — chat "go" is not (DL-328).

**MACHINE: COACH'S MACBOOK (dev).** No staging. No Mini Two. Nothing deploys. No backend. No migration.

---

## 1. Verdict

- [x] **GO** — DAG as written. India W0-4 `surface` sign before DLG0. Theme (DLG1) before chrome (DLG2).
- [ ] Amend
- [ ] Stop

---

## 2. Spec and plan

- [x] Spec is **v0.13** — `head -1` contains `Spec v0.13`; `grep -c 'DLG-LAYOUT-14'` · `AT-DLG-32` · `Do not build Preview, Entry time, or Submit` are all non-zero
- [x] Spec designated **BUILD AUTHORITY** as of this re-stamp (DL-696)
- [x] Plan **v1.0** is the program of record, executed against v0.13 as the consolidated DLG2
- [x] DLG0 (`93b08d8`) and DLG1 (`8faf9cd`) **not reopened**. India W0-4 still stands.
- [x] **Consolidated DLG2** — layout, surfaces, card controls, field widths, strike precision

---

## 3. DL-539 three-OK (verbatim)

1. Coach commissioned Position Control and closed it on this machine (DL-689 · `71a9ab5`).
2. Coach declared the dialog instruction ("dark theme on the card's tokens") was the defect, and asked for a designed dialog Spec.
3. Coach directed Spec v0.1–v0.4 through review and answered §8 as law.
4. Coach stamped v0.4 **BUILD AUTHORITY** and directed this full agent bench plan. No packet, no seed-as-one-off, no fourth rebuild.

- [x] Three-OK recorded. Freeze **not** lifted for other trees.

---

## 4. Process ticks (not product law)

| ID | Tick | Decision |
|----|------|----------|
| **JR1** | **accept** | Board `agents/p-options-lab-create-edit-dialog/` · token `DLG-W0.md` |
| **JR2** | **accept** | DLG0 first code after GO, only after W0-4 APPROVED |
| **JR3** | **accept** | `npx tsx` + Playwright |
| **JR4** | **accept** | Do not split `PositionBuilder.tsx` |
| **JR5** | **accept** | List = `surface="card"` only; host = optional DLG3 prop-wire |
| **JR6** | **accept** | Analyze testid stays `builder-analyze` |

**Governing correction (settled — do not re-derive):**

Card and dialog share behaviour and semantics. They do **not** share appearance. Required
`surface` prop (`"card"` | `"dialog"`) stamping `data-surface`.

India W0-4 still stands.

---

## 5. Cross-stamps

- [x] Position Control v1.2 stays frozen.
- [x] Spec v0.3–v0.12 remain on disk as baselines. Not edited.

---

## 6. v0.13 re-stamp (consolidated DLG2)

- [x] Prototype is the layout (DLG-LAYOUT-0)
- [x] Field widths: EXPIRATION > STRIKE > DEBIT · POS · QTY (DLG-LAYOUT-14)
- [x] Strike precision from the listed chain (DLG-FN-10)
- [x] sha1 `453def888819d4565c09914622957a4ff3348dea` matches disk
