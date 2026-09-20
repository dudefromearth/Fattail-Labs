# REQ-009 fold-in — :4011 overlay + spec loader

**To:** FUTURES instance (sole StudioOne owner today)  
**From:** spec instance (stands down from StudioOne processes)  
**Coach rider:** spec overlay + loader fold into the commit/push/deploy GO.  
**Cutoff:** 15:00 ET. Weekend **is** the post-close window (market closed until Sunday 18:00).  
**Do not interleave** this restart with kill-and-watch drills on the same service.

Code is already on `origin/main` (`420da7d4` + `6e65104f`). Deploying that tree to `:4011` brings `GET /symbology/v1/spec/{symbol}` live. Member-card hop 404 resolves here.

## CP-1 — CHAIN PRIMACY (verbatim · DL-707)

> **CP-1 — CHAIN PRIMACY.** The chain-snapshot collection on StudioOne (chain_feed and its supporting jobs) is never disrupted by Volume Profile Service work. If any test, install, invocation, backfill, or migration step could disrupt it — including indirectly via shared Massive account connection/rate limits, disk I/O or CPU contention, port conflicts, or launchd changes — the step is either redesigned to remove the risk or HELD until after the RTH close (16:00 ET). "Could disrupt" is judged pessimistically; when uncertain, hold. Every StudioOne packet must (a) carry CP-1 verbatim in its GO, (b) state its expected resource footprint (connections, disk, CPU) against chain_feed's needs, (c) capture chain_feed process status and last-snapshot freshness BEFORE and AFTER execution as evidence, and (d) include a rollback line: the single command or action that removes the change. A packet whose AFTER check shows chain_feed degraded is a FAIL regardless of its own success, and its rollback executes immediately.

## Footprint vs chain_feed

- **Process:** kickstart existing idle FastAPI on **:4011** only.  
- **Massive:** 0. Loader reads pinned snapshots on disk.  
- **Redis:** none.  
- **Disk:** rsync `server/symbology/` + `server/symbology_app.py` (includes `spec.py`, `load_specs.py`, `spec_snapshots/{ES,MES,ZB}.json`). **No git pull** on StudioOne.  
- **Ports:** 4011 only. Do not bind 4010 / 6379 / chain_feed.  
- **launchd:** kickstart `ai.fattail.labs.symbology` only. Do not edit chain-feed / vp-api / sym-feed plists.

## Sequence (after your kill-and-watch on this service is idle)

1. **BEFORE** — chain_feed pid, RSS, last log line, mtime; vp-api :4010 pid; symbology :4011 pid.  
2. Overlay from the StudioTwo checkout that is `origin/main` (sha `6e65104f` or later):

```
rsync -a --delete \
  server/symbology/ \
  studioone:/Users/ernie/Fattail-Labs/server/symbology/
rsync -a \
  server/symbology_app.py \
  studioone:/Users/ernie/Fattail-Labs/server/symbology_app.py
```

Use the same host/path the SYM1-DEPLOY overlay used. Pin LAN `192.168.1.111`, not `studioone.local`.

3. Kickstart `:4011` (do not interleave a drill):

```
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.symbology
```

4. **Loader immediately after restart** (do **not** pass `--session-open`):

```
cd /Users/ernie/Fattail-Labs/server
.venv/bin/python -m symbology.load_specs
```

Expect `{"ok": true, "roots": ["ES", "MES", "ZB"], ...}`. Snapshots are already on main; restart also imports them. The named job is this process.

5. **AFTER** — same chain_feed pid; :4010 pid unchanged; :4011 new pid listening.

6. **PP-1 per row** (computing-class cookie on `:4011`; member hop on StudioTwo `:4000`):

| Row | Assert |
|-----|--------|
| ES | computing `GET /symbology/v1/spec/ES` 200; `big_point_value=50`; `tick_value=12.5`; citation URL is the ES contract-specs page; **no** `session_summary` key |
| MES | 200; `big_point_value=5`; `tick_value=1.25`; same `calendar_id` as ES; citation URL is **MES's own** contract-specs page (not the FAQ) |
| ZB | member hop `GET /symbology/v1/spec/ZB` **404**; snapshot `spec_snapshots/ZB.json` present; ClearPort/Clearing `17` |
| SPY | member hop `GET /symbology/v1/spec/SPY` **404** |
| hop | StudioTwo member `GET http://127.0.0.1:4000/symbology/v1/spec/ES` **200** (card 404 is closed) |

Live suite still green: `LABS_SYMBOLOGY_API_BASE=http://192.168.1.111:4011 pytest tests/test_symbology_studioone_live.py`.

## Rollback (one line)

```
launchctl kickstart -k gui/$(id -u)/ai.fattail.labs.symbology
```

If the overlay is the defect, rsync the previous `server/symbology/` + `symbology_app.py` back, then kickstart. Do **not** bootout unless the sidecar itself must come down — that is the SYM1-DEPLOY rollback, not this fold-in.

## Out of scope for this fold-in

- vp-api `:4010` overlay  
- MiniTwo (per the deploy GO otherwise)  
- Watchdog both-stops (already this instance's other rider)  
- AP-1 (Coach)  
- Spec instance touching StudioOne

## Spec instance standing down

No SSH, no `:4011` kickstart, no loader from the spec instance. Paper + StudioTwo only. Clock at handoff: 08:26 ET, 2026-09-20.
