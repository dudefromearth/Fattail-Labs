# Labs Risk Engine

Single options **Risk Graph math** for FatTail Labs / Strategy Lab.

## Lineage

Ported from **MarketSwarm-Canonical** (not a live import):

| MSC | Labs |
|-----|------|
| `src/engines/risk_graph/pricing.py` | `pricing.py` (vendored) |
| P&L authority v1.1 | `payoff.py` — `mark − cost_basis` |
| Vol mode Mkt / Theo | `curves.py` — `vol_mode` |
| Rendering series S1/S2 | At Expiry + Real-Time |
| 2D + 3D shared surface | 2D now; 3D later on same `RiskSurface` |

Doctrine: Labs stays a **standalone** repo. We install a **copy** of the
engine here so both products can evolve toward one Risk Graph surface
without coupling runtimes.

## Authority (do not violate)

1. **At expiry** = intrinsic mark − package cost basis  
2. **Real-time** = BS mark − **same** cost basis  
3. **No mid-anchor shift** (wings must asymptote to max risk / −debit)  
4. **Theo** = one flat IV on every leg (calibrated to package credit when no live mid)  
5. **Mkt** = per-leg IV when chain data is available (`OptionLeg.iv`)

## Usage

```python
from engine.risk_engine import build_package, build_risk_surface

pkg = build_package(spec)
surface = build_risk_surface(pkg, time_years=0.4/365, vol_mode="theo")
# surface.expiry.pnl, surface.realtime.pnl, surface.prices
```

## Viewport

`viewport.py` ports MSC **viewState + autofitView**:

| Behavior | MSC | Labs |
|----------|-----|------|
| Sticky pan/zoom | `viewState` until Autofit | `rg_view_box` + client `view_box` state |
| Autofit | Button / explicit | **Autofit** button only — **not** on handle drop |
| ATM-centered fit | `atmCenteredXRange` | `compute_viewport` / `resolve_viewport` |

| Autofit style | Behavior |
|---------------|----------|
| `autofit` | Spot-centered, structure visible, ~30% pad, 1σ ≥ 1/3 view |
| `one_sigma` | Prefer 1σ window (expand if structure wider) |
| `wide` | Looser pad for overview |

**Why the scale used to jump:** autofit re-ran after every drag; moving the tent away from ATM widens the X half-width. Sticky viewState fixes that.

## Shape studio (Strategy Lab UI)

Structure / direction / wing controls drive the package live; **Apply to Spec**
writes them into Design. What-If (time / vol / spot) is view-only.

## Strike handles (MSC PnLChart lineage)

Interactive canvas: `components/risk_handles/`

- Amber diamond handles on the **zero line** (same hit model as MSC)
- Drag **wing** (long) handles → `wing_width`
- Drag **short** handles → OTM / wing (structure-dependent)
- Shift-drag previews moving all legs
- Commit on mouseup → Streamlit updates shape session state

## Roadmap toward full MSC Risk Graph

- [x] BS primitives  
- [x] Cost-basis P&L authority  
- [x] Theo single-vol T+0  
- [x] Mkt hook (per-leg IV)  
- [x] Viewport autofit / 1σ / wide  
- [x] Shape builder → Spec  
- [ ] Live chain IV fill for Mkt  
- [ ] Both mode (overlay Mkt + Theo)  
- [ ] Click-drag strikes on canvas  
- [ ] 3D / surface mesh host (same series)  
- [ ] Web Labs React chart (PnLChart lineage)
