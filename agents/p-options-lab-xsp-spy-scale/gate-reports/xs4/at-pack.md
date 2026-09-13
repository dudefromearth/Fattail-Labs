# XS4 AT pack — evidence index

**Date:** 2026-09-13  
**Landed:** `origin/main` (XS packet). Recapture Next: PR6 worktree `:3000`. API `:4000` main.  
**First run** (WIDTH-1 Next): `playwright.txt` — AT-XS6/9/10 live FAIL expected.  
**Recapture:** `playwright-recapture.txt` — **5 passed**. Shots 04/06/07 overwritten with PASS.

| Id | Result | Evidence |
|----|--------|----------|
| **AT-XS1** | PASS (unit) | `helper-unit-tests.txt` `builderCreateDefault.test.ts` |
| **AT-XS2** | PASS (unit) | same — NDX/RUT/QQQ/IWM/AAPL butterfly 20 |
| **AT-XS2b** | PASS (unit) | OD-XS9 (a): XSP vertical 20, iron_condor 40; SPY vertical 5; NDX vertical 50 |
| **AT-XS3** | PASS (grep) | `grep-leftovers.txt` — `s === "SPX" \|\| s === "XSP"` return 20 still present |
| **AT-XS4** | PASS (live Create) | `01-xsp-1-wide.png` 765/766/767 at spot 765.70; walk `05-xsp-width-walk.png` |
| **AT-XS5** | PASS (live + unit) | `03-spx-20-wide.png` 7635/7655/7675; unit NDX/RUT/QQQ/IWM/AAPL 20 |
| **AT-XS5b** | PASS (grep) | `defaultWidth` still `NDX` / `NQ*` → 50 |
| **AT-XS6** | PASS live recapture | `04-xsp-template-reseed.png` · `playwright-recapture.txt`. First run FAIL was WIDTH-1 Next |
| **AT-XS7** | PASS (unit) | `heatmapColumnWidths.test.ts` |
| **AT-XS7b** | PASS (unit) | same |
| **AT-XS7c** | PASS (unit) | interior `[1,2,3]` |
| **AT-XS7d** | PASS (unit) | `[1..8]` not clamped |
| **AT-XS7e** | PASS (unit) | coerce keeps `market_symbol_universe` |
| **AT-XS7f** | PASS (unit) | runner `cols[].widthPts` === panel list |
| **AT-XS7g** | PASS (live SQL) | `profile-live.json` — exactly SPY, XSP |
| **AT-XS8** | PASS (unit + live SPX shot) | `08-heatmap-spx-cols.png` 10…50 |
| **AT-XS8b** | PASS (unit) | NDX/RUT/VIX + QQQ/IWM/AAPL freeze `[10…50]` — QQQ/IWM **not** “fixed” |
| **AT-XS9** | PASS live recapture | `06-heatmap-xsp-cols.png` columns 1–7. First run FAIL was WIDTH-1 Next |
| **AT-XS10** | PASS live recapture | `07-width-fit-xsp.png` footer 7 · `09-width-fit-spx.png` footer 9 |
| **AT-XS11** | PASS (unit + live) | `listedWingChoices.test.ts`; `02-spy-listed-honesty.png` 744/764/784 — prefer=1, honest 20, not a lying 1-wide |
| **AT-XS12** | PASS (pytest) | `pytest-symbol-profile.txt` — 8 passed |
| **AT-XS12b** | PASS (live SQL) | `profile-live.json` / `profile-live.txt` |
| **AT-XS13** | PASS (unit) | `FLY_MAX_WIDTHS >= 9` |
| **AT-XS14** | PASS (this PR) | Diff is e2e + pytest + `gate-reports/xs4/` only. No `AnalyzerPositionsList.tsx` |
| **AT-XS15** | PASS (unit grep) | panel ingestKey / `lastIngestRef` in `heatmapColumnWidths.test.ts` |
| **AT-XS16** | PASS (live) | Create test: `builder-width` / `builder-center` / `builder-expiration` count 0 |
| **AT-XS17** | PASS (unit) | `profileLine` universe vs kind default |
| **AT-XS18** | PASS (unit) | empty list → `(no column list)` |
| **AT-XS19** | PASS (unit) | SPX chrome + source token |
| **AT-XS20** | PASS (unit) | TESTSYM overlay `[2,4,6]` |
| **AT-XS21** | PASS (unit) | TESTSYM kind-default → 10…50 |

## Live migrate-152 (AT-XS12b)

| Symbol | mode | fly_widths | fetch_step_floor |
|--------|------|------------|------------------|
| XSP | fixed_points | [1..7] | **5.0** unchanged |
| SPY | fixed_points | [1..7] | **2.5** unchanged |
| SPX | msc_spx | [20…50] | 5.0 |
| VIX | msc_spx | [20…50] | 5.0 |

`fixed_points` rows = **exactly** XSP, SPY (AT-XS7g).

## Commands

- `npx tsc --noEmit` (web) — exit 1, **34 pre-existing** errors in algo/LIM/blotter tests. **Zero** in XS files. See `tsc.txt`.
- `pytest tests/test_symbol_profile.py` — **8 passed**
- `npx --yes tsx` helper tests — heatmapColumnWidths 18, builderCreateDefault 10, listedWingChoices 5
- Playwright vs `http://localhost:3000` — first run Create PASS, AT-XS6/9/10 FAIL (WIDTH-1 Next). Recapture **5 passed** (`playwright-recapture.txt`)
