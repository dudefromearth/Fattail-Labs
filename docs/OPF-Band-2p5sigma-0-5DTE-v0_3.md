# OPF — Full book, SPX and XSP, 0–5 DTE, at true cadence

**Change spec v0.3**  
**Supersedes:** `docs/OPF-Band-2p5sigma-0-5DTE-v0_2.md` (bytes unchanged; that file stays the prior law). v0.1 remains the baseline.  
Date: 2026-09-28  
Machine: StudioOne, `~/Fattail-Labs-mexp2`. **CP-1** governs. The running collector is not modified to satisfy this spec.

**Coach, 2026-09-28, verbatim intent.** Maximum strikes with greeks, as fast as possible. The σ band is superseded for SPX and XSP.

**Coach, 2026-09-28, the one change from v0.2, verbatim.** The 750-contract ceiling is raised so every listed book is captured whole. New ceiling 2,500 contracts / 10 pages; a book past that fails loud. Rationale: SPX 2026-09-30 is 1,198 contracts and costs 1.14 s on a 15-second cadence; refusing it contradicts the ask.

**Standing scope:** nothing is built that this spec does not name. A seat that finds something it thinks should change reports it as a finding for Coach; it does not build it.

**Plan.** `docs/OPF-Band-2p5sigma-0-5DTE-Full-Agent-Bench-Plan-v1.2.md` is the plan of this spec. It records acceptance of plan v1.1 with this ceiling amendment. Plan v1.1 and plan v1.0 stay on disk unchanged. v1.0 is the plan of v0.1. v1.1 is the plan of v0.2.

---

## What changed from v0.2

| Section | v0.3 |
|---|---|
| §1 ceiling | 3 pages / 750 contracts becomes 10 pages / 2,500 contracts. A book past that still fails loud and is never truncated. Nothing else in v0.2 changes. |

---

## 0. What changes

1. SPX and XSP, every book from 0 DTE through 5 DTE, are captured as the full listed book for that expiration, with the greeks Massive returns on the chain snapshot.
2. Those two names are refreshed by dedicated workers. Every other name stays on the wing window it has now, on a separate pass.
3. The full book is stored in the archive and on a new feed key. The existing member ladder key remains a window at its current width.
4. All six books are reachable through the OPF API by expiration, and FatTail-Labs' reader sees them, so Runner, Analyzer, Strategy Lab and any other consumer can place structures at any DTE the archive holds.

## 1. The book

For SPX and for XSP, for each expiration from 0 DTE through 5 DTE, each capture takes the full listed chain snapshot for that expiration: every page, calls and puts, with the greeks on each contract.

The ceiling is 10 pages, 2,500 contracts. A book that would pass that ceiling fails loud. It is never truncated and never stored short.

There is no σ window, no ATM IV source, no lead, and no session ratchet on these books. `LABS_SSR_BAND_SIGMA`, `LABS_SSR_BAND_LEAD_SIGMA`, and any other `LABS_SSR_BAND_*` variable are not introduced.

Every other name keeps the wing window it has now. Widening any other name is a later spec.

## 1a. The feed

The serial pass measured after the close on 2026-09-28 was about 55 seconds for about 120 topics, so a 2-second interval on that one loop is not real. See `docs/OPF-Actual-Cadence-Finding-v0_1.md`.

SPX and XSP get dedicated workers, aimed at a two-second pass. Every other name shares a separate pass and stays on its current window.

Before W1, Delta measures how many of these snapshot calls Massive will accept at once, and what rate limit actually applies, and states the interval those workers can hold. No interval is promised that Delta did not measure. The two-second figure is the ask. The number W1 builds to is the number Delta writes down.

The live 0DTE path is never the pass that yields. If the combined work still overruns, the parallel capture backs off the far books to the T1 and T2 cadences and the report says so.

One feed restart already happened after the close on 2026-09-28. This spec does not authorize another touch of the live path to force Tuesday. CP-1.

