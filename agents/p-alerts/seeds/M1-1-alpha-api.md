# Seed M1-1 — Alpha Manager API

**Project:** p-alerts  
**Agent:** Alpha  
**Phase:** M  
**Depends:** W0-BA names **Packet M** · Mike W0-6  
**Law:** ALM §3 · §5 · plan §8.1  
**Gate it feeds:** M2 · M4 · M5

## Intent

Member Alerts Manager backend: flag, registry, records, events, stats, stream. **Not** a second authorship store that Analyzer bypasses.

## Files in scope

- `server/` new: `routes/alerts.py` (or equivalent), registry module, migration `NNN_alerts_*.sql`  
- Config: `LABS_ALERTS_MANAGER` fail-loud when used  
- Characterization tests under `server/tests/`

## Out of scope

`HostPnLChart`. Next.js pages (M2). MiniTwo. SMS/email send. Manager-side live Market Bus evaluation (OD-ALM-eval). Delete **UI**. MSC.

## Wire

1. Registry of `(suite, source_system, types[])`. Analyzer: `options_lab` / `analyzer_risk_graph` / `canvas|position`. Heatmap types `[]`.  
2. `POST`/`PATCH` require registered `source_system` **and** `suite` + `severity` → else 4xx.  
3. Record shape ALM §5.5 including `unbound` (server may store `unbound=false` until the suite reports).  
4. `GET /api/me/alerts/stream` — member-identity SSE (or WS if Mike stamped). **Not** `market/stream`.  
5. `DELETE` route **may** exist; do not document it as shipped UI.  
6. Session cookie auth. Unauth 401.

## Done when

curl evidence: unauth 401; unregistered `source_system` 4xx; missing `suite`/`severity` 4xx; registered upsert 2xx with `suite=options_lab`. Tests in the same change.

## Invariants

Fail loud. No MSC. Arch 28 market socket untouched. DL-309 N/A on this packet except: do not invent option contracts in the manager.
