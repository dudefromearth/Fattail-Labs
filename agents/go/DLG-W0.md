# DLG-W0 — Coach GO token · program `p-options-lab-create-edit-dialog`

**Plan:** `docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md`
**Spec:** `Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_7.md`
**sha1:** `8218fed8165c7330cf2a71884109a2f4e1adf814` *(Delta only — computed from disk. Coach does not confirm this number.)*
**BUILD AUTHORITY:** Spec **v0.7** as of this re-stamp. v0.4–v0.6 remain baselines. **DLG2 reopened.**
**Stamped by:** Coach (GO 2026-09-11; v0.7 re-stamp same day)
**Date:** 2026-09-11

> Ticks below are Coach’s stamp. This file, saved, is the stamp — chat "go" is not (DL-328).

**MACHINE: COACH'S MACBOOK (dev).** No staging. No Mini Two. Nothing deploys. No backend. No migration.

---

## 1. Verdict

- [x] **GO** — DAG as written. India W0-4 `surface` sign before DLG0. Theme (DLG1) before chrome (DLG2).
- [ ] Amend
- [ ] Stop

---

## 2. Spec and plan

- [x] Spec is **v0.7** — `head -1` contains `Spec v0.7`; `grep -c 'DLG-LAYOUT-0'` · `AT-DLG-18` · `AT-DLG-20` · `Do not build Preview, Entry time, or Submit` are all non-zero
- [x] Spec designated **BUILD AUTHORITY** as of this re-stamp (DL-693)
- [x] Plan **v1.0** is the program of record, executed against v0.7 from the DLG2 redo
- [x] DLG0 (`93b08d8`) and DLG1 (`8faf9cd`) **not reopened**. India W0-4 still stands.
- [x] **DLG2 reopened** — layout regression (author: v0.2 transcribed the shipped dialog, not the prototype)

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
- [x] Spec v0.4, v0.5, v0.6 remain on disk as baselines. Not edited.

---

## 6. v0.7 re-stamp (DLG2 reopened)

- [x] Prototype image is normative (DLG-LAYOUT-0). Headings not in the image are defects.
- [x] DLG-HIG-8: green on Buy and payoff stroke from an accent token, required
- [x] DLG-HIG-9: legs table filled, bordered, inner padding
- [x] Centre / Width / structure-level Expiration held (§5.3.1) — raise at DLG2-G
- [x] sha1 `8218fed8165c7330cf2a71884109a2f4e1adf814` matches disk
