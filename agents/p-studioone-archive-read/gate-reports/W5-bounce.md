# W5 bounce (Foxtrot) — 2026-08-27 13:12 EDT

**W5-GO:** stamped. Dash only. Tap kept collecting.

## Token

| Host | `LABS_SSR_ARCHIVE_TOKEN` |
|------|--------------------------|
| StudioOne `.env` | present, **length 64** (≥32) |
| StudioTwo `.env` (Labs sends this) | present, **length 64**, SHA prefix match `09fd769e68ac` |

Value not recorded here. First mint was rotated after a quoting traceback; live value is the second mint.

## Bounce

`launchctl bootout/bootstrap user/503` of `ai.fattail.labs.ssr-snapshot-dash` only. Live-capture job PID **21649** unchanged.

| Check | Result |
|-------|--------|
| Tap running after bounce | yes (`ssr_live_capture` PID 21649) |
| Live SPX snaps | 19461 before work → 19509 after bounce (still writing) |
| HTML `/` | 200, no Bearer |
| `/api/status` | 200, no Bearer |
| `/api/coverage` no Bearer | **401** `ARCHIVE AUTH` (token is set — not 501) |
| `/api/health` with Bearer | 200, `tap_running: true`, store FatTail2TB |
| `/api/coverage?days=2026-08-25&symbols=SPX` | 200, `rth_complete` |

## AT-SOAR-45

**Not run in this bounce.** Scheduled for **Friday 2026-08-28 09:32 America/New_York** (after a clean 60 s, not the first minute). Script: `scripts/soar-at45.py`. Load book **2026-08-25 SPX**, pool 4, 60 s. W5-G waits on those numbers. A new GAP or lost live snap fails.
