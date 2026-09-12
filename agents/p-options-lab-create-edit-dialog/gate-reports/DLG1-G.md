# DLG1-G

**Date:** 2026-09-11
**Machine:** Coach's MacBook (dev)
**Seed:** `agents/p-options-lab-create-edit-dialog/seeds/DLG1.md`
**Depends:** DLG0-G PASS · `93b08d8`
**Verdict:** **PASS**. Nothing deploys.

Echo named `--color-code-surface` (`#1c1c1e`, once on `:root`, never overridden).
Dialog consumes application tokens. Card still blotter. Chrome (DLG2) not started.

## Files

**Seed allowlist**

- `web/styles/tokens.css` (additive `--color-code-surface` only)
- `web/components/options-lab/TosControls.tsx` (dialog appearance branch)
- `web/components/options-lab/PositionBuilder.tsx` (tokens; card tokens/hex/palette stripped)
- `web/lib/options-lab/dlgTheme.test.ts` (new)
- `web/lib/options-lab/dlgSurface.test.ts` (dialog no-grow assert)

**Same-day record (plan S2/S6)**

- `Architecture/00-decision-log.md` (DL-691)
- `agents/p-options-lab-create-edit-dialog/reviews/DLG1-echo.md`

`AnalyzerPositionsList.tsx` not touched. `AppearanceRoot.tsx` not touched.

## Spec laws covering files touched

| File | Laws |
|------|------|
| `tokens.css` | DLG-THEME-4 named exception |
| `TosControls.tsx` | DLG-VOCAB-1/2/3 · DLG-HIG-3 · PC-HIG-8 on card |
| `PositionBuilder.tsx` | DLG-THEME-1…5 · DLG-HIG-1 |

## AT-DLG-1…15

| ID | Delta | Evidence |
|----|-------|----------|
| AT-DLG-1 | **BLOCKED** | DLG4 |
| AT-DLG-2 | **BLOCKED** | DLG4 |
| AT-DLG-3 | **PASS** | No `[color-scheme:dark]`. Panel `var(--color-surface)` / `var(--color-label)`. Follows document `data-theme`. |
| AT-DLG-4 | **PASS** | Grep empty for card tokens, hex, palette in `PositionBuilder.tsx`. Script uses `var(--color-code-surface)` only as the named exception. |
| AT-DLG-5 | **PASS** | `--text-title-3`, `--text-body`, `--hit-min`, `--radius-lg`, `--color-tint` — honour `data-font-size` / `data-density` / `data-corners` / `data-tint`. |
| AT-DLG-6 | **BLOCKED** | DLG2 |
| AT-DLG-7 | **BLOCKED** | DLG4 |
| AT-DLG-8 | **BLOCKED** | DLG4 (dialog `--hit-min` at rest is in place; gate assert is DLG4) |
| AT-DLG-9 | **BLOCKED** | DLG4 · AT-PC-04 still green |
| AT-DLG-10 | **BLOCKED** | DLG4 |
| AT-DLG-11 | **BLOCKED** | DLG2 |
| AT-DLG-12 | **BLOCKED** | DLG3 |
| AT-DLG-13 | **BLOCKED** | DLG3 |
| AT-DLG-14 | **BLOCKED** | DLG3 |
| AT-DLG-15 | **PASS** | `dlgSurface.test.ts` 9 ok. Card grow-on-hover kept. Dialog no growBox. |

## Tests

```
dlgSurface.test.ts 9 ok
dlgTheme.test.ts 6 ok
tosCard.test.ts 26 ok
positionBuilder.pc5.test.ts 9 ok
```

## Next

DLG2 (chrome / layout / verbs / removals). Do not start until this commit is on HEAD. No deploy.

## Post-hoc — DL-698 · §12

AT-DLG-4 **PASS**ed "zero hex." That grep cannot see a buy/sell branch
once the hexes are tokens. The branch survived this commit (tokens) and
died at `029a6a1`. A criterion a regression can satisfy is not a gate.
See DL-698.
