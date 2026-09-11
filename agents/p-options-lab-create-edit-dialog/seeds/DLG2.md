# DLG2 — Chrome / layout

**Status:** OPEN · **Machine:** Coach's MacBook (dev) · **Nothing deploys.**
**Phase:** DLG2
**Depends:** DLG1-G PASS
**Laws:** DLG-LAYOUT-1…9 · DLG-HIG-1 · 2 · 4 · 9 · §3 · DLG-FN-8
**ATs named:** AT-DLG-6 · AT-DLG-11
**Gate:** `gate-reports/DLG2-G.md` — fifteen-row table. Echo + Tango sit.
**Do not start before DLG1-G PASS.** Restyling on card tokens then re-theming is forbidden.

Amendments become DLG2b. Never edit this file.

## Exact files

- `web/components/options-lab/PositionBuilder.tsx`
- `web/lib/options-lab/positionBuilder.pc5.test.ts` (restate AT-PC-23 verbs; **keep AT-PC-04**)
- `web/lib/options-lab/tosCard.test.ts` (drop `builder-entry-at` requirement; keep card ATs and shared-control ATs)

Delta **FAIL**s any extra file.

## Intent

1. Title: "Create Position" / "Edit Position" with symbol and spot context beneath. **No Done, no Close in the header.**
2. Structure: **strategy selector first**. Directly beneath it: payoff icon · Buy/Sell · derived name. Right (Call/Put) Structure-level for `TEMPLATE_HAS_SIDE` only; hidden for straddle / strangle / iron fly / iron condor. Per-leg right stays on Add Leg.
3. Shape: centre, width, expiration, legs. Position: basis and package count **once**.
4. ToS script: labelled block, copy action, code-surface token. Content unchanged.
5. Actions: Create **Analyze · Cancel**. Edit **Update · Cancel**. Committing action visually dominant. Analyze uses `data-testid="builder-analyze"` (never `position-builder-analyze`). `onClick` may wait for DLG4.
6. **Remove** Preview, entry time (`builder-entry-at` and hour/min/AM-PM fields), Submit (`position-builder-submit`), header Close (`position-builder-close`).
7. Keep free-floating: `panelPos`, `aria-modal="false"`, `PANEL_W = 770`, drag handle, Escape (~794–801).
8. Restate characterization this Spec supersedes. Do not delete the test files.

**Do not build Preview, entry time, or Submit — even though `docs/reference/tos/dialog-target-layout.png` draws them.** §3 overrides the PNG.

## Out

Symbol behaviour (DLG3) · `onSave` wire (DLG4) · TosControls restyle · host restyle · modal · PNG-faithful Preview / entry time / Submit.

## Gate notes

Echo: side-by-side vs PNG **as amended by §3**, both themes, 100% zoom.
Tango: Analyze / Update / Cancel copy; one commit, one dismiss.
AT-DLG-3/4/5/15 remain PASS. AT-DLG-11 grep (plan §7).
