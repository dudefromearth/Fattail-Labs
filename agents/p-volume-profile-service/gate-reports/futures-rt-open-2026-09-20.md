# Futures VP real-time — Sunday 18:00 ET open readiness

**When:** 2026-09-20 07:53 ET (Sunday). Globex still **closed**. CP-1: chain_feed PID **538** unchanged.

## Law (this packet)

Session calendar = vendor `/futures/v1/market-status` (`session_clock.json`). Not equity RTH. Holding-last only while `reason=closed|halt`. Full path: prints → capture → developing bins (15s) → `/v1/stream` latest `session_end_date` → member chart. Front+next: **ESZ6, ESH7, MESZ6, MESH7**.

## 3. Process posture (H0-8)

KeepAlive **true** on `vp-engine`, `vp-futures`, `vp-api`, `vp-watchdog` (gui/503).

| Agent | Kill | Relaunch | Verdict |
|-------|------|----------|---------|
| vp-engine | 60353 | 60512 | **PASS** |
| vp-futures | 60446 | 60514 | **PASS** |
| vp-api :4010 | 60367 | 60515 | **PASS** |
| vp-watchdog | 60373 | 60513 | **PASS** |
| chain_feed | 538 | 538 | **UNCHANGED** |

Crash at 2 AM self-heals via launchd KeepAlive. This **is** the around-the-clock guarantee going forward, not a one-night check.

## 4. Session-boundary dry check

Vendor ES/MES `market_event=close`, `session_end_date=2026-09-18`. Clock:

```
ES  reason=closed  open=false  halt=false  sed=2026-09-18
MES reason=closed  open=false  halt=false  sed=2026-09-18
```

Logged named transitions: `vp-futures session {p} {old} -> {new}`. Next-open is not a field on this vendor row; at 18:00 ET the same SoR is expected to flip to `open` with a new `session_end_date` (typically Monday). Engine developing currently **2026-09-18** (last ingested); first Sunday-night prints land under vendor SED and become the developing edge.

## 5. Watchdog (H0-6)

`python -m market_data.vp_ops.watchdog` KeepAlive. In-session + developing histogram age > 90s → log + `~/Library/Logs/fattail-labs/vp-watchdog.alert` + SMTP if `LABS_SMTP_*` set (Foxtrot). **Now:** `idle lawful reason=closed` — no alert.

## Defects fixed this morning (were blocking the open)

- Engine `bin_all` walked all history and died on contiguous coverage — **developing-only** loop.
- `/v1/stream` keyed `date.today()` (Sunday 09-20) instead of vendor session day — now **latest ingested**.
- Stale subscribe `ESU6` after Friday expiry — now **ESZ6+ESH7**.

## Evidence still owed (Coach)

6. Open: developing-bin tick on member chart + PP-1 screen recording. AP-1 is Coach's.
7. Monday morning: bin-update timestamps through the night (gaps only at lawful halt), watchdog silent-because-healthy, chain_feed 538 still.

**Does not.** Spec files. chain_feed. StudioTwo `:3000`/`:4000`.
