# A2-W4-1 Mike — Bearer on archive routes (including marks)

**Agent:** Mike  
**Date:** 2026-08-29  
**Depends:** W3-G · W5-G (live process)  
**Law:** v0.8 §6.2 · AT-SOAR-22, 27, 28

## Auth state of the bounced dash

`LABS_SSR_ARCHIVE_TOKEN` **is set** in the dash process (len **64**, ≥32). Loaded via `ssr-snapshot-dash-run.sh` sourcing `.env`, not launchd `EnvironmentVariables`. Labs `.env` is the **same** value (sha256 prefix match). Archive routes require Bearer. They are **not** open on the LAN.

No-bearer proof (live `:5055`, process 13277):

| Path | HTTP | Body |
|------|------|------|
| `/api/marks?day=2026-08-27&symbols=VIX&t=…` | **401** | `{error: ARCHIVE AUTH, api_version: 1}` — no `marks` key |
| `/api/coverage` | **401** | same — no `days` |
| `/api/stats` | **401** | same |
| `/` | **200** | HTML |
| `/api/status` | **200** | `phase=weekend` |
| `/api/days` | **200** | collector, 14 days |

501 ≠ 401: token is present, so missing Bearer is **401**, not `ARCHIVE NOT CONFIGURED`.

## Implementation

No new identity. `/api/marks` was already in `ARCHIVE_API_PATHS`. W4 closed the test gap: marks + stats 401 ≠ empty tape / empty stats.

Labs proxy already sends `Authorization: Bearer` when the token is set (`routes/ssr_archive.py`). Same token as the dash.

## Tests

`test_bearer_on_archive_routes_only` now covers `/api/marks` and `/api/stats`.