## 1b. Keys

The full book is written to the archive and to a new feed key, one key per book (symbol, expiration). The plan names the key.

The existing member ladder key stays a window over that book at the width it has now. No reader of the existing key sees a different generation. A member wings request never widens a live ladder, and it never widens the full-book key.

## 2. Storage

The full book is written at each book's existing cadence:

- 0 DTE: every pass of the SPX and XSP workers
- T1: 15 seconds
- T2: 60 seconds

Before W1, Delta states the measured gigabytes per session for SPX and for XSP at those cadences. That figure is measured from a full-book snapshot, not estimated from the wing-window files.

Tuesday's parallel archive is the place those files go. The live archive is not rewritten in place.

## 3. The API

- `/api/coverage` and `/api/fetch` on :5055 accept `expiration=` for every stored book (they already do) and document it.
- New `/api/books?symbol=&date=` returns the expiries stored for that session with their DTE, first/last snap time, snap count, strike range, and coverage at the latest snap — so a consumer can see what is placeable before fetching. Coverage is the §6 criterion: every listed strike present, with greeks.
- FatTail-Labs `main` reader (`snap_files`) globs `exp=*/` so Runner, Analyzer and Strategy Lab see all books, matching what the mexp2 dash already does.
- Docs site at :5055 updated; consumers read routes from it.

## 4. Consumers

No control, screen, selector, or default in the production app (FatTail Labs) changes. Runner, Analyzer and Strategy Lab read the archive and the feed as they do today and simply find more strikes per expiry. Where a screen already exposes an expiry, it now has the full listed book behind it; where it does not, nothing is added. Any packet that touches a Labs control, layout, or default is out of scope and stops.

## 5. Findings to resolve in the same plan, not silently

- Friday 2026-09-25 0DTE had 4 snaps, all after the close. Find out why before the swap; a collector that nearly misses a day is a bigger problem than a narrow band.
- `LABS_SSR_WINGS=15` in `.env` while live ladders were `w25`: the plan says why they differed. Other names keep that wing window. SPX and XSP do not use it; they take the full book (§1).

The cadence finding is separate and is not a build: `docs/OPF-Actual-Cadence-Finding-v0_1.md`. The Friday and Monday reads are in plan v1.1 and are carried by plan v1.2.

## 6. Verification and cutover

- Parallel run: new capture beside the old for one full RTH day (target Tuesday 2026-09-29), writing to a parallel archive path. No change to the live path that day.
- Evidence: during Tuesday's session, the measured pass interval for SPX and XSP, and the archive's actual snapshot cadence per book, reported beside the strike coverage. Strike coverage is every listed strike present, with greeks. Report as `OPF-Strike-Band-by-DTE-Analysis-v0_2.md`.
- Storage: the measured gigabytes from §2, plus measured row-writes per day per symbol.
- Swap after the close on the parallel day, with the old capture kept runnable for one week.
- Coach's screen: Analyzer placing a fly on SPX 3 DTE from the live feed the next morning, on the existing expiry control, against the full listed book. No new Analyzer control.

## 7. What still stands

From v0.2, except the §1 ceiling:

- Parallel capture Tuesday 2026-09-29 for the full RTH day. Swap after the close. The old capture stays runnable for one week.
- No Labs control, screen, selector, or default changes (§4).
- SPX and XSP only. Every other name stays on its current wing window.
- Live 0DTE never yields. Far books back off to T1 and T2 if the pass overruns, and the report says so.
- The live feed was restarted once after the close. It is not restarted again to force Tuesday. The plist repair that pointed live capture at `~/Fattail-Labs-mexp2` stands.
- A member wings request never widens a live ladder (§1b).
- Dedicated SPX and XSP workers. The interval W1 builds to is the interval Delta measured. The full book goes to a new key. The member ladder key stays a window.

Q1 of v0.1 (2.5σ for every book) is superseded for SPX and XSP by §1.
