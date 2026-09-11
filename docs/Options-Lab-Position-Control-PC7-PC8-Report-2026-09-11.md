# Position Control — PC7 / PC8 report

**Revision:** 1  
**Date:** 2026-09-11  
**Machine:** Coach's MacBook (dev)  
**Nothing deploys.**

| Rev | Date | Change |
|-----|------|--------|
| 1 | 2026-09-11 | First report. PC7 `a939c0f` · PC8 `f1d536a`. AT-PC-05 PASS. D-PC-7 Edit gate reads CardLockState. |

PC5-G and PC6-G stay accepted. AT-PC-05 is named. D-PC-7 is closed on Edit. PC7 and PC8 are committed on Coach’s MacBook.

## Evidence ask — D-PC-7 / AT-PC-05

**AT-PC-05 PASS** (card/canvas). `lockNatural` / `lockLimit` write `CardLockState`; `definedDebitSigned` equals that lock on the same tick. Named in PC7-G; still green under PC8.

**Edit-mode displayed price now reads `CardLockState`**, not `net_debit_override`. Limit in Edit calls `lockLimit` / `unlockCard`. Create still uses the override because no record exists until Submit. That was the PC8 shared-row fix, not a stop. Litmus 1 no longer has a dialog/card split on the displayed price.

## PC7 — `a939c0f`

Constraint at the control: `boundSelectValue` never binds `options[0]` on render; empty ladder is `loading`; unlisted strike is refused; one expiration hides calendar/diagonal; DTE uses the TM clock; roll is proposed, not applied. Fixture, not a click-through.

Commit: `a939c0f7b75fc6cb45d06dfb911fb9750a86dc6e`  
`feat(analyzer): chain-bound controls, no options[0] on render (PC7)`

## PC8 — `f1d536a`

ToS card:

| Item | Landed |
|------|--------|
| Ten columns | `SPREAD · SIDE · QTY · SYMBOL · EXP · STRIKE · TYPE · PRICE · VOL · DELTA` |
| Seven fields | Spread · Side · QTY · Exp · Strike · Type · Price, inert where the strategy does not expose them |
| Spread on the card | Same rebuild path as the dialog picker → CHECK PRICE |
| Per-leg Calendar / Diagonal / CUSTOM | Exp and strike editable; name re-derives |
| Padlock pair | Unlocked outlined, shackle raised; locked solid, shackle closed |
| Grow-on-hover stepper | Stacked +/−; grown state is `--hit-min`; exclusive z-index so adjacent grown steppers do not compete |
| QTY quick-pick | 1 · 2 · 5 · 10 · 20 through the POS gesture; lock and ratio stand |
| Symbol groups | Select ≠ expand; header sets suite symbol and clears cross-group focus |
| Delete | Confirmed, names the position, Cancel available |

Commit: `f1d536af22329c65a2e74181cb229403f11eeaeb`  
`feat(analyzer): ToS card, shared stepper, CardLockState in Edit (PC8)`

Echo’s remaining density work (resting vs grown dimensions, transition, compact chrome) is a PC8-G task, not an entry gate.

## Environment

The 10-hour API cap is not a gate. Recorded in PC7-G / PC8-G so PCZ can explain any timeline gap without reconstructing it from memory.

## Standing — unchanged

Nine packets, nine commits (`ebaa723` … `f1d536a`). Sessions still unstaged. Coach is product owner; Delta, India, Tango and Hotel gate. The only remaining Coach-facing change is **PC9b** (Trade Log schema and snapshot column). Next on the DAG: PC9a Autofit (off PC3) and PC9b Promotion (off PC6).

Gate reports: `agents/p-options-lab-position-control/gate-reports/PC7-G.md`, `PC8-G.md`.
