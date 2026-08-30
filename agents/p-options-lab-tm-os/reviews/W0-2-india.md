# W0-2 India — parents / as-built (One Source v0.4 · plan v1.3)

**Agent:** India  
**Date:** 2026-08-29  
**Depends:** W0-0 STAMP  
**Verdict:** **APPROVED** for build readiness. Parents confirm. No product code this wave.

## As-built (quoted)

| Seat | Quote |
|------|--------|
| `TODAY_LIVE` refusal | `server/market_data/ssr_archive_read.py` `_book_hole` L622–623: `if _is_today(day): return "TODAY_LIVE"`. `hole_http_status` L643: `"TODAY_LIVE": 409`. Marks path L372–377 same hole on today. |
| `captureToday` into the TM hold | `web/lib/market/useOptionChainBus.ts` L14, L417; `web/lib/options-lab/useOpfRiskGraph.ts` L34, L706 — live gens written into `tmSlots` today slot. |
| Average ring (not the TM hold) | `web/lib/runner/streamBook.ts` L1–4, L382 `getStreamBook()` — TR14 client RAM ring of OPF generations. W2 must not delete this when retiring `captureToday` as replay. |
| `seedTodayFromSession` | `web/lib/options-lab/archiveLoad.ts` L258–269: fills **today** via `captureToday` from StudioOne `fillArchiveSlot`. Called from `tmHost.ts` L367 and L381 on init / symbol change. As-built it cannot land today because retrieve is `TODAY_LIVE` 409. **W1 lifts that refusal. W2 must dispose this by name.** |
| `loadTmDay` today | `web/lib/options-lab/tmHost.ts` L162–164: `if (day === today) { engageTodayFromCache(); return; }` — does **not** hit StudioOne. |
| Two-slot occupancy | `web/lib/options-lab/tmSlots.ts` L1–6: TMI-79, `today` + `archive`. v0.4 TMI-84 is one hold. |

## Parents

- TMI-82…90 supersede the named v0.7.4 IDs in spec §4. Coach §0 is intact, including **§0.14** (TMI-96).
- **TMI-91…96** are in the DAG. TMI-92 is original feed. TMI-93 is named hole. TMI-95 is tape-read. TMI-96 is dark-not-hidden.
- VIX is **ruled** at §0.11 (TMI-94/95). OS-13 = 08-27 `massive_proxy_v1`. OS-14 = 08-29 `massive_index_v1`. Source travels. Not an open question.
- This GO **consumes A2 marks**. It does not add `/api/marks`.
- `day_changed` is in-flight only (TMI-85 split with TMI-88).
- §13a untouched: legs; `generation.vix` write; unnamed fields.
- Instant Replay / Day boards remain PARKED (`agents/p-options-lab-tmi/PARKED.md`, `agents/p-az-atm/PARKED.md`). Closed v0.7.4 GO not reopened.

**BLOCKING if violated later:** a TM-built marks route; leaving `seedTodayFromSession` after W1; treating Average's stream book as the hold.

Coach Content Law: nothing Coach said in §0 was dropped this review.
