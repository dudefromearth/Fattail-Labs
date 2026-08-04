# Labs · Full MSC Risk Graph

**This is the real MarketSwarm Risk Graph surface**, vendored into FatTail Labs
(not a live import of MarketSwarm-Canonical).

## What’s included

| Surface | MSC source |
|---------|------------|
| **RiskGraphPanel** | full panel UI (positions list, Mkt/Theo chrome, sim controls) |
| **PnLChart** | 2D payoff, strike handles, pan/zoom, sticky viewState |
| **RiskGraph3DView** + `alpha`/`charlie`/`echo` | 3D surface |
| **PriceTimeChart / History** | price–time detents |
| **autofitView** | ATM-centered autofit (button only on drop — sticky view) |
| Backdrops / settings | GEX/VP chrome (data optional) |

~100 TypeScript modules under `src/`.

## Run (required for Strategy Lab embed)

```bash
cd strategy-lab-proto/msc-risk-graph-ui
npm install
npm run build
npm run preview    # http://127.0.0.1:5174
# or hot reload: npm run dev
```

Then open Strategy Lab (`streamlit run app.py` on :8501) → **2b · Risk graph studio**.

## Labs wiring

- Streamlit feeds series + strategy legs via `postMessage` (`labs-rg-data`)
- Handle drag commits back via `labs-rg-strike-drag` → Python shape / `body_offset`
- **Autofit** only when clicked (handle drop does **not** re-widen the X scale)

## Honest limits (vs live MSC)

- No live chain IV / SSE / heatmap tiles unless you later wire Massive
- Pricing falls back to panel’s internal theo path when market data is cold
- Alerts / journal / order submit hooks are no-ops until Labs product APIs exist
