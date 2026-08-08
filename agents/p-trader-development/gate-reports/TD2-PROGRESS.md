# TD2 progress (not formal Delta gate)

**Date:** 2026-08-08  
**Status:** Charts track started (Match Hygiene); sync still blocked on **TD2-0** Coach vendor GO  
**Spec:** `Specs/FatTail-Labs-Trader-Development-Phase-2-Match-Hygiene-v1_1.md`

## Board NEXT

**Charts (TD2-3 / TD2-4)** — in progress · parallel with process reports later  
**Sync (TD2-5 / TD2-6)** — blocked until TD2-0 names vendor + COGS  
**Process reports (TD2-7)** — not started  

## Landed (charts slice v1)

| Item | Evidence |
|------|----------|
| Domain: underlier · window · markers · proxy resolve · fail-loud completeness | `server/trade_log_domain/trade_chart.py` · `tests/test_trade_chart_domain.py` |
| Massive range OHLC aggs | `MassiveClient.fetch_aggs` |
| Short-TTL cache + service | `server/market_data/trade_chart_service.py` (`LABS_TRADE_CHART_CACHE_TTL_S`, default 120) |
| API | `GET /api/me/trade-log/trades/{id}/chart?tf=5m\|15m\|1d` |
| Trade sheet Chart section (tf toggle, proxy badge, error state) | `web/components/trade-log/TradeChart.tsx` |

## Still open for TD2-G (charts)

- [ ] Dogfood equity_option butterfly + all three tfs with real Massive key  
- [ ] SPX proxy label UI walk  
- [ ] Missing-bars fixture → no partial path (API already strips bars on incomplete)  
- [ ] Cache-hit log/metric on re-open (payload `cache.hit` — ops metric later)  
- [ ] Structure-band shading on non-proxy underliers (e.g. SPY butterfly)  

## Sync / reports (not this slice)

- TD2-0 vendor GO  
- `entry_source=sync` migration + Trade Log Spec catalog amend + chip  
- Process pack widgets  

## Invariants honored

- R-2.5 fail loud (no invented path)  
- SPX proxy always labeled when used  
- No new vendor; Massive existing plane only  
- No tick / L2 / replay  
