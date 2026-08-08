# TD2 progress (not formal Delta gate)

**Date:** 2026-08-08  
**Status:** Charts track started (Match Hygiene); sync still blocked on **TD2-0** Coach vendor GO  
**Spec:** `Specs/FatTail-Labs-Trader-Development-Phase-2-Match-Hygiene-v1_1.md`

## Board NEXT

**Charts (TD2-3 / TD2-4)** — landed (candles)  
**Process reports (TD2-7)** — landed (adherence + campaign + tags)  
**Sync (TD2-5 / TD2-6)** — blocked until TD2-0 names vendor + COGS  

## Landed (charts slice v1)

| Item | Evidence |
|------|----------|
| Domain: underlier · window · markers · proxy resolve · fail-loud completeness | `server/trade_log_domain/trade_chart.py` · `tests/test_trade_chart_domain.py` |
| Massive range OHLC aggs | `MassiveClient.fetch_aggs` |
| Short-TTL cache + service | `server/market_data/trade_chart_service.py` (`LABS_TRADE_CHART_CACHE_TTL_S`, default 120) |
| API | `GET /api/me/trade-log/trades/{id}/chart?tf=5m\|15m\|1d` |
| Trade sheet Chart section (candles, entry/exit, proxy badge) | `web/components/trade-log/TradeChart.tsx` + lightweight-charts |

## Landed (process pack v1) — **placement corrected DL-257**

| Item | Evidence |
|------|----------|
| Domain: adherence mix · rate series · campaign summary · records/summary adapter | `trade_log_domain/process_pack.py` · `tests/test_process_pack_domain.py` |
| API (derivation backend only) | `GET .../analytics/process-pack` · `GET .../records/summary` |
| **Reports UI** | **Removed** — Reports stays objective trade aggregate (Coach) |
| Next host | Retrospective ceremony and/or Journey aggregate — not Reports |

## Still open for TD2-G

### Charts
- [ ] Formal UI walk: SPX proxy label · missing-bars · cache hit dogfood  
- [ ] Structure-band on same-axis underliers  

### Process
- [ ] UI walk: adherence + tags + campaign hide when none  
- [ ] Confirm no tag/process×P&L surfaces  

### Sync (blocked)
- TD2-0 vendor GO  
- `entry_source=sync` migration + Trade Log Spec catalog amend + chip  

## Invariants honored

- R-2.5 fail loud (no invented path)  
- SPX proxy always labeled when used  
- No new vendor; Massive existing plane only  
- No tick / L2 / replay  
