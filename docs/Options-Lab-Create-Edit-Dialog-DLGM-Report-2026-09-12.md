# Create / Edit Position Dialog — DLGM report

**Revision:** 1
**Date:** 2026-09-12
**Machine:** Coach's MacBook (dev)
**Nothing deploys.**

| Rev | Date | Change |
|-----|------|--------|
| 1 | 2026-09-12 | First report. Token `agents/go/DLGM.md`. Gate `DLGM-G` PASS. Commit `87539b2`. `DLG-W0` not restamped. |

**DLGM-G is PASS.** Token `agents/go/DLGM.md` (Coach GO is the stamp, DL-328). DL-697. `DLG-W0` was not re-stamped. Nothing deploys. Commit `87539b2` on Coach's MacBook.

Authority: `docs/Analyzer-Dialog-Common-Model-Architecture-Proposal-v0_1.md`. India's sign: `agents/p-options-lab-create-edit-dialog/reviews/DLGM-india.md`. Sequence: `reviews/DLGM-juliet.md` — DLGM after DLG2, before DLG3. HEAD at stamp: `1396405`.

## M1–M6

| Item | Verdict | What landed |
|------|---------|-------------|
| **M1** | **PASS** | Draft is `AnalyzerPosition`. Create seeds `positionFromInput` off-book; Edit takes the book row. |
| **M2** | **PASS** | `direction` is `draft.position.direction`. Hook, three `setDirection` mirrors, race comment: gone. |
| **M3** | **PASS** | `direction` / `optionSide` hooks deleted. `template` derived from legs (`catalogToTemplate(detectFamily)`). STRATEGY writes legs. No `template` on the record. `centerStrike` / `wingWidth` / `userSpot` from `chromeFromLegs`. Chrome named. |
| **M4** | **PASS** | Display reads `record.lock` / `CardLockState`. `net_debit_override` is not a display source. D-PC-7 closed by construction. |
| **M5** | **PASS** | `resolvePackageSide`, `blotterKindFromPackageSide`, `packageDelta`, `fmtIv`, `signedActualQty`, `posAndRatio` on the draft. |
| **M6** | **PASS** | Host hands and receives a record. Book stays `AnalyzerPosition[]`. Create off-book. Edit writes nothing on open. Undo still stores `PositionInput`. No new fields on the record. |

## Greps

| Check | Before → after |
|-------|----------------|
| `AnalyzerPosition` in `PositionBuilder.tsx` | 0 → **9** |
| four shared helpers there | 0 → **non-zero** |
| `direction` / `optionSide` hooks | present → **absent** |
| `net_debit_override` as display | 19 → **0** |
| `OpfRiskAnalyzer` seam | translated `PositionInput` → **hands/receives a record** |

PC5 stayed green the whole packet: `positionBuilder.pc5.test.ts` 13 ok. Undo unchanged (AT-PC-50). Create seed still writes `lock`, `priceSide`, `liveState` defaults via `positionFromInput`.

Gate: `agents/p-options-lab-create-edit-dialog/gate-reports/DLGM-G.md`.

## Held visual (after the gate)

The legs panel is the position card — taken from the card, not re-created. No spec version.

Green on debit / red on credit via `blotterKindFromPackageSide` + `blotterCardBackground`. Language from `CARD_COLUMNS`: EXP, CALL/PUT, BUY/SELL per leg. Controls `surface="card"` at 18px. Dialog chrome (SYMBOL / STRATEGY / Analyze) stays `surface="dialog"`.

Playwright `dlg2-layout.spec.ts` 2 passed against the running app.

## Not this packet

DLG3 is still blocked on this gate. Not started. A Spec version. A GO re-stamp of `DLG-W0`. Deleting `PositionInput` — §2.1 stands; it is the record's inner structure and it stays.
