# 35 — Options Lab Volume Profile (as-built Visible Range widget)

**Law:** AZ-VP-9 series · **DL-764** GO · **DL-765** as-built (W4) · **DL-788** REQ-007 v2 Visible Range.  
**Route:** `/app/options-lab/volume-profile` (member) · `/admin/sa-dev` (twin).  
**SHA this describes:** `2cd6e284` (`main`).  
**REQ-007:** OPEN. AP-1 is Coach’s click. POC/VA HOLD.

**Companion:** server/API in [37-visible-range-volume-profile-api.md](./37-visible-range-volume-profile-api.md).  
**Member help:** `server/help_reference/options-lab-volume-profile.md`.  
**Feature audit:** `docs/Options-Lab-Volume-Profile-Feature-Audit-2026-09-20.md`.

---

## Design intent

Visible Range is the TradingView-shaped default: the histogram is **volume at price inside the time window currently on the canvas**. The server owns bins. The client never treats OHLC candles as the histogram.

The member chart is **one Lightweight Charts instance**. Layers add; they do not replace the chart. L2 (profile) is a guest `ISeriesPrimitive` on the candlestick series — same price scale, no autoscale override, zOrder `"top"`.

**Full History is not a member mode.** `/range` still exists on the computing API for other consumers. The member chart does not toggle it and does not fetch `/range` for L2.

---

## Runtime shape

```
Browser
  VolumeProfileSaSurface
    VpBar (symbol · interval · Refresh · settings)
    SaPriceChart  (LWC)
      candlestick series
      VpHistogramPrimitive     (L2 bins)
      SessionLinesPrimitive    (session open/close verticals)
    SaPartDialog
      ↓ member cookie
Labs API  :4000   /api/app/vp/v1/*     (vp_display — member hop)
      ↓ computing session (not the member cookie)
VP API          /v1/profile/{target}/window
History API     /history/v1/ohlc/{source}   (StudioOne :4012 when hopped)
```

**Widget files**

| File | Job |
|---|---|
| `web/components/options-lab/VolumeProfileSaSurface.tsx` | Member shell + short bar |
| `web/components/sa/SaPriceChart.tsx` | Chart, fetches, primitives, events |
| `web/components/sa/SaPartDialog.tsx` | Settings |
| `web/lib/saVpSeries.ts` | Histogram primitive + paint |
| `web/lib/saVpBand.ts` | Window URL, visible-candle window, row grain |
| `web/lib/saSession.ts` / `saSessionLines.ts` | Timezone + session verticals |
| `web/lib/saLayerStore.ts` | Prefs |
| `web/lib/saView.ts` | `tfMs`, `nativeOhlcTf`, resample |

---

## Lightweight Charts principles (as implemented)

1. **Time scale is the window.** Visible logical range / `barsInLogicalRange` → first/last candle times → `from_t` / `to_t` (unix ms). Empty pad to the right of the last bar is not counted as candles.
2. **The engine paints.** `attachPrimitive` → `updateAllViews` + pane `renderer` + `requestUpdate`. No second overlay canvas (`sa-vp-overlay` demolished A23 W3).
3. **Price scale is shared.** Histogram y is `series.priceToCoordinate`. Guest layer: no `autoscaleInfo` that fights candles.
4. **Events only change the window, then re-run the same path.** Load, symbol, TF, Refresh (`sa-vp-update`) = rebuild. Pan, zoom, resize, new bar = diff-classed (same `/window` fetch today; class is for later incremental updates).

---

## Data path (client)

```
candles on the series
  → visibleCandleWindow / candlesInMsRange
  → profileFetchPlan → GET /api/app/vp/v1/window/{target}?source&from_t&to_t&row
  → bins[] {price, volume}
  → primitive.forceDraw / applyBins
  → requestUpdate
```

Until `/window` returns, `mockBinsFromCandles` may paint occupancy from visible OHLC (helper in `saVpBand.ts`). Law says the client must not assemble the product histogram from bars; the mock is a display fallback, not the SoR.

**OHLC** (price layer, not the histogram): `GET /api/app/vp/v1/ohlc/{source}?tf=&contract=&bars=`. Member hop allows **only** `1m|5m|15m|1h|1d`. Extra UI intervals map via `nativeOhlcTf` then `resampleOhlc` on the client (2m←1m, 10m/30m←5m, 2h/4h←1h, 2d/7d←1d).

**Live edge:** SSE `/api/app/vp/v1/stream?source=&timeframe=` (member) → computing `/v1/stream/{source}`.

---

## Member chrome (this SHA)

Bar: title, symbol search tile, interval (grouped Minutes/Hours/Days), Refresh, settings gear.

Removed from the member bar: Full History toggle, STALE/GAPPED/coverage chips, L0–LP strip, Structure/Replay territory.

Settings sidebar: Canvas · Price · Profile · Analysis · Scales and lines · **Time zones and sessions** · Status line · Range.

Profile defaults: **number of rows = 24**, color `#2962ff`, opacity 0.42, left anchor.

Session defaults: on, dashed, thin, `#787b86` @ 0.45. ES family 17:00/18:00 ET.

---

## Not this doc

- `Specs/VP-Overlay-Spec-v0_1.md` — futures **model** overlay, not the LWC canvas.
- Structural layer (SRF-4): never re-profiles by visible time; VR output does not feed C2/C3/SA.
- POC / VAH / VAL — HOLD (`artifacts/references/REQ-007-vrvp-reference.png` + Coach ruling).
- Footprint (L4) and Position (LP) — named, gated off.
