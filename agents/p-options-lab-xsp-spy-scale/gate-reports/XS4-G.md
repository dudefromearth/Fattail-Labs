# XS4-G — Acceptance pack

**Delta** · 2026-09-13 · plan v1.3 · OD-XS1 (a)

**PASS**

Live Next at recapture: PR6 worktree `/Users/ernie/Fattail-Labs-execute-plan/pr-6/web` serving `:3000` (XS packet). API `:4000` main uvicorn. Did not stop servers. Did not SSH MiniTwo.

| Id | Result | Evidence |
|----|--------|----------|
| AT-XS1 / 2 / 2b / 3 / 5b | PASS unit | `xs4/helper-unit-tests.txt` |
| AT-XS4 XSP Create 1-wide | PASS live | `01-xsp-1-wide.png` |
| AT-XS4 walk 1…7 | PASS live (retry after one off-market flake at 20) | `05-xsp-width-walk.png` |
| AT-XS5 SPX 20-wide | PASS live | `03-spx-20-wide.png` |
| AT-XS6 template does not re-seed 20 | PASS live | `04-xsp-template-reseed.png` |
| AT-XS7 / 7b / 7c / 7d / 7e / 7f / 7g | PASS unit + SQL | helper tests · `profile-live.json` |
| AT-XS8 / 8b | PASS unit + live SPX | `08-heatmap-spx-cols.png` · QQQ/IWM freeze **FI-050** |
| AT-XS9 XSP heatmap 1–7 | PASS live | `06-heatmap-xsp-cols.png` |
| AT-XS10 Width Fit XSP footer 7 | PASS live | `07-width-fit-xsp.png` · SPX `09-width-fit-spx.png` |
| AT-XS11 SPY listed honesty | PASS live | `02-spy-listed-honesty.png` |
| AT-XS12 / 12b | PASS pytest + live SELECT | `pytest-symbol-profile.txt` · `profile-live.json` |
| AT-XS13…21 | PASS unit | helper tests |
| AT-XS14 | PASS | no `AnalyzerPositionsList.tsx` |
| AT-XS16 | PASS | builder-width / centre / expiration count 0 |
| tsc | pre-existing 34, **zero** in XS files | `tsc.txt` |
| e2e tracked | `web/e2e/width1-xsp-spy.spec.ts` · OUT this board `xs4/` | `playwright-recapture.txt` **5 passed** |

Prior `playwright.txt` FAILs were honest: live Next was WIDTH-1 `a27f187`. Recapture supersedes AT-XS6 / 9 / 10 live rows only.
