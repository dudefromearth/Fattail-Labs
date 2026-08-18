# W0-3 — Echo dashboard review

**Project:** SSR Collector Hardening  
**Agent:** Echo  
**Depends:** W0-1 spec  
**Surface:** existing Chain Snapshot dash only (`ssr_snapshot_dash` · `:5055`). No second dashboard.

## Do not
- Implement
- Invent a new app or member chrome
- Restart the collector

## Do
Review hole vs "no session" indicator: holes stay alarming; no-session is muted. Operator HIG, not member product. Control grammar for phase + counters.

Write: `agents/p-ssr-collector-hardening/gate-reports/W0-3-echo.md`  
Verdict: **APPROVED** or **RETURNED**, plus **GO / NO-GO**.
