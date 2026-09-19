# REQ-002 inventory — VP chart settings (before build)

**Date:** 2026-09-19  
**Route:** `/app/options-lab/volume-profile`  
**Law:** A10 · A20 · A21 · A22 · this packet (hierarchical TV model, our scope, light theme)

## Surfaces found

| Surface | Live on member VP? | Notes |
|---------|--------------------|--------|
| `SaPartDialog` + `saLayerStore` `SaPrefs` | **Yes** | Dark per-part popover. Replaced by combined dialog. |
| `SaUtilityBar` | Yes | Source, contract, interval, chips — **chrome, not dialog fields**. Interval (`priceTf`) stays on the bar. |
| `SaLayerStrip` | Yes | Layer visibility; right-click opens that layer's section. |
| `VolumeProfileChart` appearance (`ft_options_lab_vp_appearance_v1`) | **No** | Old bins-only chart. Not on the member SA surface. Not migrated (would be a second product). |
| Analyzer / Runner / Surface charts | Out of this packet | Registry is reusable; first wire is VP. |

## Settings that carry over (defaults = house `morning`)

| Setting | Default | Persist | Old dialog part |
|---------|---------|---------|-----------------|
| canvasBg | `#131722` | A22 `/api/me/sa-surface` + cache `ft_sa_lwc_prefs_v4` | L0 |
| vertGridOn | true | A22 | L0 |
| horzGridOn | true | A22 | L0 |
| gridColor | `#ffffff` | A22 | L0 |
| gridOpacity | 0.08 | A22 | L0 |
| crosshairColor | `#758696` | A22 | L0 |
| crosshairStyle | `largeDashed` | A22 | L0 |
| axisFont | Trebuchet MS | A22 | L0 |
| axisFontSize | 12 | A22 | L0 |
| axisTextColor | `#d1d4dc` | A22 | L0 |
| scaleLineColor | `#2b2b43` | A22 | L0 |
| marginTop / marginBottom | 0.05 | A22 | L0 |
| rightOffsetBars | 5 | A22 | L0 |
| visible.L1 | true | A22 | L1 |
| priceFormat | candle | A22 | L1 |
| colorByPrevClose | false | A22 | L1 |
| candle body/border/wick + up/down colors | teal/red | A22 | L1 |
| visible.L2 | true | A22 | L2 |
| orientation (VP anchor) | ltr (left) | A22 | L2 |
| profileWidthFrac | 0.62 | A22 | L2 |
| profileOpacity | 0.42 | A22 | L2 |
| visible.L3 | false (morning) | A22 | L3 |
| axis (scale side) | left | A22 | axis |
| lastPriceOn / lastPriceColor | true / `#26a69a` | A22 | axis |
| hiLoOn / hiColor / loColor | false / green / red | A22 | axis |
| legendOn | false | A22 | legend |
| priceLookbackDays | 1 | A22 | range |
| mode (Template) | morning | A22 | mode / footer |
| objectDefaults | {} | A22 | footer Defaults |

Nothing listed is dropped. L4 Footprint and LP Position stay reserved (empty; not in the sidebar).

## Right-click → section

| Target | `partFromPointer` / open() | Sidebar |
|--------|----------------------------|---------|
| Price scale (left/right 72 px) | `axis` | Scales and lines |
| Volume profile hit | `L2` | Profile |
| Time axis (bottom 28 px) | `range` | Range |
| Chart canvas (else) | `L0` | Canvas |
| Layer strip L1 | `L1` | Price |
| Layer strip L2 | `L2` | Profile |
| Layer strip L3 | `L3` | Analysis |
| Gear / generic | first section | Canvas |
| Mode chip | `mode` → first | Canvas (Template is footer) |
| Provenance chips | `chips` → legend | Status line |

## Persist (A22)

Server document `PUT /api/me/sa-surface` is SoR. `localStorage` `ft_sa_lwc_prefs_v4` is cache only. **Ok** commits (server write). **Cancel** restores the snapshot and does not keep draft on the server.
