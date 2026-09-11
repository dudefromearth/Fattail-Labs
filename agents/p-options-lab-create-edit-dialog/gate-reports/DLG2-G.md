# DLG2-G

**Date:** 2026-09-11
**Machine:** Coach's MacBook (dev)
**Seed:** `agents/p-options-lab-create-edit-dialog/seeds/DLG2.md` plus Spec v0.6 §5.2 / AT-DLG-16 · 17
**Depends:** DLG1-G PASS · `8faf9cd` · Spec v0.6 BUILD AUTHORITY (DL-692)
**Verdict:** **PASS**. Nothing deploys.

Layout §5.3 held. HIG is the thirteen laws, not a spacing pass. Echo and Tango
signed AT-DLG-17 **line by line**.

## Files

- `web/components/options-lab/PositionBuilder.tsx`
- `web/lib/options-lab/positionBuilder.pc5.test.ts`
- `web/lib/options-lab/tosCard.test.ts`
- `web/lib/options-lab/dlgHig.test.ts` (new — AT-DLG-11/16/17)
- `web/lib/options-lab/dlgTheme.test.ts` (Buy/Sell hue restated for HIG-8)
- Specs v0.5 (baseline, unedited) · v0.6 (BUILD AUTHORITY)
- `Architecture/00-decision-log.md` DL-692
- `agents/go/DLG-W0.md` re-stamp
- `reviews/DLG2-echo.md` · `reviews/DLG2-tango.md`

`TosControls.tsx` / `AnalyzerPositionsList.tsx` not restyled.

## Spec laws covering files touched

| File | Laws |
|------|------|
| `PositionBuilder.tsx` | DLG-LAYOUT-1…9 · DLG-HIG-1…13 · §3 · DLG-FN-8 · DLG-FN-9 · DLG-THEME-4 (still) · DLG-VOCAB-3 (surface= still) |

## AT-DLG-1…17

| ID | Delta | Evidence |
|----|-------|----------|
| AT-DLG-1 | **BLOCKED** | DLG3/4 — symbol still inert (DLG3) |
| AT-DLG-2 | **BLOCKED** | DLG4 |
| AT-DLG-3 | **PASS** | held from DLG1 |
| AT-DLG-4 | **PASS** | `dlgTheme.test.ts` |
| AT-DLG-5 | **PASS** | held from DLG1 |
| AT-DLG-6 | **PASS** | Structure / Shape / Position / script / actions. PNG+§3. `dlgHig.test.ts` |
| AT-DLG-7 | **BLOCKED** | DLG4 full keyboard walk; focus ring and Return are in place this packet |
| AT-DLG-8 | **BLOCKED** | DLG4 |
| AT-DLG-9 | **PASS** | AT-PC-04 still green |
| AT-DLG-10 | **BLOCKED** | DLG4 |
| AT-DLG-11 | **PASS** | grep: no Submit, Preview, `builder-entry-at`, header Close |
| AT-DLG-12 | **BLOCKED** | DLG3 |
| AT-DLG-13 | **BLOCKED** | DLG3 |
| AT-DLG-14 | **BLOCKED** | DLG3 |
| AT-DLG-15 | **PASS** | `dlgSurface.test.ts` 9 ok |
| AT-DLG-16 | **PASS** | PANEL_W 820, inset 20, off-grid spacing grep empty |
| AT-DLG-17 | **PASS** | Echo + Tango signed each line (`reviews/DLG2-echo.md`, `DLG2-tango.md`) |

## Tests

```
dlgHig.test.ts 9 ok
dlgTheme.test.ts 6 ok
dlgSurface.test.ts 9 ok
positionBuilder.pc5.test.ts 9 ok
tosCard.test.ts 26 ok
chainControls.test.ts 11 ok
```

## Next

DLG3 (symbol). Do not start until this commit is on HEAD. No deploy.
