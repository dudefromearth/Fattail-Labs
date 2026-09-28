# OPF — 2.5σ capture band, 0–5 DTE, through the API

**Change spec v0.1 — DRAFT**  
Source: `docs/OPF-Strike-Band-by-DTE-Analysis-v0_1.md` (2026-09-28). Implements Spec v0.8 §4, which was specified and not shipped.  
Date: 2026-09-28

**Amendments (Coach, 2026-09-28):** §4 consumers — no Labs control/screen/selector/default changes. §7 Q1 ruled: 2.5σ for every book, 0–5 DTE, SPX and XSP.

**Standing scope:** nothing is built that this spec does not name. A seat that finds something it thinks should change reports it as a finding for Coach; it does not build it.

---

## 0. What changes

1. Every captured book — 0DTE and 1–5 DTE, SPX and XSP — is captured to a per-expiry 2.5σ window computed from that expiry's own ATM IV and T, with a lead buffer in σ and a never-drop ratchet for the session.
2. The live feed carries the same window per expiry that the archive stores.
3. All six books are reachable through the OPF API by expiration, and FatTail-Labs' reader sees them, so Runner, Analyzer, Strategy Lab and any other consumer can place structures at any DTE the archive holds.

## 1. The band (Spec v0.8 §4, restated so nothing is ambiguous)

For each book (symbol, expiry) at each capture:

- `σ_T = spot × ATM_IV(expiry) × √(T_σ / 252)`, `T_σ = max(trading_dte, 1)`; trading_dte as `trading_dte()` today (weekdays, holidays counted — the safe direction).
- `follow(t)` = all listed strikes within `spot ± (2.5 + LEAD_SIGMA) × σ_T`, `LEAD_SIGMA` default 0.25.
- `active(t) = follow(t) ∪ every strike admitted earlier this session for this book` — the ratchet. Trailing strikes never drop when spot moves.
- Applies to 0DTE the same way. The fixed `wings()` count is retired for capture. `LABS_SSR_WINGS`, `book_wings()`, `band_scale()`, `lead_wings` are retired; `LABS_SSR_BAND_SIGMA` (2.5) and `LABS_SSR_BAND_LEAD_SIGMA` (0.25) replace them. `wings_max` becomes a σ cap, default 4.0, a safety rail only.
- ATM IV source: the book's own ATM IV from the feed at that capture. If IV is unavailable or degenerate (<1% or >200%), hold the last good window for that book and log it; never collapse the band.

## 2. The feed

The Redis ladder topics are by wing count (`w{N}`). The feed must publish, per expiry, a window that covers `active(t)` — the plan decides whether that is a σ-window topic, a strike-range topic, or a large-N topic filtered on capture, but the archive must never store fewer strikes than the band says because the feed was narrower. The `w25`-fallback-when-`w15`-missing behavior seen Monday is retired with the count model.

## 3. The API

- `/api/coverage` and `/api/fetch` on :5055 accept `expiration=` for every stored book (they already do) and document it.
- New `/api/books?symbol=&date=` returns the expiries stored for that session with their DTE, first/last snap time, snap count, strike range, and σ coverage at the latest snap — so a consumer can see what is placeable before fetching.
- FatTail-Labs `main` reader (`snap_files`) globs `exp=*/` so Runner, Analyzer and Strategy Lab see all books, matching what the mexp2 dash already does.
- Docs site at :5055 updated; consumers read routes from it.

## 4. Consumers

No control, screen, selector, or default in the production app (FatTail Labs) changes. Runner, Analyzer and Strategy Lab read the archive and the feed as they do today and simply find more strikes per expiry. Where a screen already exposes an expiry, it now has the full 2.5σ book behind it; where it does not, nothing is added. Any packet that touches a Labs control, layout, or default is out of scope and stops.

## 5. Findings to resolve in the same plan, not silently

- Friday 2026-09-25 0DTE had 4 snaps, all after the close. Find out why before the swap; a collector that nearly misses a day is a bigger problem than a narrow band.
- `LABS_SSR_WINGS=15` in `.env` while live ladders were `w25`: retired by §1, but the plan says why they differed.

## 6. Verification and cutover

- Parallel run: new capture beside the old for one full RTH day (target Tuesday 2026-09-29), writing to a parallel archive path. No change to the live path that day.
- Evidence: rerun the analysis report Part 2 against the parallel archive — every SPX and XSP row, DTE 0–5, ≥ 2.5σ both sides at 10:30 and at 15:30; ratchet shown by a row where spot moved and trailing strikes remained. Report as `OPF-Strike-Band-by-DTE-Analysis-v0_2.md`.
- Storage: measured row-writes per day per symbol, against the analysis' estimate.
- Swap after the close on the parallel day, with the old capture kept runnable for one week.
- Coach's screen: Analyzer placing a 2.5σ fly on SPX 3 DTE from the live feed the next morning. That is done. (No new Analyzer control. The 3 DTE book behind the existing expiry is the 2.5σ set.)

## 7. Ruled

**Q1 — 2.5σ for every DTE, or a tighter multiple for 3–5 DTE.** **Ruled (Coach 2026-09-28):** 2.5σ for every book, 0–5 DTE, SPX and XSP. Not a tighter far band.
