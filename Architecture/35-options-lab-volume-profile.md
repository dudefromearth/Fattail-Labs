# 35 — Options Lab Volume Profile (as-built widget)

**Law:** AZ-VP-9 series · **DL-764** GO · **DL-765** as-built (W4).  
**Route:** `/app/options-lab/volume-profile` (member) · `/admin/sa-dev` (twin).  
**Widget:** `web/components/sa/SaPriceChart.tsx` + `web/lib/saVpSeries.ts`.

## Paint loop

L2 volume profile is an `ISeriesPrimitive` attached to the candlestick series (`attachPrimitive`). zOrder `"top"`. Guest-layer: no autoscale override, no candle mutation. `/range` completion sets bins then `requestUpdate()` — the engine paints.

The sibling overlay canvas (`sa-vp-overlay`) and `redrawVp` were demolished (A23 W3). They do not ship.

## Data

OHLC: `GET /api/app/vp/v1/ohlc/{source}?lookback_days=0`  
Histogram: `GET /api/app/vp/v1/range/{target}` (band = pane-only y-span + margin). Fetch-band contract in `saVpBand.ts` unchanged.

Symbol/TF change clears bins before the new fetch (no ghost histogram).

## Not this doc

`Specs/VP-Overlay-Spec-v0_1.md` is **contract overlay construction** (futures model). Different overlay. Not the LWC canvas.
