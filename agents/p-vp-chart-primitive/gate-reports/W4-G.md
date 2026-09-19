# W4-G — Verification and close-out

**Verdict:** GO  
**Date:** 2026-09-19  
**Seat:** Charlie + Kilo  
**Law:** AZ-VP-9-A23 · DL-764  
**Machine:** StudioTwo. `:3000` (pid 30263) and `:4000` (uvicorn) left running. No MiniTwo.

W1-G / W2-G / W3-G already PASS. This packet is static + SSR + unit verification of the as-built primitive path. Interactive pan/zoom Playwright is **not claimed**.

## GO / NO-GO

**GO** — member and admin mounts paint via `ISeriesPrimitive`; overlay demolition holds; guest-layer law holds. Overlay symbols are gone from `web/`.

## Evidence

1. **Member SSR** `GET http://127.0.0.1:3000/app/options-lab/volume-profile` → **200**. HTML contains `data-vp-paint="primitive"` (1) on `data-testid="sa-price-chart"`. **Does not** contain `sa-vp-overlay` or `data-vp-overlay` (0).
2. **Admin twin** `SaDevCanvas` (`web/components/admin/SaDevCanvas.tsx` L8) still `import SaPriceChart from "@/components/sa/SaPriceChart"` and renders `<SaPriceChart …>` (L260). `GET http://127.0.0.1:3000/admin/sa-dev` → **200**, same `data-vp-paint="primitive"`, no `sa-vp-overlay`.
3. **Tests** (`cd web && npx tsx lib/saVpBand.test.ts && npx tsx lib/saVpSeries.test.ts`): `saVpBand.test.ts ok` · `saVpSeries.test.ts ok`.
4. **Grep `web/`** for `redrawVp`, `sa-vp-overlay`, `SA_VP_OVERLAY_ENABLED`: **empty** (`rg` exit 1). `setInterval(ensure` gone. Remaining `setInterval` is the 500 ms live-flag stale timer (not the demolished 250 ms band poll).
5. **Wire:**
   - `series.attachPrimitive(primitive)` at series create (`SaPriceChart.tsx` L147–148); `detachPrimitive` on teardown (L160–161).
   - `/range` `applyBins` sets `paintRef.current.bins` then `requestVpUpdate()` → `primitive.requestUpdate()` (L458–461, L119–120). No 2D blit from the fetch path.
   - `VpHistogramPrimitive.updateAllViews()` binds `priceToCoordinate` and pane y-window (`saVpSeries.ts` L140–149).
   - `zOrder()` returns `"top"` (`saVpSeries.ts` L104–106).
   - Context menu uses primitive `hitTest` + `hostToPane` (`SaPriceChart.tsx` L626–635). Implementer choice recorded: **LWC `ISeriesPrimitive.hitTest`**, not overlay `hitRects` walk in the menu handler.
   - `clearHistogram()` before new OHLC fetch (L171) and on band-epoch change before `/range` (L370–372).
6. **Guest-layer:** no `autoscaleInfo` on the primitive class (`saVpSeries.ts` grep empty). Test asserts `"autoscaleInfo" in prim === false`. Candle OHLC object identity preserved in `saVpSeries.test.ts`.
7. **Line counts vs `HEAD`** (committed Phase-B overlay baseline):

| file | HEAD | now | Δ lines | numstat +/− |
|------|------|-----|---------|-------------|
| `web/components/sa/SaPriceChart.tsx` | 517 | 657 | +140 | +240 / −100 |
| `web/lib/saVpSeries.ts` | 130 | 200 | +70 | +147 / −77 |
| `web/lib/saVpBand.ts` | 91 | 163 | +72 | +79 / −7 |
| `web/lib/saVpBand.test.ts` | 60 | 133 | +73 | +74 / −1 |
| `web/lib/saVpSeries.test.ts` | — (untracked) | 67 | +67 | new |

Core four tracked files: **+540 / −185**. Plus new 67-line primitive test.

`git grep` on `HEAD` still had `redrawVp` (6 call sites) and `setInterval(ensure, 250)` in `SaPriceChart.tsx`. Working tree does not.

## Files changed this program (A23 W1–W4)

- `web/components/sa/SaPriceChart.tsx`
- `web/lib/saVpSeries.ts`
- `web/lib/saVpSeries.test.ts` (new)
- `web/lib/saVpBand.ts`
- `web/lib/saVpBand.test.ts`
- `agents/p-vp-chart-primitive/` (board, seeds, W1–W4 gates)
- `Specs/AZ-VP-9-A23.md` (law; untracked copy of frozen source)

Member page / `VolumeProfileSaSurface` / `SaDevCanvas` working-tree diffs include **Data Delivery** (`continuous`, `/api/app/vp/v1/…`) — **not** this program. Do not attribute those to A23.

## Deviations from AZ-VP-9-A23

1. **Acceptance “Deleted plumbing exceeds added code”** — **not met** on `git diff --stat` vs `HEAD`. Overlay plumbing is gone; net growth is primitive lifecycle, pane-only band, inflight queue, and tests. Recorded, not hidden.
2. **W4 interactive exercises not run:** throttled `/range`, resize-to-tiny-and-back, pan/zoom storms, symbol flip mid-fetch, TF change, Strict Mode remount. No Playwright suite exists for this widget. Cold SSR of both mounts: PASS. Audit finding 4 (`redrawVp` sub-8px abort) is gone as **code** (function deleted; engine owns paint). Runtime “next engine frame” not observed in a browser this packet.
3. **Same-day as-built DL** not written here (parent Lima). **DL-764** GO is in `Architecture/00-decision-log.md`. `Architecture/35-options-lab-volume-profile.md` already describes the primitive as-built and cites **DL-765**, which is **not yet** a decision-log entry — Lima must land or retitle that cite.
4. India drift: paint path matches A23 (attach + `requestUpdate` + no overlay + zOrder top + no autoscale). Fetch-band contract in `saVpBand.ts` still pane-only (`panePriceWindow`). Structural-analysis hooks (`SaPartDialog` / overlay feature off by default) untouched by this grep.

## Not claimed

Playwright of blue bars. MiniTwo. VP service / API / ingest.
