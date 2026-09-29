# OPF — Full book, SPX and XSP, 0–5 DTE — Full Agent Bench Plan v1.2

**Status:** ACCEPTED 2026-09-28. Plan v1.1 is accepted with the one amendment in this file. W1 dispatches after W0-G and after the close. W4–W7 stay clock-gated.  
**Supersedes:** `docs/OPF-Band-2p5sigma-0-5DTE-Full-Agent-Bench-Plan-v1.1.md` (bytes unchanged).  
**Spec:** `docs/OPF-Band-2p5sigma-0-5DTE-v0_3.md` is the law. v0.2 is the prior law. v0.1 is the baseline.  
**Measurements and the Monday/Friday reads:** plan v1.1. This file does not remeasure them.  
Date: 2026-09-28.  
Machine: StudioOne, `~/Fattail-Labs-mexp2`. **CP-1.** The running collector is not modified.

**Coach, 2026-09-28, verbatim.** Plan v1.1 accepted with that amendment. The 750-contract ceiling is raised so every listed book is captured whole. New ceiling 2,500 contracts / 10 pages; a book past that fails loud. Rationale: SPX 2026-09-30 is 1,198 contracts and costs 1.14 s on a 15-second cadence; refusing it contradicts the ask. W1's ceiling test uses that book as the one that must succeed, and a synthetic book over 2,500 as the one that fails.

**Coach, 2026-09-28, storage, verbatim.** Storage planning figure: the last_updated-gated write, ~5.7 GB per session both names, as the plan already builds. The 12.8 GB figure is the bound, not the plan.

**Arithmetic beside that wording, not a replacement of it.** The 5.70 GB and 12.79 GB rows in plan v1.1 are the rows that refused SPX 2026-09-30. This amendment stores that book. Its measured snapshot is 1,108,657 bytes. At the 15-second T1 cadence that is 1,560 snaps and 1.73 GB. The last_updated-gated session with every listed book included is **7.43 GB** for both names. The every-wake bound with that book included is **14.52 GB**. W1 plans disk for 7.43 GB. 14.52 GB is the bound. Coach's 5.7 and 12.8 stay in v1.1 and are quoted above.

---

## What changed from v1.1

| | v1.1 | v1.2 |
|---|---|---|
| Spec | v0.2, ceiling 750 / 3 pages | v0.3, ceiling 2,500 / 10 pages |
| SPX 2026-09-30 | The book that must fail | The book that must succeed (1,198 contracts, 5 pages, 1.14 s) |
| Over the ceiling | 751 contracts | A synthetic book over 2,500 contracts |
| Disk W1 plans for | 5.70 GB, that book refused | 7.43 GB, last_updated-gated, that book stored |
| Disk bound | 12.79 GB, that book refused | 14.52 GB if every 2-second wake is stored |
| Acceptance | PLAN | Accepted with this amendment |

Everything else in v1.1 stands: the three measurements, the key names, `ssr/fullbook_capture`, the Monday and Friday reads, the plist repair, CP-1, §4.

---

## W1 packet

After W0-G, after the close, on a tree the live launchd does not exec. This checkout is that tree. StudioOne's running capture, feed, and band tap are not the tree.

- Ceiling 2,500 contracts and 10 pages. Past either limit, fail loud. No truncated book is returned or stored.
- The measured SPX 2026-09-30 book, 1,198 contracts and 5 pages, passes.
- A synthetic book of 2,501 contracts fails. A book of 2,500 contracts on 10 pages passes.
- 0DTE wake 2.0 seconds. A snap is written when `last_quote.last_updated` changes. The same timestamp writes nothing.
- T1, trading DTE 1–2, 15 seconds. T2, trading DTE 3–5, 60 seconds.
- Key `mb:book:I:SPX:{YYYY-MM-DD}` and `mb:book:I:XSP:{YYYY-MM-DD}`.
- Archive name `fullbook_capture`. The module is not imported by `ssr_live_capture`, `chain_feed`, or `ssr_band_tap`.
- No plist edit. No process restart. No second Massive client started from this packet.

**W1-G** is Delta's, on the tests: the 1,198-contract book succeeds, the synthetic book over 2,500 fails, an unchanged timestamp skips the write.

---

## Still clock-gated

| Phase | When |
|---|---|
| W4 | Before 09:30 ET Tuesday 2026-09-29. Parallel launchd, `fullbook_capture`, live pid 73887 not killed, feed pid 73931 not restarted, band pid 74138 left on `ssr/band_capture` |
| W5 | Tuesday regular hours. Report `docs/OPF-Strike-Band-by-DTE-Analysis-v0_2.md` |
| W6 | After Tuesday's close. Old capture runnable one week |
| W7 | Wednesday morning. Existing Analyzer expiry control, SPX 3 DTE, full listed book. No new control |
