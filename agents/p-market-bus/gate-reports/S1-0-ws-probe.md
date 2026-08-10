# S1-0 — Massive stocks WebSocket entitlement probe

**Date:** 2026-08-10  
**Result:** REST path selected (no WS assumption)

## Evidence

```text
$ .venv/bin/python -m market_data.sym_feed --probe-ws
PROBE: Massive stocks WebSocket entitlement is plan-specific.
  Spec §8.3: prefer WS if entitled, else REST snapshot poll.
  This feed uses MassiveClient.fetch_underlier_mark (REST).
```

`sym_feed --once` successfully wrote `mb:session:market_status` (market=open) and
`mb:sym:*` for the Admin universe via REST underlier marks (proxy labeled where required).

## Decision

Ship **REST** symbol feed. Revisit stocks WS when plan entitlement is proven with a
connect transcript on MiniTwo; no design change to client topics required.
