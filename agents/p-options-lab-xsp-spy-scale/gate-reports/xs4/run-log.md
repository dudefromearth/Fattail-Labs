# XS4 run log

**When:** 2026-09-13  
**Worktree:** `/Users/ernie/Fattail-Labs-execute-plan/pr-5`  
**Branch:** `execute-plan/9cd75099-pr-5-at-pack-e2e-pytest-live-migrate-152-evidence-xs4`

## Could run

| Command | Result |
|---------|--------|
| Live SELECT migrate-152 (labs @ 127.0.0.1:3306) | PASS — `profile-live.json` |
| `pytest tests/test_symbol_profile.py` | 8 passed |
| `npx --yes tsx` heatmapColumnWidths / builderCreateDefault / listedWingChoices | all ok |
| `npx tsc --noEmit` (web, sibling `node_modules`) | exit 1, 34 errors, all pre-existing (algo/LIM/blotter tests). No XS-file errors |
| Grep leftovers | OD-XS9 (a) `productWingHint` XSP→20 still present; `defaultWidth` NDX→50 kept; no QQQ/IWM in helper overlay; no AnalyzerPositionsList |
| Playwright Create AT-XS4/5/11/16 | PASS — shots 01, 02, 03 |
| Playwright XSP walk | PASS after poll — shot 05 |
| Playwright heatmap SPX 10…50 | shot 08 (columns 10…50 as required) |
| Playwright Width Fit SPX footer 9 | shot 09 |

## Could not run (honest)

Live Next `:3000` cwd = `/Users/ernie/Fattail-Labs/web` **main `a27f187` WIDTH-1**. API `:4000` cwd = `/Users/ernie/Fattail-Labs/server`. This worktree’s PR2/PR3 are **not** the processes on those ports. Did **not** stop or restart them.

| Spec vs live Next | Why |
|-------------------|-----|
| AT-XS6 `handleTemplate` butterfly stays 1 | Live `handleTemplate` still reseeds 20. Shot `04-xsp-template-reseed.png` 746/766/786 |
| AT-XS9 XSP heatmap columns 1–7 | Live still DL-435 10…50. Shot `06-heatmap-xsp-cols.png` |
| AT-XS10 XSP Width Fit footer 7 | Live footer 9. Shot `07-width-fit-xsp.png` |

Unit tests for those ATs **PASS on this worktree**. They will pass in Playwright once Next serves this tree.

## Leftovers (do not “fix”)

- `productWingHint`: `s === "SPX" \|\| s === "XSP"` → 20 remains (OD-XS9 a)
- QQQ/IWM heatmap still 10…50 (XS-ETF deferred)
- `fetch_step_floor` not edited
