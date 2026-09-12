# DLGM-G — common model

**Date:** 2026-09-12
**Machine:** Coach's MacBook (dev)
**Token:** `agents/go/DLGM.md` (DL-697)
**HEAD at stamp:** `1396405`
**Verdict:** **PASS** M1–M6. PC5 green. Undo unchanged. No new fields on
`AnalyzerPosition`. Nothing deploys.

## Greps

| Check | Before | After |
|-------|--------|-------|
| `AnalyzerPosition` in `PositionBuilder.tsx` | 0 | **9** |
| four shared helpers there | 0 | **non-zero** (`resolvePackageSide`, `blotterKindFromPackageSide`, `packageDelta`, `fmtIv`) |
| `useState<TradeDirection>` / `useState<OptionRight>` | present | **absent** |
| `setDirection` | present | **absent** |
| `net_debit_override` as display (`debitShown`) | 19 file uses | **0** in the display block |
| Host seam `handleBuilderSave(record: AnalyzerPosition)` | translated `PositionInput` | **hands/receives a record** |
| `undoStack.draft` | `PositionInput` | **unchanged** |
| New fields on `AnalyzerPosition` | — | **none** |

## M1–M6

| Item | Delta | Evidence |
|------|-------|----------|
| **M1** | **PASS** | `useState<AnalyzerPosition>`; Create `positionFromInput` off-book; Edit `initial` is the book row |
| **M2** | **PASS** | `direction` is `position.direction`; no hook; race comment gone |
| **M3** | **PASS** | `catalogToTemplate(detectFamily(legs))`; `chromeFromLegs` for center/width/right. Chrome state named (copied, notices, drag, seed refs). No `template` on the record |
| **M4** | **PASS** | `record.lock.mode === "locked"`; D-PC-7 restated and green |
| **M5** | **PASS** | helpers imported and used (`data-blotter-kind`, `data-pkg-delta`, `data-iv`, VOL via `fmtIv`, DELTA via `fmtPackageDelta`) |
| **M6** | **PASS** | `onSave(record)`; `onLivePatch(record)`; `applyEditPatch` still takes `.position`; create undo draft is `pos.position` |

## PC5

```
positionBuilder.pc5.test.ts 13 ok
tosCard.test.ts 26 ok (D-PC-7)
lock.pc6.test.ts 9 ok
```

AT-PC-04 Edit writes nothing. AT-PC-50 undo still `PositionInput`. AT-PC-22 Create draft off-book.

## Held visual (after this gate)

Legs panel is the position card. Taken from the card, not re-created.
No spec version.

- `CARD_COLUMNS` language: EXP, CALL/PUT, BUY/SELL per leg
- `blotterCardBackground` + `blotterKindFromPackageSide` (green debit / red credit)
- Controls `surface="card"` at 18px (`CARD_TH` / `CARD_TD` / `cardSelect` / `FIELD_FILL`)
- Dialog chrome (SYMBOL / STRATEGY / actions) stays `surface="dialog"`

PC5 still 13 ok after the visual.

## Not this gate

DLG3 symbol. A Spec version. `DLG-W0` restamp.
