# DLG1 — Theme (before chrome)

**Status:** OPEN · **Machine:** Coach's MacBook (dev) · **Nothing deploys.**
**Phase:** DLG1
**Depends:** DLG0-G PASS
**Laws:** DLG-THEME-1…5 · DLG-HIG-1 · DLG-HIG-3
**ATs named:** AT-DLG-3 · AT-DLG-4 · AT-DLG-5
**Gate:** `gate-reports/DLG1-G.md` — fifteen-row table. Echo sits.
**Do not start before DLG0-G PASS.** Theme before chrome is the governing sequence.

Amendments become DLG1b. Never edit this file.

## Exact files

- `web/styles/tokens.css` (Echo **additive** named code-surface token only)
- `web/components/options-lab/TosControls.tsx` (dialog appearance branch)
- `web/components/options-lab/PositionBuilder.tsx` (consume application tokens; strip card tokens / hex / palette)
- `web/lib/options-lab/dlgTheme.test.ts` (new)
- `web/lib/options-lab/dlgSurface.test.ts` (keep AT-DLG-15 green; dialog no longer shares grow-on-hover)

Delta **FAIL**s any extra file.

## Intent

1. **Echo names** the code-surface token in `tokens.css`. Dark in both `data-theme` values. Lima records the name in the same-day DL. The exception is the token, never a hex in `PositionBuilder.tsx`.
2. Dialog renders from existing application tokens (`--color-surface`, `--color-label`, `--color-tint`, `--color-success`, `--color-destructive`, `--text-*`, `--space-*`, `--radius-*`, `--hit-min`, `--elevation-*`). Honour `data-theme`, `data-font-size`, `data-density`, `data-corners`, `data-tint` as the rest of the product does. Charlie does **not** invent a parallel token set.
3. Strip from `PositionBuilder.tsx`: `FIELD_FILL`, `OL_DATA`, `OL_CHROME`, `cardSelect`, `h-[18px]`, literal hex, Tailwind palette classes. AT-DLG-4 grep (plan §7) is the oracle. One remaining `OL_DATA` is FAIL.
4. `surface="dialog"`: `--hit-min` at rest; **no** grow-on-hover. `surface="card"` keeps PC-HIG-8.
5. Buy/Sell and payoff stroke: `--color-success` / `--color-destructive`. Script block: named code-surface token only. Script **content** unchanged (`@LMT`).

## Out

Layout reorder · symbol picker behaviour · `onSave` wire · Preview/Submit/Done removals (DLG2) · card restyle · `AppearanceRoot.tsx` · `AnalyzerPositionsList.tsx` · a second appearance plane.

## Gate notes

Echo signs token mapping and contrast in both themes (DLG-THEME-5). AT-DLG-4 is a grep, not an opinion. AT-DLG-15 remains PASS. Card `tosCard.test.ts` ATs remain green.
