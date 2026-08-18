# P1-1 — Alpha session map + hole semantics

**Blocked until:** W0-G PASS + Coach auto-GO (this run: auto-GO if W0-G PASS)  
**Agent:** Alpha  
**Flag:** `LABS_SSR_HARDENING` default **0**. Running tap must not be restarted mid-gth.

## Scope
- Config file `data/ssr/session-map.json` (mtime reload). Fail loud if flag=1 and missing.
- Poll / `touch_interest` only for symbols in-session for current phase.
- One `"no session"` log line per symbol per phase occupancy.
- Hole = expected snap missing or interval exceeded. Out-of-session empty is not a hole.
- Tests AT-SSR-H-A, D, E, G from characterization-list.md

## Out of scope
Watchdog, audit, retention, replay, cadence change, StudioOne kickstart, gold volume writes, Friday rewrite.

## Cutover
Land on `main`. Do **not** `launchctl kickstart` the tap. Foxtrot/Coach cut over between phases (04:00 ET or 09:25–09:30 ET) with flag=1.

Completion: tests pass locally; flag=0 characterization still poll-all.
