# DLG0 — Surface mechanism

**Status:** OPEN · **Machine:** Coach's MacBook (dev) · **Nothing deploys.**
**Phase:** DLG0
**Depends:** W0-0 GO + **W0-4 APPROVED**
**Laws:** DLG-VOCAB-1 · 2 · 3
**ATs named:** AT-DLG-15
**Gate:** `gate-reports/DLG0-G.md` — fifteen-row AT-DLG-1…15 table. Named AT must PASS; later ATs BLOCKED with owning phase; card ATs that this file touch must remain green.

Amendments become DLG0b. Never edit this file.

## Exact files

- `web/components/options-lab/TosControls.tsx`
- `web/components/options-lab/AnalyzerPositionsList.tsx` (`surface="card"` **only** — no restyle)
- `web/components/options-lab/PositionBuilder.tsx` (`surface="dialog"` on shared controls — **no restyle**)
- `web/lib/options-lab/dlgSurface.test.ts` (new)
- `web/lib/options-lab/tosCard.test.ts` **only if** existing share-tests need `surface=` on the card

Delta **FAIL**s any extra file.

## Why this exists

The governing correction is a **mechanism**, not a restyle. DLG1 is the theme packet. This packet
only stamps `surface` so both appearances can be selected later from one component.

**Do not re-derive DLG-VOCAB-1/2/3. India signed them at W0-4.**

## Intent

1. Required `surface: "card" | "dialog"` on `TosStepper`, `TosQtyControl`, `TosPadlock`, `CardMenuField`. Stamp `data-surface={surface}` on each root.
2. `AnalyzerPositionsList` passes `surface="card"`. Card appearance **byte-identical** to `71a9ab5` (PC-HIG-8 grow-on-hover remains).
3. `PositionBuilder` passes `surface="dialog"`. Appearance may still be the blotter's — **on purpose**. Theme is DLG1. Behaviour identical (step, lock, pick, sign).
4. A call site without `surface` does not compile.
5. Test AT-DLG-15: same component, two `data-surface` values, identical callbacks; card has grow-on-hover classes; dialog branch may still share them until DLG1.

## Out

Restyle · layout · symbol · `tokens.css` · `OpfRiskAnalyzer.tsx` · a second component · forking a stepper.

## Gate notes

AT-DLG-15 grep is plan §7. `tosCard.test.ts` card ATs stay green. India may artifact-quote W0-4.
Echo not required. Fifteen-row table: AT-DLG-15 PASS; AT-DLG-1…14 BLOCKED (DLG1–4).
