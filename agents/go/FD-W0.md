# FD-W0 — GO

**Stamped:** 2026-10-12, automated bench run under Coach's voice GO (DL-826).
**Human gating:** dropped by that GO. Delta and Kilo gate in `agents/p-front-door/gate-reports/`.

| Ruling | Choice for this build |
|---|---|
| Venue | This repo, new URLs, no MiniTwo, no StudioTwo deploy |
| D2 | App-level admission (feature flag, percent, kill switch). Production nginx is not edited |
| B6 | Open. Handoff to WooCommerce checkout. No Stripe charge |
| Track A | Not done. Live Woo is not changed |
| Traffic | `traffic_percent` 0 in `server/front_door/offers.json`. Kill switch in the same file |
| Optional products | Activator, Quarterly, Monthly, Monthly intro are in config and off |
| Three-OK touches | Not requested. `billing.py`, `progress/`, and the membership page were not edited |

Two additive mount points, named so they are not silent: `server/main.py` includes the new router, and `web/components/AppChrome.tsx` hides member chrome on `/front-door` the same way it already does for `/apply`.
