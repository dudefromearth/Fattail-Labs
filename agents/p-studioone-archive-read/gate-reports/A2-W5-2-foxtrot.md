# A2-W5-2 Foxtrot — dash bounce only

**Agent:** Foxtrot  
**Date:** 2026-08-29  
**Depends:** W5-GO (Coach, this turn)

## Bounce

Synced `ssr_snapshot_dash.py` (StudioOne was behind: `e0e3ee…` → `ad7b90ae…`). Reader already matched.

`launchctl kickstart -k user/503/ai.fattail.labs.ssr-snapshot-dash`  
(`gui/503` is not the SSH domain here — `user/503` is.)

| Process | PID before | PID after | lstart after |
|---------|------------|-----------|----------------|
| **ssr_snapshot_dash** | 31660 (Aug 27 13:11) | **13277** | **Sat Aug 29 09:48:36** |
| ssr_live_capture | **21649** (Aug 27 08:14) | **21649** | unchanged |
| chain_feed | **21657** | **21657** | unchanged |
| sym_feed | **95845** | **95845** | unchanged |

Did not touch `ai.fattail.labs.ssr-live-capture`.

After HTTP 50/55 (09:51 ET): same four PIDs. `/api/status` `phase=weekend`, `wake=2026-08-30T20:15:00-04:00`.
