# T1-G — WebSocket + MarketClient (MB-P4)
**Result:** PASS  
- `WS /api/me/market/stream` — auth, hello, sub/unsub, chain full snapshot (MB7)  
- `web/lib/market/MarketSocket.ts` — one socket singleton per tab  
- `useOptionChainBus` — WS interest + HTTP poll fallback  
- AT-MB7: unauth closes 4401  
