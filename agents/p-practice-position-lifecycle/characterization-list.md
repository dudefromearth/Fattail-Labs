# PPL characterization lock

**Board:** `agents/p-practice-position-lifecycle/`  
**Owner:** Kilo · Delta reads this at PPL1-G / PPL2-G / PPL3-G  
**Plan:** v1.0 §5 PPL1 / §7

Matcher Keep is **AT-PPL-1**. PPL1 **locks the lie**. PPL2/PPL3 **invert** the marked rows.

| AT | Phase | Claim | Invert? |
|----|-------|--------|---------|
| **AT-PPL-1** | Keep | Matcher 1-of-5: `close is None`, `open_units==5`, `closed_units==1` | **Never.** Existing `test_partial_close_leaves_remaining_units_open` |
| **AT-PPL-2** | PPL1 lock → PPL2 invert | Close fill of that 1 is **Orphan**; open is **Open** (`blotter_status_by_id` / `positionBadge`) | After PPL2: close is **not** Orphan; open is residual (machine key / not Orphan amber) |
| **AT-PPL-3** | PPL1 → PPL2 | Positions qty **5** on that open | After PPL2: qty **4** from **slot**, not fill helper |
| **AT-PPL-4** | PPL1 → PPL2 | GET `/opens` includes the 5-unit open | After PPL2: not listed as fully unmatched |
| **AT-PPL-5** | PPL1 → PPL2 | `canDeleteTrade` on that open is `ok: true` | After PPL2: `ok: false` (blocking close = the 1) |
| **AT-PPL-6** | PPL1 → PPL3 | POST `TO_CLOSE` that violates a gate without override is **200** | **Inverted PPL3:** **422**; `allow_orphan_close` still 200 |
| **AT-PPL-7** | PPL1 → PPL3 | DELETE of a paired (incl. partial) open is **200** | **Inverted PPL3:** **409**; unmatched open still 200 |
| **AT-PPL-8** | PPL1 lock | `member_trade_log_imports` has no coverage from/to | PPL4 after OD-9 |
| **AT-PPL-9** | PPL1 lock | Day-book drops 30d+ unmatched open; blotter can still say Open | PPL4 after FI-PPL-1 |
| **AT-PPL-10** | PPL2 | `findPairedOpen` on the partial close id returns the open | New (Grok PPL0-A2) |
| **AT-PPL-11** | PPL3 | No `window.confirm` in `TradeSheet.tsx` or `web/app/app/trade-log/page.tsx` | **Done PPL3** — kit `useConfirm` / `AlertDialog` |
| **AT-PPL-12** | PPL3 | PATCH that re-keys a close without override is **422** | **Done PPL3** — same gates as POST |

Do not drop Coach ATs. Holes get a new AT-PPL-* row, not a silent skip.
