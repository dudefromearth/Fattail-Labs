# W0-0 — Coach GO

**Status:** PASS  
**Date:** 2026-08-08  
**Authority:** Coach (session GO)

## GO

**GO** on [`docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.1.md`](../../../docs/Campaign-Structured-Practice-Full-Agent-Bench-Plan-v1.1.md) as execution law (v1.0 plan superseded; Spec v1.1 Two Roles).

- Seating S1–S8 accepted  
- Spec F1–F3 review fixes acknowledged as law  
- `p-campaign-lifecycle` closed substrate for charter signature/amend/renew  
- Proceed autonomously; interrupt only on critical ambiguity  

## Spec §13 dispositions (locked)

| # | Disposition | Lock |
|---|-------------|------|
| 1 | Existing `is_default` books → **become account ledger** | **LOCK** |
| 2 | NULL-account campaigns: bind to sole account; else unanimous stamp account; else **default account + migration report note** | **LOCK** |
| 3 | n-floor: Hotel floor; member may **raise only** | **LOCK** |
| 4 | Sharpe v1: **DEFER** | **LOCK** |
| 5 | Restamp v1: **single-trade only** (bulk later) | **LOCK** |
| 6 | Size-floor vs Blueprint probe: member sets floor; **no probe tag v1** | **LOCK** |
| 7 | Frame grid v1: **sparse** house styles × short/medium only | **LOCK** |
| 8 | Strategy-type scope: **TRAIL** if leg classification new; other scopes ship | **LOCK** |

## India keep/kill defaults (W0-1 interim — implement unless India revises)

| Item | Choice |
|------|--------|
| Ledger marker | `is_ledger TINYINT(1) NOT NULL DEFAULT 0` (+ `is_default` may clear for non-ledger) |
| Variance | **(b) stamp-at-fill** for process variance on trade (immutable); panel stats still derive-on-read with amendment-aware bounds for historical process only if stamped — process variance stored; statistical panel derived |
| Memory | Table `member_practice_campaign_memory (identity_id, account_id, campaign_id)` PK (identity, account) |
| stamped_by | `member` \| `memory` \| `migration` \| `import` |
| Panel | Derived, never stored |

## Post-GO paper fixes (A–C) — folded before product work

| ID | Fix | Where |
|----|-----|--------|
| **A** | Default-**account** genesis at first Practice-suite touch; M2-0 seed; Tango Primary label | Spec §2.1 · bench M2-0 · W0-3 |
| **B** | Journal stamp remains optional; Law 2 = trades only | Spec Law 2.5 · M3-2 wording |
| **C** | Audit/remove hard term/bounds gates; Kilo fill-after-ends_at | M2-5 · B2-1 |

Board is **GO-ready** with these pins. Product execution still waits on W0 materialize + W0-G unless Coach continues.

## Next

W0-5 materialize seeds · W0-1/2/3/4/6 · W0-G · M1 (incl. M2-0 account genesis).
