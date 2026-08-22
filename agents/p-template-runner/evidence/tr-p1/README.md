# TR-P1 evidence pack

Capture: `cd web && FLAG=0|1 BASE=http://localhost:3000 node lib/runner/__tests__/capture-ws.mjs`

Playwright `page.on("websocket")` = DevTools Network → WS created events.

| File | What |
|------|------|
| `ws-flag-0.png` / `.json` / `.html` | Flag **0** Network WS list |
| `heatmap-flag-0.png` | Flag **0** heatmap render |
| `ws-flag-1.png` / `.json` / `.html` | Flag **1** Network WS list |
| `heatmap-flag-1.png` | Flag **1** heatmap render |

Market socket (`/api/me/market/stream`) count: **1** on both flags. HMR sockets are Next dev, not market.
