# LIMS-1 — Delta gate v1.0

**Date:** 2026-10-08
**Verdict:** **PASS**
**Delta did not edit the work under review.**

The quad scale is the shared ATM-straddle rule. StudioTwo dev is running it. This is not a production stamp.

## What passed

| ID | Result |
|---|---|
| AT-LIMS1 | PASS. Hotel fixtures and a saturated centre stay strictly inside (−100, +100). Float64 `tanh` hits ±1 near \|r\| ≈ 20; displayed X then steps one ulp inside the edge. `xUnclamped` stays `100·r`. |
| AT-LIMS2 | PASS. F6 centre < F1 centre < F2 centre, and the displayed X values keep that order. |
| AT-LIMS3 | PASS. 3,268 SPX minutes from the calibration sample. Type-7 median \|x\| = 11.130000000000003, inside 11.13 ± 0.5. Fixture `web/lib/options-lab/templates/lim.straddle-spx.json`. |
| AT-LIMS4 member | PASS. Missing ATM call or put → `valid: false` and `Quad window unavailable for {symbol} {expiration}: ATM straddle not available.` Quadrant render hides the disc. |
| AT-LIMS4 admin | **Not passed. Known gap.** Admin Notifications Spec v1.1 does not exist. No admin record was written. MS-9 was not built. |
| AT-LIMS5 | PASS. `S ≤ 0` uses the same member sentence and `valid: false`. |
| AT-LIMS6 | PASS. Absent, empty, `0`, `-1`, `NaN`, and `Infinity` abort with `LimConfigError` naming `LABS_LIM_STRADDLE_K`. |
| AT-LIMS7 | **Held books, not RTH.** Clock at the attempt was 2026-10-08 23:13 America/New_York, after the cash close. Headless Chromium on `http://studiotwo:3000` after `/api/auth/dev-login`. Template `lim`, expiration `2026-10-09`. Each symbol painted a disc whose centre was inside the quad. The page text did not contain `No centre scale`. Status on the successful frames was **Held**. |
| AT-LIMS8 | PASS for the running system. Zero hits in `web/lib`, `web/components`, `web/.env`, `web/.env.local`, `web/.env.example`, Arch 29, and spec v0.4.8. The repo is not zero. 41 historical files still name the retired key, including v0.4.7, the amendment series, older specs, plans, and DL-820, which records the old rule. Those files were not edited to clean the grep. |
| AT-LIMS9 | PASS. F8 `xUnclamped` is `100·r` and lies past ±100. Displayed X does not. The panel still observes `xUnclamped`. Ghosts still use `limGhostXY`. |

Held frames (disc centre inside the quadrant rectangle):

| Symbol | Lean on the frame | Disc |
|---|---|---|
| SPX | 16.8 | inside. Spot 7,765.36. One held minute, not the sample median of 11.13. |
| XSP | (disc inside; screenshot `/tmp/lims-shots/XSP.png`) | inside |
| SPY | −35.4 | inside. Spot 773.93. A first pass during Connecting showed `No spot for SPY.` The retry after the contract loaded showed the disc. |
| QQQ | disc inside | inside |
| AAPL | disc inside | inside |
| TSLA | disc inside | inside |

Screenshots: `/tmp/lims-shots/{SPX,XSP,SPY,QQQ,AAPL,TSLA}.png`.

## Tests

From `web/`:

```
npx --yes tsx lib/options-lab/templates/lim.test.ts
npx --yes tsx lib/options-lab/templates/limQuadrant.test.ts
npx --yes tsx lib/options-lab/templates/lim.c2.test.ts
npx --yes tsx lib/options-lab/templates/lim.zeroFetch.test.ts
npx --yes tsx lib/options-lab/templates/lim.vocab.test.ts
npx --yes tsx lib/options-lab/templates/limTrail.test.ts
```

Each printed its ok line. `lim.test.ts` exited 0 after `lim.test.ts ok`.

## Parent spec

`Specs/FatTail Labs — Heatmap LIM Template — Specification v0.4.7.md` sha1 `2d25e3f99a580b4e29058e720ca7f1424bc9c710` before and after. The new file is v0.4.8.

## Not in this pass

DudeTwo was not deployed. `infra/deploy.md` ships a git checkout, and this work is uncommitted. MiniTwo was not touched. The admin half of AT-LIMS4 remains open.
