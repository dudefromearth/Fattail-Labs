# DLG-W0 — Coach GO token · program `p-options-lab-create-edit-dialog`

**Plan:** `docs/Options-Lab-Create-Edit-Position-Dialog-Full-Agent-Bench-Plan-v1.0.md`
**Spec:** `Specs/FatTail-Labs-Options-Lab-Create-Edit-Position-Dialog-Spec-v0_6.md`
**sha1:** `9b84c4e495b45ec5b99afe69e194c45d8a9f0b8b` *(Delta only — computed from disk. Coach does not confirm this number.)*
**BUILD AUTHORITY:** Spec **v0.6** as of the re-stamp below. v0.4 remains the baseline DLG0/DLG1 were built against.
**Stamped by:** Coach (GO 2026-09-11; v0.6 re-stamp same day)
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

- [x] Spec is **v0.6** — `head -1` contains `Spec v0.6`; `grep -c 'DLG-HIG-13'` · `AT-DLG-17` · `AT-DLG-16` · `Do not build Preview, Entry time, or Submit` are all non-zero (a zero means the wrong file)
- [x] Spec designated **BUILD AUTHORITY** as of this re-stamp (DL-692)
- [x] Plan **v1.0** is the program of record, executed against v0.6 from DLG2
- [x] L1 – L20 remain **LOCKED** (VOCAB/THEME/SYM/FN/LAYOUT). §5.2 is the thirteen-law HIG treatment. Layout §5.3 is unchanged.
- [x] DLG0 (`93b08d8`) and DLG1 (`8faf9cd`) **not reopened**. India W0-4 still stands.

---

## 3. DL-539 three-OK (verbatim)

1. Coach commissioned Position Control and closed it on this machine (DL-689 · `71a9ab5`).
2. Coach declared the dialog instruction ("dark theme on the card's tokens") was the defect, and asked for a designed dialog Spec.
3. Coach directed Spec v0.1–v0.4 through review and answered §8 as law.
4. Coach stamped v0.4 **BUILD AUTHORITY** and directed this full agent bench plan. No packet, no seed-as-one-off, no fourth rebuild.

- [x] Three-OK recorded. Freeze **not** lifted for other trees.

---

## 4. Process ticks (not product law)

Product law is stamped in Spec v0.6 §8. No engineering defaults.

| ID | Tick | Decision |
|----|------|----------|
| **JR1** | **accept** | Board `agents/p-options-lab-create-edit-dialog/` · token `DLG-W0.md` |
| **JR2** | **accept** | DLG0 first code after GO, only after W0-4 APPROVED |
| **JR3** | **accept** | `npx tsx` + Playwright |
| **JR4** | **accept** | Do not split `PositionBuilder.tsx` |
| **JR5** | **accept** | List = `surface="card"` only; host = optional DLG3 prop-wire |
| **JR6** | **accept** | Analyze testid stays `builder-analyze` |

**Governing correction (settled — do not re-derive):**

Card and dialog share behaviour and semantics. They do **not** share appearance. Mechanism: required
`surface` prop (`"card"` | `"dialog"`) stamping `data-surface`. One component, two appearances.
Never two components. Never one look forced onto both.

India W0-4 signs that mechanism before DLG0. Still stands.

---

## 5. Cross-stamps

- [x] Position Control v1.2 stays frozen. PC-VOCAB-1 superseded in the DL, carried to v1.3. PC-VOCAB-2 / PC-VOCAB-8 unchanged.
- [x] PC8-G at `71a9ab5` is the as-built baseline this program corrects, not a packet to reopen.
- [x] Spec v0.4 and v0.5 remain on disk as baselines. Not edited.

---

## 6. v0.6 re-stamp (before DLG2)

- [x] §5.2 is the full thirteen-law HIG treatment, not a spacing pass
- [x] §5.3 Layout verbatim — do not HIG the layout into something else
- [x] AT-DLG-16 (820 / inset 20 / content 780 / 8-point grep) and AT-DLG-17 (itemised Echo/Tango)
- [x] sha1 `9b84c4e495b45ec5b99afe69e194c45d8a9f0b8b` matches disk
