# W4-G — Delta

**Project:** p-studioone-archive-read  
**Agent:** Delta  
**Phase:** W4-G  
**Date:** 2026-08-27  
**Law:** SO-AR v0.8 + Amendment A1 · plan v2.1 W4-G  
**Depends:** W4-1

---

## Verdict: **PASS**

Unblocks **W5-0** (Coach word). Does **not** bounce. W5-1/W5-2 do not fire.

---

## Evidence

```text
cd server && .venv/bin/python -m pytest \
  tests/test_ssr_snapshot_dash.py \
  tests/test_ssr_archive_proxy.py \
  tests/test_ssr_archive_ladder.py \
  tests/test_ssr_archive_read.py -q
```

**54 passed.**

| Gate | Evidence |
|------|----------|
| `/` unauthenticated | `test_bearer_on_archive_routes_only`: GET `/` → 200 HTML with token set |
| `/api/status` open | same test: 200 |
| Collector `/api/days` open | 200 with token set, no Authorization |
| Archive routes Bearer | `/api/coverage` without token → **401** `{error: ARCHIVE AUTH, api_version: 1}` |
| 401 ≠ empty calendar | 401 body has **no** `days` key. Wrong Bearer same. Labs proxy still maps 401 → `ARCHIVE AUTH`, not `{days:[]}` |
| Token ≥32 when present | short token → `RuntimeError` at `archive_token()` / dash `main()` |
| Token absent | existing coverage/index/fetch tests still 200 (pre-bounce compatible) |

Protected paths: `/api/coverage`, `/api/index`, `/api/fetch`, and `/api/cadence`, `/api/health`, `/api/stats` so W5 can add those handlers without a second auth hole.

---

## W5 timing proposal (AT-SOAR-45)

**Clock on this host:** 2026-08-27 **10:57 EDT**, Thursday, **RTH in progress**. About five hours of regular session remain (close 16:00 ET). That is not the tail. If your “session nearly done” is about attention rather than the clock, the clock still has RTH left.

**Do not aim at the tail of today.** A missed snap in the last 15 minutes of RTH is the expensive miss. AT-SOAR-45 is a fail if the load run costs a snapshot — not a footnote.

**Aim: tomorrow’s open, after the live book has a clean 60 s.**  
Friday 2026-08-28, after the tap is writing the live day and **one quiet 60 s of cadence is on disk** (not the first minute after GTH/RTH start). Then:

1. **Baseline 60 s** — no archive load. Live-book cadence from filenames/`t` (median, p95, new GAP).  
2. **Bounce** (your W5-GO + Foxtrot). Tap process must still be running (AT-SOAR-35).  
3. **Load ≥60 s** — full pool of **4** concurrent index/fetch against a **dense settled** day (recommend `day=2026-08-25` SPX, the wrap book already measured; 5,800-file fixture is the shape).  
4. **Compare** live-book cadence for that same ≥60 s vs the baseline 60 s. New GAP or a move in median/p95 on the **live** book = **FAIL**.

If you instead GO this afternoon: a **mid-session window 11:30–15:30 ET today** is viable only because the clock still has hours of RTH. Not after 15:45.

**What I need from you before bounce**

1. Stamp **W5-GO** on `agents/go/SOAR-W0.md` / seed W5-0.  
2. A Bearer **≥32 characters** in StudioOne launchd for `ai.fattail.labs.ssr-snapshot-dash` (`LABS_SSR_ARCHIVE_TOKEN`). Same value can land on Labs when you want Labs to authenticate; until then Labs may omit it and the extra header is ignored only on the *old* process — after bounce, Labs must send it or archive calls 401.  
3. Confirm the load book: **2026-08-25 SPX** unless you name another settled dense day.  
4. Confirm the tap must keep collecting through bounce + load, and a lost snap fails the gate.

No bounce in this wave.
