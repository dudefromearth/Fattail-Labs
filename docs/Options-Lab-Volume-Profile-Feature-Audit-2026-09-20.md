# Options Lab — Volume Profile feature audit

**Date:** 2026-09-20  
**SHA:** `2cd6e284` (`main`, MiniTwo production)  
**Scope:** Member Volume Profile and associated chart/settings components as deployed. This is the ~11:00 ET snapshot. Later afternoon patches were reverted and are **not** in this build.

**Route:** `/app/options-lab/volume-profile`

---

## What shipped

### Member chart

One Lightweight Charts canvas: candles plus volume profile as a **series primitive** (the chart engine paints; there is no second overlay).

- **Visible Range only.** Full History mode, toggle, and chrome are gone.
- Pan, zoom, logical-range (timeline) change, and **Refresh** refetch `GET /window` with `from_t` / `to_t`.
- **Refresh** fires `sa-vp-update` (rebuild).
- **Symbol search** uses the existing `SymbolSearchTile`.
- **Interval** dropdown, grouped Minutes / Hours / Days: 1, 2, 5, 10, 30 m · 1, 2, 4 h · 1, 2, 7 d. Closed-control labels are still just `1 / 2 / 5…` (no `m`/`h`/`d` suffix).
- **Settings** gear and right-click still open the dialog.

### Settings (sidebar)

| Section | Contents |
|---|---|
| Canvas | Background, vertical/horizontal grid, combined grid color+opacity, crosshair |
| Price | Candle / bar / line, body / border / wick, up/down colors |
| Profile | Rows layout (number of rows / ticks per row), row size, VP color+opacity (one widget), left/right anchor, width % |
| Analysis | Layer on/off (overlay still off by default) |
| Scales and lines | Font, size, axis text, scale line, last price, hi/lo |
| Time zones and sessions | Chart time: Exchange (Eastern) vs My timezone. Session open/close verticals: on/off, thin/medium/thick, solid/dashed, color+opacity |
| Status line | Legend / chips |
| Range | Price-layer lookback |

**House defaults:** 5m candles, profile **number of rows = 24**, session lines **on**, dashed, thin, Eastern.

### Session lines

- ES / MES / NQ / YM / RTY: **close 17:00 ET, open 18:00 ET**.
- Other symbols: 09:30 / 16:00 ET.
- Axis labels follow Exchange vs local; the 5 PM / 6 PM marks stay Eastern.

### Data path (REQ-007 still OPEN)

- Bins are **server** `/window`. Client should not invent a histogram from OHLC. A candle-occupancy mock helper remains in the tree as a fallback until the window response lands.
- `bin_source`: prints vs aggs-derived.
- Developing edge: `/stream`.
- POC / VA: **HOLD** (no reference PNG ruling).

---

## Associated pieces not in this snapshot

| Item | Status |
|---|---|
| Full History profile mode | Removed on purpose |
| STALE / GAPPED / coverage chips / L0–LP strip on the member bar | Removed from the member bar |
| POC, VAH / VAL | Not shipped |
| Footprint (L4), Position (LP) | Named, gated off |
| Replay / Structure territory | Not on the member bar |
| History fetch “don’t pull 470 listing days of 1m” | Not in this deploy (after 11:00) |
| Interval change not cancelling the VP request | Not in this deploy |
| One-bar-per-pixel compression | Not in this deploy (default is still 24 rows) |

---

## Honest gaps

1. **24 rows is the house default.** On a daily chart that will look blocky. Ticks per row = 1 is in settings; it is not the default on this build.
2. **Grouped intervals are in the UI**, and `nativeOhlcTf` maps 2m→1m, 10m/30m→5m, 2h/4h→1h, 2d/7d→1d. Native hop still only serves **1m / 5m / 15m / 1h / 1d**. Extra intervals that cannot be resampled from already-loaded native bars can still fail until the history-window fix is on this branch.
3. **REQ-007 is still OPEN.** AP-1 is still Coach’s click, not a closed gate.
4. **StudioTwo vs MiniTwo:** production is on this SHA. Local `:3000` is the same files after a hard refresh.

---

## Components touched (this SHA)

| Path | Role |
|---|---|
| `web/components/options-lab/VolumeProfileSaSurface.tsx` | Member surface + short bar |
| `web/components/sa/SaPriceChart.tsx` | LWC chart, VP primitive, session primitive, window fetch |
| `web/components/sa/SaPartDialog.tsx` | Settings dialog (ColorAlpha, Profile, Sessions) |
| `web/components/sa/SaUtilityBar.tsx` | Span-chip copy (member bar no longer uses the full utility chrome) |
| `web/components/sa/SaStructureChart.tsx` | Structure overlay chart (admin / analysis) |
| `web/lib/saVpBand.ts` | Window URL, visible-candle window, row grain, mock helper |
| `web/lib/saVpSeries.ts` | Histogram primitive + paint |
| `web/lib/saSession.ts` / `saSessionLines.ts` | Timezone + session open/close verticals |
| `web/lib/saLayerStore.ts` / `saSettingsSections.ts` | Prefs + sidebar registry |
| `web/lib/saTheme.ts` | Interval groups |
| `web/lib/saView.ts` | `tfMs`, `nativeOhlcTf`, resample |
| `web/lib/saChartStyle.ts` | Axis time formatter by timezone |
| `artifacts/reqs/REQ-007.md` | Visible Range law |
| `server/help_reference/options-lab-volume-profile.md` | Member help |

---

## Summary

This version is a working **Visible Range** member chart with settings, session marks, and a short bar. It is not the later pipeline rewrite. Next work, if any, should prove one Lightweight Charts stage at a time: candles on the series → visible range → one `/window` call → bins on the primitive → it paints.
