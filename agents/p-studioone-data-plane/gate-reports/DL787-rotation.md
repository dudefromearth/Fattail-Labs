# DL-787 rotation PP-1 (no values)

**Date:** 2026-09-20  
**CP-1:** chain_feed pid 538 RSS 71088 idle BEFORE and AFTER sidecar kickstart.

## Rotated on-box (behavior proof)

| Secret | Where | Proof |
|--------|-------|-------|
| Hop family `LABS_COMPUTING_SECRET` | StudioOne sidecar env, MiniTwo plist+env, StudioTwo env | **old token → 401** on `:4012/health`; **new hops 200** |
| MiniTwo member `LABS_SESSION_SECRET` | plist + .env | members must re-SSO |
| MiniTwo `LABS_DB_PASSWORD` | MySQL ALTER USER + plist + .env | `db_rotate_ok` |

New hops after rotation:

- MiniTwo OHLC 200 `massive_futures_aggs` 5000 bars  
- MiniTwo symbology `ES1!` 200 `ESZ2026`  
- MiniTwo VP health 200  
- StudioTwo OHLC 200 5000 bars  
- StudioTwo symbology `ES1!` 200 `ESZ2026`  

Hop family is **shared** (StudioOne verify + MiniTwo mint + StudioTwo mint). Rotated together.

## Not rotated here (vendor dashboards)

SSO (`LABS_SSO_SECRET_*`), SMTP password, Massive API key, XAI API key, ActiveCampaign token. Appeared in the DL-786 plist read. H0 standing: rotate as a matter of course when Coach supplies replacement values from those dashboards.

Temp hop files shredded on all three machines.
