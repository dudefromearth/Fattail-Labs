# Volume Profile Rendering Audit — Lightweight Charts

**Date:** 2026-09-19  
**Machine:** StudioTwo (dev)  
**Scope:** FatTail Labs VP/structure app, Lightweight Charts widget  
**Mode:** Read-only assessment. No code changes in the audit pass.

---

## Verdict

**Overlay-based, not a live primitive.**

The histogram that actually paints is a **sibling `<canvas>`** (`data-testid="sa-vp-overlay"`) drawn with the Canvas 2D API. It is **not** in Lightweight Charts’ paint loop.

`ISeriesPrimitive` exists in `web/lib/saVpSeries.ts` (`VpHistogramPrimitive`, `paneViews`, `draw`, zOrder `"top"`). **Nothing in the app calls `attachPrimitive()`.** The live import in `SaPriceChart` is only `paintProfile` / `asVpBins` / `emptyPaint`.

---

## 1. Rendering path

| Role | File |
|------|------|
| Member page | `web/app/app/options-lab/volume-profile/page.tsx` |
| Surface | `web/components/options-lab/VolumeProfileSaSurface.tsx` (mounts `SaPriceChart` ~L114) |
| Admin twin | `web/components/admin/SaDevCanvas.tsx` (~L260) |
| Chart widget | `web/components/sa/SaPriceChart.tsx` |
| Paint + unused primitive | `web/lib/saVpSeries.ts` |
| Band fetch / slice | `web/lib/saVpBand.ts` |
| HTTP | `web/lib/saDelivery.ts` → `/api/app/vp/v1/range/…` |

Lightweight Charts owns `hostRef` (`createChart`, `SaPriceChart.tsx` L136–147). The profile owns `overlayRef` (L611–615): `pointer-events-none absolute inset-0 z-10`.

`SaStructureChart.tsx` is a leftover SVG/structure path and is **not** on this widget.

---

## 2. Primitive (dead code only)

If it were attached:

| Check | Status |
|-------|--------|
| `paneViews()` | Returns `[this._view]` — `saVpSeries.ts` L121–123 |
| `renderer().draw()` | `VpRenderer.draw` → `useMediaCoordinateSpace` → `paintProfile` — L73–83, L96–98 |
| `updateAllViews()` | **Not implemented** |
| zOrder | `"top"` — L92–94 |
| `attached` / `requestUpdate` | Wired in the class — L111–127 |
| **Attached to a series?** | **No.** No `attachPrimitive` in app code |

Step 2 does not describe production behavior.

---

## 3. Overlay handshakes

All in `web/components/sa/SaPriceChart.tsx` unless noted.

| Handshake | Where |
|-----------|--------|
| Price → pixel | `series.priceToCoordinate(p)` inside `redrawVp` L130 |
| Visible y-window (fetch band) | `coordinateToPrice(0)` / `coordinateToPrice(el.clientHeight)` L362–365. Host height **includes the time axis**, so this is not pane-only |
| Fallback y if scale unread | min/max of loaded candles L368–377 |
| Resize | `ResizeObserver` on host L148–156 → `chart.resize` + `redrawVp`. Overlay is **not** the observed node |
| Time pan/zoom → overlay | `subscribeVisibleTimeRangeChange(() => redrawVp())` L157 — **no unsubscribe** in that effect; relies on `chart.remove()` L160 |
| Time pan/zoom → refetch | second `subscribeVisibleTimeRangeChange(onRange)` L463–468 (this one **is** unsubscribed) |
| Time pan/zoom → H/L lines | third subscription L343–346 |
| Histogram fetch | independent `/range` L400–454; completion calls `redrawVp()` L436 — **outside** LWC paint |
| Poll | `setInterval(ensure, 250)` L462 |
| Prefs / candles | `redrawVp()` after OHLC `setData` L193, paint prefs L226, canvas/series options L240, stream `onGen` L563 |
| Hit-test | overlay `hitRects` vs wrapper `onContextMenu` L591–605 |
| Layout | wrap `relative min-h-0 flex-1` L577–580; host `h-full` L610; overlay `absolute inset-0` L611–615 |

