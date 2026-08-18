# W0-1 — Juliet spec (Phase 1 draft)

**Project:** SSR Collector Hardening  
**Agent:** Juliet  
**Depends:** W0-0 Coach stamp  
**Feeds:** W0-2 India · W0-3 Echo · W0-4 Foxtrot · W0-5 Kilo · W0-6 Lima · W0-G  
**Status:** **COMPLETE** 2026-08-18 — spec file exists

## Do not

- Implement collector, watchdog, or dash code
- Restart StudioOne tap or dash
- Edit running tap files
- Invent an alert channel
- Change cadence
- Remove or rewrite Coach text

## Do

Draft the complete Specification from Coach’s verbatim hardening packet.

Write: `Specs/FatTail-Labs-SSR-Collector-Hardening-Spec-v1.0.md`

- **Status:** DRAFT (not BUILD AUTHORITY until W0-G + Coach)
- **Type:** Ops / gold-archive spec (StudioOne). Not a member product surface.
- **§0** = full verbatim packet from `seeds/W0-0-coach-stamp.md` — nothing removed
- Ideas inventory: required changes **1–7** all **IN-SCOPE** with priority (1–3 before open; 4–6 this week; 7 stub)
- As-built: StudioOne `ssr_live_capture` + `ssr_snapshot_dash` `:5055`; 18 tradeable; 2s; phases gth/pre/rth/extended/closed; GTH empties currently counted as holes; gold volume FatTail2TB stalled `open()`; live writes `~/Library/Caches/fattail-ssr`; DL-428 2–5s; DL-431 max published window
- Session map = **config**, proposed path `data/ssr/session-map.json` + `LABS_SSR_SESSION_MAP`
- Hole = expected snap missing **or** interval exceeded. Empty outside session is **not** a hole
- Watchdog = separate process. Alert channel **UNSPECIFIED / OPEN**
- Zero downtime. Flag + cut over **between** phases. Tonight already `gth`. Windows: 4:00 AM ET pre start, or 9:25–9:30 AM ET GTH→RTH
- Dashboard: extend existing Chain Snapshot dash only
- Tests: (a) no-session GTH not polled and not a hole; (b) heartbeat silence alerts; (c) audit flags synthetic 30s gap
- Cadence: **REPORT ONLY**. State both histories (OD-6/DL-400 3–5s; DL-428 2–5s default 2s)

Also: update `ORCHESTRATOR.md` board — W0-1 done.

## Completion criteria (met)

- [x] Spec file exists at the path above
- [x] Coach packet intact in §0
- [x] Ideas inventory complete (H1–H7 + constraints)
- [x] Open items labeled **OPEN**
- [x] Board W0-1 marked done

## Verdict

**GO** for India (W0-2) to review the DRAFT.  
**NO-GO** for implementation / tap restart / cadence change / inventing an alert channel.
