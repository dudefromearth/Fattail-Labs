# TMOS W-G — Delta

**Date:** 2026-08-29  
**Depends:** W1–W6 · dash bounce (Coach word, this turn)  
**Verdict:** **PASS** with named carries. C11 number is in this report. Tab reached full.

## Bounce

`launchctl kickstart -k user/503/ai.fattail.labs.ssr-snapshot-dash` only.  
Dash **13277 → 16430** (11:24:56 ET). Tap **21649** unchanged since Aug 27 08:14. `chain_feed` 21657, `sym_feed` 95845 unchanged. `phase=weekend`, `wake=2026-08-30T20:15:00-04:00`.

## OS-1 / OS-3 / OS-14 over HTTP (after bounce)

| ID | HTTP | Result |
|----|------|--------|
| **OS-3** | `GET /api/index?day=2026-08-29&symbol=SPX` | **200**, hole **`NOT TODAY`**, not `TODAY_LIVE`. Fetch same. Weekend SPX has no listed expiry; empty snaps is the truth. |
| **OS-14** | `GET /api/marks?day=2026-08-29&symbols=VIX&t=…00:38:09` | **200**, mid **14.43**, `source=massive_index_v1`, `captured_at=2026-08-29T00:38:08.952423-04:00`. |
| **OS-1** | Raise today, empty hold | Archive day `2026-08-29`, count **0**. No 409. No session first print — tap idle, SPX `NOT TODAY`. Wall clock **11:27 ET**, not after 13:00. |

## C11 (dense day, infill waited)

2026-08-27 SPX. First pass stuck at **20,367 / 36,107 (56%)**, heap 123 MB, after HTTP had already finished — `mergeGens` keyed on `t_ms` and collapsed TAP RESTART twins. Fixed: merge by snap filename.

Second pass: **36,107 / 36,107**, fidelity **100%**, `matchIndex=true`, JS heap **553 MB**, **4.5 min**, tab visible and responding. Evidence `agents/p-options-lab-tm-os/evidence/w6-c11-complete.json`.

Usability of 553 MB is Coach, not a silent pass.

## Month coverage leftover

Calendar open fetches `from`/`to` for the month. Coverage runs `reconstruct_book` (every snap filename + `stat`) per symbol per day. A 14-day month × SPX × ~36k files is why empty days stay `unknown` for 60 s+.

**Fix:** serve coverage dots from `COUNTS.json` / nightly `STATS.json` (filename counts already beside the day). Do not reconstruct t-order for a calendar paint.

**Follow-up, not this GO.** W-G does not wait on it.

## Fail-closed (none tripped)

TM glow · Record · Labs film · 1-min · Instant Replay name · `seedTodayFromSession` · live VIX as native · fixture closing OS-13 · tap/feed restart · second bounce of capture.

## Carries

1. **AT-SOAR-45** — Monday open. Collection outranks. Not faked on weekend idle tap.  
2. **OS-1 13:00 session-day late-tab** — same Monday window. Bounce proved no `TODAY_LIVE`; there was no RTH first print today.  
3. **Month coverage grey** — follow-up (COUNTS/STATS, not reconstruct).  
4. **Stats 02:00 launchd** — plist in place; SSH bootstrap error 5. First backfill already ran.  
5. **C11 usability** — 553 MB held. Coach whether that ships.  
6. **§13a** — dark-position legs; tap writing `generation.vix`; unnamed feed fields.  
7. **HOLD** — Basic, TPO, 1×, Record, Instant Replay film.