`redrawVp` (L113–131): if overlay/host/series is missing, or `clientWidth`/`clientHeight` &lt; 8, **return with no draw**. That is a silent miss, not an engine retry.

---

## 4. Lifecycle

Chart + candlestick series are created **once** (`useEffect` `[]`, L133–164). Symbol / timeframe change does **not** recreate the series; it `setData`s (L178) and nulls `bandRef` (L352) then refetches `/range`.

| Event | Profile | Risk |
|-------|---------|------|
| Symbol / TF | New OHLC + new `/range`; overlay canvas kept | Stale `paintRef.bins` until fetch returns; overlay can show old histogram on new candles |
| Widget unmount | `chart.remove()`; overlay is React-owned | Overlay gone with the component. Chart-create listener at L157 is not explicitly unsubscribed |
| Strict Mode remount | New `createChart`; old chart removed | Overlay ref can race the first `redrawVp` |
| Series rebuild | **None** — series is not rebuilt | N/A. Comment at L51–59 still says “L2 custom series”; that path is gone |
| Keep-alive | `VpSurfaceKeepAlive` returns `null` | Page is the only mount |

`inflightRef` can drop a needed refetch if `ensure()` runs while a request is open (L391).

---

## 5. Redraw timing vs candle data

`/range` is **not** tied to OHLC completion.

1. Band effect bails if `spanFloor` / `spanCeiling` is missing (L354–356) — health race.
2. Fetch completes → `paintRef.current.bins = bins` → `redrawVp()` (L433–436). That is an **immediate 2D blit**, not `requestUpdate` on the chart model.
3. If the price scale has no range yet, `priceToCoordinate` is null → bars skipped (`saVpSeries.ts` L62). Next chance is resize, 250 ms poll, or a time-range event.
4. Visible slice uses `paint.visibleLo` / `visibleHi` (`saVpBand.ts` `sliceVisible` L49–57). Empty slice falls back to all bins (`saVpSeries.ts` L47–51). Overlay can still be empty if every `yOf` is null.
5. OHLC `setVisibleRange` (L185–188) then `redrawVp` (L193) can run **before** `/range` bins exist.

---

## Ranked fragility (steps 3–5)

1. **Not in the chart paint loop** — every pan/zoom/resize/data event must remember to call `redrawVp`. Miss one → blank or stale profile. This is the unreliability.
2. **`priceToCoordinate` / `coordinateToPrice` against the host box**, including time-axis pixels (L130, L362–365).
3. **Independent `/range` vs OHLC**, with fetch-complete drawing into a scale that may not exist yet (L354–436).
4. **Silent `redrawVp` abort** when host &lt; 8px or refs unset (L117–120).
5. **Three time-range subscriptions**, one of them never unsubscribed in its effect (L157 vs L343 vs L465).
6. **250 ms poll + `inflightRef`** can skip a needed band fetch (L391, L462).
7. **Stale bins across symbol/TF** until the next `/range` lands (L352 vs overlay still showing `paintRef.bins`).
8. **Dead primitive** in the same file as live paint — comments say guest primitive; runtime is overlay (`saVpSeries.ts` L1–4 vs `SaPriceChart.tsx` L39–42, L611–615).

---

## GO / NO-GO on `ISeriesPrimitive`

**GO — migrate, and delete the overlay.**

The class is already written and matches Lightweight Charts 4.2.3 (`attachPrimitive` + `requestUpdate` → `fullUpdate`). Production never attaches it; the overlay is a bypass after the custom-series/primitive attempts. That bypass is why the profile blinks: it is a second compositor that must be poked whenever the engine paints. Putting L2 back on the candle series (`attachPrimitive`, `requestUpdate` on `/range` completion, drop the extra canvas and the manual resize/time-range redraws) is the fix that matches guest-layer law (add, don’t override autoscale). Until that lands, unreliability is expected.

---

## Related

- Member route: `/app/options-lab/volume-profile`
- Specs: `Specs/AZ-VP-9-A12.md`, `Specs/AZ-VP-9-A17.md`, `Specs/VP-Data-Delivery-Spec-v1_1.md`
- LWC: `lightweight-charts` ^4.2.3 (`web/package.json`)
