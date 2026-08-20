# W0-2 — India parents

**Project:** p-alerts  
**Agent:** India  
**Date:** 2026-08-20  
**Verdict:** **APPROVED** (C2 remains **BLOCKED**)

## ALB-A2 (first)

Arch 28 one-socket law is **market data** (`WS /api/me/market/stream` · `MarketSocket` tab singleton). `/api/me/alerts/stream` is a member-identity channel. Quote Arch 28 §4.3: “this law is **market data**. Member-identity streams … are **not** market sockets.” Lawful second WS/SSE. Not precedent for a second Massive/market socket.

## C2 lock

File lock: `web/components/options-lab/risk-graph/HostPnLChart.tsx` + `web/lib/risk-graph/hostAlertMenu.ts`.

Viewport W-G artifacts:

- `p-az-viewport-2d` — **W-G unfiled** (`ORCHESTRATOR.md`: W-G BLOCKED; Packet A in flight).  
- `p-az-viewport-return` — **W-G unfiled** (`ORCHESTRATOR.md`: W0-G BLOCKED, no W0-BA).

**C2 stays BLOCKED.** Do not invent lock over. C2-0 fires only when both W-G PASS. Viewport docs say `PnLChart.tsx`; as-built is `HostPnLChart.tsx` (**DL-458**). Rename is not a W-G.

## Canonical draft

ALM §3.2 is the only draft table. AZ-ALB §2.2 cites it. `suite` + `severity` required. Analyzer: `options_lab` / named `medium`. Registry rejects unknown `source_system`. Settings is not a second builder. Packet M and C1 may BUILD without `HostPnLChart`.
